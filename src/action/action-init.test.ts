import { createInitAction } from './action-init';

describe('InitAction', () => {
  test('should initialize action correctly', () => {
    const action = createInitAction('initAction');
    expect(action.msg).toEqual('initAction');
    expect(action.type).toBe('init');
  });

  test('should throw an error if apply or revert is called', () => {
    const action = createInitAction('initAction');
    expect(action.apply).toThrow();
    expect(action.revert).toThrow();
  });
});
