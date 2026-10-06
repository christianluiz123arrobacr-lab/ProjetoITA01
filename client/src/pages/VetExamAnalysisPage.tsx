import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, BarChart3, ExternalLink, Loader2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { trpc } from "@/lib/trpc";
import { VetModuleNav } from "@/components/vet/VetModuleNav";
import { Button } from "@/components/ui/button";
import {
  examAnalysisBankLink,
  type ExamAnalysis,
  type ExamAnalysisFilters,
} from "@shared/vet/examAnalysis";

const panel =
  "rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-700 dark:bg-slate-800";
const muted = "text-sm text-slate-600 dark:text-slate-300";
const percent = (number: number) =>
  `${number.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

function Filter({
  title,
  selected,
  choices,
  onChange,
}: {
  title: string;
  selected?: string;
  choices: Array<{ value: string; label: string }>;
  onChange: (value?: string) => void;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-semibold">
      {title}
      <select
        value={selected ?? ""}
        onChange={event => onChange(event.target.value || undefined)}
        className="w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
      >
        <option value="">Todos</option>
        {choices.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function IncidenceList({
  rows,
  selected,
  onSelect,
  noun,
}: {
  rows: ExamAnalysis["contents"];
  selected?: string;
  onSelect: (key: string) => void;
  noun: string;
}) {
  if (!rows.length)
    return <p className={muted}>Nenhum {noun} associado neste recorte.</p>;
  return (
    <ul className="space-y-3">
      {rows.map(row => (
        <li key={row.key}>
          <button
            onClick={() => onSelect(row.key)}
            aria-pressed={selected === row.key}
            className={`w-full rounded-xl border p-3 text-left focus-visible:outline-2 focus-visible:outline-blue-600 ${selected === row.key ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-slate-200 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700"}`}
          >
            <span className="flex flex-wrap items-start justify-between gap-2">
              <span className="min-w-0 break-words font-semibold">
                {row.label}
              </span>
              <span className="text-sm">
                {row.count} de {row.denominator} questões ·{" "}
                {percent(row.percent)}
              </span>
            </span>
            <span
              aria-hidden="true"
              className="mt-3 block h-2 overflow-hidden rounded bg-slate-200 dark:bg-slate-700"
            >
              <span
                className="block h-full rounded bg-blue-600 dark:bg-blue-400"
                style={{ width: `${row.percent}%` }}
              />
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function VetExamAnalysisPage() {
  const [requested, setRequested] = useState<ExamAnalysisFilters>({});
  const [metric, setMetric] = useState<"count" | "percent">("count");
  const query = trpc.vet.getExamAnalysis.useQuery(requested, {
    retry: false,
    staleTime: 60_000,
  });
  const data = query.data;
  const filters = data?.filters ?? requested;
  const change = (update: Partial<ExamAnalysisFilters>) =>
    setRequested({
      ...filters,
      content: undefined,
      topic: undefined,
      ...update,
    });
  const content = data?.contents.find(row => row.key === filters.content);
  const topic = data?.topics.find(row => row.key === filters.topic);
  const activeLabels = data
    ? [
        data.options.institutions.find(row => row.value === filters.institution)
          ?.label,
        data.options.subjects.find(row => row.value === filters.subject)?.label,
        data.options.exams.find(row => row.value === filters.exam)?.label,
        filters.year ? String(filters.year) : "Todos os anos",
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <div className="theme-page min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white px-4 py-5 dark:border-slate-700 dark:bg-slate-800">
        <div className="container flex flex-wrap items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/vet">
              <ArrowLeft className="mr-2 h-4 w-4" />
              VET
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Análise das provas</h1>
            <p className={muted}>
              Explore conteúdos e assuntos das questões publicadas, por
              instituição e ano.
            </p>
          </div>
        </div>
      </header>
      <VetModuleNav />
      <main className="container space-y-6 py-6">
        <section className={panel} aria-label="Filtros da análise">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Filter
              title="Instituição"
              selected={filters.institution}
              choices={data?.options.institutions ?? []}
              onChange={institution =>
                change({
                  institution,
                  subject: undefined,
                  exam: undefined,
                  year: undefined,
                })
              }
            />
            <Filter
              title="Disciplina"
              selected={filters.subject}
              choices={data?.options.subjects ?? []}
              onChange={subject =>
                change({ subject, exam: undefined, year: undefined })
              }
            />
            <Filter
              title="Ano"
              selected={filters.year ? String(filters.year) : undefined}
              choices={(data?.options.years ?? []).map(year => ({
                value: String(year),
                label: String(year),
              }))}
              onChange={year =>
                change({ year: year ? Number(year) : undefined })
              }
            />
            {!!data?.options.exams.length && (
              <Filter
                title="Banca / prova cadastrada"
                selected={filters.exam}
                choices={data.options.exams}
                onChange={exam => change({ exam, year: undefined })}
              />
            )}
          </div>
          <p className={`${muted} mt-4`}>
            A cobertura corresponde ao banco cadastrado; pode não representar
            todas as questões de cada prova original.
          </p>
        </section>
        {query.isLoading && (
          <div role="status" className={`${panel} flex items-center gap-3`}>
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando análise das provas…
          </div>
        )}
        {query.error && (
          <div role="alert" className={panel}>
            <p>Não foi possível carregar a análise das provas.</p>
            <Button className="mt-3" onClick={() => void query.refetch()}>
              Tentar novamente
            </Button>
          </div>
        )}
        {data && (
          <>
            <section
              aria-label="Cobertura dos dados"
              className="grid gap-4 sm:grid-cols-3"
            >
              <div className={panel}>
                <p className={muted}>Questões consideradas</p>
                <p className="mt-2 text-3xl font-bold">{data.total}</p>
              </div>
              <div className={panel}>
                <p className={muted}>Anos com dados</p>
                <p className="mt-2 text-3xl font-bold">{data.yearCount}</p>
                {data.unknownYearCount > 0 && (
                  <p className={`${muted} mt-2`}>
                    {data.unknownYearCount} questão(ões) com ano não informado.
                  </p>
                )}
              </div>
              <div className={panel}>
                <p className={muted}>Filtros ativos</p>
                <p className="mt-2 break-words font-semibold">{activeLabels}</p>
              </div>
            </section>
            {!data.total ? (
              <section className={panel}>
                <h2 className="text-lg font-semibold">
                  Nenhuma questão disponível
                </h2>
                <p className={`${muted} mt-2`}>
                  Não há questões publicadas para análise neste recorte.
                </p>
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => setRequested({})}
                >
                  Limpar filtros
                </Button>
              </section>
            ) : (
              <>
                <section className={panel} aria-labelledby="year-title">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 id="year-title" className="text-xl font-bold">
                        Evolução por ano
                        {topic
                          ? ` · ${topic.label}`
                          : content
                            ? ` · ${content.label}`
                            : ""}
                      </h2>
                      <p className={`${muted} mt-1`}>
                        Percentual = questões do recorte
                        {content ? " selecionado" : ""} ÷ total de questões das
                        disciplinas selecionadas naquele ano, com os filtros
                        ativos.
                      </p>
                      <p className={`${muted} mt-1`}>
                        Eixo vertical:{" "}
                        {metric === "count"
                          ? "quantidade de questões"
                          : "percentual (%)"}
                        .
                      </p>
                    </div>
                    <div
                      className="flex flex-wrap gap-2"
                      role="group"
                      aria-label="Unidade do gráfico"
                    >
                      <Button
                        variant={metric === "count" ? "default" : "outline"}
                        aria-pressed={metric === "count"}
                        onClick={() => setMetric("count")}
                      >
                        Quantidade
                      </Button>
                      <Button
                        variant={metric === "percent" ? "default" : "outline"}
                        aria-pressed={metric === "percent"}
                        onClick={() => setMetric("percent")}
                      >
                        Percentual
                      </Button>
                    </div>
                  </div>
                  {!!data.byYear.length ? (
                    <div className="h-72 min-w-0" aria-hidden="true">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={data.byYear}
                          margin={{ top: 10, right: 16, left: 0, bottom: 15 }}
                        >
                          <CartesianGrid
                            stroke="currentColor"
                            className="text-slate-300 dark:text-slate-600"
                            strokeDasharray="3 3"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="year"
                            stroke="currentColor"
                            className="text-slate-700 dark:text-slate-200"
                            label={{
                              value: "Ano com dados",
                              position: "insideBottom",
                              offset: -10,
                              fill: "currentColor",
                            }}
                          />
                          <YAxis
                            stroke="currentColor"
                            className="text-slate-700 dark:text-slate-200"
                            allowDecimals={metric === "percent"}
                            domain={
                              metric === "percent" ? [0, 100] : [0, "auto"]
                            }
                            tickFormatter={number =>
                              metric === "percent"
                                ? `${number}%`
                                : String(number)
                            }
                          />
                          <Tooltip
                            content={({ active, payload }) =>
                              active && payload?.[0] ? (
                                <div className="rounded-xl border border-slate-300 bg-slate-100 p-3 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
                                  <p>Ano {payload[0].payload.year}</p>
                                  <p>
                                    {payload[0].payload.count} de{" "}
                                    {payload[0].payload.denominator} questões (
                                    {percent(payload[0].payload.percent)})
                                  </p>
                                </div>
                              ) : null
                            }
                          />
                          <Bar
                            dataKey={metric}
                            name={
                              metric === "count" ? "Questões" : "Percentual"
                            }
                            fill="#2563eb"
                            radius={[5, 5, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className={muted}>
                      As questões deste recorte têm ano não informado; não há
                      série anual disponível.
                    </p>
                  )}
                  {data.gaps.length > 0 && (
                    <p className={`${muted} mt-3`}>
                      Sem dados:{" "}
                      {data.gaps
                        .map(gap =>
                          gap.from === gap.to
                            ? gap.from
                            : `${gap.from}–${gap.to}`
                        )
                        .join(", ")}
                      . Essas lacunas não são contadas como zero.
                    </p>
                  )}
                  {!!data.byYear.length && (
                    <details className="mt-4">
                      <summary className="cursor-pointer font-semibold focus-visible:outline-2 focus-visible:outline-blue-600">
                        Ver dados do gráfico em tabela
                      </summary>
                      <table className="mt-3 w-full text-left text-sm">
                        <caption className="pb-2 text-left">
                          Questões selecionadas e total anual do recorte
                        </caption>
                        <thead>
                          <tr>
                            <th scope="col">Ano</th>
                            <th scope="col">Questões</th>
                            <th scope="col">Total anual</th>
                            <th scope="col">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.byYear.map(row => (
                            <tr
                              key={row.year}
                              className="border-t border-slate-200 dark:border-slate-700"
                            >
                              <th scope="row" className="py-2">
                                {row.year}
                              </th>
                              <td>{row.count}</td>
                              <td>{row.denominator}</td>
                              <td>{percent(row.percent)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </details>
                  )}
                </section>
                <div className="grid gap-6 lg:grid-cols-2">
                  <section className={panel}>
                    <h2 className="mb-2 flex items-center gap-2 text-xl font-bold">
                      <BarChart3 className="h-5 w-5" />
                      Conteúdos
                    </h2>
                    <p className={`${muted} mb-4`}>
                      Incidência sobre {data.total} questões distintas.{" "}
                      {data.multiContent
                        ? "Uma questão pode aparecer em vários conteúdos; os percentuais podem somar mais de 100%."
                        : "Cada questão deste recorte possui um único conteúdo."}
                    </p>
                    <IncidenceList
                      rows={data.contents}
                      noun="conteúdo"
                      selected={filters.content}
                      onSelect={content =>
                        setRequested({ ...filters, content, topic: undefined })
                      }
                    />
                  </section>
                  <section className={panel} aria-live="polite">
                    {content ? (
                      <>
                        <Button
                          variant="outline"
                          className="mb-4"
                          onClick={() =>
                            setRequested({
                              ...filters,
                              content: undefined,
                              topic: undefined,
                            })
                          }
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Voltar aos conteúdos
                        </Button>
                        <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                          Conteúdo selecionado
                        </p>
                        <h2 className="mt-1 break-words text-xl font-bold">
                          {content.label}
                        </h2>
                        <h3 className="mt-5 font-semibold">
                          Assuntos associados
                        </h3>
                        <p className={`${muted} mb-4 mt-2`}>
                          Incidência sobre {content.count} questões deste
                          conteúdo.{" "}
                          {data.topicsCanOverlap &&
                            "Uma questão pode conter vários assuntos. "}
                          {data.hasSharedTopics &&
                            "Há assuntos associados a mais de um conteúdo. "}
                          Selecione um assunto para ver sua evolução anual.
                        </p>
                        {data.unmappedTopicQuestions > 0 && (
                          <p className={`${muted} mb-4`}>
                            {data.unmappedTopicQuestions} questão(ões) sem
                            vínculo canônico de assunto com este conteúdo. Não
                            foram atribuídos assuntos automaticamente.
                          </p>
                        )}
                        <IncidenceList
                          rows={data.topics}
                          noun="assunto"
                          selected={filters.topic}
                          onSelect={topic =>
                            setRequested({
                              ...filters,
                              topic:
                                filters.topic === topic ? undefined : topic,
                            })
                          }
                        />
                      </>
                    ) : (
                      <>
                        <h2 className="text-xl font-bold">
                          Detalhe dos assuntos
                        </h2>
                        <p className={`${muted} mt-3`}>
                          Selecione um conteúdo para explorar os assuntos
                          associados e sua frequência no período.
                        </p>
                      </>
                    )}
                    <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-700">
                      <Button
                        variant="outline"
                        className="max-w-full whitespace-normal"
                        asChild
                      >
                        <Link href={examAnalysisBankLink(filters)}>
                          <ExternalLink className="mr-2 h-4 w-4 shrink-0" />
                          Abrir questões no banco
                        </Link>
                      </Button>
                      <p className={`${muted} mt-2`}>
                        O link aplica instituição, disciplina e conteúdo quando
                        informados. Refine ano, banca e assunto nos filtros do
                        banco.
                      </p>
                    </div>
                  </section>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
