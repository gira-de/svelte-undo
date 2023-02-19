import type { UndoAction } from './action/action';
import { writable } from 'svelte/store';
import type { Readable } from 'svelte/store';
import { InitAction } from './action/action-init';
import { loadActions, saveActions, type SavedUndoAction } from './save-load';

export type SavedUndoStack<TMsg> = {
  actions: SavedUndoAction<TMsg>[];
  index: number;
};

export interface ActionStack<TMsg> {
  push: (action: UndoAction<TMsg>) => void;
}

type UndoStack<TMsg> = {
  actions: UndoAction<TMsg>[];
  index: number;
  seqNbr: number;
  canRedo: boolean;
  canUndo: boolean;
  counter: number;
};

export function newUndoStack<TMsg>(firstActionMsg: TMsg): UndoStack<TMsg> {
  const action: UndoAction<TMsg> = new InitAction(firstActionMsg);
  return {
    actions: [action],
    index: 0,
    seqNbr: 0,
    canRedo: false,
    canUndo: false,
    counter: 0,
  };
}

interface UndoStackStore<TMsg>
  extends Readable<UndoStack<TMsg>>,
    ActionStack<TMsg> {
  undo: () => void;
  redo: () => void;
  goto: (index: number) => void;
  clear: () => void;
  save: (stores: Record<string, unknown>) => SavedUndoStack<TMsg>;
  load: (
    savedUndoStack: SavedUndoStack<TMsg>,
    stores: Record<string, unknown>,
  ) => void;
}

export function undoStackStore<TMsg>(
  firstActionMsg: TMsg,
): UndoStackStore<TMsg> {
  const undoStack = newUndoStack(firstActionMsg);
  const store = writable(undoStack);

  function push(action: UndoAction<TMsg>) {
    store.update((undoStack) => {
      undoStack.counter++;
      action.seqNbr = undoStack.counter;
      const deleteCount = undoStack.actions.length - undoStack.index - 1;
      undoStack.actions.splice(undoStack.index + 1, deleteCount, action);
      undoStack.index = undoStack.actions.length - 1;
      undoStack.canUndo = undoStack.actions.length > 0;
      undoStack.canRedo = false;
      undoStack.seqNbr = action.seqNbr;
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
      undoStack.seqNbr = undoStack.actions[undoStack.index].seqNbr;
      undoStack.counter++;
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
      undoStack.seqNbr = undoStack.actions[undoStack.index].seqNbr;
      undoStack.counter++;
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
      undoStack.seqNbr = undoStack.actions[undoStack.index].seqNbr;
      undoStack.counter++;
      return undoStack;
    });
  }

  function clear() {
    store.set(newUndoStack(firstActionMsg));
  }

  function load(
    savedUndoStack: SavedUndoStack<TMsg>,
    stores: Record<string, unknown>,
  ) {
    const actions = loadActions(savedUndoStack.actions, stores);
    let counter = 0;
    for (const action of actions) {
      action.seqNbr = counter++;
    }

    store.set({
      actions,
      counter,
      index: savedUndoStack.index,
      seqNbr: actions[savedUndoStack.index].seqNbr,
      canRedo: savedUndoStack.index < savedUndoStack.actions.length - 1,
      canUndo: savedUndoStack.index > 0,
    });
  }

  function save(stores: Record<string, unknown>): SavedUndoStack<TMsg> {
    return {
      actions: saveActions(undoStack.actions, stores),
      index: undoStack.index,
    };
  }

  return {
    subscribe: store.subscribe,
    push,
    undo,
    redo,
    goto,
    clear,
    save,
    load,
  };
}
