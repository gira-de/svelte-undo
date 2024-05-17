import { undoState } from '../state.svelte';
import { setAction } from './action-set';

describe('SetAction', () => {
  test('should apply and revert values', () => {
    const foo = undoState('foo', 0);

    const action = setAction(foo, 1, 'setAction');
    action.apply();
    expect(foo.value).toBe(1);

    action.revert();
    expect(foo.value).toBe(0);

    action.apply();
    expect(foo.value).toBe(1);
  });
});
