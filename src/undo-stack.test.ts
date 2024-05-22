import { UndoStackSnapshot, undoStack } from './undo-stack';
import { get, writable } from 'svelte/store';
import { SetAction } from './action/action-set';
import { ErasedAction, InitAction } from './action/action-barrier';

describe('undoStack', () => {
  test('props should be readonly', () => {
    const undoStack1 = undoStack('created');

    // @ts-expect-error index should be readonly
    get(undoStack1).index = -1;

    // @ts-expect-error selectedAction should be readonly
    get(undoStack1).selectedAction = new InitAction('asdf');

    // @ts-expect-error canUndo should be readonly
    get(undoStack1).canUndo = false;

    // @ts-expect-error canRedo should be readonly
    get(undoStack1).canRedo = false;

    // @ts-expect-error actions.push should be accessible
    get(undoStack1).actions.push(new InitAction('asdf'));

    // @ts-expect-error action should be readonly
    get(undoStack1).actions[0].seqNbr = 1;
  });
});

describe('push', () => {
  test('should add a new item to the stack', () => {
    const undoStack1 = undoStack('created');
    const store = writable(1);
    expect(get(undoStack1).actions).toHaveLength(1);

    let action = new SetAction(store, 2, 'set value 2');
    action.apply();
    undoStack1.push(action);
    expect(get(undoStack1).actions).toHaveLength(2);

    action = new SetAction(store, 3, 'set value 3');
    action.apply();
    undoStack1.push(action);
    expect(get(undoStack1).actions).toHaveLength(3);
  });

  test('barrier action should set canUndo to false', () => {
    const undoStack1 = undoStack('created');

    undoStack1.push(new ErasedAction('barrier'));
    expect(get(undoStack1).canUndo).toBe(false);
  });
});

describe('undo', () => {
  test('should load previous state', () => {
    const undoStack1 = undoStack('created');
    const store = writable('old value');

    const action = new SetAction(store, 'new value', 'set new value');
    action.apply();
    undoStack1.push(action);
    expect(get(store)).toBe('new value');

    undoStack1.undo();
    expect(get(store)).toBe('old value');
  });

  test('should set canUndo to false if the new selected action is a barrier', () => {
    const undoStack1 = undoStack('created');
    const store = writable(1);

    const barrierAction = new ErasedAction('barrier');
    undoStack1.push(barrierAction);

    const setAction = new SetAction(store, 2, 'set 2');
    setAction.apply();
    undoStack1.push(setAction);

    undoStack1.undo();
    expect(get(undoStack1).canUndo).toBe(false);
  });

  test('should do nothing if their is no previous state', () => {
    const undoStack1 = undoStack('created');
    const store = writable('old value');

    undoStack1.undo();
    expect(get(store)).toBe('old value');
  });

  test('should do nothing if a barrier action is selected', () => {
    const undoStack1 = undoStack('created');

    const action = new ErasedAction('barrier');
    undoStack1.push(action);

    undoStack1.undo();
    expect(get(undoStack1).selectedAction).toBe(action);
  });
});

describe('redo', () => {
  test('should restore the next step', () => {
    const undoStack1 = undoStack('created');
    const store = writable('old value');

    const action = new SetAction(store, 'new value', 'set new value');
    action.apply();
    undoStack1.push(action);
    undoStack1.undo();

    undoStack1.redo();
    expect(get(store)).toBe('new value');
  });

  test('should do nothing if their is no next step', () => {
    const undoStack1 = undoStack('created');
    const store = writable('old value');

    undoStack1.redo();
    expect(get(store)).toBe('old value');
  });

  test('should do nothing if the next selected action would be a barrier', () => {
    const undoStack1 = undoStack('created');
    const store = writable(2);
    undoStack1.loadSnapshot(
      {
        index: 1,
        actions: [
          { type: 'init', msg: 'init' },
          { type: 'set', msg: 'set 2', storeId: 'store', data: 1 },
          { type: 'erased', msg: 'erased' },
        ],
      },
      { store },
    );

    undoStack1.redo();
    expect(get(undoStack1).index).toBe(1);
  });

  test('should set canRedo to false if the next action is a barrier', () => {
    const undoStack1 = undoStack('created');
    const store = writable(1);
    undoStack1.loadSnapshot(
      {
        index: 0,
        actions: [
          { type: 'init', msg: 'init' },
          { type: 'set', msg: 'set 2', storeId: 'store', data: 2 },
          { type: 'erased', msg: 'erased' },
        ],
      },
      { store },
    );

    undoStack1.redo();
    expect(get(undoStack1).index).toBe(1);
    expect(get(store)).toBe(2);
    expect(get(undoStack1).canRedo).toBe(false);
  });
});

