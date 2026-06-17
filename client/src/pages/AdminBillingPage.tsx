import { useEffect, useMemo, useState } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  CreditCard,
  Gift,
  Loader2,
  RefreshCw,
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
  payment_url: string | null;

  started_at: string | null;
  current_period_end: string | null;
  next_due_date: string | null;

  created_at: string;
  updated_at: string;
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

type BillingPlanOption = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
};

type StatusFilter = "all" | "manual_review" | "active" | "canceled" | "overdue";
type AdminBillingTab = "subscriptions" | "invites";

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
    case "active":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "overdue":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "canceled":
      return "bg-slate-100 text-slate-600 border-slate-200";
    case "failed":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-blue-50 text-blue-700 border-blue-200";
  }
}

export default function AdminBillingPage() {
  const [activeTab, setActiveTab] = useState<AdminBillingTab>("subscriptions");

  const [subscriptions, setSubscriptions] = useState<
    AdminBillingSubscriptionRow[]
  >([]);

  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [plans, setPlans] = useState<BillingPlanOption[]>([]);

  const [selectedPlanSlug, setSelectedPlanSlug] = useState("selecionados_5");
  const [inviteEmail, setInviteEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creatingInvite, setCreatingInvite] = useState(false);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [deletingInviteId, setDeletingInviteId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filteredSubscriptions = useMemo(() => {
    if (statusFilter === "all") return subscriptions;

    return subscriptions.filter(
      (subscription) => subscription.status === statusFilter
    );
  }, [subscriptions, statusFilter]);

  const subscriptionStats = useMemo(() => {
    return {
      total: subscriptions.length,
      manualReview: subscriptions.filter((item) => item.status === "manual_review")
        .length,
      active: subscriptions.filter((item) => item.status === "active").length,
      canceled: subscriptions.filter((item) => item.status === "canceled").length,
    };
  }, [subscriptions]);

  const inviteStats = useMemo(() => {
    return {
      total: invites.length,
      available: invites.filter((invite) => !invite.used_at).length,
      used: invites.filter((invite) => Boolean(invite.used_at)).length,
    };
  }, [invites]);

  async function loadSubscriptionsData() {
    const { data, error: rpcError } = await supabase.rpc(
      "admin_list_billing_subscriptions"
    );

    if (rpcError) {
      console.error("Erro ao carregar assinaturas:", rpcError);
      throw new Error(rpcError.message || "Não foi possível carregar as assinaturas.");
    }

    setSubscriptions((data ?? []) as AdminBillingSubscriptionRow[]);
  }

  async function loadInvitesData() {
    const [invitesResponse, plansResponse] = await Promise.all([
      supabase.rpc("admin_list_billing_plan_invites"),
      supabase
        .from("billing_plans")
        .select("id, slug, name, price_cents")
        .eq("is_active", true)
        .order("price_cents", { ascending: true }),
    ]);

    if (invitesResponse.error) {
      console.error("Erro ao carregar convites:", invitesResponse.error);
      throw new Error(
        invitesResponse.error.message || "Não foi possível carregar os convites."
      );
    }

    if (plansResponse.error) {
      console.error("Erro ao carregar planos:", plansResponse.error);
      throw new Error(
        plansResponse.error.message || "Não foi possível carregar os planos."
      );
    }

    setInvites((invitesResponse.data ?? []) as InviteRow[]);
    setPlans((plansResponse.data ?? []) as BillingPlanOption[]);
  }

  async function loadAllData() {
    try {
      setLoading(true);
      setError("");

      await Promise.all([loadSubscriptionsData(), loadInvitesData()]);
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
      } else {
        await loadInvitesData();
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

  async function approveSubscription(subscriptionId: string) {
    const confirmed = window.confirm(
      "Aprovar esta assinatura e liberar 1 mês de acesso?"
    );

    if (!confirmed) return;

    try {
      setActionLoadingId(subscriptionId);
      setError("");
      setSuccess("");

      const { error: rpcError } = await supabase.rpc(
        "admin_approve_manual_subscription",
        {
          target_subscription_id: subscriptionId,
          access_months: 1,
        }
      );

      if (rpcError) {
        console.error("Erro ao aprovar assinatura:", rpcError);
        setError(rpcError.message || "Não foi possível aprovar a assinatura.");
        return;
      }

      setSuccess("Assinatura aprovada com sucesso.");
      await loadSubscriptionsData();
    } catch (err) {
      console.error("Erro inesperado ao aprovar assinatura:", err);
      setError("Ocorreu um erro inesperado ao aprovar a assinatura.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function cancelSubscription(subscriptionId: string) {
    const confirmed = window.confirm("Cancelar esta assinatura?");

    if (!confirmed) return;

    try {
      setActionLoadingId(subscriptionId);
      setError("");
      setSuccess("");

      const { error: rpcError } = await supabase.rpc(
        "admin_cancel_billing_subscription",
        {
          target_subscription_id: subscriptionId,
        }
      );

      if (rpcError) {
        console.error("Erro ao cancelar assinatura:", rpcError);
        setError(rpcError.message || "Não foi possível cancelar a assinatura.");
        return;
      }

      setSuccess("Assinatura cancelada com sucesso.");
      await loadSubscriptionsData();
    } catch (err) {
      console.error("Erro inesperado ao cancelar assinatura:", err);
      setError("Ocorreu um erro inesperado ao cancelar a assinatura.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function createInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = inviteEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Informe um e-mail.");
      return;
    }

    try {
      setCreatingInvite(true);
      setError("");
      setSuccess("");

      const { error: rpcError } = await supabase.rpc(
        "admin_create_billing_plan_invite",
        {
          target_plan_slug: selectedPlanSlug,
          target_email: normalizedEmail,
          target_expires_at: null,
        }
      );

      if (rpcError) {
        console.error("Erro ao criar convite:", rpcError);
        setError(rpcError.message || "Não foi possível criar o convite.");
        return;
      }

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

      const { error: rpcError } = await supabase.rpc(
        "admin_delete_billing_plan_invite",
        {
          target_invite_id: inviteId,
        }
      );

      if (rpcError) {
        console.error("Erro ao remover convite:", rpcError);
        setError(rpcError.message || "Não foi possível remover o convite.");
        return;
      }

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
        subtitle="Aprove solicitações, acompanhe planos, gerencie acessos manuais e libere convites."
      >
        <div className="grid gap-4 md:grid-cols-4">
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
            <p className="text-sm text-emerald-700">Ativas</p>
            <p className="mt-2 text-3xl font-black text-emerald-900">
              {subscriptionStats.active}
            </p>
          </Card>

          <Card className="border-cyan-200 bg-cyan-50 p-5">
            <p className="text-sm text-cyan-700">Convites disponíveis</p>
            <p className="mt-2 text-3xl font-black text-cyan-900">
              {inviteStats.available}
            </p>
          </Card>
        </div>

        <Card className="border-slate-200 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Controle financeiro inicial
              </h2>
              <p className="text-sm text-slate-500">
                Use essa tela enquanto o gateway automático ainda não está conectado.
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
              Solicitações de assinatura
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
              Convites de planos
            </button>
          </div>

          {activeTab === "subscriptions" && (
            <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
              {[
                { value: "all", label: "Todas" },
                { value: "manual_review", label: "Análise manual" },
                { value: "active", label: "Ativas" },
                { value: "overdue", label: "Atrasadas" },
                { value: "canceled", label: "Canceladas" },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setStatusFilter(item.value as StatusFilter)}
                  className={[
                    "rounded-full border px-4 py-2 text-sm font-semibold transition",
                    statusFilter === item.value
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </Card>

        {error && (
          <Card className="border-red-200 bg-red-50 p-5">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </Card>
        )}

        {success && (
          <Card className="border-emerald-200 bg-emerald-50 p-5">
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
              <p className="text-sm text-emerald-700">{success}</p>
            </div>
          </Card>
        )}

        {activeTab === "subscriptions" && (
          <>
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
                          </div>

                          <h3 className="mt-3 text-lg font-black text-slate-900">
                            {subscription.user_name}
                          </h3>

                          <p className="text-sm text-slate-500">
                            {subscription.user_email}
                          </p>

                          <p className="mt-2 text-xs text-slate-400">
                            Solicitada em {formatDate(subscription.created_at)}
                          </p>
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
                            Vence em:{" "}
                            {formatDate(subscription.current_period_end)}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 lg:w-48">
                          {subscription.status === "manual_review" && (
                            <Button
                              onClick={() =>
                                approveSubscription(
                                  subscription.subscription_id
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
                              Aprovar
                            </Button>
                          )}

                          {subscription.status !== "canceled" && (
                            <Button
                              variant="outline"
                              onClick={() =>
                                cancelSubscription(
                                  subscription.subscription_id
                                )
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

        {activeTab === "invites" && (
          <>
            <Card className="border-slate-200 p-5">
              <div className="flex flex-col gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Criar convite de plano
                </h2>

                <p className="text-sm text-slate-500">
                  Use isso para liberar o plano de R$ 6 ou outro plano especial
                  para um e-mail específico.
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
                  {plans.map((plan) => (
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
