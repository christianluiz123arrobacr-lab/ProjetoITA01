import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminGuard from "@/components/admin/AdminGuard";
import { trpc } from "@/lib/trpc";
import {
  Loader2,
  AlertTriangle,
  RefreshCcw,
  Search,
  Save,
  UserCircle2,
  CheckCircle2,
} from "lucide-react";

type ProfileRow = {
  id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  created_at: string;
};

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

export default function AdminProfilesPage() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const trpcUtils = trpc.useUtils();
  const updateProfileMutation = trpc.admin.updateProfile.useMutation();

  const loadProfiles = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await trpcUtils.admin.listProfiles.fetch();
      setProfiles(data as ProfileRow[]);
    } catch (err) {
      console.error("Erro inesperado ao carregar perfis:", err);
      setError("Ocorreu um erro inesperado ao carregar os perfis.");
    } finally {
      setLoading(false);
    }
  }, [trpcUtils]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const filteredProfiles = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return profiles;

    return profiles.filter((profile) => {
      const nome = (profile.nome || "").toLowerCase();
      const email = (profile.email || "").toLowerCase();
      const role = (profile.role || "").toLowerCase();
      const id = (profile.id || "").toLowerCase();

      return (
        nome.includes(term) ||
        email.includes(term) ||
        role.includes(term) ||
        id.includes(term)
      );
    });
  }, [profiles, search]);

  function updateLocalProfile(
    id: string,
    patch: Partial<ProfileRow>
  ) {
    setProfiles((prev) =>
      prev.map((profile) =>
        profile.id === id ? { ...profile, ...patch } : profile
      )
    );
  }

  async function handleSaveProfile(profile: ProfileRow) {
    try {
      setBusyId(profile.id);
      setError("");
      setSuccessMessage("");

      const updatedProfile = await updateProfileMutation.mutateAsync({
        id: profile.id,
        nome: profile.nome,
        role: profile.role as "student" | "admin" | "editor",
        ativo: profile.ativo,
      });

      updateLocalProfile(profile.id, updatedProfile as ProfileRow);
      setSuccessMessage(`Perfil de ${profile.nome || profile.email} salvo com sucesso.`);
    } catch (err) {
      console.error("Erro inesperado ao salvar perfil:", err);
      setError("Ocorreu um erro inesperado ao salvar o perfil.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminGuard>
      <AdminLayout
        title="Perfis ADM"
        subtitle="Gerencie dados básicos dos perfis dos usuários do sistema."
      >
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                Perfis dos usuários
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Total de perfis carregados: {filteredProfiles.length} de {profiles.length}
              </p>
            </div>

            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={loadProfiles}
              disabled={loading}
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Atualizar lista
            </Button>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, email, role ou id..."
              className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-11 pr-4 py-3 text-sm text-slate-700 dark:text-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
            />
          </div>
        </Card>

        {loading ? (
          <Card className="p-10 flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-slate-500 dark:text-slate-400" />
            <p className="text-slate-600 dark:text-slate-300">Carregando perfis...</p>
          </Card>
        ) : null}

        {!loading && error ? (
          <Card className="p-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-300 mt-0.5" />
              <div>
                <h2 className="text-lg font-bold text-red-700 dark:text-red-300 mb-1">
                  Erro no módulo de perfis
                </h2>
                <p className="text-red-600 dark:text-red-300">{error}</p>
              </div>
            </div>
          </Card>
        ) : null}

        {!loading && successMessage ? (
          <Card className="p-5 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
              <p className="text-emerald-700 dark:text-emerald-300 font-medium">{successMessage}</p>
            </div>
          </Card>
        ) : null}

        {!loading && filteredProfiles.length === 0 ? (
          <Card className="p-10 text-center">
            <UserCircle2 className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              Nenhum perfil encontrado
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Tente outro termo de busca.
            </p>
          </Card>
        ) : null}

        {!loading && filteredProfiles.length > 0 ? (
          <div className="space-y-4">
            {filteredProfiles.map((profile) => {
              const busy = busyId === profile.id;

              return (
                <Card
                  key={profile.id}
                  className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold">
                          {profile.role || "sem role"}
                        </span>

                        {profile.ativo ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                            Ativo
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">
                            Inativo
                          </span>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
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
                            className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Email
                          </label>
                          <input
                            type="text"
                            value={profile.email || ""}
                            disabled
                            className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-500 dark:text-slate-400 shadow-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Role do perfil
                          </label>
                          <select
                            value={profile.role || "student"}
                            onChange={(e) =>
                              updateLocalProfile(profile.id, {
                                role: e.target.value,
                              })
                            }
                            className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
                          >
                            <option value="student">student</option>
                            <option value="admin">admin</option>
                            <option value="editor">editor</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Status
                          </label>
                          <select
                            value={profile.ativo ? "ativo" : "inativo"}
                            onChange={(e) =>
                              updateLocalProfile(profile.id, {
                                ativo: e.target.value === "ativo",
                              })
                            }
                            className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
                          >
                            <option value="ativo">Ativo</option>
                            <option value="inativo">Inativo</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                        <p>
                          <span className="font-semibold text-slate-800 dark:text-slate-100">ID:</span>{" "}
                          <span className="font-mono break-all">{profile.id}</span>
                        </p>
                        <p>
                          <span className="font-semibold text-slate-800 dark:text-slate-100">Criado em:</span>{" "}
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
        ) : null}
      </AdminLayout>
    </AdminGuard>
  );
}
