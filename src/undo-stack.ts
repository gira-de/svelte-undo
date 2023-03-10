import type { ReadableUndoAction, UndoAction } from './action/action';
import { get, writable } from 'svelte/store';
import type { Readable } from 'svelte/store';
import { InitAction } from './action/action-init';
import {
  loadActionsSnapshot,
  createSnapshotFromActions,
  type UndoActionSnapshot,
} from './snapshot';

type UndoStackData<TMsg> = {
  actions: UndoAction<unknown, unknown, TMsg>[];
  selectedAction: UndoAction<unknown, unknown, TMsg>;
  canRedo: boolean;
  canUndo: boolean;
  index: number;
  ticker: number;
};

type ReadableUndoStackData<TMsg> = {
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

  /**
   * 0 after the stack has been created and gets increments with each state
   * change, e.g. push, redo, undo, ...
   */
  readonly ticker: number;
};

function newUndoStackData<TMsg>(initActionMsg: TMsg): UndoStackData<TMsg> {
  const selectedAction = new InitAction(initActionMsg);
  return {
    actions: [selectedAction],
    selectedAction,
    canRedo: false,
    canUndo: false,
    index: 0,
    ticker: 0,
  };
}

export type UndoStackSnapshot<TMsg> = {
  actions: UndoActionSnapshot<TMsg>[];
  index: number;
};

export interface ActionStack<TMsg> {
  /**
   * Removes all action above the selected actions (if their are any)
   * and adds the specified action to the top of the stack. Selects the
   * action. Does not call apply().
   * @param action init, group, set or mutate action that should added to the stack
   */
  push: (action: UndoAction<unknown, unknown, TMsg>) => void;
}

export interface UndoStack<TMsg>
  extends Readable<ReadableUndoStackData<TMsg>>,
    ActionStack<TMsg> {
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
   * @param seqNbr is the seqNbr of the action those state should be loaded
   */
  goto: (seqNbr: number) => void;

  /**
   * Clears the undo stack and resets all properties as if a new undo stack
   * would have been created.
   */
  clear: () => void;

  /**
   * Creates a snapshot of the current undo stack that can easily be serialized.
   * @param stores object that contains unique string keys for each store that is references by the undo stack
   * @returns snapshot object of the undo stack
   */
  createSnapshot: (stores: Record<string, unknown>) => UndoStackSnapshot<TMsg>;

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
  const store = writable(newUndoStackData(initActionMsg));

  function push(action: UndoAction<unknown, unknown, TMsg>) {
    store.update((undoStack) => {
      undoStack.ticker++;
      action.seqNbr = undoStack.ticker;
      const deleteCount = undoStack.actions.length - undoStack.index - 1;
      undoStack.actions.splice(undoStack.index + 1, deleteCount, action);
      undoStack.index = undoStack.actions.length - 1;
      undoStack.canUndo = undoStack.actions.length > 0;
      undoStack.canRedo = false;
      undoStack.selectedAction = action;
      return undoStack;
    });
  }

  function undo() {
    store.update((undoStack) => {
      if (undoStack.index <= 0) {
        return undoStack;
      }

      undoStack.actions[undoStack.index].revert();
      undoStack.index--;
      undoStack.canUndo = undoStack.index > 0;
      undoStack.canRedo = true;
      undoStack.selectedAction = undoStack.actions[undoStack.index];
      undoStack.ticker++;
      return undoStack;
    });
  }

  function redo() {
    store.update((undoStack) => {
      if (undoStack.index >= undoStack.actions.length - 1) {
        return undoStack;
      }

      undoStack.index++;
      undoStack.actions[undoStack.index].apply();
      undoStack.canUndo = true;
      undoStack.canRedo = undoStack.index < undoStack.actions.length - 1;
      undoStack.selectedAction = undoStack.actions[undoStack.index];
      undoStack.ticker++;
      return undoStack;
    });
  }

  function goto(seqNbr: number) {
    store.update((undoStack) => {
      const targetIndex = undoStack.actions.findIndex(
        (a) => a.seqNbr === seqNbr,
      );
      if (targetIndex < 0) {
        return undoStack;
      }

      // -1 = undo (revert-action), 1 = redo (apply-action)
      const step = Math.sign(targetIndex - undoStack.index);

      for (; undoStack.index != targetIndex; undoStack.index += step) {
        if (step < 0) {
          undoStack.actions[undoStack.index].revert();
        } else {
          undoStack.actions[undoStack.index + 1].apply();
        }
      }

      undoStack.canUndo = undoStack.index > 0;
      undoStack.canRedo = undoStack.index < undoStack.actions.length - 1;
      undoStack.selectedAction = undoStack.actions[undoStack.index];
      undoStack.ticker++;
      return undoStack;
    });
  }

  function clear() {
    store.set(newUndoStackData(initActionMsg));
  }

  function createSnapshot(
    stores: Record<string, unknown>,
  ): UndoStackSnapshot<TMsg> {
    const undoStack = get(store);

    return {
      actions: createSnapshotFromActions(undoStack.actions, stores),
      index: undoStack.index,
    };
  }

  function loadSnapshot(
    undoStackSnapshot: UndoStackSnapshot<TMsg>,
    stores: Record<string, unknown>,
  ) {
    const actions = loadActionsSnapshot(undoStackSnapshot.actions, stores);
    let ticker = 0;
    for (const action of actions) {
      action.seqNbr = ticker++;
    }

    store.set({
      actions,
      selectedAction: actions[undoStackSnapshot.index],
      canRedo: undoStackSnapshot.index < undoStackSnapshot.actions.length - 1,
      canUndo: undoStackSnapshot.index > 0,
      ticker,
      index: undoStackSnapshot.index,
    });
  }

  return {
    subscribe: store.subscribe,
    push,
    undo,
    redo,
    goto,
    clear,
    createSnapshot,
    loadSnapshot,
  };
}
