import { UndoState } from '../state.svelte';
import { UndoAction } from './action';

export function setAction<TValue, TMsg>(
  undoState: UndoState<TValue>,
  patch: TValue,
  msg: TMsg,
): UndoAction<TMsg> {
  function apply() {
    const tmpValue = undoState.value;
    undoState.value = action.patch;
    action.patch = tmpValue;
  }

  const action = {
    type: 'set',
    storeId: undoState.id,
    msg,
    seqNbr: 0,
    patch,
    apply,
    revert: apply,
  };

  return action;
}
