import { undoStackStore } from './undo-stack';
import { get, writable } from 'svelte/store';
import { TransactionCtrl } from './transaction';

describe('transactionCtrl', () => {
  test('should return current draft', () => {
    const undoStack = undoStackStore('created');
    const transactionCtrl = new TransactionCtrl(undoStack, 'commit');
    const store1 = writable<Record<string, unknown>>({});

    let draft1 = transactionCtrl.getDraft(store1);
    draft1['a'] = 1;

    draft1 = transactionCtrl.getDraft(store1);
    expect(draft1['a']).toBe(1);
  });

  test('should commit store value', () => {
    const undoStack = undoStackStore('created');
    const transactionCtrl = new TransactionCtrl(undoStack, 'commit');
    const store1 = writable<Record<string, unknown>>({});

    const draft1 = transactionCtrl.getDraft(store1);
    draft1['a'] = 1;
    expect(get(store1)).toEqual({});

    transactionCtrl.commit('commit');
    expect(get(store1)).toEqual({ a: 1 });
    expect(get(undoStack).canUndo).toBe(true);
  });

  test('should commit multiple store values', () => {
    const undoStack = undoStackStore('created');
    const transactionCtrl = new TransactionCtrl(undoStack, 'commit');
    const store1 = writable<Record<string, unknown>>({});
    const store2 = writable<string[]>([]);

    const draft1 = transactionCtrl.getDraft(store1);
    draft1['a'] = 1;
    expect(get(store1)).toEqual({});

    const draft2 = transactionCtrl.getDraft(store2);
    draft2.push('x');
    expect(get(store2)).toEqual([]);

    transactionCtrl.commit('commit');
    expect(get(store1)).toEqual({ a: 1 });
    expect(get(store2)).toEqual(['x']);
    expect(get(undoStack).canUndo).toBe(true);
  });

  test('should rollback store values', () => {
    const undoStack = undoStackStore('created');
    const transactionCtrl = new TransactionCtrl(undoStack, 'commit');
    const store1 = writable<Record<string, unknown>>({});
    const store2 = writable<string[]>([]);

    const draft1 = transactionCtrl.getDraft(store1);
    draft1['a'] = 1;

    const draft2 = transactionCtrl.getDraft(store2);
    draft2.push('x');

    transactionCtrl.rollback();
    expect(get(store1)).toEqual({});
    expect(get(store2)).toEqual([]);
    expect(get(undoStack).canUndo).toBe(false);

    transactionCtrl.commit('commit');
    expect(get(store1)).toEqual({});
    expect(get(store2)).toEqual([]);
    expect(get(undoStack).canUndo).toBe(false);
  });
});
