import { UndoAction } from './action';

export function groupAction<TMsg>(msg: TMsg): UndoAction<TMsg> & {
  push(action: UndoAction<undefined>): void;
} {
  const patch: UndoAction<undefined>[] = [];

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
