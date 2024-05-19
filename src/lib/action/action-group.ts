import type { HistoryAction } from './action.js';

export function createGroupAction<TMsg>(msg: TMsg): HistoryAction<TMsg> & {
  push(action: HistoryAction<undefined>): void;
} {
  const patch: HistoryAction<undefined>[] = [];

  return {
    type: 'group',
    storeId: undefined,
    msg,
    seqNbr: 0,
    patch,
    push(action) {
      patch.push(action);
    },
    apply() {
      patch.forEach((action) => action.apply());
    },
    revert() {
      for (let i = patch.length - 1; i >= 0; i--) {
        patch[i].revert();
      }
    },
  };
}
