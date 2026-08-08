import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminGuard from "@/components/admin/AdminGuard";
import { trpc } from "@/lib/trpc";
import {
  Users,
  FileText,
  Blocks,
  Image,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Clock3,
  UserCircle2,
  EyeOff,
  BookOpenCheck,
} from "lucide-react";
import { Link } from "wouter";

type DashboardStats = {
  totalUsers: number;
  totalAdmins: number;
  totalQuestions: number;
  totalQuestionsWithoutResolution: number;
  totalUnpublishedQuestions: number;
  totalResolutions: number;
  totalResolutionImages: number;
};

type LatestQuestion = {
  id: string;
  codigo?: string | null;
  enunciado?: string | null;
  banca?: string | null;
  ano?: number | null;
  created_at?: string | null;
  publicada?: boolean | null;
};

type LatestResolution = {
  id: string;
  questao_id: string;
  tipo?: string | null;
  ordem?: number | null;
  codigo_resolucao?: string | null;
  created_at?: string | null;
};

type LatestUser = {
  id: string;
  nome?: string | null;
  email?: string | null;
  role?: string | null;
  ativo?: boolean | null;
  created_at?: string | null;
};

type QuestionWithoutResolution = {
  id: string;
  codigo?: string | null;
  enunciado?: string | null;
  banca?: string | null;
  ano?: number | null;
  created_at?: string | null;
};

