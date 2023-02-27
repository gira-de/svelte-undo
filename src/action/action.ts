export interface ReadableUndoAction<TMsg> {
  readonly msg: TMsg;
  readonly seqNbr: number;
}

export abstract class UndoAction<TMsg, TStore = unknown, TPatch = unknown>
  implements ReadableUndoAction<TMsg>
{
  readonly msg: TMsg;
  readonly store: TStore;
  protected _patch: TPatch;
  seqNbr = 0;

  constructor(store: TStore, patch: TPatch, msg: TMsg) {
    this.msg = msg;
    this.store = store;
    this._patch = patch;
  }

  get patch() {
    return this._patch;
  }

  abstract apply(): void;
  abstract revert(): void;
}
