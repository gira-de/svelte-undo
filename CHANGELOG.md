# @gira-de/svelte-undo

## 1.3.0

### Minor Changes

- e283b62: add support for Svelte 5

### Patch Changes

- cb364a1: fix: incorrect canUndo state after erasing actions twice
- a78cb63: Upgrade dev dependencies
- 7365eda: Remove unused dev dependency prettier-plugin-svelte
- ce0be15: Upgrade PNPM to version 9
- 34b1eb5: fix: update selectedAction after actions erased
- b8579a8: Upgrade GitHub actions to use Node.js 20

## 1.2.2

### Patch Changes

- d6f17af: chore: upgrade dependencies
- bf1885e: Upgrades all dependencies and increases node version

## 1.2.1

### Patch Changes

- a636754: fix missing typescript types

## 1.2.0

### Minor Changes

- 4574739: chore: upgrade svelte to v4
- 4749519: chore: upgrade immer to v10

### Patch Changes

- 4574739: chore: upgrade dependencies to fix vulnerabilities

## 1.1.1

### Patch Changes

- chore: upgrade package dependencies

## 1.1.0

### Minor Changes

- b79b942: feat: add clearUndo()/clearRedo() function to the undo stack to only remove applied/unapplied actions
- bf29205: feat: add erase() function to the undo stack that can be used to reduce the stack size while keeping the undo history messages

### Patch Changes

- e87e984: remove: ticker from undo stack as its purpose is not really clear
- e87e984: fix: wrong seqNbr after erase() or clearUndo()

## 1.0.0

### Major Changes

- first major release
- feat: undo stack with undo/redo/goto
- feat: undo step messages
- feat: transactions
- feat: snapshots
- feat: full typescript support

## 0.0.7

### Patch Changes

- fix: ticker should be 0 after loading a snapshot

## 0.0.6

### Patch Changes

- order of generic types for actions shall be the same as the constructor params

## 0.0.5

### Patch Changes

- docs: improve readme
- docs: add api docs
- fix: restrict access to undo stack and action properties

## 0.0.4

### Patch Changes

- provide TransactionCtrl type

## 0.0.3

### Patch Changes

- breaking interface changes in actions, undoStack and transactionCtrl

## 0.0.2

### Patch Changes

- fix: undo-stack save() was exporting an old data set when called after load()
- fix: stores argument for load/save() should be of type Record
- feat: add clear function to clear undo stack
- fix: add missing type exports