describe('goto', () => {
  test('should load the specified state', () => {
    const undoStack1 = undoStack('created');

    const store = writable(0);
    const s0 = get(undoStack1).actions[0].seqNbr;
    let action = new SetAction(store, 1, 'set value 1');
    action.apply();
    undoStack1.push(action);
    action = new SetAction(store, 2, 'set value 2');
    action.apply();
    undoStack1.push(action);
    const s2 = action.seqNbr;
    action = new SetAction(store, 3, 'set value 3');
    action.apply();
    undoStack1.push(action);
    action = new SetAction(store, 4, 'set value 4');
    action.apply();
    undoStack1.push(action);
    action = new SetAction(store, 5, 'set value 5');
    action.apply();
    undoStack1.push(action);
    const s5 = action.seqNbr;
    action = new SetAction(store, 6, 'set value 6');
    action.apply();
    undoStack1.push(action);
    const s6 = action.seqNbr;

    // go backwards
    undoStack1.goto(s2);
    expect(get(store)).toBe(2);

    // go forward
    undoStack1.goto(s5);
    expect(get(store)).toBe(5);

    // go to first state
    undoStack1.goto(s0);
    expect(get(store)).toBe(0);

    // go to last state
    undoStack1.goto(s6);
    expect(get(store)).toBe(6);
  });

  test('should do nothing if specified seq number does not exist', () => {
    const undoStack1 = undoStack('created');
    const store = writable('old value');

    undoStack1.goto(999);
    expect(get(store)).toBe('old value');
  });

  test('should do nothing if specified seq number is already selected', () => {
    const undoStack1 = undoStack('created');
    const store = writable(0);
    const action = new SetAction(store, 1, 'set value 1');
    action.apply();
    undoStack1.push(action);

    undoStack1.goto(action.seqNbr);

    expect(get(undoStack1).selectedAction).toBe(action);
  });

  test('should do nothing if the target undo action crosses a barrier', () => {
    const undoStack1 = undoStack('created');

    const barrierAction = new ErasedAction('barrier');
    undoStack1.push(barrierAction);

    const store = writable(0);
    const setAction = new SetAction(store, 1, 'set 1');
    setAction.apply();
    undoStack1.push(setAction);

    undoStack1.goto(get(undoStack1).actions[0].seqNbr);

    expect(get(undoStack1).selectedAction).toBe(setAction);
    expect(get(undoStack1).canUndo).toBe(true);
  });

  test('should do nothing if the target redo action touches a barrier', () => {
    const undoStack1 = undoStack('created');
    const store = writable(1);
    undoStack1.loadSnapshot(
      {
        index: 0,
        actions: [
          { type: 'init', msg: 'init' },
          { type: 'set', msg: 'set 2', storeId: 'store', data: 2 },
          { type: 'erased', msg: 'erased' },
        ],
      },
      { store },
    );

    undoStack1.goto(get(undoStack1).actions[2].seqNbr);
    expect(get(undoStack1).index).toBe(0);
    expect(get(store)).toBe(1);
    expect(get(undoStack1).canRedo).toBe(true);
  });
});

