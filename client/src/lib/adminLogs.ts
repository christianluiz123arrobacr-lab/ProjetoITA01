import { supabase } from "@/lib/supabase";

type LogLevel = "info" | "warning" | "error";

type LogAdminActionParams = {
  actorUserId?: string | null;
  actorEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  description: string;
  level?: LogLevel;
  metadata?: Record<string, unknown> | null;
};

export async function logAdminAction({
  actorUserId = null,
  actorEmail = null,
  action,
  entityType,
  entityId = null,
  description,
  level = "info",
  metadata = null,
}: LogAdminActionParams) {
  try {
    const { error } = await supabase.from("admin_logs").insert({
      actor_user_id: actorUserId,
      actor_email: actorEmail,
      action,
      entity_type: entityType,
      entity_id: entityId,
      description,
      level,
      metadata: metadata ?? {},
    });

    if (error) {
      console.error("Erro ao gravar admin log:", error);
    }
  } catch (err) {
    console.error("Erro inesperado ao gravar admin log:", err);
  }
}
