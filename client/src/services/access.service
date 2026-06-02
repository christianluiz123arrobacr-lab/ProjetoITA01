import { supabase } from "@/lib/supabase";

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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, ativo")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.warn("Erro ao buscar perfil:", profileError);
  }

  if (profile?.role === "admin") {
    const result: PlatformAccessResult = {
      status: "allowed",
      reason: "admin",
    };

    setCachedPlatformAccess(userId, result);
    return result;
  }

  if (profile?.ativo === false) {
    const result: PlatformAccessResult = {
      status: "blocked",
      reason: "profile_inactive",
    };

    setCachedPlatformAccess(userId, result);
    return result;
  }

  const { data: hasActiveSubscription, error: rpcError } = await supabase.rpc(
    "user_has_active_subscription",
    {
      target_user_id: userId,
    }
  );

  if (!rpcError && typeof hasActiveSubscription === "boolean") {
    const result: PlatformAccessResult = {
      status: hasActiveSubscription ? "allowed" : "blocked",
      reason: "rpc",
    };

    setCachedPlatformAccess(userId, result);
    return result;
  }

  console.warn(
    "RPC user_has_active_subscription falhou. Usando fallback em billing_subscriptions:",
    rpcError
  );

  const now = new Date().toISOString();

  const { data: subscription, error: subscriptionError } = await supabase
    .from("billing_subscriptions")
    .select("id")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .or(`current_period_end.is.null,current_period_end.gte.${now}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subscriptionError) {
    console.error("Erro ao verificar assinatura:", subscriptionError);

    const result: PlatformAccessResult = {
      status: "blocked",
      reason: "subscription_error",
    };

    setCachedPlatformAccess(userId, result);
    return result;
  }

  const result: PlatformAccessResult = {
    status: subscription ? "allowed" : "blocked",
    reason: "fallback",
  };

  setCachedPlatformAccess(userId, result);
  return result;
}
