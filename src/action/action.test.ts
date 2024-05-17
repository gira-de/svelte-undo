import { undoState } from '../state.svelte';
import type { ReadableUndoAction } from './action';
import { setAction } from './action-set';

describe('UndoAction properties', () => {
  test('should should be readonly', () => {
    const action = setAction(undoState('foo', 0), undefined, 'set action');
    const readableAction: ReadableUndoAction<string> = action;

    // @ts-expect-error type should be readonly
    readableAction.type = 'bar';
    // @ts-expect-error type should be readonly
    action.type = 'bar';

    // @ts-expect-error storeId should be readonly
    readableAction.storeId = 'bar';
    // @ts-expect-error storeId should be readonly
    action.storeId = 'bar';

    // @ts-expect-error seqNbr should be readonly
    readableAction.seqNbr = -1;
    action.seqNbr = -1;

    // @ts-expect-error seqNbr should be readonly
    readableAction.msg = 'bar';
    // @ts-expect-error seqNbr should be readonly
    action.msg = 'bar';
  });
});