describe('canUndo & canRedo', () => {
  test('should return the correct result', () => {
    const undoStack1 = undoStack('created');
    const store = writable(0);

    // [<0>]
    expect(get(undoStack1).canUndo).toBe(false);
    expect(get(undoStack1).canRedo).toBe(false);

    let action = new SetAction(store, 1, 'set value 1');
    action.apply();
    undoStack1.push(action);
    // [0, <1>]
    expect(get(undoStack1).canUndo).toBe(true);
    expect(get(undoStack1).canRedo).toBe(false);

    action = new SetAction(store, 2, 'set value 2');
    action.apply();
    undoStack1.push(action);
    // [0, 1, <2>]
    expect(get(undoStack1).canUndo).toBe(true);
    expect(get(undoStack1).canRedo).toBe(false);

    undoStack1.undo();
    // [0, <1>, 2]
    expect(get(undoStack1).canUndo).toBe(true);
    expect(get(undoStack1).canRedo).toBe(true);

    undoStack1.undo();
    // [<0>, 1, 2]
    expect(get(undoStack1).canUndo).toBe(false);
    expect(get(undoStack1).canRedo).toBe(true);

    undoStack1.redo();
    // [0, <1>, 2]
    expect(get(undoStack1).canUndo).toBe(true);
    expect(get(undoStack1).canRedo).toBe(true);

    undoStack1.redo();
    // [0, 1, <2>]
    expect(get(undoStack1).canUndo).toBe(true);
    expect(get(undoStack1).canRedo).toBe(false);

    undoStack1.goto(1);
    // [0, <1>, 2]
    expect(get(undoStack1).canUndo).toBe(true);
    expect(get(undoStack1).canRedo).toBe(true);

    undoStack1.goto(0);
    // [<0>, 1, 2]
    expect(get(undoStack1).canUndo).toBe(false);
    expect(get(undoStack1).canRedo).toBe(true);

    undoStack1.goto(2);
    // [0, 1, <2>]
    expect(get(undoStack1).canUndo).toBe(true);
    expect(get(undoStack1).canRedo).toBe(false);
  });
});

describe('subscribe', () => {
  test('should be called on push action', () => {
    const undoStack1 = undoStack('created');
    const store = writable(0);

    const onChanged = vitest.fn();
    undoStack1.subscribe(onChanged);

    const action = new SetAction(store, 1, 'set value 1');
    action.apply();
    undoStack1.push(action);
    expect(onChanged).toHaveBeenCalledTimes(2);
    expect(onChanged).toHaveBeenLastCalledWith(get(undoStack1));
  });

  test('should be called on undo', () => {
    const undoStack1 = undoStack('created');
    const store = writable(0);

    const action = new SetAction(store, 1, 'set value 1');
    action.apply();
    undoStack1.push(action);

    const onChanged = vitest.fn();
    undoStack1.subscribe(onChanged);
    undoStack1.undo();
    expect(onChanged).toHaveBeenCalledTimes(2);
    expect(onChanged).toHaveBeenLastCalledWith(get(undoStack1));
  });

  test('should be called on redo', () => {
    const undoStack1 = undoStack('created');
    const store = writable(0);

    const action = new SetAction(store, 1, 'set value 1');
    action.apply();
    undoStack1.push(action);
    undoStack1.undo();

    const onChanged = vitest.fn();
    undoStack1.subscribe(onChanged);
    undoStack1.redo();
    expect(onChanged).toHaveBeenCalledTimes(2);
    expect(onChanged).toHaveBeenLastCalledWith(get(undoStack1));
  });

  test('should not be called after unsubscribe', () => {
    const undoStack1 = undoStack('created');
    const store = writable(0);

    const action = new SetAction(store, 1, 'set value 1');
    action.apply();
    undoStack1.push(action);

    const onChanged = vitest.fn();
    const unsubscribe = undoStack1.subscribe(onChanged);
    undoStack1.undo();

    unsubscribe();
    undoStack1.redo();
    undoStack1.undo();
    expect(onChanged).toHaveBeenCalledTimes(2);
    expect(onChanged).toHaveBeenLastCalledWith(get(undoStack1));
  });
});

