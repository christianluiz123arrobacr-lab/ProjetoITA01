import { FormEvent, useEffect, useMemo, useState } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  CreditCard,
  Edit3,
  Gift,
  Loader2,
  RefreshCw,
  RotateCcw,
  Save,
  Settings2,
  Trash2,
  UserPlus,
  XCircle,
} from "lucide-react";
import {
  formatPriceFromCents,
  formatSubscriptionStatus,
  type BillingSubscriptionStatus,
} from "@/types/billing";

type AdminBillingSubscriptionRow = {
  subscription_id: string;
  user_id: string;
  user_name: string;
  user_email: string;

  plan_id: string;
  plan_slug: string;
  plan_name: string;
  plan_price_cents: number;

  status: string;
  gateway: string;
  gateway_subscription_id?: string | null;
  gateway_payment_id?: string | null;
  last_gateway_status?: string | null;
  gateway_reconciliation_status?: string | null;
  gateway_reconciliation_error?: string | null;
  gateway_reconciliation_attempts?: number;
  gateway_reconciliation_last_attempt_at?: string | null;
  recurring_state?: string | null;
  recurring_slot_active?: boolean | null;
  canonical_access_subscription_id?: string | null;
  cancel_at_period_end?: boolean | null;
  metadata?: Record<string, unknown> | null;
  payment_url: string | null;

  started_at: string | null;
  current_period_end: string | null;
  next_due_date: string | null;

  created_at: string;
  updated_at: string;
  effective_subscription_id: string | null;
  is_effective_subscription: boolean;
  has_valid_access: boolean;
  is_historical_subscription: boolean;
};

type InviteRow = {
  invite_id: string;
  plan_id: string;
  plan_slug: string;
  plan_name: string;
  plan_price_cents: number;
  email: string | null;
  user_id: string | null;
  invite_code: string | null;
  used_at: string | null;
  expires_at: string | null;
  created_at: string;
};

type AdminBillingPlanRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string | null;
  billing_cycle: string | null;
  is_active: boolean;
  is_public: boolean;
  requires_legacy_founder_eligibility: boolean;
  display_order: number;
  max_active_subscriptions: number | null;
  active_subscriptions_count: number;
  manual_review_count: number;
  used_slots: number;
  remaining_slots: number | null;
  has_available_slots: boolean;
};

type AdminBillingPaymentRow = {
  id: string;
  subscription_id: string | null;
  user_id: string;
  gateway: string;
  gateway_payment_id: string | null;
  payment_method: string;
  status: string;
  amount_cents: number;
  currency: string;
  access_applied_at: string | null;
  gateway_reconciliation_error: string | null;
  created_at: string;
};

type PlanFormState = {
  name: string;
  description: string;
  price: string;
  maxActiveSubscriptions: string;
  isActive: boolean;
  isPublic: boolean;
  displayOrder: string;
};

function isMercadoPagoCardSubscription(subscription: Pick<AdminBillingSubscriptionRow, "gateway" | "metadata">) {
  return subscription.gateway === "mercadopago" && subscription.metadata?.payment_method === "card";
}

type StatusFilter =
  | "all"
  | "pending"
  | "manual_review"
  | "active"
  | "overdue"
  | "expired"
  | "canceled"
  | "failed"
  | "reconciliation";
type AdminBillingTab = "subscriptions" | "payments" | "plans" | "invites";

function formatDate(date?: string | null) {
  if (!date) return "Sem data";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Sem data";
  }

  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case "manual_review":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "active":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "overdue":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "expired":
      return "bg-red-50 text-red-700 border-red-200";
    case "canceled":
      return "bg-slate-100 text-slate-600 border-slate-200";
    case "failed":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-blue-50 text-blue-700 border-blue-200";
  }
}

function centsToPriceInput(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function priceInputToCents(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".").trim();
  const parsed = Number.parseFloat(normalized);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.round(parsed * 100);
}

function buildPlanForm(plan: AdminBillingPlanRow): PlanFormState {
  return {
    name: plan.name ?? "",
    description: plan.description ?? "",
    price: centsToPriceInput(plan.price_cents ?? 0),
    maxActiveSubscriptions:
      plan.max_active_subscriptions == null
        ? ""
        : String(plan.max_active_subscriptions),
    isActive: Boolean(plan.is_active),
    isPublic: Boolean(plan.is_public),
    displayOrder: String(plan.display_order ?? 100),
  };
}

