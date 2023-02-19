import { SavedUndoStack, undoStackStore } from './undo-stack';
import { get, writable } from 'svelte/store';
import { SetAction } from './action/action-set';

describe('push', () => {
  test('should add a new item to the stack', () => {
    const undoStack = undoStackStore('created');
    const store = writable(1);
    expect(get(undoStack).actions).toHaveLength(1);

    let action = new SetAction('set value 2', store, 2);
    action.apply();
    undoStack.push(action);
    expect(get(undoStack).actions).toHaveLength(2);

    action = new SetAction('set value 3', store, 3);
    action.apply();
    undoStack.push(action);
    expect(get(undoStack).actions).toHaveLength(3);
  });
});

describe('undo', () => {
  test('should load previous state', () => {
    const undoStack = undoStackStore('created');
    const store = writable('old value');

    const action = new SetAction('set new value', store, 'new value');
    action.apply();
    undoStack.push(action);
    expect(get(store)).toBe('new value');

    undoStack.undo();
    expect(get(store)).toBe('old value');
  });

  test('should do nothing if their is no previous state', () => {
    const undoStack = undoStackStore('created');
    const store = writable('old value');

    undoStack.undo();
    expect(get(store)).toBe('old value');
  });
});

describe('redo', () => {
  test('should restore the next step', () => {
    const undoStack = undoStackStore('created');
    const store = writable('old value');

    const action = new SetAction('set new value', store, 'new value');
    action.apply();
    undoStack.push(action);
    undoStack.undo();

    undoStack.redo();
    expect(get(store)).toBe('new value');
  });

  test('should do nothing if their is no next step', () => {
    const undoStack = undoStackStore('created');
    const store = writable('old value');

    undoStack.redo();
    expect(get(store)).toBe('old value');
  });
});

describe('goto', () => {
  test('should load the specified state', () => {
    const undoStack = undoStackStore('created');
    const getSeqNbr = () => get(undoStack).actions[get(undoStack).index].seqNbr;

    const store = writable(0);
    const s0 = getSeqNbr();
    let action = new SetAction('set value 1', store, 1);
    action.apply();
    undoStack.push(action);
    action = new SetAction('set value 2', store, 2);
    action.apply();
    undoStack.push(action);
    const s2 = getSeqNbr();
    action = new SetAction('set value 3', store, 3);
    action.apply();
    undoStack.push(action);
    action = new SetAction('set value 4', store, 4);
    action.apply();
    undoStack.push(action);
    action = new SetAction('set value 5', store, 5);
    action.apply();
    undoStack.push(action);
    const s5 = getSeqNbr();
    action = new SetAction('set value 6', store, 6);
    action.apply();
    undoStack.push(action);
    const s6 = getSeqNbr();

    // go backwards
    undoStack.goto(s2);
    expect(get(store)).toBe(2);

    // go forward
    undoStack.goto(s5);
    expect(get(store)).toBe(5);

    // go to first state
    undoStack.goto(s0);
    expect(get(store)).toBe(0);

    // go to last state
    undoStack.goto(s6);
    expect(get(store)).toBe(6);
  });

  test('should do nothing if specified state does not exist', () => {
    const undoStack = undoStackStore('created');
    const store = writable('old value');

    undoStack.goto(999);
    expect(get(store)).toBe('old value');
  });
});

describe('canUndo & canRedo', () => {
  test('should return the correct result', () => {
    const undoStack = undoStackStore('created');
    const store = writable(0);

    // [<0>]
    expect(get(undoStack).canUndo).toBe(false);
    expect(get(undoStack).canRedo).toBe(false);

    let action = new SetAction('set value 1', store, 1);
    action.apply();
    undoStack.push(action);
    // [0, <1>]
    expect(get(undoStack).canUndo).toBe(true);
    expect(get(undoStack).canRedo).toBe(false);

    action = new SetAction('set value 2', store, 2);
    action.apply();
    undoStack.push(action);
    // [0, 1, <2>]
    expect(get(undoStack).canUndo).toBe(true);
    expect(get(undoStack).canRedo).toBe(false);

    undoStack.undo();
    // [0, <1>, 2]
    expect(get(undoStack).canUndo).toBe(true);
    expect(get(undoStack).canRedo).toBe(true);

    undoStack.undo();
    // [<0>, 1, 2]
    expect(get(undoStack).canUndo).toBe(false);
    expect(get(undoStack).canRedo).toBe(true);

    undoStack.redo();
    // [0, <1>, 2]
    expect(get(undoStack).canUndo).toBe(true);
    expect(get(undoStack).canRedo).toBe(true);

    undoStack.redo();
    // [0, 1, <2>]
    expect(get(undoStack).canUndo).toBe(true);
    expect(get(undoStack).canRedo).toBe(false);

    undoStack.goto(1);
    // [0, <1>, 2]
    expect(get(undoStack).canUndo).toBe(true);
    expect(get(undoStack).canRedo).toBe(true);

    undoStack.goto(0);
    // [<0>, 1, 2]
    expect(get(undoStack).canUndo).toBe(false);
    expect(get(undoStack).canRedo).toBe(true);

    undoStack.goto(2);
    // [0, 1, <2>]
    expect(get(undoStack).canUndo).toBe(true);
    expect(get(undoStack).canRedo).toBe(false);
  });
});

