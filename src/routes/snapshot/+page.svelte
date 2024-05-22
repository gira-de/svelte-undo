<script lang="ts">
  import {
    undoable,
    createTransaction,
    createHistoryStack,
    type HistorySnapshot,
  } from '$lib/index.js';
  import type { FormEventHandler } from 'svelte/elements';

  type Model = {
    user: typeof user.value;
    historySnapshot: HistorySnapshot<string>;
  };

  const user = undoable('user', { firstname: '', lastname: '' });
  const history = createHistoryStack('init');

  // create transaction
  const transaction = createTransaction(history.push);

  const onSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    const draftUser = transaction.draft(user);
    draftUser.firstname = data.get('firstname')!.toString();
    draftUser.lastname = data.get('lastname')!.toString();

    transaction.commit(
      `Name changed to ${draftUser.firstname} ${draftUser.lastname}`,
    );
  };

  let serializedModel = $state('');

  const onCreateSnapshot = () => {
    const model: Model = {
      user: user.value,
      historySnapshot: history.createSnapshot(),
    };
    serializedModel = JSON.stringify(model, undefined, '  ');
  };

  const onLoadSnapshot = () => {
    const model: Model = JSON.parse(serializedModel);
    user.value = model.user;
    history.loadSnapshot(model.historySnapshot, { user });
  };
</script>

<section>
  <h1>Input</h1>
  <form method="POST" onsubmit={onSubmit}>
    <label>
      Firstname
      <input type="text" name="firstname" value={user.value.firstname} />
    </label>
    <label>
      Lastname
      <input type="text" name="lastname" value={user.value.lastname} />
    </label>
    <div>
      <button type="submit">Apply</button>
    </div>
  </form>
</section>

<section>
  <h1>Snapshot</h1>
  <div>
    <button onclick={onCreateSnapshot}>Create Snapshot</button>
    <button onclick={onLoadSnapshot}>Load Snapshot</button>
  </div>
  <textarea>{serializedModel}</textarea>
</section>

<section>
  <h1>History</h1>
  <div>
    <button disabled={!history.canUndo} onclick={history.undo}>Undo</button>
    <button disabled={!history.canRedo} onclick={history.redo}>Redo</button>
  </div>
  <table>
    <tbody>
      {#each history.actions as action}
        <tr class:selected={action === history.selectedAction}>
          <td>{action.msg}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</section>
