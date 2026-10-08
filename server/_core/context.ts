import type { IncomingMessage, ServerResponse } from "node:http";
import { supabaseAdmin } from "./supabaseAdmin.js";
import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { bounded, isInvalidCredential, safeErrorCode } from "../../shared/authRecovery.js";

export type AuthUser = {
  id: string;
  email: string | null;
  role: "admin" | "editor" | "student";
};

export type CreateContextOptions = {
  req: IncomingMessage;
  res: ServerResponse;
};

export type TrpcContext = {
  req: IncomingMessage;
  res: ServerResponse;
  user: AuthUser | null;
  authenticate?: () => Promise<void>;
  validatedProfile?: { userId: string; data: { role?: string; ativo?: boolean } | null };
  authentication?: { status: "missing" | "invalid" | "unavailable" | "verified"; correlationId: string };
};

export async function ensureAuthentication(ctx: TrpcContext) {
  await ctx.authenticate?.();
}

/** Request-scoped lazy authentication: public-only requests do not query roles.
 * No credentials/roles are cached across requests. Concurrent batch procedures
 * share exactly one real token validation and role lookup in this request.
 */
export function createTrpcContext(opts: CreateContextOptions): TrpcContext {
  const ctx: TrpcContext = { ...opts, user: null };
  let pending: Promise<void> | undefined;
  ctx.authenticate = () => pending ??= createContext(opts).then(result => {
    ctx.user = result.user;
    ctx.authentication = result.authentication;
    ctx.validatedProfile = result.validatedProfile;
  });
  return ctx;
}

export function assertAuthenticationAvailable(ctx: TrpcContext) {
  if (ctx.authentication?.status === "invalid") {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão inválida. Entre novamente." });
  }
  if (ctx.authentication?.status === "unavailable") {
    throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Não foi possível confirmar sua autenticação. Tente novamente em instantes." });
  }
}

export async function createContext(
  opts: CreateContextOptions
): Promise<TrpcContext> {
  let user: AuthUser | null = null;
  let validatedProfile: TrpcContext["validatedProfile"];
  const started = Date.now();
  const correlationId = randomUUID();
  let status: NonNullable<TrpcContext["authentication"]>["status"] = "missing";
  let stage = "token";
  let code: string | undefined;

  try {
    const authHeader = opts.req.headers.authorization;

    const token =
      typeof authHeader === "string" && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : null;

    if (token) {
      stage = "supabase_auth";
      const tokenStarted = Date.now();
      const { data, error } = await bounded(supabaseAdmin.auth.getUser(token), 6000);
      console.info({ event: "authentication_check", correlation_id: correlationId, stage, outcome: error ? "error" : "success", code: error ? safeErrorCode(error) : undefined, duration_ms: Date.now() - tokenStarted });
      if (error) {
        status = isInvalidCredential(error) ? "invalid" : "unavailable";
        code = safeErrorCode(error);
      } else if (!data.user) {
        status = "unavailable";
        code = "empty_auth_response";
      }

      if (!error && data.user) {
        const email = data.user.email ?? null;
        stage = "roles";
        const rolesStarted = Date.now();
        const cancellation = new AbortController();
        const adminQuery = supabaseAdmin.from("admin_users").select("role").eq("user_id", data.user.id);
        const profileQuery = supabaseAdmin.from("profiles").select("role, ativo").eq("id", data.user.id);

        const [{ data: adminUser, error: adminUserError }, { data: profile, error: profileError }] =
          await bounded(Promise.all([
            (adminQuery.abortSignal?.(cancellation.signal) ?? adminQuery).maybeSingle(),
            (profileQuery.abortSignal?.(cancellation.signal) ?? profileQuery).maybeSingle(),
          ]), 4000).finally(() => cancellation.abort());

        console.info({ event: "authentication_check", correlation_id: correlationId, stage, outcome: adminUserError || profileError ? "error" : "success", duration_ms: Date.now() - rolesStarted });

        if (adminUserError || profileError) throw adminUserError || profileError;
        validatedProfile = { userId: data.user.id, data: profile };

        const resolvedRole =
          adminUser?.role === "admin" || adminUser?.role === "editor"
            ? adminUser.role
            : profile?.role === "admin"
              ? "admin"
              : "student";

        user = {
          id: data.user.id,
          email,
          role: resolvedRole,
        };
        status = "verified";
      }
    }
  } catch (error) {
    status = stage === "supabase_auth" && isInvalidCredential(error) ? "invalid" : "unavailable";
    code = safeErrorCode(error);
    user = null;
  }

  if (status !== "verified") console.warn({
    event: "authentication_check", correlation_id: correlationId, stage,
    outcome: status, code, duration_ms: Date.now() - started,
  });
  return {
    req: opts.req,
    res: opts.res,
    user,
    validatedProfile,
    authentication: { status, correlationId },
  };
}
