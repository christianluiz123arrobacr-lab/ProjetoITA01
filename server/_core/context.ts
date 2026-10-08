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
  authentication?: { status: "missing" | "invalid" | "unavailable" | "verified"; correlationId: string };
};

export function assertAuthenticationAvailable(ctx: TrpcContext) {
  if (ctx.authentication?.status === "unavailable") {
    throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Não foi possível confirmar sua autenticação. Tente novamente em instantes." });
  }
}

export async function createContext(
  opts: CreateContextOptions
): Promise<TrpcContext> {
  let user: AuthUser | null = null;
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
      const { data, error } = await bounded(supabaseAdmin.auth.getUser(token), 6000);
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

        const [{ data: adminUser, error: adminUserError }, { data: profile, error: profileError }] =
          await bounded(Promise.all([
            supabaseAdmin
              .from("admin_users")
              .select("role")
              .eq("user_id", data.user.id)
              .maybeSingle(),
            supabaseAdmin
              .from("profiles")
              .select("role")
              .eq("id", data.user.id)
              .maybeSingle(),
          ]), 4000);

        if (adminUserError || profileError) throw adminUserError || profileError;

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
    authentication: { status, correlationId },
  };
}
