import { undoable } from './undoable.svelte.js';
import { createSetAction } from './action/set.js';
import { createErasedAction } from './action/erased.js';
import { createInitAction } from './action/init.js';
import { createHistoryStack } from './stack.svelte.js';
import type { HistorySnapshot } from './snapshot.js';

describe('historyStack', () => {
  test('props should be readonly', () => {
    const historyStack = createHistoryStack('created');

    // @ts-expect-error index should be readonly
    expect(() => (historyStack.index = -1)).toThrow();

    expect(
      // @ts-expect-error selectedAction should be readonly
      () => (historyStack.selectedAction = createInitAction('asdf')),
    ).toThrow();

    // @ts-expect-error canUndo should be readonly
    expect(() => (historyStack.canUndo = false)).toThrow();

    // @ts-expect-error canRedo should be readonly
    expect(() => (historyStack.canRedo = false)).toThrow();

    // @ts-expect-error actions.push should be accessible
    historyStack.actions.push(createInitAction('asdf'));

    // @ts-expect-error action should be readonly
    historyStack.actions[0].seqNbr = 1;
  });
});

describe('push', () => {
  test('should add a new item to the stack', () => {
    const historyStack = createHistoryStack('created');
    const foo = undoable('foo', 1);
    expect(historyStack.actions).toHaveLength(1);

    let action = createSetAction(foo, 2, 'set value 2');
    action.apply();
    historyStack.push(action);
    expect(historyStack.actions).toHaveLength(2);

    action = createSetAction(foo, 3, 'set value 3');
    action.apply();
    historyStack.push(action);
    expect(historyStack.actions).toHaveLength(3);
  });

  test('barrier action should set canUndo to false', () => {
    const historyStack = createHistoryStack('created');

    historyStack.push(createErasedAction('barrier'));
    expect(historyStack.canUndo).toBe(false);
  });
});

describe('undo', () => {
  test('should load previous state', () => {
    const historyStack = createHistoryStack('created');
    const foo = undoable('foo', 'old value');

    const action = createSetAction(foo, 'new value', 'set new value');
    action.apply();
    historyStack.push(action);
    expect(foo.value).toBe('new value');

    historyStack.undo();
    expect(foo.value).toBe('old value');
  });

  test('should set canUndo to false if the new selected action is a barrier', () => {
    const historyStack = createHistoryStack('created');
    const foo = undoable('foo', 1);

    const barrierAction = createErasedAction('barrier');
    historyStack.push(barrierAction);

    const setAction1 = createSetAction(foo, 2, 'set 2');
    setAction1.apply();
    historyStack.push(setAction1);

    historyStack.undo();
    expect(historyStack.canUndo).toBe(false);
  });

  test('should do nothing if their is no previous state', () => {
    const historyStack = createHistoryStack('created');
    const foo = undoable('foo', 'old value');

    historyStack.undo();
    expect(foo.value).toBe('old value');
  });

  test('should do nothing if a barrier action is selected', () => {
    const historyStack = createHistoryStack('created');

    const action = createErasedAction('barrier');
    historyStack.push(action);

    historyStack.undo();
    expect(historyStack.selectedAction).toEqual(action);
  });
});

describe('redo', () => {
  test('should restore the next step', () => {
    const historyStack = createHistoryStack('created');
    const foo = undoable('foo', 'old value');

    const action = createSetAction(foo, 'new value', 'set new value');
    action.apply();
    historyStack.push(action);
    historyStack.undo();

    historyStack.redo();
    expect(foo.value).toBe('new value');
  });

  test('should do nothing if their is no next step', () => {
    const historyStack = createHistoryStack('created');
    const foo = undoable('foo', 'old value');

    historyStack.redo();
    expect(foo.value).toBe('old value');
  });

  test('should do nothing if the next selected action would be a barrier', () => {
    const historyStack = createHistoryStack('created');
    const foo = undoable('foo', 2);
    historyStack.loadSnapshot(
      {
        index: 1,
        actions: [
          { type: 'init', msg: 'init' },
          { type: 'set', msg: 'set 2', storeId: foo.id, data: 1 },
          { type: 'erased', msg: 'erased' },
        ],
      },
      { foo },
    );

    historyStack.redo();
    expect(historyStack.index).toBe(1);
  });

  test('should set canRedo to false if the next action is a barrier', () => {
    const historyStack = createHistoryStack('created');
    const foo = undoable('foo', 1);
    historyStack.loadSnapshot(
      {
        index: 0,
        actions: [
          { type: 'init', msg: 'init' },
          { type: 'set', msg: 'set 2', storeId: foo.id, data: 2 },
          { type: 'erased', msg: 'erased' },
        ],
      },
      { foo },
    );

    historyStack.redo();
    expect(historyStack.index).toBe(1);
    expect(foo.value).toBe(2);
    expect(historyStack.canRedo).toBe(false);
  });
});

