# @gira-de/svelte-undo

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
