import { undoState } from './state.svelte';
import { setAction } from './action/action-set';
import { erasedAction } from './action/action-erased';
import { initAction } from './action/action-init';
import { UndoStackSnapshot, undoStack } from './undo-stack.svelte';

describe('undoStack', () => {
  test('props should be readonly', () => {
    const undoStack1 = undoStack('created');

    // @ts-expect-error index should be readonly
    expect(() => (undoStack1.index = -1)).toThrow();

    expect(
      // @ts-expect-error selectedAction should be readonly
      () => (undoStack1.selectedAction = initAction('asdf')),
    ).toThrow();

    // @ts-expect-error canUndo should be readonly
    expect(() => (undoStack1.canUndo = false)).toThrow();

    // @ts-expect-error canRedo should be readonly
    expect(() => (undoStack1.canRedo = false)).toThrow();

    // @ts-expect-error actions.push should be accessible
    undoStack1.actions.push(initAction('asdf'));

    // @ts-expect-error action should be readonly
    undoStack1.actions[0].seqNbr = 1;
  });
});

describe('push', () => {
  test('should add a new item to the stack', () => {
    const undoStack1 = undoStack('created');
    const foo = undoState('foo', 1);
    expect(undoStack1.actions).toHaveLength(1);

    let action = setAction(foo, 2, 'set value 2');
    action.apply();
    undoStack1.push(action);
    expect(undoStack1.actions).toHaveLength(2);

    action = setAction(foo, 3, 'set value 3');
    action.apply();
    undoStack1.push(action);
    expect(undoStack1.actions).toHaveLength(3);
  });

  test('barrier action should set canUndo to false', () => {
    const undoStack1 = undoStack('created');

    undoStack1.push(erasedAction('barrier'));
    expect(undoStack1.canUndo).toBe(false);
  });
});

describe('undo', () => {
  test('should load previous state', () => {
    const undoStack1 = undoStack('created');
    const foo = undoState('foo', 'old value');

    const action = setAction(foo, 'new value', 'set new value');
    action.apply();
    undoStack1.push(action);
    expect(foo.value).toBe('new value');

    undoStack1.undo();
    expect(foo.value).toBe('old value');
  });

  test('should set canUndo to false if the new selected action is a barrier', () => {
    const undoStack1 = undoStack('created');
    const foo = undoState('foo', 1);

    const barrierAction = erasedAction('barrier');
    undoStack1.push(barrierAction);

    const setAction1 = setAction(foo, 2, 'set 2');
    setAction1.apply();
    undoStack1.push(setAction1);

    undoStack1.undo();
    expect(undoStack1.canUndo).toBe(false);
  });

  test('should do nothing if their is no previous state', () => {
    const undoStack1 = undoStack('created');
    const foo = undoState('foo', 'old value');

    undoStack1.undo();
    expect(foo.value).toBe('old value');
  });

  test('should do nothing if a barrier action is selected', () => {
    const undoStack1 = undoStack('created');

    const action = erasedAction('barrier');
    undoStack1.push(action);

    undoStack1.undo();
    expect(undoStack1.selectedAction).toBe(action);
  });
});

