import type { IncomingMessage, ServerResponse } from "node:http";
import { supabaseAdmin } from "./supabaseAdmin.js";

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
};

export async function createContext(
  opts: CreateContextOptions
): Promise<TrpcContext> {
  let user: AuthUser | null = null;

  try {
    const authHeader = opts.req.headers.authorization;

    const token =
      typeof authHeader === "string" && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;

    if (token) {
      const { data, error } = await supabaseAdmin.auth.getUser(token);

      if (!error && data.user) {
        const email = data.user.email ?? null;

        const [{ data: adminUser, error: adminUserError }, { data: profile, error: profileError }] =
          await Promise.all([
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
          ]);

        if (adminUserError) {
          console.error("[createContext] erro ao buscar admin_user:", adminUserError);
        }

        if (profileError) {
          console.error("[createContext] erro ao buscar profile:", profileError);
        }

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
      }
    }
  } catch (error) {
    console.error("[createContext] erro ao autenticar usuário:", error);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
