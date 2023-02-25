import { UndoAction } from './action';

export class InitAction<TMsg> extends UndoAction<TMsg> {
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
