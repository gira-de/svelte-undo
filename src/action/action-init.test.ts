import { InitAction } from './action-init';

describe('InitAction', () => {
  test('should initialize action correctly', () => {
    const action = new InitAction('initAction');
    expect(action.msg).toEqual('initAction');
    expect(action.patch).toBeUndefined();
    expect(action.store).toBeUndefined();
  });
});
