import { TRPCError } from "@trpc/server";
import { adminProcedure, router } from "../_core/trpc.js";
import { supabaseAdmin } from "../_core/supabaseAdmin.js";
import { readAllDatabaseRows } from "../_core/databaseRead.js";
import { PLAN_MONTHS, calculateDurationPrice, durationConfigSchema } from "../../shared/planDurations.js";

type Plan = { id: string; name: string; slug: string; price_cents: number; currency: string | null };
type Setting = { plan_id: string; months: number; enabled: boolean; discount_bps: number; revision: number };

export const planDurationsRouter = router({
  list: adminProcedure.query(async () => {
    const plans = await readAllDatabaseRows<Plan>((from, to) => supabaseAdmin.from("billing_plans")
      .select("id, name, slug, price_cents, currency").order("id").range(from, to), "duration_plans");
    const settings = await readAllDatabaseRows<Setting>((from, to) => supabaseAdmin.from("billing_plan_durations")
      .select("plan_id, months, enabled, discount_bps, revision").order("plan_id").order("months").range(from, to), "duration_settings");
    return plans.map(plan => ({
      ...plan,
      checkoutActive: true as const,
      durations: PLAN_MONTHS.map(months => {
        const saved = settings.find(row => row.plan_id === plan.id && row.months === months);
        const discountBps = saved?.discount_bps ?? (months === 6 ? 500 : 0);
        return { months, enabled: saved?.enabled ?? (months <= 3), discountBps, revision: saved?.revision ?? 0,
          price: plan.price_cents > 0 ? calculateDurationPrice(plan.price_cents, months, discountBps) : null };
      }),
    }));
  }),
  save: adminProcedure.input(durationConfigSchema).mutation(async ({ ctx, input }) => {
    const { data, error } = await supabaseAdmin.rpc("save_billing_plan_duration", {
      p_actor: ctx.user.id, p_plan: input.planId, p_months: input.months,
      p_enabled: input.enabled, p_discount_bps: input.discountBps, p_expected_revision: input.expectedRevision,
    });
    if (error) throw new TRPCError({ code: error.code === "40001" ? "CONFLICT" : "BAD_REQUEST",
      message: error.code === "40001" ? "Configuração alterada em outra sessão. Atualize e tente novamente." : "Não foi possível salvar a duração. Verifique a configuração e a migration." });
    if (!data) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Configuração não confirmada." });
    return { success: true };
  }),
});
