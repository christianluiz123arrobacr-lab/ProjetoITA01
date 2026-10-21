/** Only reads may use this policy. Writes are retried explicitly by the user. */
export function retryTransientRead(failures: number, error: unknown) {
  if (failures >= 1) return false;
  const data = (error as { data?: { code?: string; authStatus?: string } })
    ?.data;
  if (data?.authStatus === "invalid" || data?.authStatus === "missing")
    return false;
  return (
    data?.code === "SERVICE_UNAVAILABLE" ||
    data?.code === "GATEWAY_TIMEOUT" ||
    (!data?.code &&
      [error, (error as { cause?: unknown })?.cause].some(
        cause =>
          cause instanceof TypeError && /fetch|network/i.test(cause.message)
      ))
  );
}
