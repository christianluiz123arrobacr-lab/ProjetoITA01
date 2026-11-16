import { TRPCError } from "@trpc/server";
import { supabaseAdmin } from "./_core/supabaseAdmin.js";

export async function revokeAdminAccess(
  actorId: string,
  accessId: string,
  targetUserId?: string
) {
  const { data, error } = await supabaseAdmin.rpc("vet_revoke_admin_access", {
    p_actor: actorId,
    p_access_id: accessId,
    p_target_user: targetUserId ?? null,
  });
  if (error) {
    if (error.code === "42501")
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Acesso administrativo necessário.",
      });
    if (error.code === "P0002")
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Acesso administrativo não encontrado.",
      });
    if (error.message === "LAST_ADMIN")
      throw new TRPCError({
        code: "CONFLICT",
        message: "Não é possível remover o último administrador.",
      });
    if (error.code === "22023")
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "O acesso não corresponde ao usuário informado.",
      });
    // No fallback to separate writes: missing migration/provider failure is not success.
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "Não foi possível confirmar a revogação. Tente novamente.",
    });
  }
  if (!data || typeof data.userId !== "string" || data.role !== "student")
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "A revogação não pôde ser confirmada.",
    });
  return {
    success: true as const,
    userId: data.userId,
    role: "student" as const,
  };
}