function StatCard({
  title,
  value,
  icon: Icon,
  tone,
  helper,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  tone: "blue" | "purple" | "orange" | "emerald" | "red" | "slate" | "indigo";
  helper?: string;
}) {
  const tones = {
    blue: "from-blue-50 to-blue-100 border-blue-200 text-blue-700",
    purple: "from-purple-50 to-purple-100 border-purple-200 text-purple-700",
    orange: "from-orange-50 to-orange-100 border-orange-200 text-orange-700",
    emerald: "from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-700",
    red: "from-red-50 to-red-100 border-red-200 text-red-700",
    slate: "from-slate-50 to-slate-100 border-slate-200 text-slate-700",
    indigo: "from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-700",
  };

  return (
    <Card className={`p-6 bg-gradient-to-br ${tones[tone]}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          {helper ? <p className="text-xs text-slate-500 mt-2">{helper}</p> : null}
        </div>

        <div className="w-12 h-12 rounded-2xl bg-white/70 flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}

function QuickLinkCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <button className="w-full text-left rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
        </div>
      </button>
    </Link>
  );
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

function truncateText(text?: string | null, max = 110) {
  const value = (text || "").trim();
  if (!value) return "Sem descrição";
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalAdmins: 0,
    totalQuestions: 0,
    totalQuestionsWithoutResolution: 0,
    totalUnpublishedQuestions: 0,
    totalResolutions: 0,
    totalResolutionImages: 0,
  });

  const [latestQuestions, setLatestQuestions] = useState<LatestQuestion[]>([]);
  const [latestResolutions, setLatestResolutions] = useState<LatestResolution[]>([]);
  const [latestUsers, setLatestUsers] = useState<LatestUser[]>([]);
  const [latestQuestionsWithoutResolution, setLatestQuestionsWithoutResolution] =
    useState<QuestionWithoutResolution[]>([]);

  const trpcUtils = trpc.useUtils();

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const dashboard = await trpcUtils.admin.getDashboardStats.fetch();

        setStats(dashboard.stats);
        setLatestQuestions(dashboard.latestQuestions as LatestQuestion[]);
        setLatestResolutions(dashboard.latestResolutions as LatestResolution[]);
        setLatestUsers(dashboard.latestUsers as LatestUser[]);
        setLatestQuestionsWithoutResolution(
          dashboard.latestQuestionsWithoutResolution as QuestionWithoutResolution[]
        );
      } catch (err) {
        console.error("Erro inesperado no dashboard ADM:", err);
        setError("Ocorreu um erro inesperado ao carregar o dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [trpcUtils]);

  return (
    <AdminGuard>
      <AdminLayout
        title="Dashboard ADM"
        subtitle="Gerencie usuários, perfis, acessos administrativos, questões, resoluções, uploads e a estrutura estratégica do sistema."
      >
        {loading ? (
          <Card className="p-10 flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
            <p className="text-slate-600">Carregando dados reais do dashboard...</p>
          </Card>
        ) : error ? (
          <Card className="p-8 border-red-200 bg-red-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h2 className="text-lg font-bold text-red-700 mb-1">Erro no dashboard</h2>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          </Card>
        ) : (
          <>
            <div className="grid md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7 gap-4">
              <StatCard
                title="Usuários cadastrados"
                value={String(stats.totalUsers)}
                icon={UserCircle2}
                tone="indigo"
                helper="Contagem real da tabela profiles"
              />
              <StatCard
                title="Acessos administrativos"
                value={String(stats.totalAdmins)}
                icon={Users}
                tone="blue"
                helper="Contagem da tabela admin_users"
              />
              <StatCard
                title="Questões cadastradas"
                value={String(stats.totalQuestions)}
                icon={FileText}
                tone="purple"
                helper="Contagem real da tabela questoes"
              />
              <StatCard
                title="Sem resolução"
                value={String(stats.totalQuestionsWithoutResolution)}
                icon={BookOpenCheck}
                tone="red"
                helper="Questões sem nenhum bloco em resolucoes"
              />
              <StatCard
                title="Não publicadas"
                value={String(stats.totalUnpublishedQuestions)}
                icon={EyeOff}
                tone="slate"
                helper="Questões com publicada = false"
              />
              <StatCard
                title="Blocos de resolução"
                value={String(stats.totalResolutions)}
                icon={Blocks}
                tone="orange"
                helper="Contagem real da tabela resolucoes"
              />
              <StatCard
                title="Imagens nas resoluções"
                value={String(stats.totalResolutionImages)}
                icon={Image}
                tone="emerald"
                helper="Blocos com url_imagem preenchida"
              />
            </div>

            <div className="grid xl:grid-cols-2 gap-6">
              <Card className="p-6 bg-white border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <Clock3 className="w-5 h-5 text-slate-500" />
                  <h2 className="text-xl font-bold text-slate-900">Últimas questões</h2>
                </div>

                {latestQuestions.length > 0 ? (
                  <div className="space-y-3">
                    {latestQuestions.map((question) => (
                      <div
                        key={question.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <p className="font-bold text-slate-900">
                              {question.codigo || "Sem código"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {question.banca || "Sem banca"} • {question.ano || "Sem ano"}
                            </p>
                          </div>

                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            {formatDate(question.created_at)}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600 leading-relaxed mb-2">
                          {truncateText(question.enunciado)}
                        </p>

                        <p className="text-xs text-slate-500">
                          Status:{" "}
                          <span className="font-semibold">
                            {question.publicada ? "Publicada" : "Não publicada"}
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Nenhuma questão cadastrada ainda.</p>
                )}
              </Card>

              <Card className="p-6 bg-white border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <Clock3 className="w-5 h-5 text-slate-500" />
                  <h2 className="text-xl font-bold text-slate-900">
                    Últimos blocos de resolução
                  </h2>
                </div>

                {latestResolutions.length > 0 ? (
                  <div className="space-y-3">
                    {latestResolutions.map((resolution) => (
                      <div
                        key={resolution.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <p className="font-bold text-slate-900">
                              {resolution.codigo_resolucao || "Sem código"}
                            </p>
                            <p className="text-xs text-slate-500">
                              Questão: {resolution.questao_id}
                            </p>
                          </div>

                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            {formatDate(resolution.created_at)}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600">
                          Tipo:{" "}
                          <span className="font-semibold">
                            {resolution.tipo || "não informado"}
                          </span>{" "}
                          • Ordem:{" "}
                          <span className="font-semibold">{resolution.ordem ?? "-"}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    Nenhum bloco de resolução cadastrado ainda.
                  </p>
                )}
              </Card>
            </div>

            <div className="grid xl:grid-cols-2 gap-6">
              <Card className="p-6 bg-white border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-slate-500" />
                  <h2 className="text-xl font-bold text-slate-900">Últimos usuários</h2>
                </div>

                {latestUsers.length > 0 ? (
                  <div className="space-y-3">
                    {latestUsers.map((user) => (
                      <div
                        key={user.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <p className="font-bold text-slate-900">
                              {user.nome || "Sem nome"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {user.email || "Sem email"}
                            </p>
                          </div>

                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            {formatDate(user.created_at)}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600">
                          Role: <span className="font-semibold">{user.role || "sem role"}</span> •{" "}
                          Status:{" "}
                          <span className="font-semibold">
                            {user.ativo ? "Ativo" : "Inativo"}
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Nenhum usuário cadastrado ainda.</p>
                )}
              </Card>

              <Card className="p-6 bg-white border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpenCheck className="w-5 h-5 text-slate-500" />
                  <h2 className="text-xl font-bold text-slate-900">
                    Últimas questões sem resolução
                  </h2>
                </div>

                {latestQuestionsWithoutResolution.length > 0 ? (
                  <div className="space-y-3">
                    {latestQuestionsWithoutResolution.map((question) => (
                      <div
                        key={question.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <p className="font-bold text-slate-900">
                              {question.codigo || "Sem código"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {question.banca || "Sem banca"} • {question.ano || "Sem ano"}
                            </p>
                          </div>

                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            {formatDate(question.created_at)}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600 leading-relaxed">
                          {truncateText(question.enunciado)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    Todas as questões já têm resolução cadastrada.
                  </p>
                )}
              </Card>
            </div>

            <Card className="p-6 bg-white border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Ações rápidas</h2>
              <p className="text-sm text-slate-500 mb-6">
                Esse painel centraliza o núcleo do sistema administrativo e destaca o que
                ainda está pendente no banco.
              </p>

              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                <QuickLinkCard
                  title="Gerenciar usuários"
                  description="Acessar a central de usuários, perfis e acessos administrativos do sistema."
                  href="/admin/usuarios"
                />
                <QuickLinkCard
                  title="Gerenciar questões"
                  description="Cadastrar, editar, publicar e organizar questões do banco."
                  href="/admin/questoes"
                />
                <QuickLinkCard
                  title="Gerenciar resoluções"
                  description="Montar explicações por blocos com texto, latex e imagem."
                  href="/admin/resolucoes"
                />
                <QuickLinkCard
                  title="Gerenciar uploads"
                  description="Enviar imagens para o bucket e reutilizar assets visuais."
                  href="/admin/uploads"
                />
                <QuickLinkCard
                  title="Gerenciar VET"
                  description="Ajustar pesos, prioridades e estrutura estratégica do VET."
                  href="/admin/vet"
                />
                <QuickLinkCard
                  title="Ver logs"
                  description="Acompanhar ações administrativas e histórico do sistema."
                  href="/admin/logs"
                />
              </div>
            </Card>
          </>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}
