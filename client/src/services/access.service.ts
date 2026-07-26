import { trpcClient } from "@/lib/trpcClient";

export type PlatformAccessStatus = "allowed" | "blocked" | "unauthenticated";

export type PlatformAccessResult = {
  status: PlatformAccessStatus;
  reason?: string;
  cached?: boolean;
};

const ACCESS_CACHE_VERSION = "v1";
const ACCESS_CACHE_PREFIX = `${ACCESS_CACHE_VERSION}:platform-access`;
const ALLOWED_CACHE_TTL_MS = 5 * 60 * 1000;
const BLOCKED_CACHE_TTL_MS = 25 * 1000;

function getAccessCacheKey(userId: string) {
  return `${ACCESS_CACHE_PREFIX}:${userId}`;
}

function getCacheTtl(status: PlatformAccessStatus) {
  return status === "allowed" ? ALLOWED_CACHE_TTL_MS : BLOCKED_CACHE_TTL_MS;
}

export function getCachedPlatformAccess(userId?: string | null): PlatformAccessResult | null {
  if (!userId || typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(getAccessCacheKey(userId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PlatformAccessResult & {
      savedAt?: number;
    };

    if (!parsed.savedAt || !parsed.status) return null;

    const ttl = getCacheTtl(parsed.status);
    const expired = Date.now() - parsed.savedAt > ttl;

    if (expired) {
      window.sessionStorage.removeItem(getAccessCacheKey(userId));
      return null;
    }

    return {
      status: parsed.status,
      reason: parsed.reason,
      cached: true,
    };
  } catch {
    return null;
  }
}

export function setCachedPlatformAccess(userId: string, result: PlatformAccessResult) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(
      getAccessCacheKey(userId),
      JSON.stringify({
        ...result,
        savedAt: Date.now(),
      })
    );
  } catch {
    // cache é só acelerador
  }
}

export function clearCachedPlatformAccess(userId?: string | null) {
  if (!userId || typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(getAccessCacheKey(userId));
  } catch {
    // vida que segue
  }
}

export async function checkPlatformAccess(
  userId: string,
  options: { forceRefresh?: boolean } = {}
): Promise<PlatformAccessResult> {
  if (!options.forceRefresh) {
    const cached = getCachedPlatformAccess(userId);

    if (cached) {
      return cached;
    }
  }

  const access = await trpcClient.auth.getAccessStatus.query();
  const accessDetails = access as {
    accessState: PlatformAccessStatus;
    blockReason?: string | null;
    source?: string | null;
    role?: string | null;
  };
  const result: PlatformAccessResult = {
    status: accessDetails.accessState,
    reason: accessDetails.blockReason ?? accessDetails.source ?? accessDetails.role ?? undefined,
  };

  setCachedPlatformAccess(userId, result);
  return result;
}
