import { useEffect, useState } from "react";
export function scheduleDebouncedUpdate<T>(
  value: T,
  update: (value: T) => void,
  delay: number
) {
  const timer = setTimeout(() => update(value), delay);
  return () => clearTimeout(timer);
}
export function useDebouncedValue<T>(value: T, delay = 350) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    return scheduleDebouncedUpdate(value, setSettled, delay);
  }, [value, delay]);
  return settled;
}
