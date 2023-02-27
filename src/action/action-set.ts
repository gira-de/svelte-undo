import type { Writable } from 'svelte/store';
import { UndoAction } from './action';

export class SetAction<TStore, TMsg> extends UndoAction<
  Writable<TStore>,
  TStore,
  TMsg
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
