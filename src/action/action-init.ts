import type { HistoryAction } from './action';
import { createBarrierAction } from './action-barrier';

export function createInitAction<TMsg>(msg: TMsg): HistoryAction<TMsg> {
  return createBarrierAction({
    type: 'init',
    msg,
    seqNbr: 0,
  });
}
