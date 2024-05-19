import { undoable } from '../state.svelte.js';
import { createSetAction } from './action-set.js';

describe('SetAction', () => {
  test('should apply and revert values', () => {
    const foo = undoable('foo', 0);

    const action = createSetAction(foo, 1, 'setAction');
    action.apply();
    expect(foo.value).toBe(1);

    action.revert();
    expect(foo.value).toBe(0);

    action.apply();
    expect(foo.value).toBe(1);
  });
});