describe('goto', () => {
  test('should load the specified state', () => {
    const historyStack = createHistoryStack('created');

    const foo = undoable('foo', 0);
    const s0 = historyStack.actions[0].seqNbr;
    let action = createSetAction(foo, 1, 'set value 1');
    action.apply();
    historyStack.push(action);
    action = createSetAction(foo, 2, 'set value 2');
    action.apply();
    historyStack.push(action);
    const s2 = action.seqNbr;
    action = createSetAction(foo, 3, 'set value 3');
    action.apply();
    historyStack.push(action);
    action = createSetAction(foo, 4, 'set value 4');
    action.apply();
    historyStack.push(action);
    action = createSetAction(foo, 5, 'set value 5');
    action.apply();
    historyStack.push(action);
    const s5 = action.seqNbr;
    action = createSetAction(foo, 6, 'set value 6');
    action.apply();
    historyStack.push(action);
    const s6 = action.seqNbr;

    // go backwards
    historyStack.goto(s2);
    expect(foo.value).toBe(2);

    // go forward
    historyStack.goto(s5);
    expect(foo.value).toBe(5);

    // go to first state
    historyStack.goto(s0);
    expect(foo.value).toBe(0);

    // go to last state
    historyStack.goto(s6);
    expect(foo.value).toBe(6);
  });

  test('should do nothing if specified seq number does not exist', () => {
    const historyStack = createHistoryStack('created');
    const foo = undoable('foo', 'old value');

    historyStack.goto(999);
    expect(foo.value).toBe('old value');
  });

  test('should do nothing if specified seq number is already selected', () => {
    const historyStack = createHistoryStack('created');
    const foo = undoable('foo', 0);
    const action = createSetAction(foo, 1, 'set value 1');
    action.apply();
    historyStack.push(action);

    historyStack.goto(action.seqNbr);

    expect(historyStack.selectedAction).toEqual(action);
  });

  test('should do nothing if the target undo action crosses a barrier', () => {
    const historyStack = createHistoryStack('created');

    const barrierAction = createErasedAction('barrier');
    historyStack.push(barrierAction);

    const foo = undoable('foo', 0);
    const setAction1 = createSetAction(foo, 1, 'set 1');
    setAction1.apply();
    historyStack.push(setAction1);

    historyStack.goto(historyStack.actions[0].seqNbr);

    expect(historyStack.selectedAction).toEqual(setAction1);
    expect(historyStack.canUndo).toBe(true);
  });

  test('should do nothing if the target redo action touches a barrier', () => {
    const historyStack = createHistoryStack('created');
    const foo = undoable('foo', 1);
    historyStack.loadSnapshot(
      {
        index: 0,
        actions: [
          { type: 'init', msg: 'init' },
          { type: 'set', msg: 'set 2', storeId: foo.id, data: 2 },
          { type: 'erased', msg: 'erased' },
        ],
      },
      { foo },
    );

    historyStack.goto(historyStack.actions[2].seqNbr);
    expect(historyStack.index).toBe(0);
    expect(foo.value).toBe(1);
    expect(historyStack.canRedo).toBe(true);
  });
});

