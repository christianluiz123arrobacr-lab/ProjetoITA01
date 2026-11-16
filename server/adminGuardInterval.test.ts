import { afterEach, expect, it, vi } from "vitest";
import { adminAccessRecheck } from "../client/src/lib/adminRevalidation";
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
it("a subscribed administrative query revalidates after multiple real configured intervals", async () => {
  vi.useFakeTimers();
  // QueryObserver's browser timer branch; no HTTP, real account or DOM required.
  vi.stubGlobal("window", {});
  const { QueryClient, QueryObserver } = await import("@tanstack/query-core");
  const client = new QueryClient();
  const queryFn = vi.fn().mockResolvedValue({ id: "one", role: "admin" });
  const observer = new QueryObserver(client, { queryKey: ["me"], queryFn, retry: false, refetchInterval: adminAccessRecheck, refetchIntervalInBackground: false });
  const unsubscribe = observer.subscribe(() => {});
  try {
    await vi.advanceTimersByTimeAsync(0);
    expect(queryFn).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(300001);
    expect(queryFn).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(300001);
    expect(queryFn).toHaveBeenCalledTimes(3);
    queryFn.mockRejectedValue(new Error("temporary"));
    await vi.advanceTimersByTimeAsync(300001);
    expect(observer.getCurrentResult().isError).toBe(true);
    await vi.advanceTimersByTimeAsync(900000);
    expect(queryFn).toHaveBeenCalledTimes(4); // No error polling storm.
    queryFn.mockResolvedValue({ id: "one", role: "admin" });
    await observer.refetch();
    expect(observer.getCurrentResult().isSuccess).toBe(true);
    await vi.advanceTimersByTimeAsync(300001);
    expect(queryFn).toHaveBeenCalledTimes(6); // Periodic validation resumes.
  } finally { unsubscribe(); client.clear(); }
});
