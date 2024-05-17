import { undoState } from '../state.svelte';
import { undoStack } from '../undo-stack.svelte';
import { groupAction } from './action-group';
import { setAction } from './action-set';

describe('MutateAction', () => {
  test('should apply and revert values', () => {
    const foo0 = undoState('foo0', 0);
    const fooA = undoState('fooA', 'a');

    const action = groupAction('GroupAction');
    action.push(setAction(foo0, 1, undefined));
    action.push(setAction(fooA, 'b', undefined));
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

  test('should work with undoStack', () => {
    const undoStack1 = undoStack('created');
    const foo1 = undoState('foo1', 0);
    const foo2 = undoState('foo2', 'a');

    let action = groupAction('GroupAction');
    action.push(setAction(foo1, 1, undefined));
    action.push(setAction(foo2, 'b', undefined));
    action.push(setAction(foo1, 2, undefined));
    action.push(setAction(foo2, 'c', undefined));
    action.apply();
    undoStack1.push(action);
    expect(foo1.value).toBe(2);
    expect(foo2.value).toBe('c');

    action = groupAction('GroupAction');
    action.push(setAction(foo2, 'd', undefined));
    action.push(setAction(foo1, 3, undefined));
    action.push(setAction(foo2, 'e', undefined));
    action.push(setAction(foo1, 4, undefined));
    action.apply();
    undoStack1.push(action);
    expect(foo1.value).toBe(4);
    expect(foo2.value).toBe('e');

    undoStack1.undo();
    expect(foo1.value).toBe(2);
    expect(foo2.value).toBe('c');

    undoStack1.redo();
    expect(foo1.value).toBe(4);
    expect(foo2.value).toBe('e');
  });
});
