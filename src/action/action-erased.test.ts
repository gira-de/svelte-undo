import { erasedAction } from './action-erased';

describe('ErasedAction', () => {
  test('should initialize action correctly', () => {
    const action = erasedAction('erasedAction');
    expect(action.type).toEqual('erased');
    expect(action.msg).toEqual('erasedAction');
  });

  test('should throw an error if apply or revert is called', () => {
    const action = erasedAction('erasedAction');
    expect(action.apply).toThrow();
    expect(action.revert).toThrow();
  });
});