describe('canUndo & canRedo', () => {
  test('should return the correct result', () => {
    const historyStack = createHistoryStack('created');
    const foo = undoable('foo', 0);

    // [<0>]
    expect(historyStack.canUndo).toBe(false);
    expect(historyStack.canRedo).toBe(false);

    let action = createSetAction(foo, 1, 'set value 1');
    action.apply();
    historyStack.push(action);
    // [0, <1>]
    expect(historyStack.canUndo).toBe(true);
    expect(historyStack.canRedo).toBe(false);

    action = createSetAction(foo, 2, 'set value 2');
    action.apply();
    historyStack.push(action);
    // [0, 1, <2>]
    expect(historyStack.canUndo).toBe(true);
    expect(historyStack.canRedo).toBe(false);

    historyStack.undo();
    // [0, <1>, 2]
    expect(historyStack.canUndo).toBe(true);
    expect(historyStack.canRedo).toBe(true);

    historyStack.undo();
    // [<0>, 1, 2]
    expect(historyStack.canUndo).toBe(false);
    expect(historyStack.canRedo).toBe(true);

    historyStack.redo();
    // [0, <1>, 2]
    expect(historyStack.canUndo).toBe(true);
    expect(historyStack.canRedo).toBe(true);

    historyStack.redo();
    // [0, 1, <2>]
    expect(historyStack.canUndo).toBe(true);
    expect(historyStack.canRedo).toBe(false);

    historyStack.goto(1);
    // [0, <1>, 2]
    expect(historyStack.canUndo).toBe(true);
    expect(historyStack.canRedo).toBe(true);

    historyStack.goto(0);
    // [<0>, 1, 2]
    expect(historyStack.canUndo).toBe(false);
    expect(historyStack.canRedo).toBe(true);

    historyStack.goto(2);
    // [0, 1, <2>]
    expect(historyStack.canUndo).toBe(true);
    expect(historyStack.canRedo).toBe(false);
  });
});

describe('erase', () => {
  test('should erase all undo steps', () => {
    const historyStack = createHistoryStack('created');

    const action1 = createSetAction(undoable('foo1', 0), 1, 'set value 1');
    action1.apply();
    historyStack.push(action1);

    const action2 = createSetAction(undoable('foo2', 0), 1, 'set value 2');
    action2.apply();
    historyStack.push(action2);

    historyStack.erase();
    expect(historyStack.canUndo).toBe(false);
    expect(historyStack.actions[0].type).toBe('init');
    expect(historyStack.actions[1].type).toBe('erased');
    expect(historyStack.actions[2].type).toBe('erased');
    expect(historyStack.actions[0].msg).toBe('created');
    expect(historyStack.actions[1].msg).toBe('set value 1');
    expect(historyStack.actions[2].msg).toBe('set value 2');
    expect(historyStack.actions[0].seqNbr).toBe(0);
    expect(historyStack.actions[1].seqNbr).toBe(1);
    expect(historyStack.actions[2].seqNbr).toBe(2);
    expect(historyStack.selectedAction).toBe(historyStack.actions[2]);
  });

  test('should erase starting from the specified action', () => {
    const historyStack = createHistoryStack('created');

    const action1 = createSetAction(undoable('foo1', 0), 1, 'set value 1');
    action1.apply();
    historyStack.push(action1);

    const action2 = createSetAction(undoable('foo2', 0), 1, 'set value 2');
    action2.apply();
    historyStack.push(action2);

    historyStack.erase(action1.seqNbr);

    expect(historyStack.canUndo).toBe(true);
    expect(historyStack.actions[0].type).toBe('init');
    expect(historyStack.actions[1].type).toBe('erased');
    expect(historyStack.actions[2].type).toBe('set');
    expect(historyStack.actions[0].msg).toBe('created');
    expect(historyStack.actions[1].msg).toBe('set value 1');
    expect(historyStack.actions[2].msg).toBe('set value 2');
    expect(historyStack.actions[0].seqNbr).toBe(0);
    expect(historyStack.actions[1].seqNbr).toBe(1);
    expect(historyStack.actions[2].seqNbr).toBe(2);
  });

  test('should erase until first barrier action is reached', () => {
    const historyStack = createHistoryStack('created');

    const action1 = createSetAction(undoable('foo1', 0), 1, 'set value 1');
    action1.apply();
    historyStack.push(action1);

    historyStack.push(createErasedAction('barrier'));

    const action2 = createSetAction(undoable('foo2', 0), 1, 'set value 2');
    action2.apply();
    historyStack.push(action2);

    historyStack.erase();

    expect(historyStack.canUndo).toBe(false);
    expect(historyStack.actions[0].type).toBe('init');
    expect(historyStack.actions[1].type).toBe('set');
    expect(historyStack.actions[2].type).toBe('erased');
    expect(historyStack.actions[3].type).toBe('erased');
    expect(historyStack.actions[0].msg).toBe('created');
    expect(historyStack.actions[1].msg).toBe('set value 1');
    expect(historyStack.actions[2].msg).toBe('barrier');
    expect(historyStack.actions[3].msg).toBe('set value 2');
    expect(historyStack.actions[0].seqNbr).toBe(0);
    expect(historyStack.actions[1].seqNbr).toBe(1);
    expect(historyStack.actions[2].seqNbr).toBe(2);
    expect(historyStack.actions[3].seqNbr).toBe(3);
  });

  test('should update canUndo state correctly', () => {
    const historyStack = createHistoryStack('created');

    const foo = undoable('foo', 0);

    const action1 = createSetAction(foo, 1, 'set value 1');
    action1.apply();
    historyStack.push(action1);

    const action2 = createSetAction(foo, 1, 'set value 2');
    action2.apply();
    historyStack.push(action2);

    const action3 = createSetAction(foo, 1, 'set value 3');
    action2.apply();
    historyStack.push(action3);

    expect(historyStack.canUndo).toBe(true);

    historyStack.erase();
    expect(historyStack.canUndo).toBe(false);

    // erase a state that has already been erased
    historyStack.erase(action2.seqNbr);
    expect(historyStack.canUndo).toBe(false);
  });

  test('should do nothing if some erased actions are unapplied', () => {
    const historyStack = createHistoryStack('created');

    const action1 = createSetAction(undoable('foo1', 0), 1, 'set value 1');
    action1.apply();
    historyStack.push(action1);

    const action2 = createSetAction(undoable('foo2', 0), 1, 'set value 2');
    action2.apply();
    historyStack.push(action2);

    historyStack.undo();

    historyStack.erase();

    expect(historyStack.canUndo).toBe(true);
    expect(historyStack.actions[0].type).toBe('init');
    expect(historyStack.actions[1].type).toBe('set');
    expect(historyStack.actions[2].type).toBe('set');
  });

  test('should do nothing if an invalid seq number is provided', () => {
    const historyStack = createHistoryStack('created');

    const action1 = createSetAction(undoable('foo1', 0), 1, 'set value 1');
    action1.apply();
    historyStack.push(action1);

    historyStack.erase(99999);

    expect(historyStack.canUndo).toBe(true);
    expect(historyStack.actions[0].type).toBe('init');
    expect(historyStack.actions[1].type).toBe('set');
  });
});

