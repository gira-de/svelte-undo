import type { HistoryAction } from './types.js';
import { createBarrierAction } from './barrier.js';

export function createInitAction<TMsg>(msg: TMsg): HistoryAction<TMsg> {
  return createBarrierAction({
    type: 'init',
    msg,
    seqNbr: 0,
  });
}
