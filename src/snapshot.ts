import type { HistoryAction } from './action/action';
import type { Objectish } from 'immer';
import type { Undoable } from './state.svelte';
import { createSetAction } from './action/action-set';
import {
  type MutateActionPatch,
  createMutateAction,
} from './action/action-mutate';
import { createGroupAction } from './action/action-group';
import { createInitAction } from './action/action-init';
import { createErasedAction } from './action/action-erased';
import { isBarrierAction } from './action/action-barrier';

export type HistorySnapshot<TMsg> = {
  actions: SnapshotAction<TMsg>[];
  index: number;
};

export type SnapshotAction<TMsg> = {
  type: string;
  storeId?: string;
  msg: TMsg;
  data?: unknown;
};

export function loadSnapshotActions<TMsg>(
  snapshotActions: SnapshotAction<TMsg>[],
  stores: Record<string, unknown>,
) {
  const historyActions: HistoryAction<TMsg>[] = [];

  for (const snapshotAction of snapshotActions) {
    const action = loadSnapshotAction(snapshotAction);
    historyActions.push(action);
  }

  function loadSnapshotAction<TMsg>(
    snapshotAction: SnapshotAction<TMsg>,
  ): HistoryAction<TMsg> {
    if (snapshotAction.type === 'group') {
      const snapshotActions =
        snapshotAction.data as SnapshotAction<undefined>[];
      const newGroupAction = createGroupAction(snapshotAction.msg);
      for (const snapshotAction of snapshotActions) {
        newGroupAction.push(loadSnapshotAction(snapshotAction));
      }
      return newGroupAction;
    }

    if (snapshotAction.type === 'init') {
      return createInitAction(snapshotAction.msg);
    }

    if (snapshotAction.type === 'erased') {
      return createErasedAction(snapshotAction.msg);
    }

    if (!snapshotAction.storeId) {
      throw new Error('missing storeId');
    }

    if (snapshotAction.type === 'set') {
      return createSetAction(
        stores[snapshotAction.storeId] as Undoable<unknown>,
        snapshotAction.data,
        snapshotAction.msg,
      );
    } else if (snapshotAction.type === 'mutate') {
      return createMutateAction(
        stores[snapshotAction.storeId] as Undoable<Objectish>,
        snapshotAction.data as MutateActionPatch,
        snapshotAction.msg,
      );
    }

    throw new Error(`invalid action type '${snapshotAction.type}'`);
  }

  return historyActions;
}

export function createSnapshotActions<TMsg>(
  actions: HistoryAction<TMsg>[],
): SnapshotAction<TMsg>[] {
  const snapshotActions: SnapshotAction<TMsg>[] = [];

  for (const action of actions) {
    let data: unknown;
    if (isBarrierAction(action)) {
      data = undefined;
    } else if (Array.isArray(action.patch)) {
      data = createSnapshotActions(action.patch as HistoryAction<TMsg>[]);
    } else {
      data = action.patch;
    }

    snapshotActions.push({
      type: action.type,
      storeId: action.storeId,
      msg: action.msg,
      data,
    });
  }

  return snapshotActions;
}
