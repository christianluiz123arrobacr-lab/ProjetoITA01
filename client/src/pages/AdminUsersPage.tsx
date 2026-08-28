import { type FormEvent, useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminGuard from "@/components/admin/AdminGuard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  RefreshCcw,
  RotateCcw,
  Save,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  UserCircle2,
  Users,
  XCircle,
} from "lucide-react";

type AdminUserRow = {
  id: string;
  user_id: string;
  role: "admin" | "editor";
  created_at: string;
};

type ProfileRow = {
  id: string;
  nome: string | null;
  email: string | null;
  telefone?: string | null;
  role: string | null;
  ativo: boolean | null;
  created_at: string | null;
  last_seen_at?: string | null;
};

type AdminUserWithProfile = AdminUserRow & {
  profile?: ProfileRow | null;
};

type BillingPlanRow = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  is_active?: boolean | null;
};

type StudentBillingRow = {
  id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  role: string | null;
  ativo: boolean | null;
  created_at: string | null;
  last_seen_at: string | null;

  subscription_id: string | null;
  subscription_status: string | null;
  gateway?: string | null;
  gateway_subscription_id?: string | null;
  gateway_payment_id?: string | null;
  last_gateway_status?: string | null;
  cancel_at_period_end?: boolean | null;
  metadata?: Record<string, unknown> | null;
  plan_id: string | null;
  plan_slug: string | null;
  plan_name: string | null;
  plan_price_cents: number | null;
  current_period_end: string | null;
  next_due_date: string | null;
  subscription_created_at: string | null;
  updated_at: string | null;
  has_valid_access: boolean;
  effective_subscription_id: string | null;

  attempts_count: number | null;
  correct_count: number | null;
  wrong_count: number | null;
  last_answered_at: string | null;
};

type UsersViewMode = "alunos" | "adms";
type StudentStatusFilter =
  | "all"
  | "active"
  | "manual_review"
  | "expired"
  | "overdue"
  | "canceled"
  | "without_subscription"
  | "blocked";

type StudentPlanDraft = {
  planId: string;
  months: string;
};

function isMercadoPagoCardStudentSubscription(student: Pick<StudentBillingRow, "gateway" | "metadata">) {
  return student.gateway === "mercadopago" && student.metadata?.payment_method === "card";
}

function formatDate(date?: string | null) {
  if (!date) return "Sem data";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Sem data";

  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(date?: string | null) {
  if (!date) return "Sem registro";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Sem registro";

  return parsed.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatLastSeen(date?: string | null) {
  if (!date) return "Nunca registrado";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Nunca registrado";

  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - parsed.getTime()) / 60000);

  if (diffMinutes < 1) return "Agora há pouco";
  if (diffMinutes < 60) return `Há ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Há ${diffHours} h`;

  return formatDateTime(date);
}

function formatPhone(phone?: string | null) {
  const clean = (phone || "").trim();
  return clean || "Não informado";
}

