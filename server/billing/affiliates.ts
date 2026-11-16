import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc.js";
import { supabaseAdmin } from "../_core/supabaseAdmin.js";
import { readAllDatabaseRows } from "../_core/databaseRead.js";
import {
  affiliateCouponSchema,
  affiliatePayoutSchema,
  affiliateProfileSchema,
  couponCodeSchema,
} from "../../shared/affiliates.js";
import { planMonthsSchema } from "../../shared/planDurations.js";

export function couponQuoteMessage(message: string) {
  const messages: Record<string,string> = {
    "Affiliate checkout disabled": "Programa de cupons indisponível no momento.",
    "Affiliate coupon cannot combine with referral attribution": "Esta conta possui indicação vinculada. Cupom e indicação não podem ser combinados.",
    "Invalid or unavailable coupon": "Cupom inexistente, inativo ou fora da validade, ou vínculo de afiliado indisponível.",
    "Coupon not eligible for plan": "Este cupom não se aplica ao plano selecionado.",
    "Coupon limit reached": "Este cupom atingiu o limite de usos ou reservas.",
    "Duration disabled": "O período selecionado está indisponível.",
    "Invalid plan or duration": "Plano ou período indisponível.",
    "Founder eligibility required": "Esta conta não é elegível para o plano fundador.",
  };
  return messages[message] ?? "Não foi possível validar o cupom. Tente novamente em instantes.";
}
export async function affiliateRpc(
  name: string,
  args: Record<string, unknown>
) {
  const { data, error } = await supabaseAdmin.rpc(name, args);
  if (error)
    throw new TRPCError({
      code:
        error.code === "42501"
          ? "FORBIDDEN"
          : error.code === "P0001"
            ? "BAD_REQUEST"
            : "SERVICE_UNAVAILABLE",
      message:
        name === "affiliate_coupon_quote" && error.code === "P0001" ? couponQuoteMessage(error.message) :
        error.code === "42501"
          ? "Acesso não autorizado."
          : "Não foi possível confirmar a operação de afiliados. Confira os dados, saldo e permissões; em caso de resposta perdida, repita com a mesma chave.",
    });
  if (
    name !== "affiliate_reconcile_payment" &&
    (!data || typeof data !== "object")
  )
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message:
        "A operação não retornou confirmação. Preserve a chave e consulte novamente.",
    });
  return data;
}
const rangeSchema = z
  .object({
    subjectUserId: z.string().uuid().optional(),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    page: z.number().int().min(0).max(100000).default(0),
  })
  .strict();
export const affiliatesRouter = router({
  searchAccounts: adminProcedure
    .input(
      z
        .object({
          search: z
            .string()
            .trim()
            .min(2)
            .max(80)
            .regex(/^[A-Za-z0-9À-ÿ@. +_-]+$/),
        })
        .strict()
    )
    .query(async ({ input }) => {
      const pattern = `%${input.search.replace(/[%_\\]/g, "\\$&")}%`;
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("id,nome,email,ativo")
        .or(`nome.ilike.${pattern},email.ilike.${pattern}`)
        .order("nome")
        .order("id")
        .limit(20);
      if (error)
        throw new TRPCError({
          code: "SERVICE_UNAVAILABLE",
          message: "Não foi possível buscar contas.",
        });
      return data ?? [];
    }),
  planOptions: adminProcedure.query(() =>
    readAllDatabaseRows<{ id: string; name: string; is_active: boolean }>(
      (from, to) =>
        supabaseAdmin
          .from("billing_plans")
          .select("id,name,is_active")
          .order("name")
          .order("id")
          .range(from, to),
      "affiliate_plan_options"
    )
  ),
  preview: protectedProcedure
    .input(
      z
        .object({
          planSlug: z.string().min(1).max(120),
          months: planMonthsSchema,
          code: couponCodeSchema,
        })
        .strict()
    )
    .mutation(({ ctx, input }) =>
      affiliateRpc("affiliate_coupon_quote", {
        p_user: ctx.user.id,
        p_slug: input.planSlug,
        p_months: input.months,
        p_code: input.code,
        p_backend_enabled: process.env.AFFILIATE_CHECKOUT_ENABLED === "true",
      })
    ),
  dashboard: protectedProcedure.input(rangeSchema).query(({ ctx, input }) =>
    affiliateRpc("affiliate_dashboard", {
      p_actor: ctx.user.id,
      p_subject: input.subjectUserId ?? null,
      p_from: input.from,
      p_until: input.until,
      p_page: input.page,
    })
  ),
  panelAccess: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role === "admin") return true;
    const { data, error } = await supabaseAdmin
      .from("affiliate_profiles")
      .select("id")
      .eq("user_id", ctx.user.id)
      .maybeSingle();
    if (error)
      throw new TRPCError({
        code: "SERVICE_UNAVAILABLE",
        message: "Não foi possível confirmar o acesso ao painel do afiliado.",
      });
    return Boolean(data);
  }),
  saveProfile: adminProcedure
    .input(affiliateProfileSchema)
    .mutation(({ ctx, input }) =>
      affiliateRpc("affiliate_admin_write", {
        p_actor: ctx.user.id,
        p_kind: "profile",
        p_payload: input,
      })
    ),
  saveCoupon: adminProcedure
    .input(affiliateCouponSchema)
    .mutation(({ ctx, input }) =>
      affiliateRpc("affiliate_admin_write", {
        p_actor: ctx.user.id,
        p_kind: "coupon",
        p_payload: input,
      })
    ),
  saveSettings: adminProcedure
    .input(z.object({ payoutDay: z.number().int().min(1).max(31) }).strict())
    .mutation(({ ctx, input }) =>
      affiliateRpc("affiliate_admin_write", {
        p_actor: ctx.user.id,
        p_kind: "settings",
        p_payload: input,
      })
    ),
  release: adminProcedure
    .input(z.object({ paymentId: z.string().uuid() }).strict())
    .mutation(({ ctx, input }) =>
      affiliateRpc("affiliate_admin_write", {
        p_actor: ctx.user.id,
        p_kind: "release",
        p_payload: input,
      })
    ),
  payout: adminProcedure
    .input(affiliatePayoutSchema)
    .mutation(({ ctx, input }) =>
      affiliateRpc("affiliate_admin_write", {
        p_actor: ctx.user.id,
        p_kind: "payout",
        p_payload: input,
      })
    ),
});
