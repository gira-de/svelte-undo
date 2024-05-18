import type { HistoryAction } from './action';

const BarrierPatch = Object.freeze({});

export function createBarrierAction<TMsg>(
  action: Omit<HistoryAction<TMsg>, 'patch' | 'storeId' | 'apply' | 'revert'>,
): HistoryAction<TMsg> {
  return {
    ...action,
    patch: BarrierPatch,
    storeId: undefined,
    apply() {
      throw new Error('barrier action can not be applied');
    },
    revert() {
      throw new Error('barrier action can not be reverted');
    },
  };
}

export function isBarrierAction(action: HistoryAction<unknown>) {
  return action.patch === BarrierPatch;
}
