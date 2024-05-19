import { isBarrierAction } from './action/action-barrier.js';
import { createErasedAction } from './action/action-erased.js';
import { createGroupAction } from './action/action-group.js';
import { createInitAction } from './action/action-init.js';
import {
  type MutateActionPatch,
  createMutateAction,
} from './action/action-mutate.js';
import { createSetAction } from './action/action-set.js';
import { loadSnapshotActions, createSnapshotActions } from './snapshot.js';
import { undoable } from './state.svelte.js';

describe('loadSnapshotActions', () => {
  test('should load init-action', () => {
    const initSnapshotAction = {
      type: 'init',
      msg: 'InitAction',
    };

    const actions = loadSnapshotActions([initSnapshotAction], {});
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('init');
    expect(actions[0].storeId).toBeUndefined();
    expect(actions[0].msg).toBe('InitAction');
    expect(isBarrierAction(actions[0])).toBe(true);
    expect(() => actions[0].apply()).toThrow();
    expect(() => actions[0].revert()).toThrow();
  });

  test('should load erased-action', () => {
    const erasedSnapshotAction = {
      type: 'erased',
      msg: 'ErasedAction',
    };

    const actions = loadSnapshotActions([erasedSnapshotAction], {});
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('erased');
    expect(actions[0].storeId).toBeUndefined();
    expect(actions[0].msg).toBe('ErasedAction');
    expect(isBarrierAction(actions[0])).toBe(true);
    expect(() => actions[0].apply()).toThrow();
    expect(() => actions[0].revert()).toThrow();
  });

  test('should load group-action', () => {
    const groupSnapshotAction = {
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

    const hState1 = undoable('foo1', 0);

    const actions = loadSnapshotActions([groupSnapshotAction], {
      foo1: hState1,
    });
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('group');
    expect(actions[0].storeId).toBeUndefined();
    expect(actions[0].msg).toBe('GroupAction');

    actions[0].apply();
    expect(hState1.value).toBe(1);

    actions[0].revert();
    expect(hState1.value).toBe(0);
  });

  test('should load set-action', () => {
    const setSnapshotAction = {
      type: 'set',
      storeId: 'foo1',
      msg: 'SetAction',
      data: 1,
    };
    const hState1 = undoable('foo1', 0);

    const actions = loadSnapshotActions([setSnapshotAction], {
      foo1: hState1,
    });
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('set');
    expect(actions[0].storeId).toBe(hState1.id);
    expect(actions[0].msg).toBe('SetAction');

    actions[0].apply();
    expect(hState1.value).toBe(1);

    actions[0].revert();
    expect(hState1.value).toBe(0);
  });

  test('should load mutate-action', () => {
    const mutateSnapshotAction = {
      type: 'mutate',
      storeId: 'foo1',
      msg: 'MutateAction',
      data: {
        patches: [{ op: 'replace', path: ['value'], value: 1 }],
        inversePatches: [{ op: 'replace', path: ['value'], value: 0 }],
      },
    };
    const hState1 = undoable('foo1', { value: 0 });

    const actions = loadSnapshotActions([mutateSnapshotAction], {
      foo1: hState1,
    });
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('mutate');
    expect(actions[0].storeId).toBe(hState1.id);
    expect(actions[0].msg).toBe('MutateAction');

    actions[0].apply();
    expect(hState1.value).toEqual({ value: 1 });

    actions[0].revert();
    expect(hState1.value).toEqual({ value: 0 });
  });

  test('should throw if set-actin does not contain a store id', () => {
    const setSnapshotAction = {
      type: 'set',
      msg: 'SetAction',
      data: 1,
    };
    const hState1 = undoable('foo1', 0);

    expect(() =>
      loadSnapshotActions([setSnapshotAction], { hState1 }),
    ).toThrow();
  });

  test('should throw if mutate-action does not contain a store id', () => {
    const mutateSnapshotAction = {
      type: 'mutate',
      msg: 'MutateAction',
      data: {
        patches: [{ op: 'replace', path: ['value'], value: 1 }],
        inversePatches: [{ op: 'replace', path: ['value'], value: 0 }],
      },
    };
    const hState1 = undoable('foo1', { value: 0 });

    expect(() =>
      loadSnapshotActions([mutateSnapshotAction], { hState1 }),
    ).toThrow();
  });

  test('should throw if action type id is unknown', () => {
    const fooSnapshotAction = {
      type: 'foo',
      storeId: 'foo1',
      msg: 'FooAction',
    };
    const hState1 = undoable('foo1', 0);

    expect(() =>
      loadSnapshotActions([fooSnapshotAction], { hState1 }),
    ).toThrow();
  });
});

describe('createSnapshotActions', () => {
  test('should create a snapshot of an init-action', () => {
    const initAction1 = createInitAction('InitAction');

    const actions = createSnapshotActions([initAction1]);

    expect(actions).toEqual([{ type: 'init', msg: 'InitAction' }]);
  });

  test('should create a snapshot of an erase-action', () => {
    const erasedAction1 = createErasedAction('ErasedAction');

    const actions = createSnapshotActions([erasedAction1]);

    expect(actions).toEqual([{ type: 'erased', msg: 'ErasedAction' }]);
  });

  test('should create a snapshot of a group-action', () => {
    const groupAction1 = createGroupAction('GroupAction');
    const hState1 = undoable('foo1', 0);
    groupAction1.push(createSetAction(hState1, 1, undefined));

    const actions = createSnapshotActions([groupAction1]);

    expect(actions).toEqual([
      {
        type: 'group',
        msg: 'GroupAction',
        data: [{ type: 'set', msg: undefined, storeId: 'foo1', data: 1 }],
      },
    ]);
  });

  test('should create a snapshot of a set-action', () => {
    const hState1 = undoable('foo1', 0);
    const setAction1 = createSetAction(hState1, 1, 'SetAction');

    const actions = createSnapshotActions([setAction1]);

    expect(actions).toEqual([
      {
        type: 'set',
        storeId: 'foo1',
        msg: 'SetAction',
        data: 1,
      },
    ]);
  });

  test('should create a snapshot of a mutate-action', () => {
    const hState1 = undoable('foo1', { value: 0 });
    const patch: MutateActionPatch = {
      patches: [{ op: 'replace', path: ['value'], value: 1 }],
      inversePatches: [{ op: 'replace', path: ['value'], value: 0 }],
    };
    const mutateAction1 = createMutateAction(hState1, patch, 'MutateAction');

    const actions = createSnapshotActions([mutateAction1]);

    expect(actions).toEqual([
      {
        type: 'mutate',
        storeId: 'foo1',
        msg: 'MutateAction',
        data: patch,
      },
    ]);
  });

  test('should create a snapshot of multiple actions', () => {
    const hState1 = undoable('foo1', 0);
    const setAction1 = createSetAction(hState1, 1, 'SetAction');

    const hState2 = undoable('foo2', 'hello');
    const setAction2 = createSetAction(hState2, 'world', 'SetAction');

    const actions = createSnapshotActions([setAction1, setAction2]);

    expect(actions).toEqual([
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
