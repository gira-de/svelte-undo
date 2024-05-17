import { barrierAction, UndoAction } from './action';

export function initAction<TMsg>(msg: TMsg): UndoAction<TMsg> {
  return barrierAction({
    type: 'init',
    msg,
    seqNbr: 0,
    apply() {
      throw new Error('init action can not be applied');
    },
    revert() {
      throw new Error('init action can not be reverted');
    },
  });
}
