import type { ReadableUndoAction } from './action';
import { InitAction } from './action-init';

describe('ReadableUndoAction', () => {
  test('should not provide any function that mutates the action state', () => {
    const action = new InitAction('foo');
    const readableAction: ReadableUndoAction<string> = action;

    // @ts-expect-error apply() should be undefined
    expect(readableAction.apply).toThrow();
    expect(action.apply).toThrow();

    // @ts-expect-error revert() should be undefined
    expect(readableAction.revert).toThrow();
    expect(action.revert).toThrow();

    // @ts-expect-error store should be undefined
    readableAction.store;
    action.store;

    // @ts-expect-error seqNbr should be readonly
    readableAction.seqNbr = -1;
    action.seqNbr = -1;

    // @ts-expect-error seqNbr should be readonly
    readableAction.msg = 'bar';
    // @ts-expect-error seqNbr should be readonly
    action.msg = 'bar';
  });
});