function formatMoney(cents?: number | null) {
  const value = Number(cents || 0) / 100;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getSubscriptionStatus(student: StudentBillingRow) {
  if (!student.subscription_id) return "without_subscription";

  if (student.has_valid_access) return "active";
  if (student.subscription_status === "active" || student.subscription_status === "trialing") return "expired";

  return student.subscription_status || "without_subscription";
}

function getStatusLabel(status: string) {
  switch (status) {
    case "active":
      return "Ativa";
    case "manual_review":
      return "Aguardando pagamento";
    case "expired":
      return "Vencida";
    case "overdue":
      return "Em atraso";
    case "canceled":
      return "Cancelada";
    case "failed":
      return "Falhou";
    case "without_subscription":
      return "Sem assinatura";
    default:
      return status || "Sem assinatura";
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "manual_review":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "expired":
    case "overdue":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "canceled":
    case "failed":
      return "border-red-200 bg-red-50 text-red-700";
    case "without_subscription":
      return "border-slate-200 bg-slate-50 text-slate-600";
    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
}

function normalize(text?: string | null) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeWhatsappPhone(phone?: string | null) {
  const digits = (phone || "").replace(/\D/g, "");

  if (!digits) return "";

  if (digits.startsWith("55")) {
    return digits;
  }

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
}

function makeWhatsappUrl(student: StudentBillingRow) {
  const phone = normalizeWhatsappPhone(student.telefone);

  if (!phone) {
    return "";
  }

  const name = student.nome || student.email || "aluno";
  const message = `Olá, ${name}! Estou entrando em contato sobre sua assinatura da plataforma Projeto Vetor.`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export default function AdminUsersPage() {
  const createStudentMutation = trpc.admin.createStudent.useMutation();
  const listBillingPlansQuery = trpc.admin.listBillingPlans.useQuery(undefined, { enabled: false });
  const listStudentsWithBillingQuery = trpc.admin.listStudentsWithBilling.useQuery(undefined, { enabled: false });
  const updateStudentProfileMutation = trpc.admin.updateStudentProfile.useMutation();
  const renewUserSubscriptionMutation = trpc.admin.renewUserSubscription.useMutation();
  const cancelBillingSubscriptionMutation = trpc.admin.cancelBillingSubscription.useMutation();
  const cancelMercadoPagoSubscriptionNowMutation = trpc.admin.cancelMercadoPagoSubscriptionNow.useMutation();
  const listAdminUsersQuery = trpc.admin.listAdminUsers.useQuery(undefined, { enabled: false });
  const grantAdminAccessMutation = trpc.admin.grantAdminAccess.useMutation();
  const updateAdminRoleMutation = trpc.admin.updateAdminRole.useMutation();
  const removeAdminAccessMutation = trpc.admin.removeAdminAccess.useMutation();

  const [viewMode, setViewMode] = useState<UsersViewMode>("alunos");
  const [students, setStudents] = useState<StudentBillingRow[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserWithProfile[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [plans, setPlans] = useState<BillingPlanRow[]>([]);
  const [studentDrafts, setStudentDrafts] = useState<Record<string, StudentPlanDraft>>({});

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savingProfileId, setSavingProfileId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [studentSearch, setStudentSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StudentStatusFilter>("all");
  const [planFilter, setPlanFilter] = useState("all");

  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "editor">("editor");
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [searchAdmins, setSearchAdmins] = useState("");

  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [creatingStudent, setCreatingStudent] = useState(false);

  function mergeDrafts(rows: StudentBillingRow[], availablePlans: BillingPlanRow[]) {
    const firstPlan = availablePlans[0]?.id || "";

    setStudentDrafts((previous) => {
      const next = { ...previous };

      rows.forEach((student) => {
        if (!next[student.id]) {
          next[student.id] = {
            planId: student.plan_id || firstPlan,
            months: "1",
          };
        }
      });

      return next;
    });
  }

  async function loadPlans() {
    const result = await listBillingPlansQuery.refetch();

    if (result.error) {
      throw new Error(result.error.message || "Não foi possível carregar os planos.");
    }

    const mapped = ((result.data ?? []) as any[]).map((plan) => ({
      id: String(plan.id),
      slug: String(plan.slug),
      name: String(plan.name),
      price_cents: Number(plan.price_cents || 0),
      is_active: Boolean(plan.is_active),
    }));

    setPlans(mapped);
    return mapped;
  }

  async function loadStudents(availablePlans: BillingPlanRow[]) {
    const result = await listStudentsWithBillingQuery.refetch();

    if (result.error) {
      throw new Error(result.error.message || "Não foi possível carregar os alunos.");
    }

    const rows = ((result.data ?? []) as any[]).map((row) => ({
      ...row,
      attempts_count: Number(row.attempts_count || 0),
      correct_count: Number(row.correct_count || 0),
      wrong_count: Number(row.wrong_count || 0),
    })) as StudentBillingRow[];

    setStudents(rows);
    mergeDrafts(rows, availablePlans);
  }

  async function loadAdmins() {
    const result = await listAdminUsersQuery.refetch();

    if (result.error) {
      throw new Error(result.error.message || "Não foi possível carregar acessos administrativos.");
    }

    const rows = ((result.data || []) as AdminUserWithProfile[]).map((adminUser) => ({
      ...adminUser,
      profile: adminUser.profile || null,
    }));

    setAdminUsers(rows);
    setProfiles(rows.map((adminUser) => adminUser.profile).filter(Boolean) as ProfileRow[]);
  }

  async function loadAll() {
    try {
      setLoading(true);
      setError("");

      const availablePlans = await loadPlans();
      await Promise.all([loadStudents(availablePlans), loadAdmins()]);
    } catch (err) {
      console.error("Erro ao carregar central de alunos:", err);
      setError(err instanceof Error ? err.message : "Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const filteredStudents = useMemo(() => {
    const term = normalize(studentSearch);

    return students.filter((student) => {
      const status = getSubscriptionStatus(student);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "blocked" && student.ativo === false) ||
        status === statusFilter;

      const matchesPlan =
        planFilter === "all" || String(student.plan_id || "") === String(planFilter);

      const text = normalize(
        `${student.nome || ""} ${student.email || ""} ${student.telefone || ""} ${student.plan_name || ""} ${student.role || ""} ${student.id}`
      );

      return matchesStatus && matchesPlan && (!term || text.includes(term));
    });
  }, [students, studentSearch, statusFilter, planFilter]);

  const filteredAdmins = useMemo(() => {
    const term = normalize(searchAdmins);
    if (!term) return adminUsers;

    return adminUsers.filter((user) => {
      const text = normalize(
        `${user.profile?.nome || ""} ${user.profile?.email || ""} ${user.profile?.telefone || ""} ${user.role || ""} ${user.user_id}`
      );

      return text.includes(term);
    });
  }, [adminUsers, searchAdmins]);

  const stats = useMemo(() => {
    const active = students.filter((student) => getSubscriptionStatus(student) === "active").length;
    const pending = students.filter((student) => getSubscriptionStatus(student) === "manual_review").length;
    const expired = students.filter((student) => {
      const status = getSubscriptionStatus(student);
      return status === "expired" || status === "overdue";
    }).length;
    const blocked = students.filter((student) => student.ativo === false).length;

    return {
      total: students.length,
      active,
      pending,
      expired,
      blocked,
    };
  }, [students]);

  function updateStudentDraft(userId: string, patch: Partial<StudentPlanDraft>) {
    setStudentDrafts((previous) => ({
      ...previous,
      [userId]: {
        planId: previous[userId]?.planId || plans[0]?.id || "",
        months: previous[userId]?.months || "1",
        ...patch,
      },
    }));
  }

  function updateLocalProfile(id: string, patch: Partial<StudentBillingRow>) {
    setStudents((previous) =>
      previous.map((student) => (student.id === id ? { ...student, ...patch } : student))
    );

    setProfiles((previous) =>
      previous.map((profile) => (profile.id === id ? { ...profile, ...patch } : profile))
    );
  }

  async function handleCreateStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nome = studentName.trim();
    const email = studentEmail.trim().toLowerCase();
    const senha = studentPassword.trim();

    if (!nome || nome.length < 2) {
      setError("Digite um nome válido para o aluno.");
      return;
    }

    if (!email || !email.includes("@")) {
      setError("Digite um e-mail válido para o aluno.");
      return;
    }

    if (!senha || senha.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    try {
      setCreatingStudent(true);
      setError("");
      setSuccessMessage("");

      await createStudentMutation.mutateAsync({ nome, email, senha });

      setSuccessMessage(`Aluno ${nome} criado com sucesso.`);
      setStudentName("");
      setStudentEmail("");
      setStudentPassword("");
      setStudentSearch(email);

      await loadAll();
    } catch (err) {
      console.error("Erro ao criar aluno:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível criar o aluno. Confira se o e-mail já existe."
      );
    } finally {
      setCreatingStudent(false);
    }
  }

  async function handleSaveStudent(student: StudentBillingRow) {
    try {
      setSavingProfileId(student.id);
      setError("");
      setSuccessMessage("");

      await updateStudentProfileMutation.mutateAsync({
        id: student.id,
        nome: student.nome || null,
        telefone: student.telefone || null,
        role: student.role || "student",
        ativo: student.ativo !== false,
      });

      setSuccessMessage(`Dados de ${student.nome || student.email} salvos.`);
    } catch (err) {
      console.error("Erro ao salvar aluno:", err);
      setError(err instanceof Error ? err.message : "Não foi possível salvar o aluno.");
    } finally {
      setSavingProfileId(null);
    }
  }

  async function handleToggleStudentActive(student: StudentBillingRow) {
    const nextActive = student.ativo === false;

    try {
      setBusyId(student.id);
      setError("");
      setSuccessMessage("");

      await updateStudentProfileMutation.mutateAsync({
        id: student.id,
        nome: student.nome || null,
        telefone: student.telefone || null,
        role: student.role || "student",
        ativo: nextActive,
      });

      updateLocalProfile(student.id, { ativo: nextActive });
      setSuccessMessage(nextActive ? "Aluno reativado." : "Aluno bloqueado.");
    } catch (err) {
      console.error("Erro ao alterar status:", err);
      setError(err instanceof Error ? err.message : "Não foi possível alterar o status.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRenewStudent(student: StudentBillingRow) {
    const draft = studentDrafts[student.id] || {
      planId: student.plan_id || plans[0]?.id || "",
      months: "1",
    };

    const months = Math.max(Number.parseInt(draft.months || "1", 10) || 1, 1);
    const planId = draft.planId || student.plan_id || plans[0]?.id || "";

    if (!planId) {
      setError("Escolha um plano para renovar/liberar o aluno.");
      return;
    }

    try {
      setBusyId(student.id);
      setError("");
      setSuccessMessage("");

      await renewUserSubscriptionMutation.mutateAsync({
        userId: student.id,
        planId,
        months,
      });

      setSuccessMessage(
        `Assinatura de ${student.nome || student.email} renovada/liberada por ${months} mês(es).`
      );
      await loadAll();
    } catch (err) {
      console.error("Erro ao renovar assinatura:", err);
      setError(err instanceof Error ? err.message : "Não foi possível renovar a assinatura.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancelSubscription(student: StudentBillingRow) {
    if (!student.subscription_id) {
      setError("Esse aluno não tem assinatura para cancelar.");
      return;
    }

    const recurringCard = isMercadoPagoCardStudentSubscription(student);
    const confirmed = window.confirm(
      recurringCard
        ? `Cancelar agora a recorrência Mercado Pago de ${student.nome || student.email}? Esta ação administrativa é imediata e impede novas cobranças.`
        : `Cancelar a assinatura de ${student.nome || student.email}? O acesso pago será bloqueado imediatamente.`
    );

    if (!confirmed) return;

    try {
      setBusyId(student.id);
      setError("");
      setSuccessMessage("");

      if (recurringCard) {
        await cancelMercadoPagoSubscriptionNowMutation.mutateAsync({ subscriptionId: student.subscription_id });
      } else {
        await cancelBillingSubscriptionMutation.mutateAsync({
          subscriptionId: student.subscription_id,
        });
      }

      setSuccessMessage(
        recurringCard
          ? `Recorrência Mercado Pago de ${student.nome || student.email} cancelada no gateway e no sistema.`
          : `Assinatura de ${student.nome || student.email} cancelada.`
      );
      await loadAll();
    } catch (err) {
      console.error("Erro ao cancelar assinatura:", err);
      setError(err instanceof Error ? err.message : "Não foi possível cancelar a assinatura.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleCopyEmail(email?: string | null) {
    if (!email) return;

    try {
      await navigator.clipboard.writeText(email);
      setSuccessMessage("E-mail copiado.");
    } catch {
      setError("Não foi possível copiar o e-mail.");
    }
  }

  async function handleAddAdminAccess() {
    const trimmedEmail = newEmail.trim().toLowerCase();

    if (!trimmedEmail) {
      setError("Digite um e-mail válido.");
      return;
    }

    try {
      setAddingAdmin(true);
      setError("");
      setSuccessMessage("");

      await grantAdminAccessMutation.mutateAsync({
        email: trimmedEmail,
        role: newRole,
      });

      setSuccessMessage(`Acesso ${newRole} liberado para ${trimmedEmail}.`);
      setNewEmail("");
      setNewRole("editor");
      await loadAdmins();
    } catch (err) {
      console.error("Erro ao adicionar ADM:", err);
      setError(err instanceof Error ? err.message : "Não foi possível adicionar o ADM.");
    } finally {
      setAddingAdmin(false);
    }
  }

  async function handleChangeAdminRole(user: AdminUserWithProfile) {
    try {
      setBusyId(user.id);
      setError("");
      setSuccessMessage("");

      const nextRole = user.role === "admin" ? "editor" : "admin";
      await updateAdminRoleMutation.mutateAsync({ id: user.id, role: nextRole });

      setAdminUsers((previous) =>
        previous.map((item) => (item.id === user.id ? { ...item, role: nextRole } : item))
      );
      setSuccessMessage(`Papel alterado para ${nextRole}.`);
    } catch (err) {
      console.error("Erro ao alterar papel:", err);
      setError(err instanceof Error ? err.message : "Não foi possível alterar o papel.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemoveAdminAccess(user: AdminUserWithProfile) {
    const confirmed = window.confirm(`Remover acesso administrativo de ${user.profile?.email || user.user_id}?`);
    if (!confirmed) return;

    try {
      setBusyId(user.id);
      setError("");
      setSuccessMessage("");

      await removeAdminAccessMutation.mutateAsync({ id: user.id });

      setAdminUsers((previous) => previous.filter((item) => item.id !== user.id));
      setSuccessMessage("Acesso administrativo removido.");
    } catch (err) {
      console.error("Erro ao remover ADM:", err);
      setError(err instanceof Error ? err.message : "Não foi possível remover o acesso.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminGuard allowedRoles={["admin"]}>
      <AdminLayout
        title="Alunos e acessos"
        subtitle="Gerencie alunos, assinaturas, renovações manuais, bloqueios e acessos administrativos."
      >
        <Card className="border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white">
                <Users className="h-3.5 w-3.5" />
                Central administrativa
              </div>

              <h2 className="text-2xl font-black text-slate-950">Área de alunos</h2>
              <p className="mt-1 text-sm text-slate-500">
                Controle assinatura, liberação manual, vencimento e status do aluno sem abrir o Supabase.
              </p>
            </div>

            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={loadAll}
              disabled={loading}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card className="border-slate-200 bg-white p-5">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Total</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{stats.total}</p>
            <p className="text-sm text-slate-500">alunos cadastrados</p>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-600">Acessos liberados</p>
            <p className="mt-2 text-3xl font-black text-emerald-700">{stats.active}</p>
            <p className="text-sm text-emerald-700/80">com acesso liberado</p>
          </Card>

          <Card className="border-amber-200 bg-amber-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">Pendentes</p>
            <p className="mt-2 text-3xl font-black text-amber-700">{stats.pending}</p>
            <p className="text-sm text-amber-700/80">aguardando confirmação</p>
          </Card>

          <Card className="border-orange-200 bg-orange-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-600">Vencidos</p>
            <p className="mt-2 text-3xl font-black text-orange-700">{stats.expired}</p>
            <p className="text-sm text-orange-700/80">precisam renovar</p>
          </Card>

          <Card className="border-red-200 bg-red-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-red-600">Bloqueados</p>
            <p className="mt-2 text-3xl font-black text-red-700">{stats.blocked}</p>
            <p className="text-sm text-red-700/80">perfil inativo</p>
          </Card>
        </div>

        <Card className="border-slate-200 bg-white p-4">
          <div className="flex flex-wrap gap-3">
            <Button
              variant={viewMode === "alunos" ? "default" : "outline"}
              className="rounded-2xl"
              onClick={() => setViewMode("alunos")}
            >
              <Users className="mr-2 h-4 w-4" />
              Alunos
            </Button>

            <Button
              variant={viewMode === "adms" ? "default" : "outline"}
              className="rounded-2xl"
              onClick={() => setViewMode("adms")}
            >
              <Shield className="mr-2 h-4 w-4" />
              ADMs e editores
            </Button>
          </div>
        </Card>

        {loading ? (
          <Card className="flex items-center justify-center gap-3 p-10">
            <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
            <p className="text-slate-600">Carregando alunos e assinaturas...</p>
          </Card>
        ) : null}

        {!loading && error ? (
          <Card className="border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
              <div>
                <h2 className="text-lg font-bold text-red-700">Erro</h2>
                <p className="mt-1 text-red-600">{error}</p>
              </div>
            </div>
          </Card>
        ) : null}

        {!loading && successMessage ? (
          <Card className="border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <p className="font-medium text-emerald-700">{successMessage}</p>
            </div>
          </Card>
        ) : null}

        {!loading && viewMode === "alunos" ? (
          <>
            <Card className="border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-black text-slate-950">Criar aluno manualmente</h2>

              <form onSubmit={handleCreateStudent} className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Nome</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(event) => setStudentName(event.target.value)}
                    placeholder="Nome do aluno"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">E-mail</label>
                  <input
                    type="email"
                    value={studentEmail}
                    onChange={(event) => setStudentEmail(event.target.value)}
                    placeholder="email@exemplo.com"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Senha inicial</label>
                  <input
                    type="text"
                    value={studentPassword}
                    onChange={(event) => setStudentPassword(event.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <Button type="submit" disabled={creatingStudent} className="min-h-[46px] rounded-2xl">
                  {creatingStudent ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar
                    </>
                  )}
                </Button>
              </form>
            </Card>

            <Card className="border-slate-200 bg-white p-6">
              <div className="grid gap-4 xl:grid-cols-[1fr_220px_220px]">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(event) => setStudentSearch(event.target.value)}
                    placeholder="Buscar por nome, e-mail, telefone, plano ou ID..."
                    className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as StudentStatusFilter)}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="all">Todos os status</option>
                  <option value="active">Assinatura ativa</option>
                  <option value="manual_review">Aguardando pagamento</option>
                  <option value="expired">Vencidos</option>
                  <option value="overdue">Em atraso</option>
                  <option value="canceled">Cancelados</option>
                  <option value="without_subscription">Sem assinatura</option>
                  <option value="blocked">Perfil bloqueado</option>
                </select>

                <select
                  value={planFilter}
                  onChange={(event) => setPlanFilter(event.target.value)}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="all">Todos os planos</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} • {formatMoney(plan.price_cents)}
                    </option>
                  ))}
                </select>
              </div>
            </Card>

            {filteredStudents.length === 0 ? (
              <Card className="border-slate-200 p-10 text-center">
                <UserCircle2 className="mx-auto mb-3 h-9 w-9 text-slate-400" />
                <h3 className="text-lg font-black text-slate-950">Nenhum aluno encontrado</h3>
                <p className="mt-1 text-slate-500">Tente outro filtro ou busca.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredStudents.map((student) => {
                  const status = getSubscriptionStatus(student);
                  const draft = studentDrafts[student.id] || {
                    planId: student.plan_id || plans[0]?.id || "",
                    months: "1",
                  };
                  const isBusy = busyId === student.id;
                  const isSaving = savingProfileId === student.id;
                  const attempts = Number(student.attempts_count || 0);
                  const correct = Number(student.correct_count || 0);
                  const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : null;
                  const whatsappUrl = makeWhatsappUrl(student);

                  return (
                    <Card key={student.id} className="border-slate-200 bg-white p-6 shadow-sm">
                      <div className="flex flex-col gap-6 2xl:flex-row 2xl:items-start 2xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-4 flex flex-wrap items-center gap-2">
                            <span className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusBadge(status)}`}>
                              {getStatusLabel(status)}
                            </span>

                            {student.ativo === false ? (
                              <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-black text-red-700">
                                Perfil bloqueado
                              </span>
                            ) : (
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                                Perfil ativo
                              </span>
                            )}

                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                              {student.role || "student"}
                            </span>
                          </div>

                          <div className="grid gap-4 lg:grid-cols-2">
                            <div>
                              <label className="mb-2 block text-sm font-semibold text-slate-700">Nome</label>
                              <input
                                type="text"
                                value={student.nome || ""}
                                onChange={(event) =>
                                  updateLocalProfile(student.id, { nome: event.target.value })
                                }
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-semibold text-slate-700">E-mail</label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={student.email || ""}
                                  disabled
                                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 shadow-sm"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="rounded-2xl"
                                  onClick={() => handleCopyEmail(student.email)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-semibold text-slate-700">Telefone / WhatsApp</label>
                              <input
                                type="text"
                                value={student.telefone || ""}
                                onChange={(event) =>
                                  updateLocalProfile(student.id, { telefone: event.target.value })
                                }
                                placeholder="Telefone não informado"
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-semibold text-slate-700">Status do perfil</label>
                              <select
                                value={student.ativo === false ? "inativo" : "ativo"}
                                onChange={(event) =>
                                  updateLocalProfile(student.id, {
                                    ativo: event.target.value === "ativo",
                                  })
                                }
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                              >
                                <option value="ativo">Ativo</option>
                                <option value="inativo">Inativo</option>
                              </select>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                            <p className="rounded-2xl bg-slate-50 p-3">
                              <span className="block text-xs font-bold uppercase tracking-wide text-slate-400">Plano</span>
                              <span className="font-semibold text-slate-900">
                                {student.plan_name || "Sem plano"}
                              </span>
                            </p>

                            <p className="rounded-2xl bg-slate-50 p-3">
                              <span className="block text-xs font-bold uppercase tracking-wide text-slate-400">Vencimento</span>
                              <span className="font-semibold text-slate-900">
                                {formatDate(student.current_period_end)}
                              </span>
                            </p>

                            <p className="rounded-2xl bg-slate-50 p-3">
                              <span className="block text-xs font-bold uppercase tracking-wide text-slate-400">Último acesso</span>
                              <span className="font-semibold text-slate-900">
                                {formatLastSeen(student.last_seen_at)}
                              </span>
                            </p>

                            <p className="rounded-2xl bg-slate-50 p-3">
                              <span className="block text-xs font-bold uppercase tracking-wide text-slate-400">Questões</span>
                              <span className="font-semibold text-slate-900">
                                {attempts} feitas{accuracy !== null ? ` • ${accuracy}%` : ""}
                              </span>
                            </p>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5" /> {student.email || "Sem e-mail"}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5" /> {formatPhone(student.telefone)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock3 className="h-3.5 w-3.5" /> Cadastro: {formatDate(student.created_at)}
                            </span>
                          </div>
                        </div>

                        <div className="w-full rounded-3xl border border-slate-200 bg-slate-50 p-4 2xl:w-[360px]">
                          <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-950">
                            <CreditCard className="h-4 w-4" />
                            Assinatura manual
                          </h3>

                          <div className="space-y-3">
                            <div>
                              <label className="mb-1 block text-xs font-bold text-slate-600">Plano</label>
                              <select
                                value={draft.planId}
                                onChange={(event) => updateStudentDraft(student.id, { planId: event.target.value })}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
                              >
                                {plans.length === 0 ? <option value="">Nenhum plano</option> : null}
                                {plans.map((plan) => (
                                  <option key={plan.id} value={plan.id}>
                                    {plan.name} • {formatMoney(plan.price_cents)}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-bold text-slate-600">Meses de acesso</label>
                              <input
                                type="number"
                                min={1}
                                max={24}
                                value={draft.months}
                                onChange={(event) => updateStudentDraft(student.id, { months: event.target.value })}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                type="button"
                                className="rounded-2xl"
                                disabled={isBusy}
                                onClick={() => handleRenewStudent(student)}
                              >
                                {isBusy ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                )}
                                {status === "manual_review" ? "Aprovar" : "Renovar"}
                              </Button>

                              <Button
                                type="button"
                                variant="outline"
                                className="rounded-2xl border-red-200 text-red-700 hover:bg-red-50"
                                disabled={isBusy || !student.subscription_id}
                                onClick={() => handleCancelSubscription(student)}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancelar
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                className="rounded-2xl"
                                disabled={isSaving}
                                onClick={() => handleSaveStudent(student)}
                              >
                                {isSaving ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Save className="mr-2 h-4 w-4" />
                                )}
                                Salvar
                              </Button>

                              <Button
                                type="button"
                                variant="outline"
                                className="rounded-2xl"
                                disabled={isBusy}
                                onClick={() => handleToggleStudentActive(student)}
                              >
                                {student.ativo === false ? (
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                ) : (
                                  <Ban className="mr-2 h-4 w-4" />
                                )}
                                {student.ativo === false ? "Reativar" : "Bloquear"}
                              </Button>
                            </div>

                            {whatsappUrl ? (
                              <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
                              >
                                <MessageCircle className="h-4 w-4" />
                                Chamar no WhatsApp do aluno
                              </a>
                            ) : (
                              <button
                                type="button"
                                disabled
                                className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-black text-slate-400"
                              >
                                <MessageCircle className="h-4 w-4" />
                                Sem WhatsApp cadastrado
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        ) : null}

        {!loading && viewMode === "adms" ? (
          <>
            <Card className="border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-black text-slate-950">Adicionar acesso administrativo</h2>

              <div className="grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">E-mail do usuário</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(event) => setNewEmail(event.target.value)}
                    placeholder="email@exemplo.com"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Papel</label>
                  <select
                    value={newRole}
                    onChange={(event) => setNewRole(event.target.value as "admin" | "editor")}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <Button onClick={handleAddAdminAccess} disabled={addingAdmin} className="rounded-2xl">
                  {addingAdmin ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  Liberar
                </Button>
              </div>
            </Card>

            <Card className="border-slate-200 bg-white p-6">
              <div className="relative mb-5">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchAdmins}
                  onChange={(event) => setSearchAdmins(event.target.value)}
                  placeholder="Buscar administrador/editor..."
                  className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="space-y-3">
                {filteredAdmins.map((adminUser) => (
                  <div
                    key={adminUser.id}
                    className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white">
                          {adminUser.role}
                        </span>
                        <span className="text-xs text-slate-500">Criado em {formatDate(adminUser.created_at)}</span>
                      </div>
                      <p className="text-lg font-black text-slate-950">
                        {adminUser.profile?.nome || adminUser.profile?.email || "Usuário sem perfil"}
                      </p>
                      <p className="text-sm text-slate-500">{adminUser.profile?.email || adminUser.user_id}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        className="rounded-2xl"
                        disabled={busyId === adminUser.id}
                        onClick={() => handleChangeAdminRole(adminUser)}
                      >
                        Trocar para {adminUser.role === "admin" ? "editor" : "admin"}
                      </Button>

                      <Button
                        variant="outline"
                        className="rounded-2xl border-red-200 text-red-700 hover:bg-red-50"
                        disabled={busyId === adminUser.id}
                        onClick={() => handleRemoveAdminAccess(adminUser)}
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        ) : null}
      </AdminLayout>
    </AdminGuard>
  );
}
