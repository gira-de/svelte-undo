# @gira-de/svelte-undo

## 0.0.3

### Patch Changes

- breaking interface changes in actions, undoStack and transactionCtrl

## 0.0.2

### Patch Changes

- fix: undo-stack save() was exporting an old data set when called after load()
- fix: stores argument for load/save() should be of type Record
- feat: add clear function to clear undo stack
- fix: add missing type exports
