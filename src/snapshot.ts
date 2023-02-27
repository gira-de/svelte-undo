import type { Objectish } from 'immer/dist/internal';
import type { Writable } from 'svelte/store';
import type { UndoAction } from './action/action';
import { GroupAction } from './action/action-group';
import { InitAction } from './action/action-init';
import { MutateAction, type MutateActionPatch } from './action/action-mutate';
import { SetAction } from './action/action-set';

export type UndoActionSnapshot<TMsg> = {
  type: string;
  storeId?: string;
  msg: TMsg;
  data?: unknown;
};

const actionIds = {
  [InitAction.name]: 'init',
  [GroupAction.name]: 'group',
  [SetAction.name]: 'set',
  [MutateAction.name]: 'mutate',
};

export function loadActionsSnapshot<TMsg>(
  actionsSnapshot: UndoActionSnapshot<TMsg>[],
  stores: Record<string, unknown>,
) {
  const stackedActions: UndoAction<unknown, unknown, TMsg>[] = [];

  for (const actionSnapshot of actionsSnapshot) {
    const action = loadActionSnapshot(actionSnapshot);
    stackedActions.push(action);
  }

  function loadActionSnapshot<TMsg>(
    actionSnapshot: UndoActionSnapshot<TMsg>,
  ): UndoAction<unknown, unknown, TMsg> {
    if (actionSnapshot.type === 'group') {
      const actionsSnapshot =
        actionSnapshot.data as UndoActionSnapshot<undefined>[];
      const groupAction = new GroupAction(actionSnapshot.msg);
      for (const actionSnapshot of actionsSnapshot) {
        groupAction.push(loadActionSnapshot(actionSnapshot));
      }
      return groupAction;
    } else if (actionSnapshot.type === 'init') {
      return new InitAction(actionSnapshot.msg);
    }

    if (!actionSnapshot.storeId) {
      throw new Error('missing storeId');
    }

    if (actionSnapshot.type === 'set') {
      return new SetAction(
        stores[actionSnapshot.storeId] as Writable<unknown>,
        actionSnapshot.data,
        actionSnapshot.msg,
      );
    } else if (actionSnapshot.type === 'mutate') {
      return new MutateAction(
        stores[actionSnapshot.storeId] as Writable<Objectish>,
        actionSnapshot.data as MutateActionPatch,
        actionSnapshot.msg,
      );
    }

    throw new Error('failed to create action');
  }

  return stackedActions;
}

export function createSnapshotFromActions<TMsg>(
  actions: UndoAction<unknown, unknown, TMsg>[],
  stores: Record<string, unknown>,
) {
  const storeIds = new Map<unknown, string>();
  for (const [key, value] of Object.entries(stores)) {
    storeIds.set(value, key);
  }

  return createSnapshot(actions, storeIds);
}

function createSnapshot<TMsg>(
  actions: UndoAction<unknown, unknown, TMsg>[],
  storeIds: Map<unknown, string>,
) {
  const actionSnapshots: UndoActionSnapshot<TMsg>[] = [];

  for (const action of actions) {
    let data: unknown = undefined;
    if (Array.isArray(action.patch)) {
      data = createSnapshot(
        action.patch as UndoAction<unknown, unknown, TMsg>[],
        storeIds,
      );
    } else {
      data = action.patch;
    }

    let storeId: string | undefined = undefined;
    if (action.store) {
      storeId = storeIds.get(action.store);
      if (!storeId) {
        throw new Error('missing store id');
      }
    }

    actionSnapshots.push({
      type: getActionTypeId(action),
      storeId,
      msg: action.msg,
      data,
    });
  }

  return actionSnapshots;
}

function getActionTypeId(action: UndoAction<unknown, unknown, unknown>) {
  return actionIds[action.constructor.name];
}

export const exportedForTesting = {
  getActionTypeId,
};