describe('erase', () => {
  test('should erase all undo steps', () => {
    const undoStack1 = undoStack('created');

    const action1 = new SetAction(writable(0), 1, 'set value 1');
    action1.apply();
    undoStack1.push(action1);

    const action2 = new SetAction(writable(0), 1, 'set value 2');
    action2.apply();
    undoStack1.push(action2);

    undoStack1.erase();

    expect(get(undoStack1).canUndo).toBe(false);
    expect(get(undoStack1).actions[0]).instanceOf(InitAction);
    expect(get(undoStack1).actions[1]).instanceOf(ErasedAction);
    expect(get(undoStack1).actions[2]).instanceOf(ErasedAction);
    expect(get(undoStack1).actions[0].msg).toBe('created');
    expect(get(undoStack1).actions[1].msg).toBe('set value 1');
    expect(get(undoStack1).actions[2].msg).toBe('set value 2');
    expect(get(undoStack1).actions[0].seqNbr).toBe(0);
    expect(get(undoStack1).actions[1].seqNbr).toBe(1);
    expect(get(undoStack1).actions[2].seqNbr).toBe(2);
    expect(get(undoStack1).selectedAction).toBe(get(undoStack1).actions[2]);
  });

  test('should erase starting from the specified action', () => {
    const undoStack1 = undoStack('created');

    const action1 = new SetAction(writable(0), 1, 'set value 1');
    action1.apply();
    undoStack1.push(action1);

    const action2 = new SetAction(writable(0), 1, 'set value 2');
    action2.apply();
    undoStack1.push(action2);

    undoStack1.erase(action1.seqNbr);

    expect(get(undoStack1).canUndo).toBe(true);
    expect(get(undoStack1).actions[0]).instanceOf(InitAction);
    expect(get(undoStack1).actions[1]).instanceOf(ErasedAction);
    expect(get(undoStack1).actions[2]).instanceOf(SetAction);
    expect(get(undoStack1).actions[0].msg).toBe('created');
    expect(get(undoStack1).actions[1].msg).toBe('set value 1');
    expect(get(undoStack1).actions[2].msg).toBe('set value 2');
    expect(get(undoStack1).actions[0].seqNbr).toBe(0);
    expect(get(undoStack1).actions[1].seqNbr).toBe(1);
    expect(get(undoStack1).actions[2].seqNbr).toBe(2);
  });

  test('should erase until first barrier action is reached', () => {
    const undoStack1 = undoStack('created');

    const action1 = new SetAction(writable(0), 1, 'set value 1');
    action1.apply();
    undoStack1.push(action1);

    undoStack1.push(new ErasedAction('barrier'));

    const action2 = new SetAction(writable(0), 1, 'set value 2');
    action2.apply();
    undoStack1.push(action2);

    undoStack1.erase();

    expect(get(undoStack1).canUndo).toBe(false);
    expect(get(undoStack1).actions[0]).instanceOf(InitAction);
    expect(get(undoStack1).actions[1]).instanceOf(SetAction);
    expect(get(undoStack1).actions[2]).instanceOf(ErasedAction);
    expect(get(undoStack1).actions[3]).instanceOf(ErasedAction);
    expect(get(undoStack1).actions[0].msg).toBe('created');
    expect(get(undoStack1).actions[1].msg).toBe('set value 1');
    expect(get(undoStack1).actions[2].msg).toBe('barrier');
    expect(get(undoStack1).actions[3].msg).toBe('set value 2');
    expect(get(undoStack1).actions[0].seqNbr).toBe(0);
    expect(get(undoStack1).actions[1].seqNbr).toBe(1);
    expect(get(undoStack1).actions[2].seqNbr).toBe(2);
    expect(get(undoStack1).actions[3].seqNbr).toBe(3);
  });

  test('should update canUndo state correctly', () => {
    const undoStack1 = undoStack('created');

    const foo = writable(0);

    const action1 = new SetAction(foo, 1, 'set value 1');
    action1.apply();
    undoStack1.push(action1);

    const action2 = new SetAction(foo, 1, 'set value 2');
    action2.apply();
    undoStack1.push(action2);

    const action3 = new SetAction(foo, 1, 'set value 3');
    action2.apply();
    undoStack1.push(action3);

    expect(get(undoStack1).canUndo).toBe(true);

    undoStack1.erase();
    expect(get(undoStack1).canUndo).toBe(false);

    // erase a state that has already been erased
    undoStack1.erase(action2.seqNbr);
    expect(get(undoStack1).canUndo).toBe(false);
  });

  test('should do nothing if some erased actions are unapplied', () => {
    const undoStack1 = undoStack('created');

    const action1 = new SetAction(writable(0), 1, 'set value 1');
    action1.apply();
    undoStack1.push(action1);

    const action2 = new SetAction(writable(0), 1, 'set value 2');
    action2.apply();
    undoStack1.push(action2);

    undoStack1.undo();

    undoStack1.erase();

    expect(get(undoStack1).canUndo).toBe(true);
    expect(get(undoStack1).actions[0]).instanceOf(InitAction);
    expect(get(undoStack1).actions[1]).instanceOf(SetAction);
    expect(get(undoStack1).actions[2]).instanceOf(SetAction);
  });

  test('should do nothing if an invalid seq number is provided', () => {
    const undoStack1 = undoStack('created');

    const action1 = new SetAction(writable(0), 1, 'set value 1');
    action1.apply();
    undoStack1.push(action1);

    undoStack1.erase(99999);

    expect(get(undoStack1).canUndo).toBe(true);
    expect(get(undoStack1).actions[0]).instanceOf(InitAction);
    expect(get(undoStack1).actions[1]).instanceOf(SetAction);
  });
});

