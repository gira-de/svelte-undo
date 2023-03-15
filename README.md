# @gira-de/svelte-undo

Provides low level utility functions to use Svelte Stores in combination with redo/undo capabilities. Relies on [immer.js](https://immerjs.github.io/immer/).

[Example App](https://github.com/gira-de/svelte-undo-example)

## Features

- **UndoStack** contains the history of all changes
- **Undo/Redo/Goto** to revert the model to a specific state
- **Transactions** to map multiple changes in one undo step
- **Commit Messages** for every undo stack entry
- **immer.js** is used to keep the undo stack small by using patches
- **Snapshots** to export/import the undo stack to/from JSON
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
import { undoStack, SetAction } from '@gira-de/svelte-undo';

// create undo stack
const myUndoStack = undoStack('first stack message');
const msgStore = writable('old value');

// create a new action to update the store value
const action = new SetAction(msgStore, 'new value', 'set new value');

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

Creating actions and manually pushing them to the undo stack might create a lot of boilerplate code. The use of Transaction simplifies this.

```ts
import { undoStack, transactionCtrl } from '@gira-de/svelte-undo';

// create a store as usual
const personStore = writable({ name: 'John', age: '23' });

// create undo stack and a transaction controller
const myUndoStack = undoStack('created');
const myTransactionCtrl = transactionCtrl(myUndoStack);

// apply model changes on the draft state
let personDraft = myTransactionCtrl.draft(personStore);
personDraft['age'] = 24;

// apply all changes made to the drafts
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

// push a undo step to the undo stack
const myUndoStack = undoStack('created');
const myTransactionCtrl = transactionCtrl(myUndoStack);
const personStore = writable({ name: 'John', age: '23' });
myTransactionCtrl.draft(personStore)['age'] = 24;
myTransactionCtrl.commit('happy birthday');

// provide a store id for each store used in the undo stack
const stores = {
  person: personStore,
};

// create a snapshot
const undoStackSnapshot = myUndoStack.createSnapshot(stores);

// snapshot can easily be stringified to json
const json = JSON.stringify(undoStackSnapshot);

console.log(json);
// {
//    index: 1,
//    actions: [
//      { type: 'init', msg: 'created' },
//      { type: 'mutate', msg: 'happy birthday', storeId: 'person', data: ... }
//    ]
// }

// later: load the undo stack snapshot
myUndoStack.loadSnapshot(JSON.parse(json), stores);
```

## Documentation

### undoStack

The _undoStack_ is basically a Svelte store with various properties and functions. The undo stack always contains at least one undo step (action).

#### Instantiation examples:

`const myUndoStack = undoStack('first undo stack message');`

`const myUndoStack = undoStack({ user: 'xyz', msg: 'project created' });`

#### Properties

- $myUndoStack.**actions**
  - a list of all undo steps
- $myUndoStack.**selectedAction**
  - the current active step those changes are applied to the model
- $myUndoStack.**canUndo**
  - _true_ if the _selectedAction_ is not the first action on the undo stack
  - _false_ otherwise
- $myUndoStack.**canRedo**
  - _true_ if the _selectedAction_ is not the last action on the undo stack
  - _false_ otherwise
- $myUndoStack.**index**
  - the index of the current _selectedAction_
  - e.g. is _0_ if _canUndo_ is false
- $myUndoStack.**ticker**
  - _0_ after the undo stack has been created, cleared or a snapshot has been loaded
  - gets increment by one after each each change on the undo stack (e.g. undo, redo, push, ...)

#### Functions

- myUndoStack.**push(action)**
  - pushes a new action on the undo stack and selects the action
  - does no apply the action state, this has to be done manually
  - its recommend to use the transaction controller instead of pushing actions manually
- myUndoStack.**undo()**
  - reverts the state of the selected action and selects the previous action
  - does nothing if their is no previous action on the undo stack
- myUndoStack.**redo()**
  - selects the next action and applies its state
  - does nothing if their is no next action on the undo stack
- myUndoStack.**goto(seqNbr)**
  - selects the action for the specified sequence number (_action.seqNbr_) and applies/reverts all actions between
  - has basically the same effect as calling undo/redo in a loop
- myUndoStack.**clear()**
  - removes all actions from the undo stack and creates a new init action
  - has same effect as if a new undo stack would be created
- myUndoStack.**createSnapshot(stores)**
  - creates and returns a snapshot of the undo stack
  - the snapshot can be easily serialized since it does no contain any store references and so on
- myUndoStack.**loadSnapshot(undoStackSnapshot, stores)**
  - clears the undo stack and then loads the specified snapshot

### transactionCtrl

#### Instantiation

`const myTransactionCtrl = transactionCtrl(myUndoStack);`

#### Functions

- myTransactionCtrl.**draft(store)**
  - return a new draft object for the specified store
  - changes to the draft object are not visible in the store until commit is called
- myTransactionCtrl.**commit(msg)**
  - applies all draft changes to the corresponding stores
  - calling _commit_ without having any draft changes has no effect
- myTransactionCtrl.**rollback()**
  - discards all draft changes since the last commit
  - calling _commit_ afterwards a _rollback_ has no effect

## Known issues

- Working with arrays (push/remove items) might create very large undo stack entries

## Contributing

Contributions are always welcome! Please have a look at our [CONTRIBUTION.md]()
