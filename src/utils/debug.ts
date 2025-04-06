import { useState, useDebugValue, Dispatch, SetStateAction } from "react";

export function useStateWithLabel<T>(initialValue: T, name: string): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState(initialValue);
  useDebugValue(`${name}: ${JSON.stringify(value)}`);
  return [value, setValue];
}
