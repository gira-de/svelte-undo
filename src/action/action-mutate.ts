import { UndoAction } from './action';
import { enablePatches, enableMapSet, applyPatches } from 'immer';
import type { Patch, Objectish } from 'immer';
import type { Writable } from 'svelte/store';

enablePatches();
enableMapSet();

export type MutateActionPatch = {
  patches: Patch[];
  inversePatches: Patch[];
};

export class MutateAction<TValue extends Objectish, TMsg> extends UndoAction<
  Writable<TValue>,
  MutateActionPatch,
  TMsg
> {
  apply() {
    this.store.update((value) => applyPatches(value, this.patch.patches));
  }

  revert() {
    this.store.update((value) =>
      applyPatches(value, this.patch.inversePatches),
    );
  }
}
