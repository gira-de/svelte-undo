import { createErasedAction } from './action-erased.js';

describe('ErasedAction', () => {
  test('should initialize action correctly', () => {
    const action = createErasedAction('erasedAction');
    expect(action.type).toEqual('erased');
    expect(action.msg).toEqual('erasedAction');
  });

  test('should throw an error if apply or revert is called', () => {
    const action = createErasedAction('erasedAction');
    expect(action.apply).toThrow();
    expect(action.revert).toThrow();
  });
});
