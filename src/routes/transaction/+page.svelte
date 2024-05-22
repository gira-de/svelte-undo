<script lang="ts">
  import {
    undoable,
    createTransaction,
    createHistoryStack,
  } from '$lib/index.js';
  import type { FormEventHandler } from 'svelte/elements';

  // create history stack and transaction
  const history = createHistoryStack('init');
  const transaction = createTransaction(history.push);

  const user = undoable('user', { firstname: '', lastname: '' });

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
