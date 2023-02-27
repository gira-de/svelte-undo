export interface ReadableUndoAction<TMsg> {
  readonly msg: TMsg;
  readonly seqNbr: number;
}

export abstract class UndoAction<TStore, TPatch, TMsg>
  implements ReadableUndoAction<TMsg>
{
  readonly store: TStore;
  protected _patch: TPatch;
  readonly msg: TMsg;
  seqNbr = 0;

  constructor(store: TStore, patch: TPatch, msg: TMsg) {
    this.store = store;
    this._patch = patch;
    this.msg = msg;
  }

  get patch() {
    return this._patch;
  }

  abstract apply(): void;
  abstract revert(): void;
}
