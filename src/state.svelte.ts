export interface UndoState<T> {
  id: string;
  value: T;
}

export function undoState<T>(id: string, value: T): UndoState<T> {
  let stateValue = $state.frozen(value);

  return {
    get id() {
      return id;
    },
    get value() {
      return stateValue;
    },
    set value(v) {
      stateValue = v;
    },
  };
}
