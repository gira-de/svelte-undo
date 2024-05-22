<script lang="ts">
  import { createSetAction, createHistoryStack, undoable } from '$lib/index.js';
  import type { FormEventHandler } from 'svelte/elements';

  // create history stack
  const history = createHistoryStack('init');
  const undoableValue = undoable('note', '');

  const onSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    // create a new action that can be push on the history stack
    const newNote = data.get('note')!.toString();
    const action = createSetAction(
      undoableValue,
      newNote,
      `set note '${newNote}'`,
    );

    //apply action
    action.apply();

    // push action onto the history stack
    history.push(action);
  };
</script>

<section>
  <h1>Input</h1>
  <form action="POST" onsubmit={onSubmit}>
    <label>
      Value
      <input type="text" name="note" value={undoableValue.value} />
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
