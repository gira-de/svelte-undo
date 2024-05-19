import type { HistoryAction } from './action.js';
import { createBarrierAction } from './action-barrier.js';

export function createErasedAction<TMsg>(msg: TMsg): HistoryAction<TMsg> {
  return createBarrierAction({
    type: 'erased',
    msg,
    seqNbr: 0,
  });
}
