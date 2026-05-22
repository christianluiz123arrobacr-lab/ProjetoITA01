import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminGuard from "@/components/admin/AdminGuard";
import { supabase } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";
import {
  Loader2,
  AlertTriangle,
  Shield,
  ShieldCheck,
  Trash2,
  RefreshCcw,
  Plus,
  Search,
  Save,
  UserCircle2,
  Users,
  Clock3,
  Phone,
} from "lucide-react";

type AdminUserRow = {
  id: string;
  user_id: string;
  role: "admin" | "editor";
  created_at: string;
};

type ProfileRow = {
  id: string;
  nome: string;
  email: string;
  telefone?: string | null;
  role: string;
  ativo: boolean;
  created_at: string;
  last_seen_at?: string | null;
};

type AdminUserWithProfile = AdminUserRow & {
  profile?: ProfileRow | null;
};

type UsersViewMode = "usuarios" | "adms";

function formatDate(date?: string | null) {
  if (!date) return "Sem data";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Sem data";

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
  const diffMs = now.getTime() - parsed.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Agora há pouco";
  if (diffMinutes < 60) return `Há ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) return `Há ${diffHours} h`;

  return formatDate(date);
}

function formatPhone(phone?: string | null) {
  const clean = (phone || "").trim();

  return clean || "Não informado";
}

export default function AdminUsersPage() {
  const createStudentMutation = trpc.admin.createStudent.useMutation();

  const [users, setUsers] = useState<AdminUserWithProfile[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [busyProfileId, setBusyProfileId] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "editor">("editor");
  const [addingUser, setAddingUser] = useState(false);

  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [creatingStudent, setCreatingStudent] = useState(false);

  const [searchAdmins, setSearchAdmins] = useState("");
  const [searchProfiles, setSearchProfiles] = useState("");

  const [viewMode, setViewMode] = useState<UsersViewMode>("usuarios");

  async function loadAll() {
    try {
      setLoading(true);
      setError("");

      const [adminUsersResult, profilesResult] = await Promise.all([
        supabase
          .from("admin_users")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      if (adminUsersResult.error) {
        console.error("Erro ao carregar admin_users:", adminUsersResult.error);
        setError("Não foi possível carregar os acessos administrativos.");
        return;
      }

      if (profilesResult.error) {
        console.error("Erro ao carregar profiles:", profilesResult.error);
        setError("Não foi possível carregar os perfis dos usuários.");
        return;
      }

      const adminRows = (adminUsersResult.data as AdminUserRow[]) || [];
      const profileRows = (profilesResult.data as ProfileRow[]) || [];

      const profileMap = new Map(
        profileRows.map((profile) => [profile.id, profile])
      );

      const merged: AdminUserWithProfile[] = adminRows.map((user) => ({
        ...user,
        profile: profileMap.get(user.user_id) || null,
      }));

      setProfiles(profileRows);
      setUsers(merged);
    } catch (err) {
      console.error("Erro inesperado ao carregar módulo de usuários:", err);
      setError("Ocorreu um erro inesperado ao carregar os dados dos usuários.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const filteredAdmins = useMemo(() => {
    const term = searchAdmins.trim().toLowerCase();

    if (!term) return users;

    return users.filter((user) => {
      const nome = (user.profile?.nome || "").toLowerCase();
      const email = (user.profile?.email || "").toLowerCase();
      const telefone = (user.profile?.telefone || "").toLowerCase();
      const adminRole = (user.role || "").toLowerCase();
      const profileRole = (user.profile?.role || "").toLowerCase();
      const userId = (user.user_id || "").toLowerCase();

      return (
        nome.includes(term) ||
        email.includes(term) ||
        telefone.includes(term) ||
        adminRole.includes(term) ||
        profileRole.includes(term) ||
        userId.includes(term)
      );
    });
  }, [users, searchAdmins]);

  const filteredProfiles = useMemo(() => {
    const term = searchProfiles.trim().toLowerCase();

    if (!term) return profiles;

    return profiles.filter((profile) => {
      const nome = (profile.nome || "").toLowerCase();
      const email = (profile.email || "").toLowerCase();
      const telefone = (profile.telefone || "").toLowerCase();
      const role = (profile.role || "").toLowerCase();
      const id = (profile.id || "").toLowerCase();

      return (
        nome.includes(term) ||
        email.includes(term) ||
        telefone.includes(term) ||
        role.includes(term) ||
        id.includes(term)
      );
    });
  }, [profiles, searchProfiles]);

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

      await createStudentMutation.mutateAsync({
        nome,
        email,
        senha,
      });

      setSuccessMessage(
        `Aluno ${nome} criado com sucesso. Ele já pode fazer login com ${email}.`
      );

      setStudentName("");
      setStudentEmail("");
      setStudentPassword("");
      setSearchProfiles(email);

      await loadAll();
    } catch (err) {
      console.error("Erro ao criar aluno:", err);

      const message =
        err instanceof Error
          ? err.message
          : "Não foi possível criar o aluno. Confira se o e-mail já existe ou se a chave SUPABASE_SERVICE_ROLE_KEY está configurada.";

      setError(message);
    } finally {
      setCreatingStudent(false);
    }
  }

  async function handleAddAccess() {
    try {
      setAddingUser(true);
      setError("");
      setSuccessMessage("");

      const trimmedEmail = newEmail.trim().toLowerCase();

      if (!trimmedEmail) {
        setError("Digite um email válido.");
        return;
      }

      const foundProfile = profiles.find(
        (profile) => profile.email.trim().toLowerCase() === trimmedEmail
      );

      if (!foundProfile) {
        setError("Nenhum usuário com esse email foi encontrado na tabela profiles.");
        return;
      }

      const { error } = await supabase.from("admin_users").upsert(
        {
          user_id: foundProfile.id,
          role: newRole,
        },
        {
          onConflict: "user_id",
        }
      );

      if (error) {
        console.error("Erro ao adicionar acesso administrativo:", error);
        setError("Não foi possível adicionar o acesso administrativo.");
        return;
      }

      setSuccessMessage(
        `Acesso ${newRole} adicionado/atualizado com sucesso para ${foundProfile.email}.`
      );

      setNewEmail("");
      setNewRole("editor");

      await loadAll();
    } catch (err) {
      console.error("Erro inesperado ao adicionar acesso:", err);
      setError("Ocorreu um erro inesperado ao adicionar o acesso.");
    } finally {
      setAddingUser(false);
    }
  }

  async function handleChangeRole(user: AdminUserWithProfile) {
    try {
      setBusyUserId(user.id);
      setError("");
      setSuccessMessage("");

      const nextRole = user.role === "admin" ? "editor" : "admin";

      const { error } = await supabase
        .from("admin_users")
        .update({ role: nextRole })
        .eq("id", user.id);

      if (error) {
        console.error("Erro ao alterar papel do usuário:", error);
        setError("Não foi possível alterar o papel do usuário.");
        return;
      }

      setUsers((prev) =>
        prev.map((item) =>
          item.id === user.id ? { ...item, role: nextRole } : item
        )
      );

      setSuccessMessage(`Papel alterado com sucesso para ${nextRole}.`);
    } catch (err) {
      console.error("Erro inesperado ao alterar papel:", err);
      setError("Ocorreu um erro inesperado ao alterar o papel.");
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleRemoveAccess(user: AdminUserWithProfile) {
    try {
      setBusyUserId(user.id);
      setError("");
      setSuccessMessage("");

      const { error } = await supabase
        .from("admin_users")
        .delete()
        .eq("id", user.id);

      if (error) {
        console.error("Erro ao remover acesso administrativo:", error);
        setError("Não foi possível remover o acesso administrativo.");
        return;
      }

      setUsers((prev) => prev.filter((item) => item.id !== user.id));
      setSuccessMessage("Acesso administrativo removido com sucesso.");
    } catch (err) {
      console.error("Erro inesperado ao remover acesso:", err);
      setError("Ocorreu um erro inesperado ao remover o acesso.");
    } finally {
      setBusyUserId(null);
    }
  }

  function updateLocalProfile(id: string, patch: Partial<ProfileRow>) {
    setProfiles((prev) =>
      prev.map((profile) =>
        profile.id === id ? { ...profile, ...patch } : profile
      )
    );

    setUsers((prev) =>
      prev.map((adminUser) =>
        adminUser.profile?.id === id
          ? {
              ...adminUser,
              profile: {
                ...adminUser.profile,
                ...patch,
              },
            }
          : adminUser
      )
    );
  }

  async function handleSaveProfile(profile: ProfileRow) {
    try {
      setBusyProfileId(profile.id);
      setError("");
      setSuccessMessage("");

      const { error } = await supabase
        .from("profiles")
        .update({
          nome: profile.nome,
          telefone: profile.telefone || null,
          role: profile.role,
          ativo: profile.ativo,
        })
        .eq("id", profile.id);

      if (error) {
        console.error("Erro ao salvar perfil:", error);
        setError("Não foi possível salvar as alterações do perfil.");
        return;
      }

      setSuccessMessage(
        `Perfil de ${profile.nome || profile.email} salvo com sucesso.`
      );
    } catch (err) {
      console.error("Erro inesperado ao salvar perfil:", err);
      setError("Ocorreu um erro inesperado ao salvar o perfil.");
    } finally {
      setBusyProfileId(null);
    }
  }

  return (
    <AdminGuard allowedRoles={["admin"]}>
      <AdminLayout
        title="Usuários ADM"
        subtitle="Central de gerenciamento de usuários, acessos administrativos e último acesso."
      >
        <Card className="p-6 bg-white border-slate-200">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                Central de usuários
              </h2>

              <p className="text-sm text-slate-500">
                {profiles.length} usuários cadastrados • {users.length} acessos administrativos
              </p>
            </div>

            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={loadAll}
              disabled={loading}
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Atualizar tudo
            </Button>
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex flex-wrap gap-3">
            <Button
              variant={viewMode === "usuarios" ? "default" : "outline"}
              className="rounded-2xl"
              onClick={() => setViewMode("usuarios")}
            >
              <Users className="w-4 h-4 mr-2" />
              Usuários
            </Button>

            <Button
              variant={viewMode === "adms" ? "default" : "outline"}
              className="rounded-2xl"
              onClick={() => setViewMode("adms")}
            >
              <Shield className="w-4 h-4 mr-2" />
              ADMs
            </Button>
          </div>
        </Card>

        {loading ? (
          <Card className="p-10 flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
            <p className="text-slate-600">Carregando dados dos usuários...</p>
          </Card>
        ) : null}

        {!loading && error ? (
          <Card className="p-6 border-red-200 bg-red-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />

              <div>
                <h2 className="text-lg font-bold text-red-700 mb-1">
                  Erro no módulo de usuários
                </h2>

                <p className="text-red-600">{error}</p>
              </div>
            </div>
          </Card>
        ) : null}

        {!loading && successMessage ? (
          <Card className="p-5 border-emerald-200 bg-emerald-50">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <p className="text-emerald-700 font-medium">{successMessage}</p>
            </div>
          </Card>
        ) : null}

        {viewMode === "adms" ? (
          <>
            <Card className="p-6 bg-white border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Adicionar novo acesso administrativo por email
              </h2>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email do usuário
                  </label>

                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Digite o email do usuário"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Papel administrativo
                  </label>

                  <select
                    value={newRole}
                    onChange={(e) =>
                      setNewRole(e.target.value as "admin" | "editor")
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <Button
                  onClick={handleAddAccess}
                  disabled={addingUser}
                  className="rounded-2xl"
                >
                  {addingUser ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adicionando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar acesso
                    </>
                  )}
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-white border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Acessos administrativos
              </h2>

              <div className="relative w-full mb-5">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />

                <input
                  type="text"
                  value={searchAdmins}
                  onChange={(e) => setSearchAdmins(e.target.value)}
                  placeholder="Buscar por nome, email, telefone, papel ou user_id..."
                  className="w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {filteredAdmins.length === 0 ? (
                <Card className="p-10 text-center border-slate-200">
                  <Shield className="w-8 h-8 text-slate-400 mx-auto mb-3" />

                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    Nenhum acesso administrativo encontrado
                  </h3>

                  <p className="text-slate-500">
                    Quando houver registros na tabela admin_users, eles aparecerão aqui.
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredAdmins.map((user) => {
                    const busy = busyUserId === user.id;

                    return (
                      <Card
                        key={user.id}
                        className="p-6 bg-white border-slate-200 shadow-sm"
                      >
                        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold">
                                {user.role}
                              </span>

                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                  user.role === "admin"
                                    ? "bg-blue-100 text-blue-700 border-blue-200"
                                    : "bg-purple-100 text-purple-700 border-purple-200"
                                }`}
                              >
                                {user.role === "admin" ? "Administrador" : "Editor"}
                              </span>

                              {user.profile?.ativo === false ? (
                                <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-red-100 text-red-700 border-red-200">
                                  Inativo
                                </span>
                              ) : (
                                <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-100 text-emerald-700 border-emerald-200">
                                  Ativo
                                </span>
                              )}
                            </div>

                            <div className="space-y-2 text-sm text-slate-600">
                              <p>
                                <span className="font-semibold text-slate-800">Nome:</span>{" "}
                                {user.profile?.nome || "Sem nome"}
                              </p>

                              <p>
                                <span className="font-semibold text-slate-800">Email:</span>{" "}
                                {user.profile?.email || "Sem email"}
                              </p>

                              <p className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-slate-400" />
                                <span className="font-semibold text-slate-800">Telefone:</span>{" "}
                                {formatPhone(user.profile?.telefone)}
                              </p>

                              <p>
                                <span className="font-semibold text-slate-800">Role do profile:</span>{" "}
                                {user.profile?.role || "Sem role"}
                              </p>

                              <p className="flex items-center gap-2">
                                <Clock3 className="w-4 h-4 text-slate-400" />
                                <span className="font-semibold text-slate-800">Último acesso:</span>{" "}
                                {formatLastSeen(user.profile?.last_seen_at)}
                              </p>

                              <p>
                                <span className="font-semibold text-slate-800">User ID:</span>{" "}
                                <span className="font-mono break-all">{user.user_id}</span>
                              </p>

                              <p>
                                <span className="font-semibold text-slate-800">Criado em:</span>{" "}
                                {formatDate(user.created_at)}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3 shrink-0">
                            <Button
                              variant="outline"
                              className="rounded-2xl"
                              onClick={() => handleChangeRole(user)}
                              disabled={busy}
                            >
                              {busy ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <RefreshCcw className="w-4 h-4 mr-2" />
                              )}
                              Tornar {user.role === "admin" ? "editor" : "admin"}
                            </Button>

                            <Button
                              variant="outline"
                              className="rounded-2xl border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => handleRemoveAccess(user)}
                              disabled={busy}
                            >
                              {busy ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4 mr-2" />
                              )}
                              Remover acesso
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </Card>
          </>
        ) : (
          <>
            <Card className="p-6 bg-white border-slate-200">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Criar novo aluno
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Crie a conta do aluno no Supabase Auth e o perfil dele automaticamente.
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleCreateStudent}
                className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end"
              >
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Nome do aluno
                  </label>

                  <input
                    type="text"
                    value={studentName}
                    onChange={(event) => setStudentName(event.target.value)}
                    placeholder="Ex: João Silva"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    E-mail
                  </label>

                  <input
                    type="email"
                    value={studentEmail}
                    onChange={(event) => setStudentEmail(event.target.value)}
                    placeholder="aluno@email.com"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Senha inicial
                  </label>

                  <input
                    type="text"
                    value={studentPassword}
                    onChange={(event) => setStudentPassword(event.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    Depois você envia essa senha para o aluno. Manual, mas controlado.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={creatingStudent}
                  className="rounded-2xl min-h-[46px]"
                >
                  {creatingStudent ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar aluno
                    </>
                  )}
                </Button>
              </form>
            </Card>

            <Card className="p-6 bg-white border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Usuários do sistema
              </h2>

              <div className="relative w-full mb-5">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />

                <input
                  type="text"
                  value={searchProfiles}
                  onChange={(e) => setSearchProfiles(e.target.value)}
                  placeholder="Buscar por nome, email, telefone, role ou id..."
                  className="w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {filteredProfiles.length === 0 ? (
                <Card className="p-10 text-center border-slate-200">
                  <UserCircle2 className="w-8 h-8 text-slate-400 mx-auto mb-3" />

                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    Nenhum perfil encontrado
                  </h3>

                  <p className="text-slate-500">Tente outro termo de busca.</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredProfiles.map((profile) => {
                    const busy = busyProfileId === profile.id;

                    return (
                      <Card
                        key={profile.id}
                        className="p-6 bg-white border-slate-200 shadow-sm"
                      >
                        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                              <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold">
                                {profile.role || "sem role"}
                              </span>

                              {profile.ativo ? (
                                <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-100 text-emerald-700 border-emerald-200">
                                  Ativo
                                </span>
                              ) : (
                                <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-red-100 text-red-700 border-red-200">
                                  Inativo
                                </span>
                              )}
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                  Nome
                                </label>

                                <input
                                  type="text"
                                  value={profile.nome || ""}
                                  onChange={(e) =>
                                    updateLocalProfile(profile.id, {
                                      nome: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                  Email
                                </label>

                                <input
                                  type="text"
                                  value={profile.email || ""}
                                  disabled
                                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 shadow-sm"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                  Telefone
                                </label>

                                <input
                                  type="text"
                                  value={profile.telefone || ""}
                                  onChange={(e) =>
                                    updateLocalProfile(profile.id, {
                                      telefone: e.target.value,
                                    })
                                  }
                                  placeholder="Telefone não informado"
                                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                  Role do perfil
                                </label>

                                <select
                                  value={profile.role || "student"}
                                  onChange={(e) =>
                                    updateLocalProfile(profile.id, {
                                      role: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                >
                                  <option value="student">student</option>
                                  <option value="admin">admin</option>
                                  <option value="editor">editor</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                  Status
                                </label>

                                <select
                                  value={profile.ativo ? "ativo" : "inativo"}
                                  onChange={(e) =>
                                    updateLocalProfile(profile.id, {
                                      ativo: e.target.value === "ativo",
                                    })
                                  }
                                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                >
                                  <option value="ativo">Ativo</option>
                                  <option value="inativo">Inativo</option>
                                </select>
                              </div>
                            </div>

                            <div className="mt-4 space-y-2 text-sm text-slate-600">
                              <p className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-slate-400" />
                                <span className="font-semibold text-slate-800">Telefone:</span>{" "}
                                {formatPhone(profile.telefone)}
                              </p>

                              <p className="flex items-center gap-2">
                                <Clock3 className="w-4 h-4 text-slate-400" />
                                <span className="font-semibold text-slate-800">Último acesso:</span>{" "}
                                {formatLastSeen(profile.last_seen_at)}
                              </p>

                              <p>
                                <span className="font-semibold text-slate-800">ID:</span>{" "}
                                <span className="font-mono break-all">{profile.id}</span>
                              </p>

                              <p>
                                <span className="font-semibold text-slate-800">Criado em:</span>{" "}
                                {formatDate(profile.created_at)}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            <Button
                              className="rounded-2xl min-w-[170px]"
                              onClick={() => handleSaveProfile(profile)}
                              disabled={busy}
                            >
                              {busy ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Salvando...
                                </>
                              ) : (
                                <>
                                  <Save className="w-4 h-4 mr-2" />
                                  Salvar perfil
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </Card>
          </>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}
