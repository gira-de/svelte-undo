import { get, writable } from 'svelte/store';
import { UndoAction } from './action/action';
import { GroupAction } from './action/action-group';
import { InitAction } from './action/action-init';
import { MutateAction, type MutateActionPatch } from './action/action-mutate';
import { SetAction } from './action/action-set';
import { getActionTypeId, loadActions, saveActions } from './snapshot';

export class FooAction extends UndoAction<string> {
  constructor() {
    super('Unknown Action', undefined, undefined);
  }
  apply() {
    // noop
  }
  revert() {
    // noop
  }
}

describe('getActionTypeId', () => {
  test.each([
    { action: new InitAction('InitAction'), actionId: 'init' },
    { action: new GroupAction('GroupAction'), actionId: 'group' },
    { action: new SetAction('SetAction', writable(0), 1), actionId: 'set' },
    {
      action: new MutateAction('MutateAction', writable({}), {
        patches: [],
        inversePatches: [],
      }),
      actionId: 'mutate',
    },
  ])('should return action id $actionId', ({ action, actionId }) => {
    expect(getActionTypeId(action)).toBe(actionId);
  });

  test('should return undefined if action is unkown', () => {
    expect(getActionTypeId(new FooAction())).toBe(undefined);
  });
});

describe('loadActions', () => {
  test('should load init-action', () => {
    const savedInitAction = {
      type: 'init',
      msg: 'InitAction',
    };

    const undoActions = loadActions([savedInitAction], {});
    expect(undoActions).toHaveLength(1);
    expect(undoActions[0]).instanceOf(InitAction);
    expect(undoActions[0].store).toBeUndefined();
    expect(undoActions[0].msg).toBe('InitAction');

    expect(() => undoActions[0].apply()).not.toThrow();
    expect(() => undoActions[0].revert()).not.toThrow();
  });

  test('should load group-action', () => {
    const savedGroupAction = {
      type: 'group',
      msg: 'GroupAction',
      data: [
        {
          type: 'set',
          storeId: 'store1',
          msg: 'SetAction',
          data: 1,
        },
      ],
    };

    const store1 = writable(0);

    const undoActions = loadActions([savedGroupAction], { store1 });
    expect(undoActions).toHaveLength(1);
    expect(undoActions[0]).instanceOf(GroupAction);
    expect(undoActions[0].store).toBeUndefined();
    expect(undoActions[0].msg).toBe('GroupAction');

    undoActions[0].apply();
    expect(get(store1)).toBe(1);

    undoActions[0].revert();
    expect(get(store1)).toBe(0);
  });

  test('should load set-action', () => {
    const savedSetAction = {
      type: 'set',
      storeId: 'store1',
      msg: 'SetAction',
      data: 1,
    };
    const store1 = writable(0);

    const undoActions = loadActions([savedSetAction], { store1 });
    expect(undoActions).toHaveLength(1);
    expect(undoActions[0]).instanceOf(SetAction);
    expect(undoActions[0].store).toBe(store1);
    expect(undoActions[0].msg).toBe('SetAction');

    undoActions[0].apply();
    expect(get(store1)).toBe(1);

    undoActions[0].revert();
    expect(get(store1)).toBe(0);
  });

  test('should load mutate-action', () => {
    const savedMutateAction = {
      type: 'mutate',
      storeId: 'store1',
      msg: 'MutateAction',
      data: {
        patches: [{ op: 'replace', path: ['value'], value: 1 }],
        inversePatches: [{ op: 'replace', path: ['value'], value: 0 }],
      },
    };
    const store1 = writable({ value: 0 });

    const undoActions = loadActions([savedMutateAction], { store1 });
    expect(undoActions).toHaveLength(1);
    expect(undoActions[0]).instanceOf(MutateAction);
    expect(undoActions[0].store).toBe(store1);
    expect(undoActions[0].msg).toBe('MutateAction');

    undoActions[0].apply();
    expect(get(store1)).toEqual({ value: 1 });

    undoActions[0].revert();
    expect(get(store1)).toEqual({ value: 0 });
  });

  test('should throw if set-actin does not contain a store id', () => {
    const savedSetAction = {
      type: 'set',
      msg: 'SetAction',
      data: 1,
    };
    const store1 = writable(0);

    expect(() => loadActions([savedSetAction], { store1 })).toThrow();
  });

  test('should throw if mutate-actin does not contain a store id', () => {
    const savedMutateAction = {
      type: 'mutate',
      msg: 'MutateAction',
      data: {
        patches: [{ op: 'replace', path: ['value'], value: 1 }],
        inversePatches: [{ op: 'replace', path: ['value'], value: 0 }],
      },
    };
    const store1 = writable({ value: 0 });

    expect(() => loadActions([savedMutateAction], { store1 })).toThrow();
  });

  test('should throw if action type id is unkown', () => {
    const savedFooAction = {
      type: 'foo',
      storeId: 'store1',
      msg: 'FooAction',
    };
    const store1 = writable(0);

    expect(() => loadActions([savedFooAction], { store1 })).toThrow();
  });
});

describe('saveActions', () => {
  test('should save init-action', () => {
    const initAction = new InitAction('InitAction');

    const savedActions = saveActions([initAction], {});

    expect(savedActions).toEqual([{ type: 'init', msg: 'InitAction' }]);
  });

  test('should save group-action', () => {
    const groupAction = new GroupAction('GroupAction');
    const store1 = writable(0);
    groupAction.push(new SetAction('SetAction', store1, 1));

    const savedActions = saveActions([groupAction], { store1 });

    expect(savedActions).toEqual([
      {
        type: 'group',
        msg: 'GroupAction',
        data: [{ type: 'set', msg: 'SetAction', storeId: 'store1', data: 1 }],
      },
    ]);
  });

  test('should save set-action', () => {
    const store1 = writable(0);

    const setAction = new SetAction('SetAction', store1, 1);
    const savedActions = saveActions([setAction], { store1 });

    expect(savedActions).toEqual([
      {
        type: 'set',
        storeId: 'store1',
        msg: 'SetAction',
        data: 1,
      },
    ]);
  });

  test('should save mutate-action', () => {
    const store1 = writable({ value: 0 });
    const patch: MutateActionPatch = {
      patches: [{ op: 'replace', path: ['value'], value: 1 }],
      inversePatches: [{ op: 'replace', path: ['value'], value: 0 }],
    };
    const mutateAction = new MutateAction('MutateAction', store1, patch);
    const savedActions = saveActions([mutateAction], { store1 });

    expect(savedActions).toEqual([
      {
        type: 'mutate',
        storeId: 'store1',
        msg: 'MutateAction',
        data: patch,
      },
    ]);
  });

  test('should save multiple actions', () => {
    const store1 = writable(0);
    const setAction = new SetAction('SetAction', store1, 1);

    const store2 = writable('hello');
    const setAction2 = new SetAction('SetAction', store2, 'world');

    const savedActions = saveActions([setAction, setAction2], {
      store1,
      store2,
    });

    expect(savedActions).toEqual([
      {
        type: 'set',
        storeId: 'store1',
        msg: 'SetAction',
        data: 1,
      },
      {
        type: 'set',
        storeId: 'store2',
        msg: 'SetAction',
        data: 'world',
      },
    ]);
  });

  test('should throw if store id is missing', () => {
    const store1 = writable(0);
    const setAction = new SetAction('SetAction', store1, 1);

    expect(() => saveActions([setAction], {})).toThrow();
  });
});
