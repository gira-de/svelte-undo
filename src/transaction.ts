import { createDraft, finishDraft } from 'immer';
import type { Patch } from 'immer';
import type { Objectish } from 'immer/dist/internal';
import { get } from 'svelte/store';
import type { Writable } from 'svelte/store';
import { MutateAction } from './action/action-mutate';
import { GroupAction } from './action/action-group';
import type { ActionStack } from './undo-stack';

export interface TransactionCtrl<TMsg> {
  /**
   * Returns the draft state for the specified store.
   * The draft can then be edited without changing the store value.
   * The changes will be applied to the store when commit() is called.
   *
   * @param store the store for which the draft state should be created
   */
  draft<TData extends Objectish>(store: Writable<TData>): TData;

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
 * @param actionStack The undo stack where the history entries shall be stored
 * @returns instance of a transaction controller
 */
export function transactionCtrl<TMsg>(
  actionStack: ActionStack<TMsg>,
): TransactionCtrl<TMsg> {
  const draftValues: Map<Writable<Objectish>, Objectish> = new Map();

  function draft<TData extends Objectish>(store: Writable<TData>) {
    let draftValue = draftValues.get(store);
    if (draftValue === undefined) {
      const storeValue = get(store);
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
      const action = new MutateAction(
        storeUpdate.store,
        storeUpdate.patch,
        msg,
      );
      storeUpdate.store.set(storeUpdate.newValue);
      actionStack.push(action);
    } else if (storeUpdates.length > 1) {
      const action = new GroupAction<TMsg>(msg);
      for (const storeUpdate of storeUpdates) {
        action.push(
          new MutateAction(storeUpdate.store, storeUpdate.patch, undefined),
        );
        storeUpdate.store.set(storeUpdate.newValue);
      }
      actionStack.push(action);
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
