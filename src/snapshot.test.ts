import { erasedAction } from './action/action-erased';
import { groupAction } from './action/action-group';
import { initAction } from './action/action-init';
import { MutateActionPatch, mutateAction } from './action/action-mutate';
import { setAction } from './action/action-set';
import { loadActionsSnapshot, createSnapshotFromActions } from './snapshot';
import { undoState } from './state.svelte';

describe('loadActionsSnapshot', () => {
  test('should load init-action', () => {
    const initActionSnapshot = {
      type: 'init',
      msg: 'InitAction',
    };

    const undoActions = loadActionsSnapshot([initActionSnapshot], {});
    expect(undoActions).toHaveLength(1);
    expect(undoActions[0].type).toBe('init');
    expect(undoActions[0].storeId).toBeUndefined();
    expect(undoActions[0].msg).toBe('InitAction');
  });

  test('should load erased-action', () => {
    const erasedActionSnapshot = {
      type: 'erased',
      msg: 'ErasedAction',
    };

    const undoActions = loadActionsSnapshot([erasedActionSnapshot], {});
    expect(undoActions).toHaveLength(1);
    expect(undoActions[0].type).toBe('erased');
    expect(undoActions[0].storeId).toBeUndefined();
    expect(undoActions[0].msg).toBe('ErasedAction');
  });

  test('should load group-action', () => {
    const groupActionSnapshot = {
      type: 'group',
      msg: 'GroupAction',
      data: [
        {
          type: 'set',
          storeId: 'foo1',
          msg: 'SetAction',
          data: 1,
        },
      ],
    };

    const store1 = undoState('foo1', 0);

    const undoActions = loadActionsSnapshot([groupActionSnapshot], {
      foo1: store1,
    });
    expect(undoActions).toHaveLength(1);
    expect(undoActions[0].type).toBe('group');
    expect(undoActions[0].storeId).toBeUndefined();
    expect(undoActions[0].msg).toBe('GroupAction');

    undoActions[0].apply();
    expect(store1.value).toBe(1);

    undoActions[0].revert();
    expect(store1.value).toBe(0);
  });

  test('should load set-action', () => {
    const setActionSnapshot = {
      type: 'set',
      storeId: 'foo1',
      msg: 'SetAction',
      data: 1,
    };
    const store1 = undoState('foo1', 0);

    const undoActions = loadActionsSnapshot([setActionSnapshot], {
      foo1: store1,
    });
    expect(undoActions).toHaveLength(1);
    expect(undoActions[0].type).toBe('set');
    expect(undoActions[0].storeId).toBe(store1.id);
    expect(undoActions[0].msg).toBe('SetAction');

    undoActions[0].apply();
    expect(store1.value).toBe(1);

    undoActions[0].revert();
    expect(store1.value).toBe(0);
  });

  test('should load mutate-action', () => {
    const mutateActionSnapshot = {
      type: 'mutate',
      storeId: 'foo1',
      msg: 'MutateAction',
      data: {
        patches: [{ op: 'replace', path: ['value'], value: 1 }],
        inversePatches: [{ op: 'replace', path: ['value'], value: 0 }],
      },
    };
    const store1 = undoState('foo1', { value: 0 });

    const undoActions = loadActionsSnapshot([mutateActionSnapshot], {
      foo1: store1,
    });
    expect(undoActions).toHaveLength(1);
    expect(undoActions[0].type).toBe('mutate');
    expect(undoActions[0].storeId).toBe(store1.id);
    expect(undoActions[0].msg).toBe('MutateAction');

    undoActions[0].apply();
    expect(store1.value).toEqual({ value: 1 });

    undoActions[0].revert();
    expect(store1.value).toEqual({ value: 0 });
  });

  test('should throw if set-actin does not contain a store id', () => {
    const setActionSnapshot = {
      type: 'set',
      msg: 'SetAction',
      data: 1,
    };
    const store1 = undoState('foo1', 0);

    expect(() =>
      loadActionsSnapshot([setActionSnapshot], { store1 }),
    ).toThrow();
  });

  test('should throw if mutate-actin does not contain a store id', () => {
    const mutateActionSnapshot = {
      type: 'mutate',
      msg: 'MutateAction',
      data: {
        patches: [{ op: 'replace', path: ['value'], value: 1 }],
        inversePatches: [{ op: 'replace', path: ['value'], value: 0 }],
      },
    };
    const store1 = undoState('foo1', { value: 0 });

    expect(() =>
      loadActionsSnapshot([mutateActionSnapshot], { store1 }),
    ).toThrow();
  });

  test('should throw if action type id is unknown', () => {
    const fooActionSnapshot = {
      type: 'foo',
      storeId: 'foo1',
      msg: 'FooAction',
    };
    const store1 = undoState('foo1', 0);

    expect(() =>
      loadActionsSnapshot([fooActionSnapshot], { store1 }),
    ).toThrow();
  });
});