describe('clear', () => {
  test('should all actions from stack and create a new init action', () => {
    const historyStack = createHistoryStack('created');

    const action = createSetAction(undoable('foo', 0), 1, 'set value 1');
    action.apply();
    historyStack.push(action);

    historyStack.clear();
    expect(historyStack.index).toBe(0);
    expect(historyStack.actions).toHaveLength(1);
    expect(historyStack.actions[0].msg).toBe('created');
    expect(historyStack.actions[0].seqNbr).toBe(2);
    expect(historyStack.canUndo).toBe(false);
    expect(historyStack.canRedo).toBe(false);
    expect(historyStack.selectedAction).toBe(historyStack.actions[0]);
  });
});

describe('clearUndo', () => {
  test('should do nothing if first action is selected', () => {
    const historyStack = createHistoryStack('created');

    const action1 = createSetAction(undoable('foo1', 0), 1, 'set value 1');
    action1.apply();
    historyStack.push(action1);

    historyStack.undo();

    historyStack.clearUndo();
    expect(historyStack.index).toBe(0);
    expect(historyStack.actions).toHaveLength(2);
    expect(historyStack.actions[0].msg).toBe('created');
    expect(historyStack.canUndo).toBe(false);
    expect(historyStack.canRedo).toBe(true);
    expect(historyStack.selectedAction).toBe(historyStack.actions[0]);
    expect(historyStack.selectedAction.type).toBe('init');
  });

  test('should clear undo action and keep redo action', () => {
    const historyStack = createHistoryStack('created');

    const action1 = createSetAction(undoable('foo1', 0), 1, 'set value 1');
    action1.apply();
    historyStack.push(action1);

    const action2 = createSetAction(undoable('foo2', 0), 2, 'set value 2');
    action2.apply();
    historyStack.push(action2);

    const action3 = createSetAction(undoable('foo3', 0), 3, 'set value 3');
    action3.apply();
    historyStack.push(action3);

    historyStack.undo();

    historyStack.clearUndo();
    expect(historyStack.index).toBe(0);
    expect(historyStack.actions).toHaveLength(2);
    expect(historyStack.actions[0].msg).toBe('set value 2');
    expect(historyStack.canUndo).toBe(false);
    expect(historyStack.canRedo).toBe(true);
    expect(historyStack.selectedAction).toBe(historyStack.actions[0]);
    expect(historyStack.selectedAction.type).toBe('erased');
  });
});

