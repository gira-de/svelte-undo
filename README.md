# @gira-de/svelte-undo

Provides low level utility functions to use Svelte Stores in combination with redo/undo capabilities. Relies on [immer.js](https://immerjs.github.io/immer/).

[Example App](https://github.com/gira-de/svelte-undo-example)

## Usage Examples

### Push actions to undo stack

```ts
import { undoStack, SetAction } from '@gira-de/svelte-undo';

// create undo stack
const myUndoStack = undoStack('first stack message');
const msgStore = writable('old value');

// create a new action to update the store value
const action = new SetAction('set new value', msgStore, 'new value');

// apply the action
action.apply();
console.log($msgStore); // 'new value'

// push action onto the undo stack
myUndoStack.push(action);

// call undo() to revert the changes
myUndoStack.undo();
console.log($msgStore); // 'old value'
```

### Use transactions

Writing and pushing actions to the undo stack might create a lot of boilerplate code. The use of Transaction simplifies this.

```ts
import { undoStack, transactionCtrl } from '@gira-de/svelte-undo';

// create undo stack with transaction controller
const myUndoStack = undoStack('created');
const myTransactionCtrl = transactionCtrl(myUndoStack, 'commit');
const personStore = writable({ name: 'John', age: '23' });

// create a draft state for the person store
let personDraft = myTransactionCtrl.draft(personStore);
personDraft['age'] = 24;

// apply all draft changes
myTransactionCtrl.commit('happy birthday');
console.log($personStore); // { name: 'John', age: '24' }

// call undo() to revert the changes
myUndoStack.undo();
console.log($personStore); // { name: 'John', age: '23' }
```

Limitations: The transaction controller can only be used with Svelte stores that hold an Objectish value (object, array, map, set)

### Save & Load undo stack

```ts
import { undoStack, transactionCtrl } from '@gira-de/svelte-undo';

// new undo stack
const myUndoStack = undoStack('created');
const myTransactionCtrl = transactionCtrl(myUndoStack, 'sub action');

// create an undo step
const personStore = writable({ name: 'John', age: '23' });
myTransactionCtrl.draft(personStore)['age'] = 24;
myTransactionCtrl.commit('happy birthday');

// create a snapshot of the current state
const stores = {
  person: personStore,
};
const undoStackSnapshot = myUndoStack.createSnapshot(stores);

// snapshot can easily be stringified to json
JSON.stringify(undoStackSnapshot);
// {
//    index: 1,
//    actions: [
//      { type: 'init', msg: 'created' },
//      { type: 'mutate', msg: 'happy birthday', storeId: 'person', data: ... }
//    ]
// }

// later: load the undo stack snapshot
myUndoStack.loadSnapshot(undoStackSnapshot, stores);
```

## Known issues

- Working with arrays (push/remove items) might create a very large undo stack entries