describe('clear', () => {
  test('should all actions from stack and create a new init action', () => {
    const undoStack1 = undoStack('created');

    const action = new SetAction(writable(0), 1, 'set value 1');
    action.apply();
    undoStack1.push(action);

    undoStack1.clear();
    expect(get(undoStack1).index).toBe(0);
    expect(get(undoStack1).actions).toHaveLength(1);
    expect(get(undoStack1).actions[0].msg).toBe('created');
    expect(get(undoStack1).actions[0].seqNbr).toBe(2);
    expect(get(undoStack1).canUndo).toBe(false);
    expect(get(undoStack1).canRedo).toBe(false);
    expect(get(undoStack1).selectedAction).toBe(get(undoStack1).actions[0]);
  });
});

describe('clearUndo', () => {
  test('should do nothing if first action is selected', () => {
    const undoStack1 = undoStack('created');

    const action1 = new SetAction(writable(0), 1, 'set value 1');
    action1.apply();
    undoStack1.push(action1);

    undoStack1.undo();

    undoStack1.clearUndo();
    expect(get(undoStack1).index).toBe(0);
    expect(get(undoStack1).actions).toHaveLength(2);
    expect(get(undoStack1).actions[0].msg).toBe('created');
    expect(get(undoStack1).canUndo).toBe(false);
    expect(get(undoStack1).canRedo).toBe(true);
    expect(get(undoStack1).selectedAction).toBe(get(undoStack1).actions[0]);
    expect(get(undoStack1).selectedAction).instanceOf(InitAction);
  });

  test('should clear undo action and keep redo action', () => {
    const undoStack1 = undoStack('created');

    const action1 = new SetAction(writable(0), 1, 'set value 1');
    action1.apply();
    undoStack1.push(action1);

    const action2 = new SetAction(writable(0), 2, 'set value 2');
    action2.apply();
    undoStack1.push(action2);

    const action3 = new SetAction(writable(0), 3, 'set value 3');
    action3.apply();
    undoStack1.push(action3);

    undoStack1.undo();

    undoStack1.clearUndo();
    expect(get(undoStack1).index).toBe(0);
    expect(get(undoStack1).actions).toHaveLength(2);
    expect(get(undoStack1).actions[0].msg).toBe('set value 2');
    expect(get(undoStack1).canUndo).toBe(false);
    expect(get(undoStack1).canRedo).toBe(true);
    expect(get(undoStack1).selectedAction).toBe(get(undoStack1).actions[0]);
    expect(get(undoStack1).selectedAction).instanceOf(ErasedAction);
  });
});

