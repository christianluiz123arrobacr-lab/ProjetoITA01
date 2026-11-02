const NON_JSON_API_ERROR =
  /unexpected token|not valid json|server error has occurred|internal server error/i;

export function getSafeApiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  const message = error.message.trim();
  return !message || NON_JSON_API_ERROR.test(message) ? fallback : message;
}
