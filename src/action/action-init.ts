import { UndoAction } from './action';

export class InitAction<TMsg> extends UndoAction<undefined, undefined, TMsg> {
  constructor(msg: TMsg) {
    super(undefined, undefined, msg);
  }

  apply() {
    // noop
  }

  revert() {
    // noop
  }
}
