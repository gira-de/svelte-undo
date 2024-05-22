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

  const user = undoable('user', { name: '' });

  const onSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    const draftUser = transaction.draft(user);
    draftUser.name = data.get('name')!.toString();

    transaction.commit(`Name changed to ${draftUser.name}`);
  };
</script>

<section>
  <h1>Input</h1>
  <form method="POST" onsubmit={onSubmit}>
    <label>
      Name
      <input type="text" name="name" value={user.value.name} />
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
    <button onclick={history.clear}>Clear</button>
    <button onclick={history.clearUndo}>Clear Undo</button>
    <button onclick={history.clearRedo}>Clear Redo</button>
  </div>
  <table>
    <thead>
      <tr>
        <th>Message</th>
        <th>Props</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {#each history.actions as action}
        <tr class:selected={action === history.selectedAction}>
          <td>
            {action.msg}
          </td>
          <td class="props">
            <span>type: {action.type}</span>&#8201;
            <span>storeId: {action.storeId}</span>&#8201;
            <span>seqNbr: {action.seqNbr}</span>
          </td>
          <td>
            {#if history.canGoto(action.seqNbr)}
              <button onclick={() => history.goto(action.seqNbr)}>Apply</button>
            {/if}
            <button onclick={() => history.erase(action.seqNbr)}>Erase</button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</section>

<style>
  .props > span {
    font-size: 0.75rem;
    padding: 0.1rem 0.4rem;
    border-radius: 0.2rem;
    background-color: var(--bg-neutral);
    color: var(--bg-neutral-content);
  }
</style>
