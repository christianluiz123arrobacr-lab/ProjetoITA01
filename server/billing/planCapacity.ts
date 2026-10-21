import { TRPCError } from "@trpc/server";
import { supabaseAdmin } from "../_core/supabaseAdmin.js";

export async function loadPlanCapacity() {
  const { data, error } = await supabaseAdmin.rpc("billing_plan_capacity");
  if (error)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Não foi possível consultar as vagas dos planos.",
    });
  return new Map<string, any>(
    (data ?? []).map((row: any) => [String(row.plan_id), row])
  );
}
