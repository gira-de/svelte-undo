import { ErasedAction, InitAction } from './action-barrier';

describe('InitAction', () => {
  test('should initialize action correctly', () => {
    const action = new InitAction('initAction');
    expect(action.msg).toEqual('initAction');
    expect(action.patch).toBeUndefined();
    expect(action.store).toBeUndefined();
  });
});

describe('ErasedAction', () => {
  test('should initialize action correctly', () => {
    const action = new ErasedAction('erasedAction');
    expect(action.msg).toEqual('erasedAction');
    expect(action.patch).toBeUndefined();
    expect(action.store).toBeUndefined();
  });
});
