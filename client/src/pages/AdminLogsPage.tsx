import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminGuard from "@/components/admin/AdminGuard";
import { trpc } from "@/lib/trpc";
import {
  Loader2,
  AlertTriangle,
  Search,
  Clock3,
  ShieldAlert,
  Info,
  TriangleAlert,
  Database,
} from "lucide-react";

type AdminLogRow = {
  id: string;
  created_at: string;
  actor_user_id?: string | null;
  actor_email?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  description: string;
  level: string;
  metadata?: Record<string, unknown> | null;
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

function prettify(value?: string | null) {
  const text = (value || "").trim();
  if (!text) return "Não informado";
  return text
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getLevelMeta(level?: string | null) {
  const normalized = (level || "").toLowerCase().trim();

  if (normalized === "error") {
    return {
      label: "Erro",
      className: "bg-red-100 text-red-700 border-red-200",
      icon: ShieldAlert,
    };
  }

  if (normalized === "warning") {
    return {
      label: "Aviso",
      className: "bg-yellow-100 text-yellow-700 border-yellow-200",
      icon: TriangleAlert,
    };
  }

  return {
    label: "Info",
    className: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Info,
  };
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AdminLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");

  const trpcUtils = trpc.useUtils();

  useEffect(() => {
    async function loadLogs() {
      try {
        setLoading(true);
        setError("");

        const data = await trpcUtils.admin.listAdminLogs.fetch();
        setLogs(data as AdminLogRow[]);
      } catch (err) {
        console.error("Erro inesperado ao carregar admin logs:", err);
        setError("Ocorreu um erro inesperado ao carregar os logs.");
      } finally {
        setLoading(false);
      }
    }

    loadLogs();
  }, [trpcUtils]);

  const actionOptions = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.action).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [logs]);

  const entityOptions = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.entity_type).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [logs]);

  const levelOptions = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.level).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const term = search.trim().toLowerCase();

    return logs.filter((log) => {
      const action = (log.action || "").toLowerCase();
      const entityType = (log.entity_type || "").toLowerCase();
      const entityId = (log.entity_id || "").toLowerCase();
      const description = (log.description || "").toLowerCase();
      const actorEmail = (log.actor_email || "").toLowerCase();
      const level = (log.level || "").toLowerCase();
      const metadataText = JSON.stringify(log.metadata || {}).toLowerCase();

      const matchesSearch =
        !term ||
        action.includes(term) ||
        entityType.includes(term) ||
        entityId.includes(term) ||
        description.includes(term) ||
        actorEmail.includes(term) ||
        level.includes(term) ||
        metadataText.includes(term);

      const matchesAction = !actionFilter || log.action === actionFilter;
      const matchesEntity = !entityFilter || log.entity_type === entityFilter;
      const matchesLevel = !levelFilter || log.level === levelFilter;

      return matchesSearch && matchesAction && matchesEntity && matchesLevel;
    });
  }, [logs, search, actionFilter, entityFilter, levelFilter]);

  function clearFilters() {
    setSearch("");
    setActionFilter("");
    setEntityFilter("");
    setLevelFilter("");
  }

  return (
    <AdminGuard>
      <AdminLayout
        title="Logs ADM"
        subtitle="Acompanhamento real das ações administrativas registradas no sistema."
      >
        <Card className="p-6 bg-white border-slate-200">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                Histórico administrativo
              </h2>
              <p className="text-sm text-slate-500">
                Exibindo {filteredLogs.length} de {logs.length} logs carregados
              </p>
            </div>

            <div className="relative w-full xl:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por ação, entidade, descrição, email..."
                className="w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border-slate-200">
          <div className="grid md:grid-cols-3 xl:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Ação
              </label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="">Todas</option>
                {actionOptions.map((action) => (
                  <option key={action} value={action}>
                    {prettify(action)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Entidade
              </label>
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="">Todas</option>
                {entityOptions.map((entity) => (
                  <option key={entity} value={entity}>
                    {prettify(entity)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nível
              </label>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="">Todos</option>
                {levelOptions.map((level) => (
                  <option key={level} value={level}>
                    {prettify(level)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                className="rounded-2xl w-full"
                onClick={clearFilters}
              >
                Limpar filtros
              </Button>
            </div>
          </div>
        </Card>

        {loading ? (
          <Card className="p-10 flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
            <p className="text-slate-600">Carregando logs administrativos...</p>
          </Card>
        ) : error ? (
          <Card className="p-8 border-red-200 bg-red-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h2 className="text-lg font-bold text-red-700 mb-1">
                  Erro ao carregar logs
                </h2>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          </Card>
        ) : filteredLogs.length === 0 ? (
          <Card className="p-10 text-center">
            <Database className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              Nenhum log encontrado
            </h2>
            <p className="text-slate-500">
              Ajuste os filtros ou gere novas ações administrativas.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredLogs.map((log) => {
              const levelMeta = getLevelMeta(log.level);
              const LevelIcon = levelMeta.icon;
              const metadataEntries = Object.entries(log.metadata || {}).filter(
                ([, value]) =>
                  value !== null &&
                  value !== undefined &&
                  String(value).trim() !== ""
              );

              return (
                <Card
                  key={log.id}
                  className="p-5 bg-white border-slate-200 shadow-sm"
                >
                  <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${levelMeta.className}`}
                        >
                          <LevelIcon className="w-3.5 h-3.5" />
                          {levelMeta.label}
                        </span>

                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                          {prettify(log.action)}
                        </span>

                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200">
                          {prettify(log.entity_type)}
                        </span>
                      </div>

                      <p className="text-base font-semibold text-slate-900 mb-2">
                        {log.description}
                      </p>

                      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 text-sm text-slate-600">
                        <p>
                          <span className="font-semibold text-slate-800">Data:</span>{" "}
                          {formatDate(log.created_at)}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-800">Email:</span>{" "}
                          {log.actor_email || "Não informado"}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-800">Entidade ID:</span>{" "}
                          {log.entity_id || "—"}
                        </p>
                        <p className="md:col-span-2 xl:col-span-3">
                          <span className="font-semibold text-slate-800">Log ID:</span>{" "}
                          {log.id}
                        </p>
                      </div>

                      {metadataEntries.length > 0 ? (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Clock3 className="w-4 h-4 text-slate-500" />
                            <p className="text-sm font-semibold text-slate-700">
                              Metadata
                            </p>
                          </div>

                          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 text-sm text-slate-600">
                            {metadataEntries.map(([key, value]) => (
                              <p key={key}>
                                <span className="font-semibold text-slate-800">
                                  {prettify(key)}:
                                </span>{" "}
                                {typeof value === "object"
                                  ? JSON.stringify(value)
                                  : String(value)}
                              </p>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}
