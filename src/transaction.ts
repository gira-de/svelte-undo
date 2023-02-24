import { createDraft, finishDraft } from 'immer';
import type { Patch } from 'immer';
import type { Objectish } from 'immer/dist/internal';
import { get } from 'svelte/store';
import type { Writable } from 'svelte/store';
import { MutateAction } from './action/action-mutate';
import { GroupAction } from './action/action-group';
import type { ActionStack } from './undo-stack';

export function transactionCtrl<TMsg>(actionStack: ActionStack<TMsg>) {
  const draftValues: Map<Writable<Objectish>, Objectish> = new Map();

  function draft<TData extends Objectish>(store: Writable<TData>): TData {
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
        msg,
        storeUpdate.store,
        storeUpdate.patch,
      );
      storeUpdate.store.set(storeUpdate.newValue);
      actionStack.push(action);
    } else if (storeUpdates.length > 1) {
      const action = new GroupAction<TMsg>(msg);
      for (const storeUpdate of storeUpdates) {
        action.push(
          new MutateAction(undefined, storeUpdate.store, storeUpdate.patch),
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
