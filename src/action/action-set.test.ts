import { get, writable } from 'svelte/store';
import { SetAction } from './action-set';

describe('SetAction', () => {
  test('should apply and revert values', () => {
    const store = writable(0);

    const action = new SetAction('setAction', store, 1);
    action.apply();
    expect(get(store)).toBe(1);

    action.revert();
    expect(get(store)).toBe(0);

    action.apply();
    expect(get(store)).toBe(1);
  });
});
