import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { supabaseAdmin } from "./supabaseAdmin.js";

type AccessUser = { id: string; role: string };
type AccessClient = Pick<typeof supabaseAdmin, "from" | "rpc">;
type AccessOptions = { correlationId?: string };

export type PlatformAccessDecision = {
  allowed: boolean;
  source: "role" | "profile" | "subscription";
  role: string;
  profileActive: boolean;
  hasPendingPayment: boolean;
  correlationId: string;
};

function logAccess(input: {
  correlationId: string;
  stage: string;
  outcome: "blocked" | "error";
  code?: string | null;
}) {
  console.error({
    event: "platform_access_check",
    correlation_id: input.correlationId,
    stage: input.stage,
    outcome: input.outcome,
    code: input.code ?? null,
  });
}

export async function getPlatformAccessDecision(
  user: AccessUser,
  client: AccessClient = supabaseAdmin,
  options: AccessOptions = {},
): Promise<PlatformAccessDecision> {
  const correlationId = options.correlationId || randomUUID();
  if (user.role === "admin" || user.role === "editor") {
    return { allowed: true, source: "role", role: user.role, profileActive: true, hasPendingPayment: false, correlationId };
  }

  const { data: profile, error: profileError } = await client.from("profiles")
    .select("role, ativo")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) {
    logAccess({ correlationId, stage: "profile", outcome: "error", code: profileError.code });
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível validar o acesso à plataforma." });
  }

  const role = typeof profile?.role === "string" ? profile.role : user.role;
  if (role === "admin" || role === "editor") {
    return { allowed: true, source: "role", role, profileActive: profile?.ativo !== false, hasPendingPayment: false, correlationId };
  }
  if (profile?.ativo === false) {
    return { allowed: false, source: "profile", role, profileActive: false, hasPendingPayment: false, correlationId };
  }

  const { data: pendingPayment, error: pendingPaymentError } = await client.from("billing_payments")
    .select("id")
    .eq("user_id", user.id)
    .eq("gateway", "mercadopago")
    .eq("status", "pending")
    .maybeSingle();
  if (pendingPaymentError) {
    logAccess({ correlationId, stage: "pending_payment", outcome: "error", code: pendingPaymentError.code });
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível validar o acesso à plataforma." });
  }

  const hasPendingPayment = Boolean((pendingPayment as { id?: string } | null)?.id);
  const { data, error } = await client.rpc("user_has_active_subscription", { target_user_id: user.id });
  if (error || typeof data !== "boolean") {
    if (hasPendingPayment) {
      logAccess({ correlationId, stage: "canonical_rpc", outcome: "blocked", code: error?.code });
      return { allowed: false, source: "subscription", role, profileActive: true, hasPendingPayment, correlationId };
    }
    logAccess({ correlationId, stage: "canonical_rpc", outcome: "error", code: error?.code });
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível validar o acesso à plataforma." });
  }
  return { allowed: data, source: "subscription", role, profileActive: true, hasPendingPayment, correlationId };
}

export async function assertPlatformAccess(user: AccessUser, client: AccessClient = supabaseAdmin) {
  const decision = await getPlatformAccessDecision(user, client);
  if (!decision.allowed) {
    throw new TRPCError({ code: "FORBIDDEN", message: "É necessário ter acesso ativo à plataforma." });
  }
  return decision;
}
