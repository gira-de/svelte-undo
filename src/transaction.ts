import { createDraft, finishDraft } from 'immer';
import type { Patch, Objectish } from 'immer';
import { UndoState } from './state.svelte';
import { mutateAction } from './action/action-mutate';
import { groupAction } from './action/action-group';
import { UndoAction } from './action/action';

export interface TransactionCtrl<TMsg> {
  /**
   * Returns the draft state for the specified store.
   * The draft can then be edited without changing the store value.
   * The changes will be applied to the store when commit() is called.
   *
   * @param store the store for which the draft state should be created
   */
  draft<TData extends Objectish>(store: UndoState<TData>): TData;

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
 * @param pushFunc function that should the called to push new items on the undo stack. Normally undoStack.push
 * @returns instance of a transaction controller
 */
export function transactionCtrl<TMsg>(
  pushFunc: (action: UndoAction<TMsg>) => void,
): TransactionCtrl<TMsg> {
  const draftValues: Map<UndoState<Objectish>, Objectish> = new Map();

  function draft<TData extends Objectish>(store: UndoState<TData>) {
    let draftValue = draftValues.get(store);
    if (draftValue === undefined) {
      const storeValue = store.value;
      draftValue = createDraft(storeValue);
      draftValues.set(store, draftValue);
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
      const action = mutateAction(storeUpdate.store, storeUpdate.patch, msg);
      storeUpdate.store.value = storeUpdate.newValue;
      pushFunc(action);
    } else if (storeUpdates.length > 1) {
      const action = groupAction<TMsg>(msg);
      for (const storeUpdate of storeUpdates) {
        action.push(
          mutateAction(storeUpdate.store, storeUpdate.patch, undefined),
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
