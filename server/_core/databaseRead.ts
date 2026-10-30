import { TRPCError } from "@trpc/server";
import { bounded, safeErrorCode } from "../../shared/authRecovery.js";

type ReadResult<T> = { data: T | null; error: unknown };
type ReadOperation<T> = PromiseLike<ReadResult<T>> & {
  abortSignal?: (signal: AbortSignal) => PromiseLike<ReadResult<T>>;
};

export class DatabaseReadFailure extends TRPCError {
  readonly databaseCode: string;
  constructor(error: unknown) {
    super({ code: "SERVICE_UNAVAILABLE", message: "Não foi possível carregar os dados agora. Tente novamente em instantes." });
    this.databaseCode = safeErrorCode(error);
  }
}

/** Read-only operations: a timeout is never retried or reported as an empty set. */
export async function readDatabase<T>(operation: ReadOperation<T>, stage: string, timeoutMs = 8000): Promise<T | null> {
  const controller = new AbortController();
  const started = Date.now();
  try {
    const result = await bounded(operation.abortSignal?.(controller.signal) ?? operation, timeoutMs);
    if (result.error) throw result.error;
    return result.data;
  } catch (error) {
    console.warn({ event: "database_read", stage, outcome: "unavailable", code: safeErrorCode(error), duration_ms: Date.now() - started });
    throw new DatabaseReadFailure(error);
  } finally {
    controller.abort();
  }
}

/** Stop only on an empty page: a project may configure a row cap below 500.
 * Advance by the number actually received. Stable ordering belongs to each query. */
export async function readAllDatabaseRows<T>(
  page: (from: number, to: number) => ReadOperation<T[]>,
  stage: string,
  timeoutMs = 15000,
): Promise<T[]> {
  const rows: T[] = [];
  const deadline = Date.now() + timeoutMs;
  for (let from = 0; ;) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new DatabaseReadFailure({ code: "operation_timeout" });
    const data = await readDatabase(page(from, from + 499), stage, Math.min(8000, remaining));
    if (!Array.isArray(data)) throw new DatabaseReadFailure({ code: "invalid_read_result" });
    rows.push(...data);
    if (!data.length) return rows;
    from += data.length;
  }
}

/** Keep IN expressions and related result sets below PostgREST/URL limits. */
export async function readDatabaseRowsByIds<T>(
  ids: string[],
  query: (ids: string[], from: number, to: number) => ReadOperation<T[]>,
  stage: string,
): Promise<T[]> {
  const rows: T[] = [];
  const unique = Array.from(new Set(ids));
  const deadline = Date.now() + 15000;
  for (let offset = 0; offset < unique.length; offset += 200) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new DatabaseReadFailure({ code: "operation_timeout" });
    const data = await readAllDatabaseRows((from, to) => query(unique.slice(offset, offset + 200), from, to), stage, remaining);
    rows.push(...data);
  }
  return rows;
}
