import { undoable } from '../undoable.svelte.js';
import { createMutateAction, type MutateActionPatch } from './mutate.js';
import { produce } from 'immer';

describe('MutateAction', () => {
  test('should apply and revert values', () => {
    const foo = undoable('foo', { bar: 0 });
    const patch: MutateActionPatch = { patches: [], inversePatches: [] };
    foo.value = produce(
      foo.value,
      (value) => {
        value.bar = 1;
      },
      (patches, inversePatches) => {
        patch.patches = patches;
        patch.inversePatches = inversePatches;
      },
    );
    const action = createMutateAction(foo, patch, 'MutateAction');

    expect(foo.value).toStrictEqual({ bar: 1 });

    action.revert();
    expect(foo.value).toStrictEqual({ bar: 0 });

    action.apply();
    expect(foo.value).toStrictEqual({ bar: 1 });
  });

  test('should load patch', () => {
    const msg = 'MutateAction';
    const foo = undoable('foo', { bar: 0 });
    const data: MutateActionPatch = {
      inversePatches: [{ op: 'replace', path: ['bar'], value: 0 }],
      patches: [{ op: 'replace', path: ['bar'], value: 1 }],
    };

    const action = createMutateAction(foo, data, msg);
    expect(action?.msg).toEqual('MutateAction');

    action?.apply();
    expect(foo.value).toStrictEqual({ bar: 1 });

    action?.revert();
    expect(foo.value).toStrictEqual({ bar: 0 });
  });
});
