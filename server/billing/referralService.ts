import { assertRateLimit } from "../_core/rateLimit.js";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { supabaseAdmin } from "../_core/supabaseAdmin.js";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc.js";
import { referralCampaignSchema } from "../../shared/referralProgram.js";

export async function referralRpc(name: string, args: Record<string, unknown>) {
  const { data, error } = await supabaseAdmin.rpc(name, args);
  if (error)
    throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
  return data;
}

type ReferralAttributionResult = {
  status: "queued" | "attached" | "rejected" | "missing" | "pending";
  reason?: string;
  referral_id?: string;
};

function attributionResult(value: unknown): ReferralAttributionResult {
  if (!value || typeof value !== "object" || !("status" in value))
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "A atribuição da indicação retornou uma resposta inválida.",
    });
  return value as ReferralAttributionResult;
}

export async function registerReferralAttribution(userId: string, code?: string) {
  if (!code) return { status: "missing" } as const;
  await assertRateLimit({
    key: `referral:attach:${userId}`,
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  const queued = attributionResult(
    await referralRpc("referral_queue_attribution", {
      p_user: userId,
      p_code: code,
    })
  );
  if (queued.status === "rejected") return queued;
  try {
    return attributionResult(
      await referralRpc("referral_finalize_attribution", { p_user: userId })
    );
  } catch {
    // The queue RPC committed first, so a later authenticated request can
    // finalize this attribution without the browser hint.
    return { status: "pending" } as const;
  }
}

export async function finalizePendingReferral(userId: string) {
  return attributionResult(
    await referralRpc("referral_finalize_attribution", { p_user: userId })
  );
}

export async function getReferralPricingPreview(userId: string) {
  await finalizePendingReferral(userId);
  return referralRpc("referral_pricing_preview", { p_user: userId });
}
export const referralCodeSchema = z
  .string()
  .regex(/^[a-f0-9]{32}$/)
  .optional();

export const referralRouter = router({
  mine: protectedProcedure.query(async ({ ctx }) => {
    const { error } = await supabaseAdmin
      .from("referral_codes")
      .upsert(
        { user_id: ctx.user.id, code: randomBytes(16).toString("hex") },
        { onConflict: "user_id", ignoreDuplicates: true }
      );
    if (error)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Não foi possível gerar o link de indicação.",
      });
    return referralRpc("referral_dashboard", {
      p_user: ctx.user.id,
      p_admin: false,
    });
  }),
  pricingPreview: protectedProcedure.query(({ ctx }) =>
    getReferralPricingPreview(ctx.user.id)
  ),
  admin: adminProcedure.query(({ ctx }) =>
    referralRpc("referral_dashboard", { p_user: ctx.user.id, p_admin: true })
  ),
  save: adminProcedure
    .input(referralCampaignSchema)
    .mutation(async ({ ctx, input }) => {
      await referralRpc("referral_save_campaign", {
        p_actor: ctx.user.id,
        p_config: input,
      });
      return { success: true };
    }),
});
