import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { LEGAL_DOCUMENT_VERSIONS, LEGAL_RESPONSIBLE_FALLBACK } from "../../shared/legalDocuments.js";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc.js";
import { supabaseAdmin } from "../_core/supabaseAdmin.js";

function configuredValue(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function configuredContactEmail() {
  const value = configuredValue(process.env.LEGAL_CONTACT_EMAIL);
  return value && z.string().email().safeParse(value).success ? value : null;
}

export function isWhatsAppConsentAvailable() {
  return process.env.WHATSAPP_REMINDERS_ENABLED === "true" &&
    Boolean(process.env.WHATSAPP_ACCESS_TOKEN?.trim()) &&
    Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID?.trim());
}

export function getPublicLegalConfig() {
  const responsibleName = configuredValue(process.env.LEGAL_RESPONSIBLE_NAME);
  return {
    versions: LEGAL_DOCUMENT_VERSIONS,
    responsibleName: responsibleName ?? LEGAL_RESPONSIBLE_FALLBACK,
    responsibleNameConfigured: Boolean(responsibleName),
    contactEmail: configuredContactEmail(),
    whatsappConsentAvailable: isWhatsAppConsentAvailable(),
  };
}

export async function recordLegalAcceptance(userId: string, source: "registration" | "existing_user_update") {
  const { error } = await supabaseAdmin.rpc("record_legal_acceptance", {
    p_user_id: userId,
    p_terms_version: LEGAL_DOCUMENT_VERSIONS.terms,
    p_privacy_version: LEGAL_DOCUMENT_VERSIONS.privacy,
    p_source: source,
  });
  if (error) throw new Error(error.message);
}

export async function recordWhatsAppConsent(userId: string, granted: boolean, source: "registration" | "profile_settings") {
  if (granted && !isWhatsAppConsentAvailable()) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A integração de WhatsApp ainda não está disponível." });
  }
  const { error } = await supabaseAdmin.rpc("record_whatsapp_consent", {
    p_user_id: userId,
    p_consent_version: LEGAL_DOCUMENT_VERSIONS.whatsappConsent,
    p_granted: granted,
    p_source: source,
  });
  if (error) throw new Error(error.message);
}

export const legalRouter = router({
  publicConfig: publicProcedure.query(() => getPublicLegalConfig()),
  acceptanceStatus: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role === "admin" || ctx.user.role === "editor") {
      return { required: false, acceptedAt: null };
    }
    const { data, error } = await supabaseAdmin
      .from("legal_document_acceptances")
      .select("accepted_at")
      .eq("user_id", ctx.user.id)
      .eq("terms_version", LEGAL_DOCUMENT_VERSIONS.terms)
      .eq("privacy_version", LEGAL_DOCUMENT_VERSIONS.privacy)
      .maybeSingle();
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível verificar o aceite dos termos." });
    return { required: !data, acceptedAt: data?.accepted_at ?? null };
  }),
  acceptCurrent: protectedProcedure
    .input(z.object({ accepted: z.literal(true) }))
    .mutation(async ({ ctx }) => {
      await recordLegalAcceptance(ctx.user.id, "existing_user_update");
      return { success: true } as const;
    }),
  setWhatsAppConsent: protectedProcedure
    .input(z.object({ granted: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await recordWhatsAppConsent(ctx.user.id, input.granted, "profile_settings");
      return { success: true, granted: input.granted } as const;
    }),
});
