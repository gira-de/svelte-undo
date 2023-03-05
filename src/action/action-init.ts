import { UndoAction } from './action';

export abstract class BarrierAction<TMsg> extends UndoAction<
  undefined,
  undefined,
  TMsg
> {
  constructor(msg: TMsg) {
    super(undefined, undefined, msg);
  }

  apply() {
    throw new Error('barrier action can not be applied');
  }

  revert() {
    throw new Error('barrier action can not be reverted');
  }
}

export class InitAction<TMsg> extends BarrierAction<TMsg> {}

export class ErasedAction<TMsg> extends BarrierAction<TMsg> {}
