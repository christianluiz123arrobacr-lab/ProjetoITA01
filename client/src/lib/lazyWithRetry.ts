import { lazy, type ComponentType, type LazyExoticComponent } from "react";

const CHUNK_ERROR_PATTERNS = [
  "failed to fetch dynamically imported module",
  "importing a module script failed",
  "error loading dynamically imported module",
  "loading chunk failed",
];
const RETRY_PREFIX = "projeto-vetor:chunk-retry:";

export class DynamicImportRecoveryError extends Error {
  readonly isDynamicImportRecoveryError = true;
  constructor() {
    super("Não foi possível carregar esta página após uma atualização.");
    this.name = "DynamicImportRecoveryError";
  }
}

export function isDynamicImportError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalized = message.toLowerCase();
  return CHUNK_ERROR_PATTERNS.some(pattern => normalized.includes(pattern));
}

export type DynamicImportRecoveryAction =
  | "reload"
  | "show-friendly-error"
  | "rethrow";

export type DynamicImportEnvironment = {
  sessionStorage: Pick<Storage, "getItem" | "setItem" | "removeItem">;
  reload: () => void;
};

export function getDynamicImportRecoveryAction(
  error: unknown,
  alreadyRetried: boolean
): DynamicImportRecoveryAction {
  if (!isDynamicImportError(error)) return "rethrow";
  return alreadyRetried ? "show-friendly-error" : "reload";
}

function retryKey(id: string) {
  return `${RETRY_PREFIX}${id}`;
}

export async function importWithRetry<T extends ComponentType<unknown>>(
  id: string,
  importer: () => Promise<{ default: T }>,
  environment: DynamicImportEnvironment = {
    sessionStorage: window.sessionStorage,
    reload: () => window.location.reload(),
  }
): Promise<{ default: T }> {
  const key = retryKey(id);
  try {
    const module = await importer();
    try {
      environment.sessionStorage.removeItem(key);
    } catch (storageError) {
      console.warn(
        "Não foi possível limpar o controle de atualização da página.",
        storageError
      );
    }
    return module;
  } catch (error) {
    let alreadyRetried = false;
    try {
      alreadyRetried = environment.sessionStorage.getItem(key) === "1";
    } catch {
      // Sem sessionStorage, não é seguro tentar um reload automático.
      if (isDynamicImportError(error)) throw new DynamicImportRecoveryError();
      throw error;
    }
    const action = getDynamicImportRecoveryAction(error, alreadyRetried);
    if (action === "rethrow") throw error;
    if (action === "show-friendly-error")
      throw new DynamicImportRecoveryError();
    try {
      environment.sessionStorage.setItem(key, "1");
    } catch {
      throw new DynamicImportRecoveryError();
    }
    environment.reload();
    return new Promise<{ default: T }>(() => undefined);
  }
}

export function lazyWithRetry<T extends ComponentType<unknown>>(
  id: string,
  importer: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return lazy(() => importWithRetry(id, importer));
}
