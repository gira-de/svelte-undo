import { undoStack } from '../undo-stack.svelte';
import { get, writable } from 'svelte/store';
import { GroupAction } from './action-group';
import { SetAction } from './action-set';

describe('MutateAction', () => {
  test('should apply and revert values', () => {
    const store0 = writable(0);
    const storeA = writable('a');

    const action = new GroupAction('GroupAction');
    action.push(new SetAction(store0, 1, undefined));
    action.push(new SetAction(storeA, 'b', undefined));
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

  test('should work with undoStack', () => {
    const undoStack1 = undoStack('created');
    const store1 = writable(0);
    const store2 = writable('a');

    let action = new GroupAction('GroupAction');
    action.push(new SetAction(store1, 1, undefined));
    action.push(new SetAction(store2, 'b', undefined));
    action.push(new SetAction(store1, 2, undefined));
    action.push(new SetAction(store2, 'c', undefined));
    action.apply();
    undoStack1.push(action);
    expect(get(store1)).toBe(2);
    expect(get(store2)).toBe('c');

    action = new GroupAction('GroupAction');
    action.push(new SetAction(store2, 'd', undefined));
    action.push(new SetAction(store1, 3, undefined));
    action.push(new SetAction(store2, 'e', undefined));
    action.push(new SetAction(store1, 4, undefined));
    action.apply();
    undoStack1.push(action);
    expect(get(store1)).toBe(4);
    expect(get(store2)).toBe('e');

    undoStack1.undo();
    expect(get(store1)).toBe(2);
    expect(get(store2)).toBe('c');

    undoStack1.redo();
    expect(get(store1)).toBe(4);
    expect(get(store2)).toBe('e');
  });
});
