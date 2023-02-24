import { undoStack } from '../undo-stack';
import { get, writable } from 'svelte/store';
import { GroupAction } from './action-group';
import { SetAction } from './action-set';

describe('MutateAction', () => {
  test('should apply and revert values', () => {
    const store0 = writable(0);
    const storeA = writable('a');

    const action = new GroupAction('GroupAction');
    action.push(new SetAction(undefined, store0, 1));
    action.push(new SetAction(undefined, storeA, 'b'));
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
    action.push(new SetAction(undefined, store1, 1));
    action.push(new SetAction(undefined, store2, 'b'));
    action.push(new SetAction(undefined, store1, 2));
    action.push(new SetAction(undefined, store2, 'c'));
    action.apply();
    undoStack1.push(action);
    expect(get(store1)).toBe(2);
    expect(get(store2)).toBe('c');

    action = new GroupAction('GroupAction');
    action.push(new SetAction(undefined, store2, 'd'));
    action.push(new SetAction(undefined, store1, 3));
    action.push(new SetAction(undefined, store2, 'e'));
    action.push(new SetAction(undefined, store1, 4));
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