describe('clearRedo', () => {
  test('should do nothing if last action is selected', () => {
    const historyStack = createHistoryStack('created');

    const action1 = createSetAction(undoable('foo1', 0), 1, 'set value 1');
    action1.apply();
    historyStack.push(action1);

    historyStack.clearRedo();
    expect(historyStack.index).toBe(1);
    expect(historyStack.actions).toHaveLength(2);
    expect(historyStack.actions[1].msg).toBe('set value 1');
    expect(historyStack.canUndo).toBe(true);
    expect(historyStack.canRedo).toBe(false);
    expect(historyStack.selectedAction).toBe(historyStack.actions[1]);
    expect(historyStack.selectedAction.type).toBe('set');
  });

  test('should clear redo action and keep undo action', () => {
    const historyStack = createHistoryStack('created');

    const action1 = createSetAction(undoable('foo1', 0), 1, 'set value 1');
    action1.apply();
    historyStack.push(action1);

    const action2 = createSetAction(undoable('foo2', 0), 2, 'set value 2');
    action2.apply();
    historyStack.push(action2);

    const action3 = createSetAction(undoable('foo3', 0), 3, 'set value 3');
    action3.apply();
    historyStack.push(action3);

    historyStack.undo();

    historyStack.clearRedo();
    expect(historyStack.index).toBe(2);
    expect(historyStack.actions).toHaveLength(3);
    expect(historyStack.actions[2].msg).toBe('set value 2');
    expect(historyStack.canUndo).toBe(true);
    expect(historyStack.canRedo).toBe(false);
    expect(historyStack.selectedAction).toBe(historyStack.actions[2]);
    expect(historyStack.selectedAction.type).toBe('set');
  });
});

describe('loadSnapshot', () => {
  test('should load undo stack state', () => {
    const historyStack = createHistoryStack('created');

    const historySnapshot: HistorySnapshot<string> = {
      index: 1,
      actions: [
        { type: 'init', msg: 'init' },
        { type: 'set', storeId: 'foo', msg: 'set value 1', data: 0 },
      ],
    };
    const foo = undoable('foo', 1);
    historyStack.loadSnapshot(historySnapshot, { foo });

    expect(historyStack.actions).toHaveLength(2);
    expect(historyStack.index).toBe(1);
    expect(historyStack.canUndo).toBe(true);
    expect(historyStack.canRedo).toBe(false);
    expect(historyStack.selectedAction).toBe(historyStack.actions[1]);
    expect(historyStack.actions.map((a) => a.seqNbr)).toEqual([1, 2]);

    historyStack.undo();
    expect(historyStack.index).toBe(0);
    expect(foo.value).toBe(0);
  });

  test('should continue seqNbr from all actions ever pushed since undo stack has been created', () => {
    const historyStack = createHistoryStack('created');

    const historySnapshot: HistorySnapshot<string> = {
      index: 1,
      actions: [
        { type: 'init', msg: 'created' },
        { type: 'set', storeId: 'foo', msg: 'set value 1', data: 0 },
      ],
    };
    const foo = undoable('foo', 1);
    historyStack.loadSnapshot(historySnapshot, { foo });
    const action = createSetAction(foo, 2, 'set value 2');
    action.apply();
    historyStack.push(action);
    const actions = historyStack.actions;
    expect(actions.length).toEqual(3);
    expect(actions[2].seqNbr).toEqual(3);
  });
});

describe('createSnapshot', () => {
  test('should export undo stack state', () => {
    const historyStack = createHistoryStack('created');
    const foo = undoable('foo', 0);
    const action = createSetAction(foo, 1, 'set value 1');
    action.apply();
    historyStack.push(action);

    const historySnapshot = historyStack.createSnapshot();

    expect(historySnapshot).toEqual({
      index: 1,
      actions: [
        { type: 'init', msg: 'created' },
        { type: 'set', storeId: 'foo', msg: 'set value 1', data: 0 },
      ],
    });
  });
});
