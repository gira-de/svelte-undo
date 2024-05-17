import { barrierAction, UndoAction } from './action';

export function erasedAction<TMsg>(msg: TMsg): UndoAction<TMsg> {
  return barrierAction({
    type: 'erased',
    msg,
    seqNbr: 0,
    apply() {
      throw new Error('erased action can not be applied');
    },
    revert() {
      throw new Error('erased action can not be reverted');
    },
  });
}
