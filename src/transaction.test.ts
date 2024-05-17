import { undoStack } from './undo-stack.svelte';
import { transactionCtrl } from './transaction';
import { undoState } from './state.svelte';

describe('transactionCtrl', () => {
  test('should return current draft', () => {
    const undoStack1 = undoStack('created');
    const transactionCtrl1 = transactionCtrl(undoStack1.push);
    const store1 = undoState<Record<string, unknown>>('foo1', {});

    let draft1 = transactionCtrl1.draft(store1);
    draft1['a'] = 1;

    draft1 = transactionCtrl1.draft(store1);
    expect(draft1['a']).toBe(1);
  });

  test('should commit store value', () => {
    const undoStack1 = undoStack('created');
    const transactionCtrl1 = transactionCtrl(undoStack1.push);
    const store1 = undoState<Record<string, unknown>>('foo1', {});

    const draft1 = transactionCtrl1.draft(store1);
    draft1['a'] = 1;
    expect(store1.value).toEqual({});

    transactionCtrl1.commit('commit');
    expect(store1.value).toEqual({ a: 1 });
    expect(undoStack1.canUndo).toBe(true);
  });

  test('should commit multiple store values', () => {
    const undoStack1 = undoStack('created');
    const transactionCtrl1 = transactionCtrl(undoStack1.push);
    const store1 = undoState<Record<string, unknown>>('foo1', {});
    const store2 = undoState<string[]>('foo2', []);

    const draft1 = transactionCtrl1.draft(store1);
    draft1['a'] = 1;
    expect(store1.value).toEqual({});

    const draft2 = transactionCtrl1.draft(store2);
    draft2.push('x');
    expect(store2.value).toEqual([]);

    transactionCtrl1.commit('commit');
    expect(store1.value).toEqual({ a: 1 });
    expect(store2.value).toEqual(['x']);
    expect(undoStack1.canUndo).toBe(true);
  });

  test('should rollback store values', () => {
    const undoStack1 = undoStack('created');
    const transactionCtrl1 = transactionCtrl(undoStack1.push);
    const store1 = undoState<Record<string, unknown>>('foo1', {});
    const store2 = undoState<string[]>('foo2', []);

    const draft1 = transactionCtrl1.draft(store1);
    draft1['a'] = 1;

    const draft2 = transactionCtrl1.draft(store2);
    draft2.push('x');

    transactionCtrl1.rollback();
    expect(store1.value).toEqual({});
    expect(store2.value).toEqual([]);
    expect(undoStack1.canUndo).toBe(false);

    transactionCtrl1.commit('commit');
    expect(store1.value).toEqual({});
    expect(store2.value).toEqual([]);
    expect(undoStack1.canUndo).toBe(false);
  });
});
