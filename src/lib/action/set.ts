import type { Undoable } from '../undoable.svelte.js';
import type { HistoryAction } from './types.js';

export function createSetAction<TValue, TMsg>(
  undoable: Undoable<TValue>,
  patch: TValue,
  msg: TMsg,
): HistoryAction<TMsg> {
  function apply() {
    const tmpValue = undoable.value;
    undoable.value = action.patch;
    action.patch = tmpValue;
  }

  const action = {
    type: 'set',
    storeId: undoable.id,
    msg,
    seqNbr: 0,
    patch,
    apply,
    revert: apply,
  };

  return action;
}
