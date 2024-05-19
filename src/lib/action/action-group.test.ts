import { undoable } from '../state.svelte.js';
import { createHistoryStack } from '../undo-stack.svelte.js';
import { createGroupAction } from './action-group.js';
import { createSetAction } from './action-set.js';

describe('MutateAction', () => {
  test('should apply and revert values', () => {
    const foo0 = undoable('foo0', 0);
    const fooA = undoable('fooA', 'a');

    const action = createGroupAction('GroupAction');
    action.push(createSetAction(foo0, 1, undefined));
    action.push(createSetAction(fooA, 'b', undefined));
    action.apply();
    expect(foo0.value).toBe(1);
    expect(fooA.value).toBe('b');

    action.revert();
    expect(foo0.value).toBe(0);
    expect(fooA.value).toBe('a');

    action.apply();
    expect(foo0.value).toBe(1);
    expect(fooA.value).toBe('b');
  });

  test('should work with historyStack', () => {
    const historyStack = createHistoryStack('created');
    const foo1 = undoable('foo1', 0);
    const foo2 = undoable('foo2', 'a');

    let action = createGroupAction('GroupAction');
    action.push(createSetAction(foo1, 1, undefined));
    action.push(createSetAction(foo2, 'b', undefined));
    action.push(createSetAction(foo1, 2, undefined));
    action.push(createSetAction(foo2, 'c', undefined));
    action.apply();
    historyStack.push(action);
    expect(foo1.value).toBe(2);
    expect(foo2.value).toBe('c');

    action = createGroupAction('GroupAction');
    action.push(createSetAction(foo2, 'd', undefined));
    action.push(createSetAction(foo1, 3, undefined));
    action.push(createSetAction(foo2, 'e', undefined));
    action.push(createSetAction(foo1, 4, undefined));
    action.apply();
    historyStack.push(action);
    expect(foo1.value).toBe(4);
    expect(foo2.value).toBe('e');

    historyStack.undo();
    expect(foo1.value).toBe(2);
    expect(foo2.value).toBe('c');

    historyStack.redo();
    expect(foo1.value).toBe(4);
    expect(foo2.value).toBe('e');
  });
});
