import { UndoAction } from './action';

export class GroupAction<TMsg> extends UndoAction<
  TMsg,
  undefined,
  UndoAction<TMsg>[]
> {
  constructor(msg: TMsg, actions: UndoAction<TMsg>[] = []) {
    super(msg, undefined, actions);
  }

  push(action: UndoAction<TMsg>) {
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
