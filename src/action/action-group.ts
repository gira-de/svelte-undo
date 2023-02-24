import { UndoAction } from './action';

export class GroupAction<TMsg> extends UndoAction<
  TMsg,
  undefined,
  UndoAction<undefined>[]
> {
  constructor(msg: TMsg, actions: UndoAction<undefined>[] = []) {
    super(msg, undefined, actions);
  }

  push(action: UndoAction<undefined>) {
    this.patch.push(action);
  }

  apply() {
    this.patch.forEach((action) => action.apply());
  }

  revert() {
    for (let i = this.patch.length - 1; i >= 0; i--) {
      this.patch[i].revert();
    }
  }
}
