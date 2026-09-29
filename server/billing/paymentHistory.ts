import { TRPCError } from "@trpc/server";
import { supabaseAdmin } from "../_core/supabaseAdmin.js";

// Financial history deliberately has no dependency on the current subscription.
export async function getPaymentHistory(userId: string, page = 0) {
  const pageSize = 20;
  const { data, count, error } = await supabaseAdmin
    .from("billing_payments")
    .select(
      "id, plan_id, amount_cents, currency, payment_method, status, created_at, approved_at, access_duration_value, access_duration_unit, billing_plans(name)",
      { count: "exact" }
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);
  if (error)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Não foi possível carregar o histórico de pagamentos.",
    });
  return { items: data ?? [], total: count ?? 0, page, pageSize };
}
