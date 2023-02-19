# @gira-de/svelte-undo

Provides low level utility functions to use Svelte Stores in combination with redo/undo capabilities. Relies on [immer.js](https://immerjs.github.io/immer/).

[Example App](https://github.com/gira-de/svelte-undo-example)

## Usage Examples

### Use undo stack to push actions

```ts
import { undoStackStore } from '@gira-de/svelte-undo';

// create undo stack
const undoStack = undoStackStore('first stack message');
const msgStore = writable('old value');

// create a new action to update the store value
const action = new SetAction('set new value', msgStore, 'new value');

// apply the action
action.apply();
console.log($msgStore); // 'new value'

// push action onto the undo stack
undoStack.push(action);

// call undo() to revert the changes
undoStack.undo();
console.log($msgStore); // 'old value'
```

### Use transactions (recommended)

To avoid writing boilerplate code like in the example before (create, apply and push actions), the transaction controller can be used instead.

```ts
import { undoStackStore, TransactionCtrl } from '@gira-de/svelte-undo';

// create undo stack with transaction controller
const undoStack = undoStackStore('created');
const transactionCtrl = new TransactionCtrl(undoStack, 'commit');
const personStore = writable({ name: 'John', age: '23' });

// create a draft state for the person store
let personDraft = transactionCtrl.getDraft(personStore);
personDraft['age'] = 24;

// apply all draft changes
transactionCtrl.commit('happy birthday');
console.log($personDraft); // { name: 'John', age: '24' }

// call undo() to revert the changes
undoStack.undo();
console.log($personDraft); // { name: 'John', age: '23' }
```

Limitations: The transaction controller can only be used with Svelte stores that hold an Objectish value (object, array, map or set)

### Export undo stack actions

```ts
import { undoStackStore, TransactionCtrl } from '@gira-de/svelte-undo';

// create undo stack
const undoStack = undoStackStore('created');
const transactionCtrl = new TransactionCtrl(undoStack, 'init commit msg');

// add undo stack entry
const personStore = writable({ name: 'John', age: '23' });
transactionCtrl.getDraft(personStore)['age'] = 24;
transactionCtrl.commit('happy birthday');

// export undo stack actions
const storeIds = new Map<unknown, string>();
storeIds.set(personStore, 'person');
const savedActions = saveActions($undoStack.actions, storeIds);

console.log(savedActions);
// [{ type: 'init', msg: 'init commit msg' },
//  { type: 'mutation', msg: 'happy birthday', storeId: 'person', data: ... }]
```
