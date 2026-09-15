import { TRPCError } from "@trpc/server";
import { supabaseAdmin } from "./supabaseAdmin.js";

type AccessUser = { id: string; role: string };
type AccessClient = Pick<typeof supabaseAdmin, "from" | "rpc">;

export type PlatformAccessDecision = {
  allowed: boolean;
  source: "role" | "profile" | "subscription";
  role: string;
  profileActive: boolean;
};

export async function getPlatformAccessDecision(user: AccessUser, client: AccessClient = supabaseAdmin): Promise<PlatformAccessDecision> {
  if (user.role === "admin" || user.role === "editor") {
    return { allowed: true, source: "role", role: user.role, profileActive: true };
  }
  const { data: profile, error: profileError } = await client.from("profiles")
    .select("role, ativo")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível validar o acesso à plataforma." });
  }
  const role = typeof profile?.role === "string" ? profile.role : user.role;
  if (role === "admin" || role === "editor") {
    return { allowed: true, source: "role", role, profileActive: profile?.ativo !== false };
  }
  if (profile?.ativo === false) return { allowed: false, source: "profile", role, profileActive: false };
  const { data, error } = await client.rpc("user_has_active_subscription", { target_user_id: user.id });
  if (error || typeof data !== "boolean") {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível validar o acesso à plataforma." });
  }
  return { allowed: data, source: "subscription", role, profileActive: true };
}

export async function assertPlatformAccess(user: AccessUser, client: AccessClient = supabaseAdmin) {
  const decision = await getPlatformAccessDecision(user, client);
  if (!decision.allowed) {
    throw new TRPCError({ code: "FORBIDDEN", message: "É necessário ter acesso ativo à plataforma." });
  }
  return decision;
}
