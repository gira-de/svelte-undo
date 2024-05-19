export interface ReadableHistoryAction<TMsg> {
  readonly storeId: string | undefined;
  readonly msg: TMsg;
  readonly seqNbr: number;
  readonly type: string;
}

export interface HistoryAction<TMsg> extends ReadableHistoryAction<TMsg> {
  seqNbr: number;
  readonly patch: unknown;
  apply(): void;
  revert(): void;
}
