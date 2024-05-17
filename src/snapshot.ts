import { isBarrierAction, type UndoAction } from './action/action';
import type { Objectish } from 'immer';
import { UndoState } from './state.svelte';
import { setAction } from './action/action-set';
import { MutateActionPatch, mutateAction } from './action/action-mutate';
import { groupAction } from './action/action-group';
import { initAction } from './action/action-init';
import { erasedAction } from './action/action-erased';

export type UndoActionSnapshot<TMsg> = {
  type: string;
  storeId?: string;
  msg: TMsg;
  data?: unknown;
};

export function loadActionsSnapshot<TMsg>(
  actionsSnapshot: UndoActionSnapshot<TMsg>[],
  stores: Record<string, unknown>,
) {
  const stackedActions: UndoAction<TMsg>[] = [];

  for (const actionSnapshot of actionsSnapshot) {
    const action = loadActionSnapshot(actionSnapshot);
    stackedActions.push(action);
  }

  function loadActionSnapshot<TMsg>(
    actionSnapshot: UndoActionSnapshot<TMsg>,
  ): UndoAction<TMsg> {
    if (actionSnapshot.type === 'group') {
      const actionsSnapshot =
        actionSnapshot.data as UndoActionSnapshot<undefined>[];
      const newGroupAction = groupAction(actionSnapshot.msg);
      for (const actionSnapshot of actionsSnapshot) {
        newGroupAction.push(loadActionSnapshot(actionSnapshot));
      }
      return newGroupAction;
    }

    if (actionSnapshot.type === 'init') {
      return initAction(actionSnapshot.msg);
    }

    if (actionSnapshot.type === 'erased') {
      return erasedAction(actionSnapshot.msg);
    }

    if (!actionSnapshot.storeId) {
      throw new Error('missing storeId');
    }

    if (actionSnapshot.type === 'set') {
      return setAction(
        stores[actionSnapshot.storeId] as UndoState<unknown>,
        actionSnapshot.data,
        actionSnapshot.msg,
      );
    } else if (actionSnapshot.type === 'mutate') {
      return mutateAction(
        stores[actionSnapshot.storeId] as UndoState<Objectish>,
        actionSnapshot.data as MutateActionPatch,
        actionSnapshot.msg,
      );
    }

    throw new Error(`invalid action type '${actionSnapshot.type}'`);
  }

  return stackedActions;
}

export function createSnapshotFromActions<TMsg>(actions: UndoAction<TMsg>[]) {
  return createSnapshot(actions);
}

function createSnapshot<TMsg>(actions: UndoAction<TMsg>[]) {
  const actionSnapshots: UndoActionSnapshot<TMsg>[] = [];

  for (const action of actions) {
    let data: unknown;
    if (isBarrierAction(action)) {
      data = undefined;
    } else if (Array.isArray(action.patch)) {
      data = createSnapshot(action.patch as UndoAction<TMsg>[]);
    } else {
      data = action.patch;
    }

    actionSnapshots.push({
      type: action.type,
      storeId: action.storeId,
      msg: action.msg,
      data,
    });
  }

  return actionSnapshots;
}
