import { supabaseAdmin } from "../_core/supabaseAdmin.js";
import { resolveEffectiveBillingAccess } from "./accessConsistency.js";

type ReminderType = "expires_in_2_days" | "expires_in_1_day" | "expired_today";
const templateEnv: Record<ReminderType, string> = {
  expires_in_2_days: "WHATSAPP_TEMPLATE_EXPIRES_2_DAYS",
  expires_in_1_day: "WHATSAPP_TEMPLATE_EXPIRES_1_DAY",
  expired_today: "WHATSAPP_TEMPLATE_EXPIRED",
};

function dateKey(value: Date) { return value.toISOString().slice(0, 10); }
function addDays(date: Date, days: number) { const next = new Date(date); next.setUTCDate(next.getUTCDate() + days); return next; }
function normalizePhone(value: string | null | undefined) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return null;
  return digits.startsWith("55") ? digits : `55${digits}`;
}
export function reminderForDueDate(due: Date, now: Date): ReminderType | null {
  const difference = Math.round((Date.parse(dateKey(due)) - Date.parse(dateKey(now))) / 86_400_000);
  if (difference === 2) return "expires_in_2_days";
  if (difference === 1) return "expires_in_1_day";
  if (difference === 0) return "expired_today";
  return null;
}

export function isWhatsAppRemindersEnabled() { return process.env.WHATSAPP_REMINDERS_ENABLED === "true"; }

async function sendTemplate(input: { phone: string; template: string; name: string; dueDate: string; link: string }) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) throw new Error("Integração WhatsApp não configurada.");
  const version = process.env.WHATSAPP_GRAPH_API_VERSION || "v22.0";
  const response = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: input.phone, type: "template", template: {
      name: input.template, language: { code: "pt_BR" }, components: [{ type: "body", parameters: [
        { type: "text", text: input.name }, { type: "text", text: input.dueDate }, { type: "text", text: input.link },
      ] }],
    } }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error("WhatsApp Cloud API recusou o envio.");
  return String(data?.messages?.[0]?.id ?? "");
}

export async function runBillingReminderJob(now = new Date()) {
  const [{ data: profiles, error: profilesError }, { data: subscriptions, error: subscriptionsError }, { data: payments, error: paymentsError }] = await Promise.all([
    supabaseAdmin.from("profiles").select("id,nome,telefone,billing_whatsapp_opt_in").eq("billing_whatsapp_opt_in", true),
    supabaseAdmin.from("billing_subscriptions").select("id,user_id,status,current_period_end,updated_at,created_at,canonical_access_subscription_id"),
    supabaseAdmin.from("billing_payments").select("user_id,status,access_applied_at,subscription_id,original_subscription_id,applied_to_subscription_id"),
  ]);
  if (profilesError || subscriptionsError || paymentsError) throw new Error(profilesError?.message || subscriptionsError?.message || paymentsError?.message);
  const { effectiveByUser } = resolveEffectiveBillingAccess(subscriptions ?? [], payments ?? [], now);
  const subscriptionById = new Map((subscriptions ?? []).map((item: any) => [String(item.id), item]));
  const summary = { sent: 0, failed: 0, skipped: 0, dryRun: 0 };
  for (const profile of profiles ?? []) {
    const effective = effectiveByUser.get(String(profile.id));
    const subscription = effective?.subscriptionId ? subscriptionById.get(effective.subscriptionId) : null;
    if (!effective?.hasValidAccess || !subscription?.current_period_end) continue;
    const due = new Date(subscription.current_period_end);
    const type = reminderForDueDate(due, now);
    if (!type) continue;
    const phone = normalizePhone(profile.telefone);
    const dueDate = dateKey(due);
    const base = { user_id: profile.id, subscription_id: subscription.id, notification_type: type, due_date: dueDate, channel: "whatsapp" };
    if (!phone) {
      await supabaseAdmin.from("billing_notification_log").upsert({ ...base, status: "skipped", error_message: "Telefone inválido ou ausente." }, { onConflict: "user_id,notification_type,due_date,channel", ignoreDuplicates: true });
      summary.skipped++; continue;
    }
    const enabled = isWhatsAppRemindersEnabled();
    const template = process.env[templateEnv[type]];
    if (!enabled || !template) {
      await supabaseAdmin.from("billing_notification_log").upsert({ ...base, recipient_phone: phone, status: "skipped", error_message: enabled ? "Template WhatsApp não configurado." : "Modo simulação: envio não habilitado." }, { onConflict: "user_id,notification_type,due_date,channel", ignoreDuplicates: true });
      summary.dryRun++; continue;
    }
    const { data: claimed, error: claimError } = await supabaseAdmin.from("billing_notification_log").upsert({ ...base, recipient_phone: phone, status: "pending" }, { onConflict: "user_id,notification_type,due_date,channel", ignoreDuplicates: true }).select("id").maybeSingle();
    if (claimError || !claimed?.id) continue;
    try {
      const providerMessageId = await sendTemplate({ phone, template, name: profile.nome || "aluno", dueDate, link: `${process.env.APP_BASE_URL ?? ""}/planos` });
      await supabaseAdmin.from("billing_notification_log").update({ status: "sent", provider_message_id: providerMessageId || null, sent_at: new Date().toISOString(), error_message: null }).eq("id", claimed.id);
      summary.sent++;
    } catch {
      await supabaseAdmin.from("billing_notification_log").update({ status: "failed", error_message: "Falha ao enviar pela WhatsApp Cloud API." }).eq("id", claimed.id);
      summary.failed++;
    }
  }
  return { ...summary, enabled: isWhatsAppRemindersEnabled() };
}

/** Admin-only retry; it never changes access and only sends an already logged reminder. */
export async function retryBillingReminder(notificationId: string) {
  const { data: log, error } = await supabaseAdmin.from("billing_notification_log")
    .select("id,user_id,notification_type,due_date,recipient_phone,profiles(nome)").eq("id", notificationId).maybeSingle();
  if (error || !log?.id) throw new Error(error?.message || "Aviso não encontrado.");
  if (!isWhatsAppRemindersEnabled()) throw new Error("WhatsApp está em modo simulação; reenvio não disponível.");
  const type = log.notification_type as ReminderType;
  const template = templateEnv[type] ? process.env[templateEnv[type]] : null;
  if (!template || !log.recipient_phone) throw new Error("Aviso sem template ou telefone válido.");
  try {
    const providerMessageId = await sendTemplate({ phone: log.recipient_phone, template, name: (log.profiles as any)?.nome || "aluno", dueDate: log.due_date, link: `${process.env.APP_BASE_URL ?? ""}/planos` });
    await supabaseAdmin.from("billing_notification_log").update({ status: "sent", provider_message_id: providerMessageId || null, error_message: null, sent_at: new Date().toISOString() }).eq("id", notificationId);
    return { success: true };
  } catch {
    await supabaseAdmin.from("billing_notification_log").update({ status: "failed", error_message: "Falha ao reenviar pela WhatsApp Cloud API." }).eq("id", notificationId);
    throw new Error("Falha ao reenviar aviso.");
  }
}
