import type { Writable } from 'svelte/store';
import { UndoAction } from './action';

export class SetAction<TMsg, TStore> extends UndoAction<
  TMsg,
  Writable<TStore>,
  TStore
> {
  apply() {
    this.store.update((currValue) => {
      [currValue, this._patch] = [this._patch, currValue];
      return currValue;
    });
  }

  revert() {
    this.apply();
  }
}
