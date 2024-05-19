import { createDraft, finishDraft } from 'immer';
import type { Patch, Objectish } from 'immer';
import type { Undoable } from './undoable.svelte.js';
import { createMutateAction } from './action/mutate.js';
import { createGroupAction } from './action/group.js';
import type { HistoryAction } from './action/types.js';

export interface Transaction<TMsg> {
  /**
   * Returns the draft object for the specified state.
   * The draft can then be edited without changing the state.
   * The changes will be applied to the state when commit() is called.
   *
   * @param undoable the state for which the draft object should be created
   */
  draft<TData extends Objectish>(undoable: Undoable<TData>): TData;

  /**
   * Applies the changes of the draft state(s) to the stores and adds
   * a action with all these changes to the undo stack. The specified
   * msg parameter is applied to the action.
   *
   * Does nothing if no draft changes exists.
   *
   * @param msg action message
   */
  commit(msg: TMsg): void;

  /**
   * Discards all draft changes.
   */
  rollback(): void;
}

/**
 * Creates a new transaction controller for the specified undo stack.
 * The transaction controller can be used to create undo stack entries
 * by committing draft objects.
 *
 * Only one transaction controller per undo stack is allowed.
 *
 * @param pushFunc function that should the called to push new items on the undo stack. Normally historyStack.push
 * @returns instance of a transaction controller
 */
export function createTransaction<TMsg>(
  pushFunc: (action: HistoryAction<TMsg>) => void,
): Transaction<TMsg> {
  const draftValues: Map<Undoable<Objectish>, Objectish> = new Map();

  function draft<TData extends Objectish>(undoable: Undoable<TData>) {
    let draftValue = draftValues.get(undoable);
    if (draftValue === undefined) {
      draftValue = createDraft(undoable.value);
      draftValues.set(undoable, draftValue);
    }
    return draftValue as TData;
  }

  function commit(msg: TMsg) {
    // finish drafts and create patches
    let storeUpdates = Array.from(draftValues, ([store, draftValue]) => {
      let patches: Patch[] = [];
      let inversePatches: Patch[] = [];
      const newValue = finishDraft(draftValue, (p, ip) => {
        patches = p;
        inversePatches = ip;
      });
      return {
        store,
        newValue,
        patch: { patches, inversePatches },
      };
    });

    // remove store updates where nothing has changed
    storeUpdates = storeUpdates.filter((v) => v.patch.patches.length > 0);

    if (storeUpdates.length === 1) {
      const storeUpdate = storeUpdates[0];
      const action = createMutateAction(
        storeUpdate.store,
        storeUpdate.patch,
        msg,
      );
      storeUpdate.store.value = storeUpdate.newValue;
      pushFunc(action);
    } else if (storeUpdates.length > 1) {
      const action = createGroupAction<TMsg>(msg);
      for (const storeUpdate of storeUpdates) {
        action.push(
          createMutateAction(storeUpdate.store, storeUpdate.patch, undefined),
        );
        storeUpdate.store.value = storeUpdate.newValue;
      }
      pushFunc(action);
    }

    draftValues.clear();
  }

  function rollback() {
    draftValues.clear();
  }

  return {
    draft,
    commit,
    rollback,
  };
}