describe('clearRedo', () => {
  test('should do nothing if last action is selected', () => {
    const undoStack1 = undoStack('created');

    const action1 = new SetAction(writable(0), 1, 'set value 1');
    action1.apply();
    undoStack1.push(action1);

    undoStack1.clearRedo();
    expect(get(undoStack1).index).toBe(1);
    expect(get(undoStack1).actions).toHaveLength(2);
    expect(get(undoStack1).actions[1].msg).toBe('set value 1');
    expect(get(undoStack1).canUndo).toBe(true);
    expect(get(undoStack1).canRedo).toBe(false);
    expect(get(undoStack1).selectedAction).toBe(get(undoStack1).actions[1]);
    expect(get(undoStack1).selectedAction).instanceOf(SetAction);
  });

  test('should clear redo action and keep undo action', () => {
    const undoStack1 = undoStack('created');

    const action1 = new SetAction(writable(0), 1, 'set value 1');
    action1.apply();
    undoStack1.push(action1);

    const action2 = new SetAction(writable(0), 2, 'set value 2');
    action2.apply();
    undoStack1.push(action2);

    const action3 = new SetAction(writable(0), 3, 'set value 3');
    action3.apply();
    undoStack1.push(action3);

    undoStack1.undo();

    undoStack1.clearRedo();
    expect(get(undoStack1).index).toBe(2);
    expect(get(undoStack1).actions).toHaveLength(3);
    expect(get(undoStack1).actions[2].msg).toBe('set value 2');
    expect(get(undoStack1).canUndo).toBe(true);
    expect(get(undoStack1).canRedo).toBe(false);
    expect(get(undoStack1).selectedAction).toBe(get(undoStack1).actions[2]);
    expect(get(undoStack1).selectedAction).instanceOf(SetAction);
  });
});

describe('loadSnapshot', () => {
  test('should load undo stack state', () => {
    const undoStack1 = undoStack('created');

    const undoStackSnapshot: UndoStackSnapshot<string> = {
      index: 1,
      actions: [
        { type: 'init', msg: 'init' },
        { type: 'set', storeId: 'foo', msg: 'set value 1', data: 0 },
      ],
    };
    const fooStore = writable(1);
    undoStack1.loadSnapshot(undoStackSnapshot, { foo: fooStore });

    expect(get(undoStack1).actions).toHaveLength(2);
    expect(get(undoStack1).index).toBe(1);
    expect(get(undoStack1).canUndo).toBe(true);
    expect(get(undoStack1).canRedo).toBe(false);
    expect(get(undoStack1).selectedAction).toBe(get(undoStack1).actions[1]);
    expect(get(undoStack1).actions.map((a) => a.seqNbr)).toEqual([1, 2]);

    undoStack1.undo();
    expect(get(undoStack1).index).toBe(0);
    expect(get(fooStore)).toBe(0);
  });

  test('should continue seqNbr from all actions ever pushed since undo stack has been created', () => {
    const undoStack1 = undoStack('created');

    const undoStackSnapshot: UndoStackSnapshot<string> = {
      index: 1,
      actions: [
        { type: 'init', msg: 'created' },
        { type: 'set', storeId: 'foo', msg: 'set value 1', data: 0 },
      ],
    };
    const fooStore = writable(1);
    undoStack1.loadSnapshot(undoStackSnapshot, { foo: fooStore });
    const action = new SetAction(fooStore, 2, 'set value 2');
    action.apply();
    undoStack1.push(action);
    const actions = get(undoStack1).actions;
    expect(actions.length).toEqual(3);
    expect(actions[2].seqNbr).toEqual(3);
  });
});

describe('createSnapshot', () => {
  test('should export undo stack state', () => {
    const undoStack1 = undoStack('created');
    const fooStore = writable(0);
    const action = new SetAction(fooStore, 1, 'set value 1');
    action.apply();
    undoStack1.push(action);

    const undoStackSnapshot = undoStack1.createSnapshot({ foo: fooStore });

    expect(undoStackSnapshot).toEqual({
      index: 1,
      actions: [
        { type: 'init', msg: 'created' },
        { type: 'set', storeId: 'foo', msg: 'set value 1', data: 0 },
      ],
    });
  });
});
