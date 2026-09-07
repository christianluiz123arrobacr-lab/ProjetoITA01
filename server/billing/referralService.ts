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
export async function attachReferral(userId: string, code?: string) {
  if (!code) return;
  await assertRateLimit({
    key: `referral:attach:${userId}`,
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  await referralRpc("referral_attach", { p_user: userId, p_code: code });
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
  attach: protectedProcedure
    .input(z.object({ code: referralCodeSchema }))
    .mutation(({ ctx, input }) => attachReferral(ctx.user.id, input.code)),
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
