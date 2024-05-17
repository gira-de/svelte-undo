import {
  isBarrierAction,
  type ReadableUndoAction,
  type UndoAction,
} from './action/action';
import { erasedAction } from './action/action-erased';
import { initAction } from './action/action-init';
import {
  loadActionsSnapshot,
  createSnapshotFromActions,
  type UndoActionSnapshot,
} from './snapshot';

type WritableStackData<TMsg> = {
  actions: UndoAction<TMsg>[];
  selectedAction: UndoAction<TMsg>;
  canRedo: boolean;
  canUndo: boolean;
  index: number;
};

type ReadableStackData<TMsg> = {
  /**
   * list of all actions that are currently on the undo stack
   */
  readonly actions: ReadonlyArray<ReadableUndoAction<TMsg>>;

  /**
   * the active undo step those state has been applied
   */
  readonly selectedAction: ReadableUndoAction<TMsg>;

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

function stackData<TMsg>(
  seqNbr: number,
  initActionMsg: TMsg,
): WritableStackData<TMsg> {
  const selectedAction = initAction(initActionMsg);
  selectedAction.seqNbr = seqNbr;
  return {
    actions: [selectedAction],
    selectedAction,
    canRedo: false,
    canUndo: false,
    index: 0,
  };
}

export type UndoStackSnapshot<TMsg> = {
  actions: UndoActionSnapshot<TMsg>[];
  index: number;
};

export interface UndoStack<TMsg> extends ReadableStackData<TMsg> {
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
  push: (action: UndoAction<TMsg>) => void;

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
  createSnapshot: () => UndoStackSnapshot<TMsg>;

  /**
   * Loads the snapshot that has previously been created with createSnapshot().
   * @param undoStackSnapshot
   * @param stores
   * @returns
   */
  loadSnapshot: (
    undoStackSnapshot: UndoStackSnapshot<TMsg>,
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
export function undoStack<TMsg>(initActionMsg: TMsg): UndoStack<TMsg> {
  let highestSeqNbr = -1;
  function nextSeqNbr() {
    return ++highestSeqNbr;
  }

  let undoStackData = $state(stackData(nextSeqNbr(), initActionMsg));

  function push(action: UndoAction<TMsg>) {
    const deleteCount = undoStackData.actions.length - undoStackData.index - 1;
    action.seqNbr = nextSeqNbr();
    undoStackData.actions.splice(undoStackData.index + 1, deleteCount, action);
    undoStackData.index = undoStackData.actions.length - 1;
    undoStackData.selectedAction = action;
    undoStackData.canUndo = !isBarrierAction(action);
    undoStackData.canRedo = false;
  }

  function undo() {
    if (
      undoStackData.index <= 0 ||
      isBarrierAction(undoStackData.selectedAction)
    ) {
      return;
    }

    undoStackData.selectedAction.revert();
    undoStackData.index--;
    undoStackData.selectedAction = undoStackData.actions[undoStackData.index];
    undoStackData.canUndo =
      undoStackData.index > 0 && !isBarrierAction(undoStackData.selectedAction);
    undoStackData.canRedo = true;
  }

  function redo() {
    if (
      undoStackData.index >= undoStackData.actions.length - 1 ||
      isBarrierAction(undoStackData.actions[undoStackData.index + 1])
    ) {
      return;
    }

    undoStackData.actions[undoStackData.index + 1].apply();
    undoStackData.index++;
    undoStackData.selectedAction = undoStackData.actions[undoStackData.index];
    undoStackData.canUndo = true;
    undoStackData.canRedo =
      undoStackData.index < undoStackData.actions.length - 1 &&
      !isBarrierAction(undoStackData.actions[undoStackData.index + 1]);
  }

  function goto(seqNbr: number) {
    const targetIndex = undoStackData.actions.findIndex(
      (a) => a.seqNbr === seqNbr,
    );
    if (targetIndex < 0) {
      return;
    }

    if (targetIndex === undoStackData.index) {
      return;
    }

    for (let i = undoStackData.index; targetIndex < i; i--) {
      if (isBarrierAction(undoStackData.actions[i])) {
        return;
      }
    }

    for (let i = undoStackData.index + 1; targetIndex >= i; i++) {
      if (isBarrierAction(undoStackData.actions[i])) {
        return;
      }
    }

    for (; targetIndex < undoStackData.index; undoStackData.index--) {
      undoStackData.actions[undoStackData.index].revert();
    }

    for (; targetIndex > undoStackData.index; undoStackData.index++) {
      undoStackData.actions[undoStackData.index + 1].apply();
    }

    undoStackData.selectedAction = undoStackData.actions[undoStackData.index];
    undoStackData.canUndo =
      undoStackData.index > 0 && !isBarrierAction(undoStackData.selectedAction);
    undoStackData.canRedo =
      undoStackData.index < undoStackData.actions.length - 1 &&
      !isBarrierAction(undoStackData.actions[undoStackData.index + 1]);
  }

  function erase(seqNbr?: number) {
    // get top start index
    const startIndex =
      seqNbr === undefined
        ? undoStackData.actions.length - 1
        : undoStackData.actions.findIndex((a) => a.seqNbr === seqNbr);
    if (startIndex < 0) {
      return;
    }

    // cancel if unapplied action should be erased
    if (undoStackData.index < startIndex) {
      return;
    }

    // erase actions
    for (let i = startIndex; i > 0; i--) {
      const action = undoStackData.actions[i];
      if (isBarrierAction(action)) {
        break;
      }

      const newAction = erasedAction(action.msg);
      newAction.seqNbr = action.seqNbr;
      undoStackData.actions[i] = newAction;
    }

    undoStackData.selectedAction = undoStackData.actions[undoStackData.index];
    undoStackData.canUndo =
      undoStackData.index > 0 && !isBarrierAction(undoStackData.selectedAction);
  }

  function clear() {
    undoStackData = stackData(nextSeqNbr(), initActionMsg);
  }

  function clearUndo() {
    if (undoStackData.index === 0) {
      return;
    }

    undoStackData.actions.splice(0, undoStackData.index);
    undoStackData.index = 0;
    undoStackData.canUndo = false;
    const firstAction = erasedAction(undoStackData.actions[0].msg);
    firstAction.seqNbr = undoStackData.actions[0].seqNbr;
    undoStackData.actions[0] = firstAction;
    undoStackData.selectedAction = firstAction;
  }

  function clearRedo() {
    if (undoStackData.index === undoStackData.actions.length - 1) {
      return;
    }

    undoStackData.actions.splice(undoStackData.index + 1);
    undoStackData.canRedo = false;
  }

  function createSnapshot(): UndoStackSnapshot<TMsg> {
    return {
      actions: createSnapshotFromActions(undoStackData.actions),
      index: undoStackData.index,
    };
  }

  function loadSnapshot(
    undoStackSnapshot: UndoStackSnapshot<TMsg>,
    stores: Record<string, unknown>,
  ) {
    const actions = loadActionsSnapshot(undoStackSnapshot.actions, stores);
    actions.forEach((a) => (a.seqNbr = nextSeqNbr()));

    undoStackData = {
      actions,
      selectedAction: actions[undoStackSnapshot.index],
      canRedo: undoStackSnapshot.index < undoStackSnapshot.actions.length - 1,
      canUndo: undoStackSnapshot.index > 0,
      index: undoStackSnapshot.index,
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
      return undoStackData.actions;
    },
    get selectedAction() {
      return undoStackData.selectedAction;
    },
    get canRedo() {
      return undoStackData.canRedo;
    },
    get canUndo() {
      return undoStackData.canUndo;
    },
    get index() {
      return undoStackData.index;
    },
  };
}
