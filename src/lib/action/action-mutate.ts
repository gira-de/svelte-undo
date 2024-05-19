import type { HistoryAction } from './action.js';
import { enablePatches, enableMapSet, applyPatches } from 'immer';
import type { Patch, Objectish } from 'immer';
import type { Undoable } from '../state.svelte.js';

enablePatches();
enableMapSet();

export type MutateActionPatch = {
  patches: Patch[];
  inversePatches: Patch[];
};

export function createMutateAction<TValue extends Objectish, TMsg>(
  undoable: Undoable<TValue>,
  patch: MutateActionPatch,
  msg: TMsg,
): HistoryAction<TMsg> {
  return {
    type: 'mutate',
    storeId: undoable.id,
    msg,
    seqNbr: 0,
    patch,
    apply() {
      undoable.value = applyPatches(undoable.value, patch.patches);
    },
    revert() {
      undoable.value = applyPatches(undoable.value, patch.inversePatches);
    },
  };
}
