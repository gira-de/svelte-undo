export interface ReadableUndoAction<TMsg> {
  readonly storeId: string | undefined;
  readonly msg: TMsg;
  readonly seqNbr: number;
  readonly type: string;
}

export interface UndoAction<TMsg> extends ReadableUndoAction<TMsg> {
  seqNbr: number;
  readonly patch: unknown;
  apply(): void;
  revert(): void;
}

const BarrierPatch = Object.freeze({});

export function barrierAction<TMsg>(
  action: Omit<UndoAction<TMsg>, 'patch' | 'storeId'>,
): UndoAction<TMsg> {
  return {
    ...action,
    patch: BarrierPatch,
    storeId: undefined,
  };
}

export function isBarrierAction(action: UndoAction<unknown>) {
  return action.patch === BarrierPatch;
}
