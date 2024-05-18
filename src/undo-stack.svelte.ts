import type { ReadableHistoryAction, HistoryAction } from './action/action';
import { isBarrierAction } from './action/action-barrier';
import { createErasedAction } from './action/action-erased';
import { createInitAction } from './action/action-init';
import {
  loadSnapshotActions,
  createSnapshotActions,
  type HistorySnapshot,
} from './snapshot';

type HistoryData<TMsg> = {
  actions: HistoryAction<TMsg>[];
  selectedAction: HistoryAction<TMsg>;
  canRedo: boolean;
  canUndo: boolean;
  index: number;
};

type ReadableHistoryData<TMsg> = {
  /**
   * list of all actions that are currently on the undo stack
   */
  readonly actions: ReadonlyArray<ReadableHistoryAction<TMsg>>;

  /**
   * the active undo step those state has been applied
   */
  readonly selectedAction: ReadableHistoryAction<TMsg>;

  /**
   * true if the selected action is not on the top of the stack.
   * Is false after pushing an action to the stack.
   */
  readonly canRedo: boolean;

  /**
   * true if the selected action is not the first action on the stack.
   * Is false after the stack has been created.
   */
  readonly canUndo: boolean;

  /**
   * index is the selected action. Any value between 0 and actions.length - 1
   */
  readonly index: number;
};

function createHistoryData<TMsg>(
  seqNbr: number,
  initActionMsg: TMsg,
): HistoryData<TMsg> {
  const selectedAction = createInitAction(initActionMsg);
  selectedAction.seqNbr = seqNbr;
  return {
    actions: [selectedAction],
    selectedAction,
    canRedo: false,
    canUndo: false,
    index: 0,
  };
}

export interface HistoryStack<TMsg> extends ReadableHistoryData<TMsg> {
  /**
   * Reverts the selected action and selects the previous action.
   * Does nothing if there is no previous action.
   */
  undo: () => void;

  /**
   * Selects the next actions and applies its state.
   * Does nothing if their is no next action.
   */
  redo: () => void;

  /**
   * Applies or reverts all actions until the action with the specified
   * seqNbr is reached. Then the specified action is selected.
   * Does nothing if no action with the specified seqNbr exists.
   * @param seqNbr is the sequence number of the action those state should be
   * loaded.
   */
  goto: (seqNbr: number) => void;

  /**
   * Removes all action above the selected actions (if their are any)
   * and adds the specified action to the top of the stack. Selects the
   * action. Does not call apply().
   * @param action init, group, set or mutate action that should added to the stack
   */
  push: (action: HistoryAction<TMsg>) => void;

  /**
   * Erases all actions beginning with action of the specified seqNbr. Erased
   * actions no longer can be used for undo/redo but they are still listed on
   * the undo stack. This reduces the size of the stack while keeping the
   * history of all actions.
   * Stops erasing when a barrier step is reached.
   * @param seqNbr the sequence number, from which all older actions should be
   * erased. If undefined, starts erasing from the top of the stack.
   */
  erase: (seqNbr?: number) => void;

  /**
   * Clears the undo stack and resets all properties as if a new undo stack
   * would have been created.
   */
  clear: () => void;

  /**
   * Removes all undo action and keeps the redo actions. The selected action
   * gets erased. Does nothing if the first action is selected.
   */
  clearUndo: () => void;

  /**
   * Removes all redo action and keeps the undo actions. Does nothing if the
   * last action is selected.
   */
  clearRedo: () => void;

  /**
   * Creates a snapshot of the current undo stack that can easily be serialized.
   * @param stores object that contains unique string keys for each store that is references by the undo stack
   * @returns snapshot object of the undo stack
   */
  createSnapshot: () => HistorySnapshot<TMsg>;

  /**
   * Loads the snapshot that has previously been created with createSnapshot().
   * @param historySnapshot
   * @param stores
   * @returns
   */
  loadSnapshot: (
    historySnapshot: HistorySnapshot<TMsg>,
    stores: Record<string, unknown>,
  ) => void;
}

/**
 * Create a new undo stack in form of a Svelte store. The stack holds all undo
 * steps (aka actions) and provides functions undo or redo those steps.
 *
 * @param initActionMsg message of the first undo stack stack entry
 * @returns Svelte store of an undo stack
 */
