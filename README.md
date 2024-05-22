# @gira-de/svelte-undo

Provides low-level utility functions to use Svelte [Stores](https://svelte.dev/tutorial/writable-stores) in combination with redo/undo capabilities. Relies on [immer.js](https://immerjs.github.io/immer/).

[Example App](https://github.com/gira-de/svelte-undo-example)

![](./example-app.gif)

## Features

- **HistoryStack** contains the history of all changes
- **Undo/Redo/Goto** reverts the model to a specific state
- **Transactions** map multiple changes in one undo step
- **Commit Messages** for every undo stack entry
- **immer.js** keeps the undo stack small by using patches
- **Snapshots** export/import the undo stack to/from JSON
- **Typescript** support

## Installation

```bash
# using npm
npm install -D @gira-de/svelte-undo

# or using pnpm
pnpm install -D @gira-de/svelte-undo

# or using yarn
yarn add -D @gira-de/svelte-undo
```

## Usage examples

### Push actions to undo stack

```ts
import {
  createHistoryStack,
  createSetAction,
  undoable,
} from '@gira-de/svelte-undo';

// create undo stack
const history = createHistoryStack('first stack message');
const value = undoable('unique-id', 'old value');

// create a new action
const action = createSetAction(value, 'new value', 'set new value');

// applying the action will update the value
action.apply();
console.log(value); // 'new value'

// push action onto the undo stack
history.push(action);

// call undo() to revert the changes
history.undo();
console.log(value); // 'old value'
```

### Use transactions

Using actions directly is usually quite cumbersome and creates a lot of redundant code and opportunities for errors. Transactions simplify usage.

```ts
import {
  createHistoryStack,
  createTransaction,
  undoable,
} from '@gira-de/svelte-undo';

// create a undoable value as usual
const person = undoable('person', { name: 'John', age: 23 });

// create undo stack and a transaction
const history = createHistoryStack('created');
const transaction = createTransaction(history.push);

// changes to the model are appliedj to a draft state
const draftPerson = transaction.draft(person);
draftPerson['age'] = 24;

// apply all changes made to the draft states
transaction.commit('happy birthday');
console.log(person); // { name: 'John', age: 24 }

// call undo() to revert the changes
history.undo();
console.log(person); // { name: 'John', age: 23 }
```

Limitations: The transaction controller can only be used with Object-like value (object, array, map, set).

### Save from & load to undo stack

```ts
import {
  createHistoryStack,
  createTransaction,
  undoable,
} from '@gira-de/svelte-undo';

// push an undo step to the undo stack
const history = createHistoryStack('created');
const transaction = createTransaction(history.push);
const person = undoable('personId', { name: 'John', age: 23 });
transaction.draft(person)['age'] = 24;
transaction.commit('happy birthday');

// create a snapshot
const historySnapshot = history.createSnapshot();

// snapshot can easily be stringified to json
const json = JSON.stringify(historySnapshot);

console.log(json);
// {
//    index: 1,
//    actions: [
//      { type: 'init', msg: 'created' },
//      { type: 'mutate', msg: 'happy birthday', storeId: 'personId', data: ... }
//    ]
// }

// later: load the undo stack snapshot
history.loadSnapshot(JSON.parse(json), {
  personId: person,
});
```

## Documentation

### HistoryStack

The _HistoryStack_ contains the undo actions, undo/redo functionality and various states.
The actions stack can never be empty.

#### Instantiation examples:

`const historyStack = createHistoryStack('project created');`

`const historyStack = createHistoryStack({ timestamp: 12345678, msg: 'project created' });`

#### Properties

- historyStack.**actions**
  - the list of all actions that are currently on the undo stack
- historyStack.**selectedAction**
  - the current active step whose changes are applied to the model
- historyStack.**canUndo**
  - _true_ if the _selectedAction_ is not the first action on the stack and the action is not a barrier
  - _false_ otherwise
- historyStack.**canRedo**
  - _true_ if the _selectedAction_ is not the last action on the stack and the next action is not a barrier
  - _false_ otherwise
- historyStack.**index**
  - the index of the current _selectedAction_

#### Functions

- historyStack.**push(action)**
  - pushes a new action onto the undo stack and selects the action
  - does not apply the action state, this has to be done manually
  - it's recommended to use the transaction controller instead of pushing actions manually
- historyStack.**undo()**
  - reverts the state of the selected action and selects the previous action
  - does nothing if there's no previous action on the undo stack or the selected action is a barrier
- historyStack.**redo()**
  - selects the next action and applies its state
  - does nothing if there's no next action on the undo stack or the next action is a barrier
- historyStack.**goto(seqNbr)**
  - selects the action for the specified sequence number (_action.seqNbr_) and applies/reverts all actions between
  - has basically the same effect as calling undo/redo in a loop
- historyStack.**clear()**
  - removes all actions from the undo stack and creates a new init action
  - has the same effect as if a new undo stack has been created
- historyStack.**clearRedo()**
  - Removes all redoable actions from the stack
  - This is the same as would happen if a new action is pushed while not being at the latest state, just without pushing the action
- historyStack.**clearUndo()**
  - Deletes all previous undo actions
  - If the current position is the top of the stack, this effectively deletes the whole undo stack
- historyStack.**createSnapshot()**
  - creates and returns a snapshot of the undo stack
  - the snapshot can be easily serialized since it does not contain any references to the undoable states etc.
- historyStack.**loadSnapshot(historySnapshot, stores)**
  - clears the undo stack and then loads the specified snapshot
- historyStack.**erase(seqNbr?)**
  - removes undo/redo capability from actions to reduce the size of the undo stack
  - starting from the specified sequence number the action itself and all previous actions are erased
  - if seqNbr is undefined starts all actions are erased
  - erased actions are still included on the undo stack in form of log entries
  - this function is currently experimental and might not always yield the expected state

### Transaction

#### Instantiation example

`const transaction = createTransaction(history.push);`

#### Functions

- transaction.**draft(undoable)**
  - returns a new draft object for the specified undoable state
  - changes on the draft object are not applied to the original state until commit is called.
- transaction.**commit(msg)**
  - applies all draft changes to the undoable state
  - calling _commit_ without having any draft changes has no effect
- transaction.**rollback()**
  - discards all draft changes since the last commit
  - calling _commit_ after a _rollback_ has no effect

## Known issues

- Working with arrays (pushing/removing items) might create very large undo stack entries.

## Contributing

Contributions are always welcome! Please have a look at our [CONTRIBUTING.md](CONTRIBUTING.md)
