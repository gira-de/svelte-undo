import { undoStack } from './undo-stack';
import { get, writable } from 'svelte/store';
import { transactionCtrl } from './transaction';

describe('transactionCtrl', () => {
  test('should return current draft', () => {
    const undoStack1 = undoStack('created');
    const transactionCtrl1 = transactionCtrl(undoStack1);
    const store1 = writable<Record<string, unknown>>({});

    let draft1 = transactionCtrl1.draft(store1);
    draft1['a'] = 1;

    draft1 = transactionCtrl1.draft(store1);
    expect(draft1['a']).toBe(1);
  });

  test('should commit store value', () => {
    const undoStack1 = undoStack('created');
    const transactionCtrl1 = transactionCtrl(undoStack1);
    const store1 = writable<Record<string, unknown>>({});

    const draft1 = transactionCtrl1.draft(store1);
    draft1['a'] = 1;
    expect(get(store1)).toEqual({});

    transactionCtrl1.commit('commit');
    expect(get(store1)).toEqual({ a: 1 });
    expect(get(undoStack1).canUndo).toBe(true);
  });

  test('should commit multiple store values', () => {
    const undoStack1 = undoStack('created');
    const transactionCtrl1 = transactionCtrl(undoStack1);
    const store1 = writable<Record<string, unknown>>({});
    const store2 = writable<string[]>([]);

    const draft1 = transactionCtrl1.draft(store1);
    draft1['a'] = 1;
    expect(get(store1)).toEqual({});

    const draft2 = transactionCtrl1.draft(store2);
    draft2.push('x');
    expect(get(store2)).toEqual([]);

    transactionCtrl1.commit('commit');
    expect(get(store1)).toEqual({ a: 1 });
    expect(get(store2)).toEqual(['x']);
    expect(get(undoStack1).canUndo).toBe(true);
  });

  test('should rollback store values', () => {
    const undoStack1 = undoStack('created');
    const transactionCtrl1 = transactionCtrl(undoStack1);
    const store1 = writable<Record<string, unknown>>({});
    const store2 = writable<string[]>([]);

    const draft1 = transactionCtrl1.draft(store1);
    draft1['a'] = 1;

    const draft2 = transactionCtrl1.draft(store2);
    draft2.push('x');

    transactionCtrl1.rollback();
    expect(get(store1)).toEqual({});
    expect(get(store2)).toEqual([]);
    expect(get(undoStack1).canUndo).toBe(false);

    transactionCtrl1.commit('commit');
    expect(get(store1)).toEqual({});
    expect(get(store2)).toEqual([]);
    expect(get(undoStack1).canUndo).toBe(false);
  });
});