export default function AdminBillingPage() {
  const listBillingSubscriptionsQuery = trpc.admin.listBillingSubscriptions.useQuery(undefined, { enabled: false });
  const listBillingPlansQuery = trpc.admin.listBillingPlans.useQuery(undefined, { enabled: false });
  const listBillingPlanInvitesQuery = trpc.admin.listBillingPlanInvites.useQuery(undefined, { enabled: false });
  const listBillingPaymentsQuery = trpc.admin.listBillingPayments.useQuery(undefined, { enabled: false });
  const renewBillingSubscriptionMutation = trpc.admin.renewBillingSubscription.useMutation();
  const cancelBillingSubscriptionMutation = trpc.admin.cancelBillingSubscription.useMutation();
  const cancelMercadoPagoSubscriptionNowMutation = trpc.admin.cancelMercadoPagoSubscriptionNow.useMutation();
  const reconcileMercadoPagoDuplicatesMutation = trpc.admin.reconcileMercadoPagoDuplicates.useMutation();
  const reconcileMercadoPagoPaymentMutation = trpc.admin.reconcileMercadoPagoPayment.useMutation();
  const updateBillingPlanMutation = trpc.admin.updateBillingPlan.useMutation();
  const createBillingPlanInviteMutation = trpc.admin.createBillingPlanInvite.useMutation();
  const deleteBillingPlanInviteMutation = trpc.admin.deleteBillingPlanInvite.useMutation();

  const [activeTab, setActiveTab] = useState<AdminBillingTab>("subscriptions");

  const [subscriptions, setSubscriptions] = useState<
    AdminBillingSubscriptionRow[]
  >([]);

  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [payments, setPayments] = useState<AdminBillingPaymentRow[]>([]);
  const [plans, setPlans] = useState<AdminBillingPlanRow[]>([]);
  const [planForms, setPlanForms] = useState<Record<string, PlanFormState>>({});

  const [selectedPlanSlug, setSelectedPlanSlug] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creatingInvite, setCreatingInvite] = useState(false);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null);
  const [deletingInviteId, setDeletingInviteId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filteredSubscriptions = useMemo(() => {
    if (statusFilter === "all") return subscriptions;
    if (statusFilter === "reconciliation") {
      return subscriptions.filter((subscription) => Boolean(subscription.gateway_reconciliation_status));
    }

    return subscriptions.filter(
      (subscription) => subscription.status === statusFilter
    );
  }, [subscriptions, statusFilter]);

  const subscriptionStats = useMemo(() => {
    return {
      total: subscriptions.length,
      pending: subscriptions.filter((item) => item.status === "pending").length,
      manualReview: subscriptions.filter((item) => item.status === "manual_review")
        .length,
      studentsWithActiveAccess: new Set(subscriptions.filter((item) => item.has_valid_access).map((item) => item.user_id)).size,
      activeRecords: subscriptions.filter((item) => item.status === "active" || item.status === "trialing").length,
      historical: subscriptions.filter((item) => item.is_historical_subscription).length,
      expired: subscriptions.filter((item) => item.status === "expired").length,
      canceled: subscriptions.filter((item) => item.status === "canceled").length,
      reconciliation: subscriptions.filter((item) => Boolean(item.gateway_reconciliation_status)).length,
    };
  }, [subscriptions]);

  const inviteStats = useMemo(() => {
    return {
      total: invites.length,
      available: invites.filter((invite) => !invite.used_at).length,
      used: invites.filter((invite) => Boolean(invite.used_at)).length,
    };
  }, [invites]);

  const planStats = useMemo(() => {
    return {
      total: plans.length,
      active: plans.filter((plan) => plan.is_active).length,
      limited: plans.filter((plan) => plan.max_active_subscriptions != null).length,
    };
  }, [plans]);

  async function loadSubscriptionsData() {
    const result = await listBillingSubscriptionsQuery.refetch();

    if (result.error) {
      throw new Error(result.error.message || "Não foi possível carregar as assinaturas.");
    }

    setSubscriptions((result.data ?? []) as AdminBillingSubscriptionRow[]);
  }

  async function loadPlansData() {
    const result = await listBillingPlansQuery.refetch();

    if (result.error) {
      throw new Error(result.error.message || "Não foi possível carregar os planos.");
    }

    const mapped = (result.data ?? []) as AdminBillingPlanRow[];
    setPlans(mapped);
    setPlanForms(
      Object.fromEntries(mapped.map((plan) => [plan.id, buildPlanForm(plan)]))
    );
    setSelectedPlanSlug((current) => current || mapped[0]?.slug || "");
  }

  async function loadInvitesData() {
    const result = await listBillingPlanInvitesQuery.refetch();

    if (result.error) {
      throw new Error(result.error.message || "Não foi possível carregar os convites.");
    }

    setInvites((result.data ?? []) as InviteRow[]);
  }

  async function loadPaymentsData() {
    const result = await listBillingPaymentsQuery.refetch();
    if (result.error) throw new Error(result.error.message || "Não foi possível carregar os pagamentos.");
    setPayments((result.data ?? []) as AdminBillingPaymentRow[]);
  }

  async function loadAllData() {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        loadSubscriptionsData(),
        loadPlansData(),
        loadInvitesData(),
        loadPaymentsData(),
      ]);
    } catch (err) {
      console.error("Erro ao carregar dados de assinaturas:", err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro inesperado ao carregar os dados.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function refreshActiveTab() {
    try {
      setRefreshing(true);
      setError("");

      if (activeTab === "subscriptions") {
        await loadSubscriptionsData();
      } else if (activeTab === "payments") {
        await Promise.all([loadPaymentsData(), loadSubscriptionsData()]);
      } else if (activeTab === "plans") {
        await loadPlansData();
      } else {
        await Promise.all([loadInvitesData(), loadPlansData()]);
      }
    } catch (err) {
      console.error("Erro ao atualizar dados:", err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro inesperado ao atualizar os dados.");
      }
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAllData();
  }, []);

  async function renewSubscription(subscriptionId: string, label = "renovar") {
    const confirmed = window.confirm(
      label === "aprovar"
        ? "Aprovar esta assinatura e liberar 1 mês de acesso?"
        : "Renovar esta assinatura por mais 1 mês?"
    );

    if (!confirmed) return;

    try {
      setActionLoadingId(subscriptionId);
      setError("");
      setSuccess("");

      await renewBillingSubscriptionMutation.mutateAsync({
        subscriptionId,
        months: 1,
      });

      setSuccess(
        label === "aprovar"
          ? "Assinatura aprovada com sucesso."
          : "Assinatura renovada com sucesso."
      );
      await loadSubscriptionsData();
    } catch (err) {
      console.error("Erro inesperado ao renovar assinatura:", err);
      setError("Ocorreu um erro inesperado ao renovar a assinatura.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function cancelSubscription(subscription: AdminBillingSubscriptionRow) {
    const recurringCard = isMercadoPagoCardSubscription(subscription);
    const confirmed = window.confirm(
      recurringCard
        ? "Cancelar agora a recorrência no Mercado Pago? Esta ação administrativa é imediata e impede novas cobranças."
        : "Cancelar esta assinatura agora? O acesso pago será bloqueado imediatamente."
    );

    if (!confirmed) return;

    try {
      setActionLoadingId(subscription.subscription_id);
      setError("");
      setSuccess("");

      if (recurringCard) {
        const result = await cancelMercadoPagoSubscriptionNowMutation.mutateAsync({ subscriptionId: subscription.subscription_id });
        if (result.outcome !== "success") {
          setError(`Cancelamento ${result.outcome}: ${result.failures.length} cobrança(s) ainda exigem reconciliação.`);
          await loadSubscriptionsData();
          return;
        }
      } else {
        await cancelBillingSubscriptionMutation.mutateAsync({ subscriptionId: subscription.subscription_id });
      }

      setSuccess(recurringCard ? "Recorrência Mercado Pago cancelada no gateway e no sistema." : "Assinatura cancelada com sucesso.");
      await loadSubscriptionsData();
    } catch (err) {
      console.error("Erro inesperado ao cancelar assinatura:", err);
      setError(err instanceof Error ? err.message : "Ocorreu um erro inesperado ao cancelar a assinatura.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function reconcileSubscription(subscription: AdminBillingSubscriptionRow) {
    if (!window.confirm("Consultar o Mercado Pago e cancelar esta recorrência duplicada? A ação é idempotente e não altera preços.")) return;
    try {
      setActionLoadingId(subscription.subscription_id);
      setError("");
      setSuccess("");
      const result = await reconcileMercadoPagoDuplicatesMutation.mutateAsync({ subscriptionId: subscription.subscription_id, confirm: true });
      switch (result.outcome) {
        case "success":
          setSuccess(`Reconciliação confirmada: ${result.processed} recorrência(s) processada(s).`);
          break;
        case "partial":
          setError(`Reconciliação parcial: ${result.successes.length} sucesso(s) e ${result.failures.length} falha(s).`);
          break;
        case "failed":
          setError(`Reconciliação falhou para ${result.failures.length} recorrência(s). Nenhuma confirmação foi removida.`);
          break;
        case "no_action":
          setError(result.noActionReason || "Nenhuma ação de reconciliação foi realizada.");
          break;
      }
      await loadSubscriptionsData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao reconciliar recorrência.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function reconcilePayment(payment: AdminBillingPaymentRow) {
    if (!window.confirm("Consultar o status oficial deste pagamento no Mercado Pago? O acesso só será liberado se o gateway confirmar a aprovação.")) return;
    try {
      setActionLoadingId(payment.id);
      setError("");
      setSuccess("");
      const result = await reconcileMercadoPagoPaymentMutation.mutateAsync({ billingPaymentId: payment.id });
      if (result.paymentStatus === "approved" && result.accessApplied) setSuccess("Pagamento confirmado e acesso liberado.");
      else if (result.paymentStatus === "pending") setError("O Mercado Pago ainda não confirmou este pagamento.");
      else setError(result.message);
      await Promise.all([loadPaymentsData(), loadSubscriptionsData()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível verificar o pagamento no Mercado Pago.");
      await Promise.all([loadPaymentsData(), loadSubscriptionsData()]).catch(() => undefined);
    } finally {
      setActionLoadingId(null);
    }
  }

  function updatePlanForm(planId: string, patch: Partial<PlanFormState>) {
    setPlanForms((current) => ({
      ...current,
      [planId]: {
        ...current[planId],
        ...patch,
      },
    }));
  }

  async function savePlan(plan: AdminBillingPlanRow) {
    const form = planForms[plan.id];

    if (!form) return;

    const priceCents = priceInputToCents(form.price);

    if (priceCents == null) {
      setError("Informe um valor válido para o plano.");
      return;
    }

    const maxActiveSubscriptions = form.maxActiveSubscriptions.trim()
      ? Number.parseInt(form.maxActiveSubscriptions.trim(), 10)
      : null;

    if (
      maxActiveSubscriptions !== null &&
      (!Number.isFinite(maxActiveSubscriptions) || maxActiveSubscriptions < 0)
    ) {
      setError("Informe um limite válido ou deixe em branco para sem limite.");
      return;
    }

    try {
      setSavingPlanId(plan.id);
      setError("");
      setSuccess("");

      await updateBillingPlanMutation.mutateAsync({
        planId: plan.id,
        name: form.name.trim() || plan.name,
        description: form.description.trim() || null,
        priceCents,
        maxActiveSubscriptions,
        isActive: form.isActive,
        isPublic: form.isPublic,
        displayOrder: Math.max(0, Number.parseInt(form.displayOrder || "100", 10)),
        requiresLegacyFounderEligibility: plan.requires_legacy_founder_eligibility,
      });

      setSuccess("Plano atualizado com sucesso.");
      await loadPlansData();
    } catch (err) {
      console.error("Erro inesperado ao salvar plano:", err);
      const message = err instanceof Error ? err.message : "Não foi possível salvar o plano.";
      setError(`Não foi possível salvar o plano: ${message}`);
    } finally {
      setSavingPlanId(null);
    }
  }

  async function createInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = inviteEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Informe um e-mail.");
      return;
    }

    if (!selectedPlanSlug) {
      setError("Selecione um plano.");
      return;
    }

    try {
      setCreatingInvite(true);
      setError("");
      setSuccess("");

      await createBillingPlanInviteMutation.mutateAsync({
        planSlug: selectedPlanSlug,
        email: normalizedEmail,
        expiresAt: null,
      });

      setInviteEmail("");
      setSuccess("Convite criado com sucesso.");
      await loadInvitesData();
    } catch (err) {
      console.error("Erro inesperado ao criar convite:", err);
      setError("Ocorreu um erro inesperado ao criar o convite.");
    } finally {
      setCreatingInvite(false);
    }
  }

  async function deleteInvite(inviteId: string) {
    const confirmed = window.confirm("Remover este convite?");

    if (!confirmed) return;

    try {
      setDeletingInviteId(inviteId);
      setError("");
      setSuccess("");

      await deleteBillingPlanInviteMutation.mutateAsync({ inviteId });

      setSuccess("Convite removido com sucesso.");
      await loadInvitesData();
    } catch (err) {
      console.error("Erro inesperado ao remover convite:", err);
      setError("Ocorreu um erro inesperado ao remover o convite.");
    } finally {
      setDeletingInviteId(null);
    }
  }

  return (
    <AdminGuard allowedRoles={["admin"]}>
      <AdminLayout
        title="Assinaturas"
        subtitle="Gerencie planos, preços, limites de vagas, renovações manuais e solicitações de acesso."
      >
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="border-slate-200 p-5">
            <p className="text-sm text-slate-500">Solicitações</p>
            <p className="mt-2 text-3xl font-black text-slate-900">
              {subscriptionStats.total}
            </p>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50 p-5">
            <p className="text-sm text-yellow-700">Aguardando análise</p>
            <p className="mt-2 text-3xl font-black text-yellow-900">
              {subscriptionStats.manualReview}
            </p>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm text-emerald-700">Alunos com acesso ativo</p>
            <p className="mt-2 text-3xl font-black text-emerald-900">
              {subscriptionStats.studentsWithActiveAccess}
            </p>
          </Card>

          <Card className="border-blue-200 bg-blue-50 p-5">
            <p className="text-sm text-blue-700">Registros ativos</p>
            <p className="mt-2 text-3xl font-black text-blue-900">{subscriptionStats.activeRecords}</p>
          </Card>

          <Card className="border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-600">Registros históricos</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{subscriptionStats.historical}</p>
          </Card>

          <Card className="border-red-200 bg-red-50 p-5">
            <p className="text-sm text-red-700">Expiradas</p>
            <p className="mt-2 text-3xl font-black text-red-900">
              {subscriptionStats.expired}
            </p>
          </Card>

          <Card className="border-cyan-200 bg-cyan-50 p-5">
            <p className="text-sm text-cyan-700">Planos ativos</p>
            <p className="mt-2 text-3xl font-black text-cyan-900">
              {planStats.active}
            </p>
          </Card>
        </div>

        <Card className="border-slate-200 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Controle financeiro manual
              </h2>
              <p className="text-sm text-slate-500">
                Use esta tela para alterar preços, limites, aprovar pagamentos e renovar acessos enquanto a cobrança automática não estiver ativa.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={refreshActiveTab}
              disabled={loading || refreshing}
              className="gap-2"
            >
              {loading || refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Atualizar
            </Button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("subscriptions")}
              className={[
                "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
                activeTab === "subscriptions"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              <CreditCard className="h-4 w-4" />
              Assinaturas
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("payments")}
              className={[
                "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
                activeTab === "payments"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              <RefreshCw className="h-4 w-4" />
              Pagamentos Mercado Pago
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("plans")}
              className={[
                "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
                activeTab === "plans"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              <Settings2 className="h-4 w-4" />
              Configuração de planos
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("invites")}
              className={[
                "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
                activeTab === "invites"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              <Gift className="h-4 w-4" />
              Convites
            </button>
          </div>
        </Card>

        {error && (
          <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            {success}
          </div>
        )}

        {activeTab === "subscriptions" && (
          <>
            <Card className="border-slate-200 p-4">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  ["all", "Todas"],
                  ["pending", `Pendentes (${subscriptionStats.pending})`],
                  ["manual_review", "Em análise"],
                  ["active", "Ativas"],
                  ["overdue", "Em atraso"],
                  ["expired", "Expiradas"],
                  ["canceled", "Canceladas"],
                  ["reconciliation", `Reconciliação necessária (${subscriptionStats.reconciliation})`],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatusFilter(value as StatusFilter)}
                    className={[
                      "rounded-full border px-3 py-1.5 text-xs font-bold transition",
                      statusFilter === value
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Card>

            {loading ? (
              <Card className="flex items-center justify-center gap-3 p-10">
                <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                <p className="text-slate-600">Carregando assinaturas...</p>
              </Card>
            ) : filteredSubscriptions.length === 0 ? (
              <Card className="border-slate-200 p-10 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <CreditCard className="h-6 w-6 text-slate-500" />
                </div>

                <h2 className="text-xl font-bold text-slate-900">
                  Nenhuma assinatura encontrada
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Quando alguém clicar em um plano, a solicitação aparecerá aqui.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredSubscriptions.map((subscription) => {
                  const isActionLoading =
                    actionLoadingId === subscription.subscription_id;
                  const isManualReview = subscription.status === "manual_review";

                  return (
                    <Card
                      key={subscription.subscription_id}
                      className="overflow-hidden border-slate-200"
                    >
                      <div className="grid gap-4 p-5 lg:grid-cols-[1.4fr_1fr_auto] lg:items-center">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={[
                                "rounded-full border px-3 py-1 text-xs font-bold",
                                getStatusBadge(subscription.status),
                              ].join(" ")}
                            >
                              {formatSubscriptionStatus(
                                subscription.status as BillingSubscriptionStatus
                              )}
                            </span>

                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                              {subscription.gateway}
                            </span>

                            {subscription.gateway_reconciliation_status ? (
                              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                                Reconciliação necessária
                              </span>
                            ) : null}

                            {subscription.is_effective_subscription ? (
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Assinatura efetiva</span>
                            ) : subscription.is_historical_subscription ? (
                              <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">Histórico / substituída</span>
                            ) : null}
                          </div>

                          <h3 className="mt-3 text-lg font-black text-slate-900">
                            {subscription.user_name || "Aluno sem nome"}
                          </h3>

                          <p className="text-sm text-slate-500">
                            {subscription.user_email || "Sem e-mail"}
                          </p>

                          <p className="mt-2 text-xs text-slate-400">
                            Solicitada em {formatDate(subscription.created_at)}
                          </p>

                          {subscription.gateway_reconciliation_status ? (
                            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                              <p className="font-black uppercase tracking-wide">Reconciliação financeira</p>
                              <p className="mt-1">Status: {subscription.gateway_reconciliation_status}</p>
                              <p className="mt-1 break-all">Mercado Pago: {subscription.gateway_subscription_id || subscription.gateway_payment_id || "Sem ID"}</p>
                              <p className="mt-1 line-clamp-2">Erro: {subscription.gateway_reconciliation_error || "Sem detalhe registrado"}</p>
                              <p className="mt-1">Tentativas: {subscription.gateway_reconciliation_attempts ?? 0}</p>
                            </div>
                          ) : null}
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Plano
                          </p>

                          <p className="mt-1 font-bold text-slate-900">
                            {subscription.plan_name}
                          </p>

                          <p className="text-sm text-slate-600">
                            {formatPriceFromCents(
                              subscription.plan_price_cents
                            )}{" "}
                            / mês
                          </p>

                          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                            <Clock3 className="h-4 w-4" />
                            Vence em: {formatDate(subscription.current_period_end)}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 lg:w-52">
                          {subscription.gateway_reconciliation_status ? (
                            <Button
                              variant="outline"
                              onClick={() => reconcileSubscription(subscription)}
                              disabled={isActionLoading}
                              className="gap-2 border-amber-300 text-amber-800 hover:bg-amber-50"
                            >
                              {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                              Reconciliar gateway
                            </Button>
                          ) : null}
                          {isManualReview ? (
                            <Button
                              onClick={() =>
                                renewSubscription(
                                  subscription.subscription_id,
                                  "aprovar"
                                )
                              }
                              disabled={isActionLoading}
                              className="gap-2"
                            >
                              {isActionLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                              Aprovar 1 mês
                            </Button>
                          ) : (
                            <Button
                              onClick={() =>
                                renewSubscription(subscription.subscription_id)
                              }
                              disabled={isActionLoading}
                              className="gap-2"
                            >
                              {isActionLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RotateCcw className="h-4 w-4" />
                              )}
                              Renovar +1 mês
                            </Button>
                          )}

                          {subscription.status !== "canceled" && (
                            <Button
                              variant="outline"
                              onClick={() =>
                                cancelSubscription(subscription)
                              }
                              disabled={isActionLoading}
                              className="gap-2 border-red-200 text-red-700 hover:bg-red-50"
                            >
                              {isActionLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === "payments" && (
          <Card className="overflow-hidden border-slate-200">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-lg font-black text-slate-900">Pagamentos registrados</h2>
              <p className="mt-1 text-sm text-slate-500">A verificação consulta o Mercado Pago e nunca ativa uma assinatura manualmente.</p>
            </div>
            {loading ? (
              <div className="flex items-center justify-center gap-3 p-10 text-slate-600"><Loader2 className="h-5 w-5 animate-spin" />Carregando pagamentos...</div>
            ) : payments.length === 0 ? (
              <p className="p-10 text-center text-sm text-slate-500">Nenhum pagamento encontrado.</p>
            ) : (
              <div className="divide-y divide-slate-200">
                {payments.map(payment => {
                  const canReconcile = payment.gateway === "mercadopago"
                    && (!payment.access_applied_at || ["pending", "failed"].includes(payment.status) || Boolean(payment.gateway_reconciliation_error));
                  const isActionLoading = actionLoadingId === payment.id;
                  return (
                    <div key={payment.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={["rounded-full border px-3 py-1 text-xs font-bold", getStatusBadge(payment.status)].join(" ")}>{payment.status}</span>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">{payment.payment_method}</span>
                        </div>
                        <p className="mt-3 font-bold text-slate-900">{formatPriceFromCents(payment.amount_cents)} {payment.currency}</p>
                        <p className="mt-1 break-all text-xs text-slate-500">Pagamento local: {payment.id}</p>
                        <p className="mt-1 break-all text-xs text-slate-500">Mercado Pago: {payment.gateway_payment_id || "ID não registrado"}</p>
                        <p className="mt-1 text-xs text-slate-500">Criado em {formatDate(payment.created_at)} · Acesso {payment.access_applied_at ? "aplicado" : "não aplicado"}</p>
                        {payment.gateway_reconciliation_error ? <p className="mt-2 text-xs text-red-700">Falha anterior: {payment.gateway_reconciliation_error}</p> : null}
                      </div>
                      {canReconcile ? (
                        <Button variant="outline" onClick={() => reconcilePayment(payment)} disabled={isActionLoading || !payment.gateway_payment_id} className="gap-2 border-cyan-300 text-cyan-800 hover:bg-cyan-50">
                          {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                          Reconciliar acesso
                        </Button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {activeTab === "plans" && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-slate-200 p-5">
                <p className="text-sm text-slate-500">Total de planos</p>
                <p className="mt-2 text-3xl font-black text-slate-900">
                  {planStats.total}
                </p>
              </Card>

              <Card className="border-emerald-200 bg-emerald-50 p-5">
                <p className="text-sm text-emerald-700">Ativos</p>
                <p className="mt-2 text-3xl font-black text-emerald-900">
                  {planStats.active}
                </p>
              </Card>

              <Card className="border-cyan-200 bg-cyan-50 p-5">
                <p className="text-sm text-cyan-700">Com limite de vagas</p>
                <p className="mt-2 text-3xl font-black text-cyan-900">
                  {planStats.limited}
                </p>
              </Card>
            </div>

            <Card className="border-slate-200 p-5">
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <p>
                  Alterações de preço valem somente para novos checkouts e não
                  modificam cobranças ou pagamentos já criados. A elegibilidade
                  do Plano Fundador é permanente, validada pelo servidor e não
                  pode ser concedida por esta tela.
                </p>
              </div>
            </Card>

            {loading ? (
              <Card className="flex items-center justify-center gap-3 p-10">
                <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                <p className="text-slate-600">Carregando planos...</p>
              </Card>
            ) : (
              <div className="grid gap-4 lg:grid-cols-3">
                {plans.map((plan) => {
                  const form = planForms[plan.id] ?? buildPlanForm(plan);
                  const isSaving = savingPlanId === plan.id;
                  const max = plan.max_active_subscriptions;
                  const used = plan.used_slots ?? 0;
                  const percent = max
                    ? Math.min(100, Math.round((used / max) * 100))
                    : 0;

                  return (
                    <Card key={plan.id} className="border-slate-200 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                            <Edit3 className="h-4 w-4" />
                            {plan.slug}
                          </div>
                          <h3 className="mt-2 text-xl font-black text-slate-900">
                            {plan.name}
                          </h3>
                        </div>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${
                            plan.is_active
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-100 text-slate-600"
                          }`}
                        >
                          {plan.is_active ? "Ativo" : "Inativo"}
                        </span>
                      </div>

                      <div className="mt-5 space-y-3">
                        <label className="block">
                          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Nome
                          </span>
                          <input
                            value={form.name}
                            onChange={(event) =>
                              updatePlanForm(plan.id, { name: event.target.value })
                            }
                            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-900"
                          />
                        </label>

                        <label className="block">
                          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Ordem de exibição</span>
                          <input
                            type="number"
                            min="0"
                            value={form.displayOrder}
                            onChange={(event) => updatePlanForm(plan.id, { displayOrder: event.target.value })}
                            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-900"
                          />
                        </label>

                        <label className="block">
                          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Valor mensal
                          </span>
                          <div className="mt-1 flex items-center rounded-2xl border border-slate-200 bg-white px-4 focus-within:border-slate-900">
                            <span className="text-sm font-black text-slate-500">R$</span>
                            <input
                              value={form.price}
                              onChange={(event) =>
                                updatePlanForm(plan.id, { price: event.target.value })
                              }
                              placeholder="9,00"
                              className="w-full bg-transparent px-3 py-3 text-sm text-slate-700 outline-none"
                            />
                          </div>
                        </label>

                        <label className="block">
                          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Limite de assinaturas
                          </span>
                          <input
                            value={form.maxActiveSubscriptions}
                            onChange={(event) =>
                              updatePlanForm(plan.id, {
                                maxActiveSubscriptions: event.target.value,
                              })
                            }
                            placeholder="Sem limite"
                            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-900"
                          />
                          <p className="mt-1 text-xs text-slate-400">
                            Deixe em branco para plano sem limite.
                          </p>
                        </label>

                        <label className="block">
                          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Descrição pública
                          </span>
                          <textarea
                            value={form.description}
                            onChange={(event) =>
                              updatePlanForm(plan.id, {
                                description: event.target.value,
                              })
                            }
                            rows={3}
                            className="mt-1 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-900"
                          />
                        </label>

                        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={(event) =>
                              updatePlanForm(plan.id, {
                                isActive: event.target.checked,
                              })
                            }
                          />
                          Plano ativo para novos checkouts
                        </label>

                        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={form.isPublic}
                            onChange={(event) => updatePlanForm(plan.id, { isPublic: event.target.checked })}
                          />
                          Mostrar plano na tela pública
                        </label>

                        <div className={`rounded-2xl border p-4 text-sm ${plan.requires_legacy_founder_eligibility ? "border-amber-200 bg-amber-50 text-amber-800" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                          <p className="font-bold">Elegibilidade de fundador</p>
                          <p className="mt-1 text-xs leading-5">
                            {plan.requires_legacy_founder_eligibility
                              ? "Obrigatória. Apenas usuários com permissão histórica permanente podem comprar este plano."
                              : "Não exigida para este plano."}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex justify-between text-xs font-bold text-slate-500">
                          <span>Uso atual</span>
                          <span>
                            {used}
                            {max ? `/${max}` : ""} vagas
                          </span>
                        </div>
                        {max && (
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-cyan-400"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        )}
                        <p className="mt-2 text-xs text-slate-500">
                          {max
                            ? `${plan.remaining_slots ?? 0} vagas restantes.`
                            : "Plano sem limite definido."}
                        </p>
                      </div>

                      <Button
                        onClick={() => savePlan(plan)}
                        disabled={isSaving}
                        className="mt-5 w-full gap-2"
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Salvar alterações
                      </Button>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === "invites" && (
          <>
            <Card className="border-slate-200 p-5">
              <div className="flex flex-col gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Criar convite de plano
                </h2>

                <p className="text-sm text-slate-500">
                  Use isso para liberar um plano especial para um e-mail específico.
                </p>
              </div>

              <form
                onSubmit={createInvite}
                className="mt-5 grid gap-3 md:grid-cols-[1fr_1.4fr_auto]"
              >
                <select
                  value={selectedPlanSlug}
                  onChange={(event) => setSelectedPlanSlug(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-900"
                >
                  {plans
                    .filter((plan) => plan.is_active)
                    .map((plan) => (
                      <option key={plan.id} value={plan.slug}>
                        {plan.name} - {formatPriceFromCents(plan.price_cents)}
                      </option>
                    ))}
                </select>

                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="email@exemplo.com"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-900"
                />

                <Button type="submit" disabled={creatingInvite} className="gap-2">
                  {creatingInvite ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Criar convite
                </Button>
              </form>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-slate-200 p-5">
                <p className="text-sm text-slate-500">Total de convites</p>
                <p className="mt-2 text-3xl font-black text-slate-900">
                  {inviteStats.total}
                </p>
              </Card>

              <Card className="border-emerald-200 bg-emerald-50 p-5">
                <p className="text-sm text-emerald-700">Disponíveis</p>
                <p className="mt-2 text-3xl font-black text-emerald-900">
                  {inviteStats.available}
                </p>
              </Card>

              <Card className="border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Usados</p>
                <p className="mt-2 text-3xl font-black text-slate-900">
                  {inviteStats.used}
                </p>
              </Card>
            </div>

            {loading ? (
              <Card className="flex items-center justify-center gap-3 p-10">
                <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                <p className="text-slate-600">Carregando convites...</p>
              </Card>
            ) : invites.length === 0 ? (
              <Card className="border-slate-200 p-10 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <Gift className="h-6 w-6 text-slate-500" />
                </div>

                <h2 className="text-xl font-bold text-slate-900">
                  Nenhum convite criado
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Crie convites para liberar planos especiais por e-mail.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {invites.map((invite) => {
                  const isDeleting = deletingInviteId === invite.invite_id;
                  const used = Boolean(invite.used_at);

                  return (
                    <Card
                      key={invite.invite_id}
                      className="overflow-hidden border-slate-200"
                    >
                      <div className="grid gap-4 p-5 lg:grid-cols-[1.3fr_1fr_auto] lg:items-center">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={[
                                "rounded-full border px-3 py-1 text-xs font-bold",
                                used
                                  ? "border-slate-200 bg-slate-100 text-slate-600"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700",
                              ].join(" ")}
                            >
                              {used ? "Usado" : "Disponível"}
                            </span>

                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                              {invite.plan_slug}
                            </span>
                          </div>

                          <h3 className="mt-3 text-lg font-black text-slate-900">
                            {invite.email ?? "Sem e-mail"}
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            Criado em {formatDate(invite.created_at)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Plano liberado
                          </p>

                          <p className="mt-1 font-bold text-slate-900">
                            {invite.plan_name}
                          </p>

                          <p className="text-sm text-slate-600">
                            {formatPriceFromCents(invite.plan_price_cents)} / mês
                          </p>

                          <p className="mt-2 text-xs text-slate-500">
                            Expira: {formatDate(invite.expires_at)}
                          </p>
                        </div>

                        <div className="flex flex-col gap-2 lg:w-44">
                          {!used && (
                            <Button
                              variant="outline"
                              onClick={() => deleteInvite(invite.invite_id)}
                              disabled={isDeleting}
                              className="gap-2 border-red-200 text-red-700 hover:bg-red-50"
                            >
                              {isDeleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                              Remover
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}
