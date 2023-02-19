import type { Objectish } from 'immer/dist/internal';
import type { Writable } from 'svelte/store';
import type { UndoAction } from './action/action';
import { GroupAction } from './action/action-group';
import { InitAction } from './action/action-init';
import { MutateAction, type MutateActionPatch } from './action/action-mutate';
import { SetAction } from './action/action-set';

export type SavedUndoAction<TMsg> = {
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

export function getActionTypeId(action: UndoAction<unknown>) {
  return actionIds[action.constructor.name];
}

export function loadActions<TMsg>(
  savedUndoActions: SavedUndoAction<TMsg>[],
  stores: Record<string, unknown>,
) {
  const stackedActions: UndoAction<TMsg>[] = [];

  for (const savedAction of savedUndoActions) {
    const action = loadAction(savedAction);
    stackedActions.push(action);
  }

  function loadAction(savedAction: SavedUndoAction<TMsg>): UndoAction<TMsg> {
    if (savedAction.type === 'group') {
      const savedGroupActions = savedAction.data as SavedUndoAction<TMsg>[];
      const undoActions = savedGroupActions.map((a) => loadAction(a));
      return new GroupAction(savedAction.msg, undoActions);
    } else if (savedAction.type === 'init') {
      return new InitAction(savedAction.msg);
    }

    if (!savedAction.storeId) {
      throw new Error('missing storeId');
    }

    if (savedAction.type === 'set') {
      return new SetAction(
        savedAction.msg,
        stores[savedAction.storeId] as Writable<unknown>,
        savedAction.data,
      );
    } else if (savedAction.type === 'mutate') {
      return new MutateAction(
        savedAction.msg,
        stores[savedAction.storeId] as Writable<Objectish>,
        savedAction.data as MutateActionPatch,
      );
    }

    throw new Error('failed to create action');
  }

  return stackedActions;
}

export function saveActions<TMsg>(
  actions: UndoAction<TMsg>[],
  stores: Record<string, unknown>,
) {
  const storeIds = new Map<unknown, string>();
  for (const [key, value] of Object.entries(stores)) {
    storeIds.set(value, key);
  }

  return _saveActions(actions, storeIds);
}

function _saveActions<TMsg>(
  actions: UndoAction<TMsg>[],
  storeIds: Map<unknown, string>,
) {
  const savedActions: SavedUndoAction<TMsg>[] = [];

  for (const action of actions) {
    let data: unknown = undefined;
    if (Array.isArray(action.patch)) {
      data = _saveActions(action.patch as UndoAction<TMsg>[], storeIds);
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

    savedActions.push({
      type: getActionTypeId(action),
      storeId,
      msg: action.msg,
      data,
    });
  }

  return savedActions;
}
