/** Unknown provider failures are not proof of invalid credentials. */
export function isInvalidCredential(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" && [
    "bad_jwt", "jwt_expired", "session_expired", "session_not_found",
    "refresh_token_not_found", "refresh_token_already_used", "user_not_found", "user_banned",
  ].includes(code);
}

export class OperationTimeout extends Error {
  readonly code = "operation_timeout";
  constructor() { super("O serviço não respondeu no prazo esperado."); }
}

export async function bounded<T>(operation: PromiseLike<T>, ms = 8000, signal?: AbortSignal): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cancel: (() => void) | undefined;
  try {
    return await Promise.race([
      Promise.resolve(operation),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new OperationTimeout()), ms); }),
      new Promise<never>((_, reject) => {
        cancel = () => reject(new DOMException("Operação interrompida.", "AbortError"));
        if (signal?.aborted) cancel(); else signal?.addEventListener("abort", cancel, { once: true });
      }),
    ]);
  } finally { clearTimeout(timer); if (cancel) signal?.removeEventListener("abort", cancel); }
}

export function safeErrorCode(error: unknown): string {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" && /^[a-zA-Z0-9_]{1,64}$/.test(code) ? code : "provider_error";
}