export function createHistoryStack<TMsg>(
  initActionMsg: TMsg,
): HistoryStack<TMsg> {
  let highestSeqNbr = -1;
  function nextSeqNbr() {
    return ++highestSeqNbr;
  }

  let historyData = $state(createHistoryData(nextSeqNbr(), initActionMsg));

  function push(action: HistoryAction<TMsg>) {
    const deleteCount = historyData.actions.length - historyData.index - 1;
    action.seqNbr = nextSeqNbr();
    historyData.actions.splice(historyData.index + 1, deleteCount, action);
    historyData.index = historyData.actions.length - 1;
    historyData.selectedAction = action;
    historyData.canUndo = !isBarrierAction(action);
    historyData.canRedo = false;
  }

  function undo() {
    if (historyData.index <= 0 || isBarrierAction(historyData.selectedAction)) {
      return;
    }

    historyData.selectedAction.revert();
    historyData.index--;
    historyData.selectedAction = historyData.actions[historyData.index];
    historyData.canUndo =
      historyData.index > 0 && !isBarrierAction(historyData.selectedAction);
    historyData.canRedo = true;
  }

  function redo() {
    if (
      historyData.index >= historyData.actions.length - 1 ||
      isBarrierAction(historyData.actions[historyData.index + 1])
    ) {
      return;
    }

    historyData.actions[historyData.index + 1].apply();
    historyData.index++;
    historyData.selectedAction = historyData.actions[historyData.index];
    historyData.canUndo = true;
    historyData.canRedo =
      historyData.index < historyData.actions.length - 1 &&
      !isBarrierAction(historyData.actions[historyData.index + 1]);
  }

  function goto(seqNbr: number) {
    const targetIndex = historyData.actions.findIndex(
      (a) => a.seqNbr === seqNbr,
    );
    if (targetIndex < 0) {
      return;
    }

    if (targetIndex === historyData.index) {
      return;
    }

    for (let i = historyData.index; targetIndex < i; i--) {
      if (isBarrierAction(historyData.actions[i])) {
        return;
      }
    }

    for (let i = historyData.index + 1; targetIndex >= i; i++) {
      if (isBarrierAction(historyData.actions[i])) {
        return;
      }
    }

    for (; targetIndex < historyData.index; historyData.index--) {
      historyData.actions[historyData.index].revert();
    }

    for (; targetIndex > historyData.index; historyData.index++) {
      historyData.actions[historyData.index + 1].apply();
    }

    historyData.selectedAction = historyData.actions[historyData.index];
    historyData.canUndo =
      historyData.index > 0 && !isBarrierAction(historyData.selectedAction);
    historyData.canRedo =
      historyData.index < historyData.actions.length - 1 &&
      !isBarrierAction(historyData.actions[historyData.index + 1]);
  }

  function erase(seqNbr?: number) {
    // get top start index
    const startIndex =
      seqNbr === undefined
        ? historyData.actions.length - 1
        : historyData.actions.findIndex((a) => a.seqNbr === seqNbr);
    if (startIndex < 0) {
      return;
    }

    // cancel if unapplied action should be erased
    if (historyData.index < startIndex) {
      return;
    }

    // erase actions
    for (let i = startIndex; i > 0; i--) {
      const action = historyData.actions[i];
      if (isBarrierAction(action)) {
        break;
      }

      const newAction = createErasedAction(action.msg);
      newAction.seqNbr = action.seqNbr;
      historyData.actions[i] = newAction;
    }

    historyData.selectedAction = historyData.actions[historyData.index];
    historyData.canUndo =
      historyData.index > 0 && !isBarrierAction(historyData.selectedAction);
  }

  function clear() {
    historyData = createHistoryData(nextSeqNbr(), initActionMsg);
  }

  function clearUndo() {
    if (historyData.index === 0) {
      return;
    }

    historyData.actions.splice(0, historyData.index);
    historyData.index = 0;
    historyData.canUndo = false;
    const firstAction = createErasedAction(historyData.actions[0].msg);
    firstAction.seqNbr = historyData.actions[0].seqNbr;
    historyData.actions[0] = firstAction;
    historyData.selectedAction = firstAction;
  }

  function clearRedo() {
    if (historyData.index === historyData.actions.length - 1) {
      return;
    }

    historyData.actions.splice(historyData.index + 1);
    historyData.canRedo = false;
  }

  function createSnapshot(): HistorySnapshot<TMsg> {
    return {
      actions: createSnapshotActions(historyData.actions),
      index: historyData.index,
    };
  }

  function loadSnapshot(
    historySnapshot: HistorySnapshot<TMsg>,
    stores: Record<string, unknown>,
  ) {
    const actions = loadSnapshotActions(historySnapshot.actions, stores);
    actions.forEach((a) => (a.seqNbr = nextSeqNbr()));

    historyData = {
      actions,
      selectedAction: actions[historySnapshot.index],
      canRedo: historySnapshot.index < historySnapshot.actions.length - 1,
      canUndo: historySnapshot.index > 0,
      index: historySnapshot.index,
    };
  }

  return {
    push,
    undo,
    redo,
    goto,
    erase,
    clear,
    clearUndo,
    clearRedo,
    createSnapshot,
    loadSnapshot,
    get actions() {
      return historyData.actions;
    },
    get selectedAction() {
      return historyData.selectedAction;
    },
    get canRedo() {
      return historyData.canRedo;
    },
    get canUndo() {
      return historyData.canUndo;
    },
    get index() {
      return historyData.index;
    },
  };
}