describe('subscribe', () => {
  test('should be called on push action', () => {
    const undoStack = undoStackStore('created');
    const store = writable(0);

    const onChanged = vitest.fn();
    undoStack.subscribe(onChanged);

    const action = new SetAction('set value 1', store, 1);
    action.apply();
    undoStack.push(action);
    expect(onChanged).toHaveBeenCalledTimes(2);
    expect(onChanged).toHaveBeenLastCalledWith(get(undoStack));
  });

  test('should be called on undo', () => {
    const undoStack = undoStackStore('created');
    const store = writable(0);

    const action = new SetAction('set value 1', store, 1);
    action.apply();
    undoStack.push(action);

    const onChanged = vitest.fn();
    undoStack.subscribe(onChanged);
    undoStack.undo();
    expect(onChanged).toHaveBeenCalledTimes(2);
    expect(onChanged).toHaveBeenLastCalledWith(get(undoStack));
  });

  test('should be called on redo', () => {
    const undoStack = undoStackStore('created');
    const store = writable(0);

    const action = new SetAction('set value 1', store, 1);
    action.apply();
    undoStack.push(action);
    undoStack.undo();

    const onChanged = vitest.fn();
    undoStack.subscribe(onChanged);
    undoStack.redo();
    expect(onChanged).toHaveBeenCalledTimes(2);
    expect(onChanged).toHaveBeenLastCalledWith(get(undoStack));
  });

  test('should not be called after unsubscribe', () => {
    const undoStack = undoStackStore('created');
    const store = writable(0);

    const action = new SetAction('set value 1', store, 1);
    action.apply();
    undoStack.push(action);

    const onChanged = vitest.fn();
    const unsubscribe = undoStack.subscribe(onChanged);
    undoStack.undo();

    unsubscribe();
    undoStack.redo();
    undoStack.undo();
    expect(onChanged).toHaveBeenCalledTimes(2);
    expect(onChanged).toHaveBeenLastCalledWith(get(undoStack));
  });
});

describe('load', () => {
  test('should load actions into stack', () => {
    const undoStack = undoStackStore('created');

    const savedUndoStack: SavedUndoStack<string> = {
      index: 1,
      actions: [
        { type: 'init', msg: 'init' },
        { type: 'set', storeId: 'foo', msg: 'set value 1', data: 0 },
      ],
    };
    const fooStore = writable(1);
    undoStack.load(savedUndoStack, { foo: fooStore });

    expect(get(undoStack).actions).toHaveLength(2);
    expect(get(undoStack).index).toBe(1);
    expect(get(undoStack).canUndo).toBe(true);
    expect(get(undoStack).canRedo).toBe(false);

    undoStack.undo();
    expect(get(undoStack).index).toBe(0);
    expect(get(fooStore)).toBe(0);
  });
});

describe('save', () => {
  test('should save undo stack actions', () => {
    const undoStack = undoStackStore('created');
    const fooStore = writable(0);
    const action = new SetAction('set value 1', fooStore, 1);
    action.apply();
    undoStack.push(action);

    const savedUndoStack = undoStack.save({ foo: fooStore });

    expect(savedUndoStack).toEqual({
      index: 1,
      actions: [
        { type: 'init', msg: 'created' },
        { type: 'set', storeId: 'foo', msg: 'set value 1', data: 0 },
      ],
    });
  });
});
