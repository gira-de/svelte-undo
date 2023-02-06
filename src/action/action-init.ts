import { UndoAction } from './action';

export class InitAction<TMsg> extends UndoAction<TMsg> {
  constructor(msg: TMsg) {
    super(msg, undefined, undefined);
  }

  apply() {
    // noop
  }

  revert() {
    // noop
  }
}
