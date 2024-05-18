export interface Undoable<T> {
  id: string;
  value: T;
}

export function undoable<T>(id: string, value: T): Undoable<T> {
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
