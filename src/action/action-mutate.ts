import { UndoAction } from './action';
import { enablePatches, enableMapSet, applyPatches } from 'immer';
import type { Patch, Objectish } from 'immer';
import { UndoState } from '../state.svelte';

enablePatches();
enableMapSet();

export type MutateActionPatch = {
  patches: Patch[];
  inversePatches: Patch[];
};

export function mutateAction<TValue extends Objectish, TMsg>(
  undoState: UndoState<TValue>,
  patch: MutateActionPatch,
  msg: TMsg,
): UndoAction<TMsg> {
  return {
    type: 'mutate',
    storeId: undoState.id,
    msg,
    seqNbr: 0,
    patch,
    apply() {
      undoState.value = applyPatches(undoState.value, patch.patches);
    },
    revert() {
      undoState.value = applyPatches(undoState.value, patch.inversePatches);
    },
  };
}
