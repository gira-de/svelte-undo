import { undoStackStore } from '../undo-stack';
import { get, writable } from 'svelte/store';
import { GroupAction } from './action-group';
import { SetAction } from './action-set';

describe('MutateAction', () => {
  test('should apply and revert values', () => {
    const store0 = writable(0);
    const storeA = writable('a');

    const action = new GroupAction('GroupAction');
    action.push(new SetAction('SetAction', store0, 1));
    action.push(new SetAction('SetAction', storeA, 'b'));
    action.apply();
    expect(get(store0)).toBe(1);
    expect(get(storeA)).toBe('b');

    action.revert();
    expect(get(store0)).toBe(0);
    expect(get(storeA)).toBe('a');

    action.apply();
    expect(get(store0)).toBe(1);
    expect(get(storeA)).toBe('b');
  });

  test('should work with undoStackStore', () => {
    const undoStack = undoStackStore('created');
    const store1 = writable(0);
    const store2 = writable('a');

    let action = new GroupAction('GroupAction');
    action.push(new SetAction('set value 1', store1, 1));
    action.push(new SetAction('set value b', store2, 'b'));
    action.push(new SetAction('set value 2', store1, 2));
    action.push(new SetAction('set value c', store2, 'c'));
    action.apply();
    undoStack.push(action);
    expect(get(store1)).toBe(2);
    expect(get(store2)).toBe('c');

    action = new GroupAction('GroupAction');
    action.push(new SetAction('set value d', store2, 'd'));
    action.push(new SetAction('set value 3', store1, 3));
    action.push(new SetAction('set value e', store2, 'e'));
    action.push(new SetAction('set value 4', store1, 4));
    action.apply();
    undoStack.push(action);
    expect(get(store1)).toBe(4);
    expect(get(store2)).toBe('e');

    undoStack.undo();
    expect(get(store1)).toBe(2);
    expect(get(store2)).toBe('c');

    undoStack.redo();
    expect(get(store1)).toBe(4);
    expect(get(store2)).toBe('e');
  });
});
