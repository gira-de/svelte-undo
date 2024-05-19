import type { HistoryAction } from './action.js';
import { createBarrierAction } from './action-barrier.js';

export function createInitAction<TMsg>(msg: TMsg): HistoryAction<TMsg> {
  return createBarrierAction({
    type: 'init',
    msg,
    seqNbr: 0,
  });
}
