import { UndoAction } from './action';
import { enablePatches, enableMapSet, applyPatches } from 'immer';
import type { Patch } from 'immer';
import type { Objectish } from 'immer/dist/internal';
import type { Writable } from 'svelte/store';

enablePatches();
enableMapSet();

export type MutateActionPatch = {
  patches: Patch[];
  inversePatches: Patch[];
};

export class MutateAction<TMsg, TValue extends Objectish> extends UndoAction<
  TMsg,
  Writable<TValue>,
  MutateActionPatch
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
