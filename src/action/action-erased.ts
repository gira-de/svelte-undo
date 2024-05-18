import type { HistoryAction } from './action';
import { createBarrierAction } from './action-barrier';

export function createErasedAction<TMsg>(msg: TMsg): HistoryAction<TMsg> {
  return createBarrierAction({
    type: 'erased',
    msg,
    seqNbr: 0,
  });
}