describe('createSnapshotFromActions', () => {
  test('should create a snapshot of an init-action', () => {
    const initAction1 = initAction('InitAction');

    const actionsSnapshot = createSnapshotFromActions([initAction1]);

    expect(actionsSnapshot).toEqual([{ type: 'init', msg: 'InitAction' }]);
  });

  test('should create a snapshot of an erase-action', () => {
    const erasedAction1 = erasedAction('ErasedAction');

    const actionsSnapshot = createSnapshotFromActions([erasedAction1]);

    expect(actionsSnapshot).toEqual([{ type: 'erased', msg: 'ErasedAction' }]);
  });

  test('should create a snapshot of a group-action', () => {
    const groupAction1 = groupAction('GroupAction');
    const store1 = undoState('foo1', 0);
    groupAction1.push(setAction(store1, 1, undefined));

    const actionsSnapshot = createSnapshotFromActions([groupAction1]);

    expect(actionsSnapshot).toEqual([
      {
        type: 'group',
        msg: 'GroupAction',
        data: [{ type: 'set', msg: undefined, storeId: 'foo1', data: 1 }],
      },
    ]);
  });

  test('should create a snapshot of a set-action', () => {
    const store1 = undoState('foo1', 0);

    const setAction1 = setAction(store1, 1, 'SetAction');
    const actionsSnapshot = createSnapshotFromActions([setAction1]);

    expect(actionsSnapshot).toEqual([
      {
        type: 'set',
        storeId: 'foo1',
        msg: 'SetAction',
        data: 1,
      },
    ]);
  });

  test('should create a snapshot of a mutate-action', () => {
    const store1 = undoState('foo1', { value: 0 });
    const patch: MutateActionPatch = {
      patches: [{ op: 'replace', path: ['value'], value: 1 }],
      inversePatches: [{ op: 'replace', path: ['value'], value: 0 }],
    };
    const mutateAction1 = mutateAction(store1, patch, 'MutateAction');
    const actionsSnapshot = createSnapshotFromActions([mutateAction1]);

    expect(actionsSnapshot).toEqual([
      {
        type: 'mutate',
        storeId: 'foo1',
        msg: 'MutateAction',
        data: patch,
      },
    ]);
  });

  test('should create a snapshot of multiple actions', () => {
    const store1 = undoState('foo1', 0);
    const setAction1 = setAction(store1, 1, 'SetAction');

    const store2 = undoState('foo2', 'hello');
    const setAction2 = setAction(store2, 'world', 'SetAction');

    const actionsSnapshot = createSnapshotFromActions([setAction1, setAction2]);

    expect(actionsSnapshot).toEqual([
      {
        type: 'set',
        storeId: 'foo1',
        msg: 'SetAction',
        data: 1,
      },
      {
        type: 'set',
        storeId: 'foo2',
        msg: 'SetAction',
        data: 'world',
      },
    ]);
  });
});
