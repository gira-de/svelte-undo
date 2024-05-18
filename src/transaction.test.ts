import { createHistoryStack } from './undo-stack.svelte';
import { createTransaction } from './transaction';
import { undoable } from './state.svelte';

describe('transactionCtrl', () => {
  test('should return current draft', () => {
    const historyStack = createHistoryStack('created');
    const transaction = createTransaction(historyStack.push);
    const hState1 = undoable('foo1', { a: 0 });

    transaction.draft(hState1).a = 1;
    expect(transaction.draft(hState1).a).toBe(1);
  });

  test('should commit store value', () => {
    const historyStack = createHistoryStack('created');
    const transaction = createTransaction(historyStack.push);
    const hState1 = undoable('foo1', { a: 0 });

    transaction.draft(hState1).a = 1;
    expect(hState1.value).toEqual({ a: 0 });

    transaction.commit('commit');
    expect(hState1.value).toEqual({ a: 1 });
    expect(historyStack.canUndo).toBe(true);
  });

  test('should commit multiple store values', () => {
    const historyStack = createHistoryStack('created');
    const transaction = createTransaction(historyStack.push);
    const hState1 = undoable('foo1', { a: 0 });
    const hState2 = undoable<string[]>('foo2', []);

    transaction.draft(hState1).a = 1;
    expect(hState1.value).toEqual({ a: 0 });

    transaction.draft(hState2).push('x');
    expect(hState2.value).toEqual([]);

    transaction.commit('commit');
    expect(hState1.value).toEqual({ a: 1 });
    expect(hState2.value).toEqual(['x']);
    expect(historyStack.canUndo).toBe(true);
  });

  test('should rollback store values', () => {
    const historyStack = createHistoryStack('created');
    const transaction = createTransaction(historyStack.push);
    const hState1 = undoable('foo1', { a: 0 });
    const hState2 = undoable<string[]>('foo2', []);

    transaction.draft(hState1).a = 1;
    transaction.draft(hState2).push('x');

    transaction.rollback();
    expect(hState1.value).toEqual({ a: 0 });
    expect(hState2.value).toEqual([]);
    expect(historyStack.canUndo).toBe(false);

    transaction.commit('commit');
    expect(hState1.value).toEqual({ a: 0 });
    expect(hState2.value).toEqual([]);
    expect(historyStack.canUndo).toBe(false);
  });
});
