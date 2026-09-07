import { z } from "zod";
const placeholders = new Set([
  "nome",
  "link",
  "beneficio_indicado",
  "recompensa_indicador",
  "meta_indicacoes",
]);
export const referralCampaignSchema = z
  .object({
    enabled: z.boolean(),
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().min(1).max(3000),
    goal: z.number().int().min(1).max(1000),
    reward_days: z.number().int().min(1).max(3650),
    benefit: z.enum(["none", "percent", "fixed", "days"]),
    discount: z.number().int().min(0).max(10000000),
    extra_days: z.number().int().min(0).max(3650),
    starts_at: z.string().datetime({ offset: true }).nullable(),
    ends_at: z.string().datetime({ offset: true }).nullable(),
    max_rewards: z.number().int().min(1).max(100000).nullable(),
    allow_stacking: z.boolean(),
    whatsapp_label: z.string().trim().min(1).max(100),
    whatsapp_message: z
      .string()
      .trim()
      .min(1)
      .max(2000)
      .refine(
        text =>
          Array.from(text.matchAll(/\{([^{}]*)\}/g)).every(match =>
            placeholders.has(match[1])
          ),
        "Placeholder não permitido."
      ),
  })
  .superRefine((value, ctx) => {
    if (value.benefit === "percent" && value.discount > 90)
      ctx.addIssue({
        code: "custom",
        path: ["discount"],
        message: "Percentual deve estar entre 0 e 90.",
      });
    if (
      value.starts_at &&
      value.ends_at &&
      Date.parse(value.starts_at) >= Date.parse(value.ends_at)
    )
      ctx.addIssue({
        code: "custom",
        path: ["ends_at"],
        message: "Fim deve ser posterior ao início.",
      });
    if (value.benefit === "days" && value.extra_days === 0)
      ctx.addIssue({
        code: "custom",
        path: ["extra_days"],
        message: "Informe a quantidade de dias extras.",
      });
  });
export type ReferralCampaignConfig = z.infer<typeof referralCampaignSchema>;
export const defaultReferralCampaign: ReferralCampaignConfig = {
  enabled: false,
  title: "Indique e Ganhe",
  description:
    "Convide amigos e ganhe tempo de acesso após a confirmação do pagamento deles.",
  goal: 3,
  reward_days: 30,
  benefit: "none",
  discount: 0,
  extra_days: 0,
  starts_at: null,
  ends_at: null,
  max_rewards: null,
  allow_stacking: false,
  whatsapp_label: "Compartilhar no WhatsApp",
  whatsapp_message:
    "Olá! Conheça o Projeto Vetor pelo meu link: {link}. {beneficio_indicado}",
};
export function referralBenefitText(c: ReferralCampaignConfig) {
  return c.benefit === "percent"
    ? `${c.discount}% de desconto no primeiro pagamento elegível.`
    : c.benefit === "fixed"
      ? `${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(c.discount / 100)} de desconto no primeiro pagamento elegível.`
      : c.benefit === "days"
        ? `${c.extra_days} dias extras de acesso após o pagamento aprovado.`
        : "Conheça os recursos da plataforma.";
}
export function referralShareMessage(
  c: ReferralCampaignConfig,
  name: string,
  link: string
) {
  const values: Record<string, string> = {
    nome: name,
    link,
    beneficio_indicado: referralBenefitText(c),
    recompensa_indicador: `${c.reward_days} dias de acesso`,
    meta_indicacoes: String(c.goal),
  };
  return c.whatsapp_message.replace(
    /\{([^{}]*)\}/g,
    (match, key) => values[key] ?? match
  );
}
