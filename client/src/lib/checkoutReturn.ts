/** Only the plans page is an allowed destination after checkout authentication. */
export function checkoutReturn(search: string, fallback: string): string {
  const target = new URLSearchParams(search).get("returnTo");
  if (!target) return fallback;
  try {
    const url = new URL(target, "https://checkout.invalid");
    if (url.origin !== "https://checkout.invalid" || url.pathname !== "/planos")
      return fallback;
    return url.pathname + url.search;
  } catch {
    return fallback;
  }
}
