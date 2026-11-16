import { useState } from "react";
export function synchronizeFilterPage(state: { key: string; page: number }, key: string) {
  return state.key === key ? state : { key, page: 0 };
}
/** A filter change resets the page synchronously, before the next request. */
export function useFilterPage(filters: unknown) {
  const key = JSON.stringify(filters);
  const [state, setState] = useState({ key, page: 0 });
  const current = synchronizeFilterPage(state, key);
  // Persist the reset even when returning to an earlier filter without paging.
  if (current !== state) setState(current);
  const page = current.page;
  return {
    page,
    setPage: (next: number) => setState({ key, page: Math.max(0, next) }),
  };
}
