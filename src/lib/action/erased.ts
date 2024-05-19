import type { HistoryAction } from './types.js';
import { createBarrierAction } from './barrier.js';

export function createErasedAction<TMsg>(msg: TMsg): HistoryAction<TMsg> {
  return createBarrierAction({
    type: 'erased',
    msg,
    seqNbr: 0,
  });
}
