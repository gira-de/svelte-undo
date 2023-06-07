import { get, writable } from 'svelte/store';
import { MutateAction, type MutateActionPatch } from './action-mutate';
import { produce } from 'immer';

describe('MutateAction', () => {
  test('should apply and revert values', () => {
    const store = writable({ value: 0 });
    const patch: MutateActionPatch = { patches: [], inversePatches: [] };
    store.update((state) => {
      return produce(
        state,
        (storeValue) => {
          storeValue.value = 1;
        },
        (patches, inversePatches) => {
          patch.patches = patches;
          patch.inversePatches = inversePatches;
        },
      );
    });
    const action = new MutateAction(store, patch, 'MutateAction');

    expect(get(store)).toStrictEqual({ value: 1 });

    action.revert();
    expect(get(store)).toStrictEqual({ value: 0 });

    action.apply();
    expect(get(store)).toStrictEqual({ value: 1 });
  });

  test('should load patch', () => {
    const msg = 'MutateAction';
    const store = writable({ value: 0 });
    const data: MutateActionPatch = {
      inversePatches: [{ op: 'replace', path: ['value'], value: 0 }],
      patches: [{ op: 'replace', path: ['value'], value: 1 }],
    };

    const action = new MutateAction(store, data, msg);
    expect(action?.msg).toEqual('MutateAction');

    action?.apply();
    expect(get(store)).toStrictEqual({ value: 1 });

    action?.revert();
    expect(get(store)).toStrictEqual({ value: 0 });
  });
});