describe('redo', () => {
  test('should restore the next step', () => {
    const undoStack1 = undoStack('created');
    const foo = undoState('foo', 'old value');

    const action = setAction(foo, 'new value', 'set new value');
    action.apply();
    undoStack1.push(action);
    undoStack1.undo();

    undoStack1.redo();
    expect(foo.value).toBe('new value');
  });

  test('should do nothing if their is no next step', () => {
    const undoStack1 = undoStack('created');
    const foo = undoState('foo', 'old value');

    undoStack1.redo();
    expect(foo.value).toBe('old value');
  });

  test('should do nothing if the next selected action would be a barrier', () => {
    const undoStack1 = undoStack('created');
    const foo = undoState('foo', 2);
    undoStack1.loadSnapshot(
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

    undoStack1.redo();
    expect(undoStack1.index).toBe(1);
  });

  test('should set canRedo to false if the next action is a barrier', () => {
    const undoStack1 = undoStack('created');
    const foo = undoState('foo', 1);
    undoStack1.loadSnapshot(
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

    undoStack1.redo();
    expect(undoStack1.index).toBe(1);
    expect(foo.value).toBe(2);
    expect(undoStack1.canRedo).toBe(false);
  });
});

describe('goto', () => {
  test('should load the specified state', () => {
    const undoStack1 = undoStack('created');

    const foo = undoState('foo', 0);
    const s0 = undoStack1.actions[0].seqNbr;
    let action = setAction(foo, 1, 'set value 1');
    action.apply();
    undoStack1.push(action);
    action = setAction(foo, 2, 'set value 2');
    action.apply();
    undoStack1.push(action);
    const s2 = action.seqNbr;
    action = setAction(foo, 3, 'set value 3');
    action.apply();
    undoStack1.push(action);
    action = setAction(foo, 4, 'set value 4');
    action.apply();
    undoStack1.push(action);
    action = setAction(foo, 5, 'set value 5');
    action.apply();
    undoStack1.push(action);
    const s5 = action.seqNbr;
    action = setAction(foo, 6, 'set value 6');
    action.apply();
    undoStack1.push(action);
    const s6 = action.seqNbr;

    // go backwards
    undoStack1.goto(s2);
    expect(foo.value).toBe(2);

    // go forward
    undoStack1.goto(s5);
    expect(foo.value).toBe(5);

    // go to first state
    undoStack1.goto(s0);
    expect(foo.value).toBe(0);

    // go to last state
    undoStack1.goto(s6);
    expect(foo.value).toBe(6);
  });

  test('should do nothing if specified seq number does not exist', () => {
    const undoStack1 = undoStack('created');
    const foo = undoState('foo', 'old value');

    undoStack1.goto(999);
    expect(foo.value).toBe('old value');
  });

  test('should do nothing if specified seq number is already selected', () => {
    const undoStack1 = undoStack('created');
    const foo = undoState('foo', 0);
    const action = setAction(foo, 1, 'set value 1');
    action.apply();
    undoStack1.push(action);

    undoStack1.goto(action.seqNbr);

    expect(undoStack1.selectedAction).toBe(action);
  });

  test('should do nothing if the target undo action crosses a barrier', () => {
    const undoStack1 = undoStack('created');

    const barrierAction = erasedAction('barrier');
    undoStack1.push(barrierAction);

    const foo = undoState('foo', 0);
    const setAction1 = setAction(foo, 1, 'set 1');
    setAction1.apply();
    undoStack1.push(setAction1);

    undoStack1.goto(undoStack1.actions[0].seqNbr);

    expect(undoStack1.selectedAction).toBe(setAction1);
    expect(undoStack1.canUndo).toBe(true);
  });

  test('should do nothing if the target redo action touches a barrier', () => {
    const undoStack1 = undoStack('created');
    const foo = undoState('foo', 1);
    undoStack1.loadSnapshot(
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

    undoStack1.goto(undoStack1.actions[2].seqNbr);
    expect(undoStack1.index).toBe(0);
    expect(foo.value).toBe(1);
    expect(undoStack1.canRedo).toBe(true);
  });
});

describe('canUndo & canRedo', () => {
  test('should return the correct result', () => {
    const undoStack1 = undoStack('created');
    const foo = undoState('foo', 0);

    // [<0>]
    expect(undoStack1.canUndo).toBe(false);
    expect(undoStack1.canRedo).toBe(false);

    let action = setAction(foo, 1, 'set value 1');
    action.apply();
    undoStack1.push(action);
    // [0, <1>]
    expect(undoStack1.canUndo).toBe(true);
    expect(undoStack1.canRedo).toBe(false);

    action = setAction(foo, 2, 'set value 2');
    action.apply();
    undoStack1.push(action);
    // [0, 1, <2>]
    expect(undoStack1.canUndo).toBe(true);
    expect(undoStack1.canRedo).toBe(false);

    undoStack1.undo();
    // [0, <1>, 2]
    expect(undoStack1.canUndo).toBe(true);
    expect(undoStack1.canRedo).toBe(true);

    undoStack1.undo();
    // [<0>, 1, 2]
    expect(undoStack1.canUndo).toBe(false);
    expect(undoStack1.canRedo).toBe(true);

    undoStack1.redo();
    // [0, <1>, 2]
    expect(undoStack1.canUndo).toBe(true);
    expect(undoStack1.canRedo).toBe(true);

    undoStack1.redo();
    // [0, 1, <2>]
    expect(undoStack1.canUndo).toBe(true);
    expect(undoStack1.canRedo).toBe(false);

    undoStack1.goto(1);
    // [0, <1>, 2]
    expect(undoStack1.canUndo).toBe(true);
    expect(undoStack1.canRedo).toBe(true);

    undoStack1.goto(0);
    // [<0>, 1, 2]
    expect(undoStack1.canUndo).toBe(false);
    expect(undoStack1.canRedo).toBe(true);

    undoStack1.goto(2);
    // [0, 1, <2>]
    expect(undoStack1.canUndo).toBe(true);
    expect(undoStack1.canRedo).toBe(false);
  });
});

describe('erase', () => {
  test('should erase all undo steps', () => {
    const undoStack1 = undoStack('created');

    const action1 = setAction(undoState('foo1', 0), 1, 'set value 1');
    action1.apply();
    undoStack1.push(action1);

    const action2 = setAction(undoState('foo2', 0), 1, 'set value 2');
    action2.apply();
    undoStack1.push(action2);

    undoStack1.erase();
    expect(undoStack1.canUndo).toBe(false);
    expect(undoStack1.actions[0].type).toBe('init');
    expect(undoStack1.actions[1].type).toBe('erased');
    expect(undoStack1.actions[2].type).toBe('erased');
    expect(undoStack1.actions[0].msg).toBe('created');
    expect(undoStack1.actions[1].msg).toBe('set value 1');
    expect(undoStack1.actions[2].msg).toBe('set value 2');
    expect(undoStack1.actions[0].seqNbr).toBe(0);
    expect(undoStack1.actions[1].seqNbr).toBe(1);
    expect(undoStack1.actions[2].seqNbr).toBe(2);
    expect(undoStack1.selectedAction).toBe(undoStack1.actions[2]);
  });

  test('should erase starting from the specified action', () => {
    const undoStack1 = undoStack('created');

    const action1 = setAction(undoState('foo1', 0), 1, 'set value 1');
    action1.apply();
    undoStack1.push(action1);

    const action2 = setAction(undoState('foo2', 0), 1, 'set value 2');
    action2.apply();
    undoStack1.push(action2);

    undoStack1.erase(action1.seqNbr);

    expect(undoStack1.canUndo).toBe(true);
    expect(undoStack1.actions[0].type).toBe('init');
    expect(undoStack1.actions[1].type).toBe('erased');
    expect(undoStack1.actions[2].type).toBe('set');
    expect(undoStack1.actions[0].msg).toBe('created');
    expect(undoStack1.actions[1].msg).toBe('set value 1');
    expect(undoStack1.actions[2].msg).toBe('set value 2');
    expect(undoStack1.actions[0].seqNbr).toBe(0);
    expect(undoStack1.actions[1].seqNbr).toBe(1);
    expect(undoStack1.actions[2].seqNbr).toBe(2);
  });

  test('should erase until first barrier action is reached', () => {
    const undoStack1 = undoStack('created');

    const action1 = setAction(undoState('foo1', 0), 1, 'set value 1');
    action1.apply();
    undoStack1.push(action1);

    undoStack1.push(erasedAction('barrier'));

    const action2 = setAction(undoState('foo2', 0), 1, 'set value 2');
    action2.apply();
    undoStack1.push(action2);

    undoStack1.erase();

    expect(undoStack1.canUndo).toBe(false);
    expect(undoStack1.actions[0].type).toBe('init');
    expect(undoStack1.actions[1].type).toBe('set');
    expect(undoStack1.actions[2].type).toBe('erased');
    expect(undoStack1.actions[3].type).toBe('erased');
    expect(undoStack1.actions[0].msg).toBe('created');
    expect(undoStack1.actions[1].msg).toBe('set value 1');
    expect(undoStack1.actions[2].msg).toBe('barrier');
    expect(undoStack1.actions[3].msg).toBe('set value 2');
    expect(undoStack1.actions[0].seqNbr).toBe(0);
    expect(undoStack1.actions[1].seqNbr).toBe(1);
    expect(undoStack1.actions[2].seqNbr).toBe(2);
    expect(undoStack1.actions[3].seqNbr).toBe(3);
  });

  test('should update canUndo state correctly', () => {
    const historyStack = undoStack('created');

    const foo = undoState('foo', 0);

    const action1 = setAction(foo, 1, 'set value 1');
    action1.apply();
    historyStack.push(action1);

    const action2 = setAction(foo, 1, 'set value 2');
    action2.apply();
    historyStack.push(action2);

    const action3 = setAction(foo, 1, 'set value 3');
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
    const undoStack1 = undoStack('created');

    const action1 = setAction(undoState('foo1', 0), 1, 'set value 1');
    action1.apply();
    undoStack1.push(action1);

    const action2 = setAction(undoState('foo2', 0), 1, 'set value 2');
    action2.apply();
    undoStack1.push(action2);

    undoStack1.undo();

    undoStack1.erase();

    expect(undoStack1.canUndo).toBe(true);
    expect(undoStack1.actions[0].type).toBe('init');
    expect(undoStack1.actions[1].type).toBe('set');
    expect(undoStack1.actions[2].type).toBe('set');
  });

  test('should do nothing if an invalid seq number is provided', () => {
    const undoStack1 = undoStack('created');

    const action1 = setAction(undoState('foo1', 0), 1, 'set value 1');
    action1.apply();
    undoStack1.push(action1);

    undoStack1.erase(99999);

    expect(undoStack1.canUndo).toBe(true);
    expect(undoStack1.actions[0].type).toBe('init');
    expect(undoStack1.actions[1].type).toBe('set');
  });
});

describe('clear', () => {
  test('should all actions from stack and create a new init action', () => {
    const undoStack1 = undoStack('created');

    const action = setAction(undoState('foo', 0), 1, 'set value 1');
    action.apply();
    undoStack1.push(action);

    undoStack1.clear();
    expect(undoStack1.index).toBe(0);
    expect(undoStack1.actions).toHaveLength(1);
    expect(undoStack1.actions[0].msg).toBe('created');
    expect(undoStack1.actions[0].seqNbr).toBe(2);
    expect(undoStack1.canUndo).toBe(false);
    expect(undoStack1.canRedo).toBe(false);
    expect(undoStack1.selectedAction).toBe(undoStack1.actions[0]);
  });
});

describe('clearUndo', () => {
  test('should do nothing if first action is selected', () => {
    const undoStack1 = undoStack('created');

    const action1 = setAction(undoState('foo1', 0), 1, 'set value 1');
    action1.apply();
    undoStack1.push(action1);

    undoStack1.undo();

    undoStack1.clearUndo();
    expect(undoStack1.index).toBe(0);
    expect(undoStack1.actions).toHaveLength(2);
    expect(undoStack1.actions[0].msg).toBe('created');
    expect(undoStack1.canUndo).toBe(false);
    expect(undoStack1.canRedo).toBe(true);
    expect(undoStack1.selectedAction).toBe(undoStack1.actions[0]);
    expect(undoStack1.selectedAction.type).toBe('init');
  });

  test('should clear undo action and keep redo action', () => {
    const undoStack1 = undoStack('created');

    const action1 = setAction(undoState('foo1', 0), 1, 'set value 1');
    action1.apply();
    undoStack1.push(action1);

    const action2 = setAction(undoState('foo2', 0), 2, 'set value 2');
    action2.apply();
    undoStack1.push(action2);

    const action3 = setAction(undoState('foo3', 0), 3, 'set value 3');
    action3.apply();
    undoStack1.push(action3);

    undoStack1.undo();

    undoStack1.clearUndo();
    expect(undoStack1.index).toBe(0);
    expect(undoStack1.actions).toHaveLength(2);
    expect(undoStack1.actions[0].msg).toBe('set value 2');
    expect(undoStack1.canUndo).toBe(false);
    expect(undoStack1.canRedo).toBe(true);
    expect(undoStack1.selectedAction).toBe(undoStack1.actions[0]);
    expect(undoStack1.selectedAction.type).toBe('erased');
  });
});

describe('clearRedo', () => {
  test('should do nothing if last action is selected', () => {
    const undoStack1 = undoStack('created');

    const action1 = setAction(undoState('foo1', 0), 1, 'set value 1');
    action1.apply();
    undoStack1.push(action1);

    undoStack1.clearRedo();
    expect(undoStack1.index).toBe(1);
    expect(undoStack1.actions).toHaveLength(2);
    expect(undoStack1.actions[1].msg).toBe('set value 1');
    expect(undoStack1.canUndo).toBe(true);
    expect(undoStack1.canRedo).toBe(false);
    expect(undoStack1.selectedAction).toBe(undoStack1.actions[1]);
    expect(undoStack1.selectedAction.type).toBe('set');
  });

  test('should clear redo action and keep undo action', () => {
    const undoStack1 = undoStack('created');

    const action1 = setAction(undoState('foo1', 0), 1, 'set value 1');
    action1.apply();
    undoStack1.push(action1);

    const action2 = setAction(undoState('foo2', 0), 2, 'set value 2');
    action2.apply();
    undoStack1.push(action2);

    const action3 = setAction(undoState('foo3', 0), 3, 'set value 3');
    action3.apply();
    undoStack1.push(action3);

    undoStack1.undo();

    undoStack1.clearRedo();
    expect(undoStack1.index).toBe(2);
    expect(undoStack1.actions).toHaveLength(3);
    expect(undoStack1.actions[2].msg).toBe('set value 2');
    expect(undoStack1.canUndo).toBe(true);
    expect(undoStack1.canRedo).toBe(false);
    expect(undoStack1.selectedAction).toBe(undoStack1.actions[2]);
    expect(undoStack1.selectedAction.type).toBe('set');
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
    const foo = undoState('foo', 1);
    undoStack1.loadSnapshot(undoStackSnapshot, { foo });

    expect(undoStack1.actions).toHaveLength(2);
    expect(undoStack1.index).toBe(1);
    expect(undoStack1.canUndo).toBe(true);
    expect(undoStack1.canRedo).toBe(false);
    expect(undoStack1.selectedAction).toBe(undoStack1.actions[1]);
    expect(undoStack1.actions.map((a) => a.seqNbr)).toEqual([1, 2]);

    undoStack1.undo();
    expect(undoStack1.index).toBe(0);
    expect(foo.value).toBe(0);
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
    const foo = undoState('foo', 1);
    undoStack1.loadSnapshot(undoStackSnapshot, { foo });
    const action = setAction(foo, 2, 'set value 2');
    action.apply();
    undoStack1.push(action);
    const actions = undoStack1.actions;
    expect(actions.length).toEqual(3);
    expect(actions[2].seqNbr).toEqual(3);
  });
});

describe('createSnapshot', () => {
  test('should export undo stack state', () => {
    const undoStack1 = undoStack('created');
    const foo = undoState('foo', 0);
    const action = setAction(foo, 1, 'set value 1');
    action.apply();
    undoStack1.push(action);

    const undoStackSnapshot = undoStack1.createSnapshot();

    expect(undoStackSnapshot).toEqual({
      index: 1,
      actions: [
        { type: 'init', msg: 'created' },
        { type: 'set', storeId: 'foo', msg: 'set value 1', data: 0 },
      ],
    });
  });
});
