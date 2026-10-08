import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, BarChart3, Star, Loader2, ArrowRight } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
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
  MISSING_ANALYSIS_VALUE,
  type ExamAnalysisFilters,
  type ExamAnalysis,
} from "@shared/vet/examAnalysis";

const panel =
  "rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900";
const muted = "text-sm text-slate-600 dark:text-slate-300";
const colors = [
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#f97316",
  "#eab308",
  "#64748b",
];
const seriesColor = (data: ExamAnalysis, key: string) => {
  const contentIndex = data.donut.findIndex(slice =>
    slice.members.includes(key)
  );
  const index =
    contentIndex >= 0
      ? contentIndex
      : data.topics.findIndex(topic => topic.key === key);
  return colors[Math.max(0, index) % colors.length];
};
const pct = (n: number | null) =>
  n === null
    ? "Sem dados"
    : n.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%";
const pp = (n: number) =>
  (n > 0 ? "+" : "") +
  n.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) +
  " pp";
type Choice = { value: string; label: string };
function Filter({
  title,
  value,
  choices,
  onChange,
  all = "Todos",
}: {
  title: string;
  value?: string;
  choices: Choice[];
  onChange: (v?: string) => void;
  all?: string;
}) {
  return (
    <label className="grid min-w-0 gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
      {title}
      <select
        aria-label={title}
        value={value ?? ""}
        onChange={e => onChange(e.target.value || undefined)}
        className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
      >
        <option value="">{all}</option>
        {choices.map(c => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
    </label>
  );
}
type Series = ExamAnalysis["contentSeries"][number];
function AnnualChart({
  data,
  series,
  metric,
}: {
  data: ExamAnalysis;
  series: Series[];
  metric: "count" | "percent";
}) {
  const active = series.length
    ? series
    : [{ key: "volume", label: "Volume anual", points: data.volumeSeries }];
  const rows = data.volumeSeries.map((point, index) =>
    Object.fromEntries([
      ["year", point.year],
      ...active.map((s, i) => ["s" + i, s.points[index]?.[metric] ?? null]),
    ])
  );
  const allYears = rows.map(row => Number(row.year));
  return (
    <>
      {rows.length ? (
        <div
          className="h-64 w-full min-w-0"
          role="img"
          aria-label="Evolução anual. Valores e lacunas disponíveis na tabela abaixo."
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={rows}
              margin={{ top: 16, right: 12, left: 0, bottom: 4 }}
            >
              <CartesianGrid stroke="currentColor" opacity={0.12} />
              <XAxis
                type="number"
                dataKey="year"
                domain={["dataMin", "dataMax"]}
                ticks={allYears.length <= 15 ? allYears : undefined}
                allowDecimals={false}
                stroke="currentColor"
                tick={{ fontSize: 11 }}
              />
              <YAxis
                stroke="currentColor"
                allowDecimals={metric === "percent"}
                domain={metric === "percent" ? [0, 100] : [0, "auto"]}
                tick={{ fontSize: 11 }}
                width={38}
              />
              <Tooltip
                content={({ active: open, label }) => {
                  if (!open) return null;
                  const index = allYears.indexOf(Number(label));
                  return (
                    <div className={panel + " shadow-lg text-sm"}>
                      <strong>Ano {label}</strong>
                      {active.map((s, i) => {
                        const p = s.points[index];
                        return (
                          <p key={s.key}>
                            <span style={{ color: seriesColor(data, s.key) }}>
                              ●{" "}
                            </span>
                            {s.label}:{" "}
                            {p?.count === null || !p
                              ? "Sem dados"
                              : p.count +
                                " / " +
                                p.denominator +
                                " questões · " +
                                pct(p.percent)}
                          </p>
                        );
                      })}
                    </div>
                  );
                }}
              />
              {active.map((s, i) => (
                <Line
                  key={s.key}
                  name={s.label}
                  dataKey={"s" + i}
                  stroke={seriesColor(data, s.key)}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className={muted}>Não há anos informados neste recorte.</p>
      )}
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-semibold">
          Tabela acessível dos dados anuais
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Contagens distintas, base anual e incidência. Anos sem base são
              lacunas.
            </caption>
            <thead>
              <tr>
                <th className="p-2">Ano</th>
                <th className="p-2">Série</th>
                <th className="p-2">Questões</th>
                <th className="p-2">Base anual</th>
                <th className="p-2">Incidência</th>
              </tr>
            </thead>
            <tbody>
              {active.flatMap(s =>
                s.points.map(p => (
                  <tr
                    key={s.key + p.year}
                    className="border-t border-slate-200 dark:border-slate-700"
                  >
                    <td className="p-2">{p.year}</td>
                    <td className="p-2">{s.label}</td>
                    <td className="p-2">{p.count ?? "Sem dados"}</td>
                    <td className="p-2">{p.denominator || "Sem dados"}</td>
                    <td className="p-2">{pct(p.percent)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}

export default function VetExamAnalysisPage() {
  const [requested, setRequested] = useState<ExamAnalysisFilters>({});
  const [rangeMode, setRangeMode] = useState(false);
  const [from, setFrom] = useState<number>();
  const [to, setTo] = useState<number>();
  const [metric, setMetric] = useState<"count" | "percent">("count");
  const [seriesKeys, setSeriesKeys] = useState<string[]>([]);
  const [seriesKind, setSeriesKind] = useState<"content" | "topic">("content");
  const [others, setOthers] = useState(false);
  const query = trpc.vet.getExamAnalysis.useQuery(requested, {
    retry: false,
    staleTime: 60_000,
  });
  const data = query.data;
  const filters = data?.filters ?? requested;
  const globalChange = (next: Partial<ExamAnalysisFilters>) => {
    setRequested({
      institution: filters.institution,
      subject: filters.subject,
      exam: filters.exam,
      ...next,
    });
    setSeriesKeys([]);
    setSeriesKind("content");
    setMetric("count");
    setFrom(undefined);
    setTo(undefined);
    setRangeMode(false);
  };
  const selectContent = (key?: string) => {
    setRequested({ ...filters, content: key, topic: undefined });
    setSeriesKind("content");
    setSeriesKeys(key ? [key] : []);
  };
  const selectTopic = (key: string) => {
    setRequested({ ...filters, topic: key });
    setSeriesKind("topic");
    setSeriesKeys([key]);
  };
  const available =
    seriesKind === "topic" && filters.content
      ? (data?.topicSeries ?? [])
      : (data?.contentSeries ?? []);
  const selectedSeries = seriesKeys
    .flatMap(key => available.filter(s => s.key === key))
    .slice(0, 5);
  const toggleSeries = (key: string) =>
    setSeriesKeys(prev => {
      const valid = prev.filter(k => available.some(s => s.key === k));
      return valid.includes(key)
        ? valid.filter(k => k !== key)
        : valid.length < 5
          ? [...valid, key]
          : valid;
    });
  const selected =
    data?.contents.find(c => c.key === filters.content) ?? data?.contents[0];
  const years =
    data?.options.years.map(y => ({ value: String(y), label: String(y) })) ??
    [];
  const selectedTopic = data?.topics.find(t => t.key === filters.topic);
  const compared = data?.comparison;
  const rangeInvalid = !!from && !!to && from > to;
  return (
    <div className="vet-theme theme-page min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <main className="container space-y-4 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              Análise das provas
            </h1>
            <p className={muted}>
              Veja o que mais aparece no banco e como a incidência muda ao longo
              dos anos.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/vet">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao VET
            </Link>
          </Button>
        </div>
        <VetModuleNav />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Filter
            title="Instituição"
            value={filters.institution}
            choices={data?.options.institutions ?? []}
            onChange={institution =>
              globalChange({ institution, subject: undefined, exam: undefined })
            }
          />
          <Filter
            title="Disciplina"
            value={filters.subject}
            choices={data?.options.subjects ?? []}
            onChange={subject => globalChange({ subject, exam: undefined })}
          />
          <Filter
            title="Banca/prova"
            value={filters.exam}
            choices={data?.options.exams ?? []}
            onChange={exam => globalChange({ exam })}
          />
          <Filter
            title="Período"
            value={
              rangeMode
                ? "range"
                : filters.year
                  ? String(filters.year)
                  : undefined
            }
            choices={[...years, { value: "range", label: "Intervalo de anos" }]}
            all="Todos os anos"
            onChange={v => {
              if (v === "range") {
                setRangeMode(true);
                setFrom(filters.period?.from);
                setTo(filters.period?.to);
              } else {
                setRangeMode(false);
                setRequested({
                  ...filters,
                  year: v ? Number(v) : undefined,
                  period: undefined,
                });
              }
            }}
          />
        </div>
        {rangeMode && (
          <div className={panel + " flex flex-wrap items-end gap-3"}>
            <Filter
              title="Ano inicial"
              value={from ? String(from) : undefined}
              choices={years}
              onChange={v => setFrom(v ? Number(v) : undefined)}
              all="Escolher"
            />
            <Filter
              title="Ano final"
              value={to ? String(to) : undefined}
              choices={years}
              onChange={v => setTo(v ? Number(v) : undefined)}
              all="Escolher"
            />
            <Button
              disabled={!from || !to || rangeInvalid}
              onClick={() =>
                setRequested({
                  ...filters,
                  year: undefined,
                  period: { from: from!, to: to! },
                })
              }
            >
              Aplicar intervalo
            </Button>
            {rangeInvalid && (
              <p role="alert" className="text-red-700 dark:text-red-300">
                O ano inicial deve preceder o final.
              </p>
            )}
          </div>
        )}
        {query.isLoading ? (
          <div className={panel + " flex items-center gap-3"} role="status">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando análise…
          </div>
        ) : query.isError ? (
          <div className={panel} role="alert">
            <p>Não foi possível carregar a análise. Tente novamente.</p>
            <Button onClick={() => query.refetch()}>Tentar novamente</Button>
          </div>
        ) : (
          data && (
            <>
              <p className={muted}>
                Banco analisado: <strong>{data.total}</strong> questões
                distintas · {data.yearCount} anos com dados
                {data.unknownYearCount
                  ? " · " + data.unknownYearCount + " sem ano"
                  : ""}
                {query.isFetching ? " · Atualizando…" : ""}
                {filters.period
                  ? " · " + filters.period.from + "–" + filters.period.to
                  : ""}
              </p>
              {!data.total ? (
                <div className={panel}>
                  Nenhuma questão publicada encontrada neste recorte.
                </div>
              ) : (
                <>
                  <div className="grid gap-4 lg:grid-cols-3">
                    <section
                      className={panel + " lg:col-span-2"}
                      aria-label="Distribuição proporcional"
                    >
                      <h2 className="flex items-center gap-2 font-bold">
                        <BarChart3 className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
                        Distribuição proporcional por conteúdo
                      </h2>
                      <div className="grid items-center gap-4 sm:grid-cols-2">
                        <div
                          className="relative h-64 min-w-0"
                          role="img"
                          aria-label="Rosca proporcional. Todos os valores estão disponíveis na legenda."
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={data.donut}
                                dataKey="share"
                                nameKey="label"
                                innerRadius="54%"
                                outerRadius="86%"
                                stroke="none"
                                isAnimationActive={false}
                                onClick={slice => {
                                  if (slice.key === "__others__")
                                    setOthers(true);
                                  else selectContent(slice.key);
                                }}
                              >
                                {data.donut.map((item, i) => (
                                  <Cell
                                    key={item.key}
                                    fill={colors[i % colors.length]}
                                    cursor="pointer"
                                  />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <strong className="text-2xl">{data.total}</strong>
                            <span className={muted}>questões</span>
                          </div>
                        </div>
                        <ul className="space-y-1">
                          {data.donut.map((item, i) => (
                            <li key={item.key}>
                              <button
                                onClick={() =>
                                  item.key === "__others__"
                                    ? setOthers(v => !v)
                                    : selectContent(item.key)
                                }
                                aria-pressed={
                                  filters.content === item.key ||
                                  (item.key === "__others__" && others)
                                }
                                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-500 dark:hover:bg-slate-800"
                              >
                                <span
                                  className="h-3 w-3 shrink-0 rounded-full"
                                  style={{
                                    background: colors[i % colors.length],
                                  }}
                                />
                                <span className="min-w-0 flex-1 break-words">
                                  {item.label}
                                </span>
                                <strong>{pct(item.share)}</strong>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {others && (
                        <div
                          className="flex flex-wrap gap-2 border-t border-slate-200 pt-3 dark:border-slate-700"
                          aria-label="Conteúdos agrupados em Outros"
                        >
                          {data.distribution
                            .filter(d =>
                              data.donut
                                .find(s => s.key === "__others__")
                                ?.members.includes(d.key)
                            )
                            .map(d => (
                              <Button
                                variant="outline"
                                size="sm"
                                key={d.key}
                                onClick={() => selectContent(d.key)}
                              >
                                {d.label} · {pct(d.share)}
                              </Button>
                            ))}
                        </div>
                      )}
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Questões multiconteúdo dividem seu peso entre as tags.
                        Participação da rosca não é incidência; parcelas abaixo
                        de 5% vão para “Outros”, preservando a maior.
                      </p>
                    </section>
                    <section
                      className={panel + " flex flex-col gap-3"}
                      aria-label="Conteúdo em destaque"
                    >
                      <h2 className="flex items-center gap-2 text-sm font-bold">
                        <Star className="h-4 w-4 text-blue-500" />
                        {filters.content
                          ? "Conteúdo selecionado"
                          : "Conteúdo mais incidente"}
                      </h2>
                      {selected && (
                        <>
                          <h3 className="break-words text-2xl font-bold text-cyan-700 dark:text-cyan-300">
                            {selected.label}
                          </h3>
                          <p>
                            <strong>{pct(selected.percent)}</strong> de
                            incidência · {selected.count} /{" "}
                            {selected.denominator} questões
                          </p>
                          <p className={muted}>
                            {pct(
                              data.distribution.find(
                                d => d.key === selected.key
                              )?.share ?? 0
                            )}{" "}
                            de participação proporcional na rosca.
                          </p>
                        </>
                      )}
                      {selectedTopic && (
                        <p className={muted}>
                          Assunto: {selectedTopic.label} · {data.selectedTotal}{" "}
                          questões. Incidência no conteúdo:{" "}
                          {pct(selectedTopic.percent)}.
                        </p>
                      )}
                      <p className={muted}>
                        Contagens do banco cadastrado, não previsão nem
                        cobertura garantida da prova oficial.
                      </p>
                      <div className="mt-auto flex flex-col gap-2">
                        {!filters.content && selected ? (
                          <Button onClick={() => selectContent(selected.key)}>
                            Ver análise detalhada{" "}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => selectContent()}
                          >
                            Voltar aos conteúdos
                          </Button>
                        )}
                        <Button asChild variant="outline">
                          <Link href={examAnalysisBankLink(filters)}>
                            Ver questões do recorte
                          </Link>
                        </Button>
                        {(filters.content === MISSING_ANALYSIS_VALUE ||
                          filters.topic === MISSING_ANALYSIS_VALUE ||
                          filters.institution === MISSING_ANALYSIS_VALUE ||
                          filters.subject === MISSING_ANALYSIS_VALUE ||
                          filters.exam === MISSING_ANALYSIS_VALUE) && (
                          <p className="text-xs">
                            “Não informado” não é transportado ao banco; o
                            destino terá um recorte mais amplo.
                          </p>
                        )}
                      </div>
                    </section>
                  </div>
                  <section className={panel} aria-label="Evolução anual">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <h2 className="font-bold">
                        Incidência por ano
                        {filters.content
                          ? " · " + selected?.label
                          : " · visão geral"}
                      </h2>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={metric === "count" ? "default" : "outline"}
                          onClick={() => setMetric("count")}
                        >
                          Questões
                        </Button>
                        <Button
                          size="sm"
                          variant={metric === "percent" ? "default" : "outline"}
                          disabled={!selectedSeries.length}
                          onClick={() => setMetric("percent")}
                        >
                          % da base anual
                        </Button>
                      </div>
                    </div>
                    {filters.content && (
                      <div className="mb-3 flex gap-2">
                        <Button
                          size="sm"
                          variant={
                            seriesKind === "content" ? "default" : "outline"
                          }
                          onClick={() => {
                            setSeriesKind("content");
                            setSeriesKeys([filters.content!]);
                          }}
                        >
                          Comparar conteúdos
                        </Button>
                        <Button
                          size="sm"
                          variant={
                            seriesKind === "topic" ? "default" : "outline"
                          }
                          onClick={() => {
                            setSeriesKind("topic");
                            setSeriesKeys(
                              data.topics.slice(0, 5).map(t => t.key)
                            );
                          }}
                        >
                          Comparar assuntos
                        </Button>
                      </div>
                    )}
                    <div
                      className="mb-3 flex max-h-40 flex-wrap gap-2 overflow-y-auto"
                      aria-label="Selecionar séries"
                    >
                      {available.map(s => (
                        <button
                          key={s.key}
                          aria-pressed={selectedSeries.some(
                            v => v.key === s.key
                          )}
                          disabled={
                            !seriesKeys.includes(s.key) &&
                            selectedSeries.length >= 5
                          }
                          onClick={() => toggleSeries(s.key)}
                          className={
                            "rounded-full border px-3 py-1 text-xs " +
                            (seriesKeys.includes(s.key)
                              ? "border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
                              : "border-slate-300 dark:border-slate-600")
                          }
                        >
                          <span
                            aria-hidden="true"
                            style={{ color: seriesColor(data, s.key) }}
                          >
                            ●{" "}
                          </span>
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <AnnualChart
                      data={data}
                      series={selectedSeries}
                      metric={selectedSeries.length ? metric : "count"}
                    />
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      Até cinco séries de{" "}
                      {seriesKind === "topic" ? "assuntos" : "conteúdos"}. A
                      base percentual é o total anual da disciplina e demais
                      filtros. Anos sem base são lacunas, não zero; questões sem
                      ano ficam apenas no resumo.
                    </p>
                  </section>
                  {filters.content && (
                    <section className={panel}>
                      <h2 className="mb-3 font-bold">Assuntos relacionados</h2>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {data.topics.map(t => (
                          <button
                            key={t.key}
                            aria-pressed={filters.topic === t.key}
                            onClick={() => selectTopic(t.key)}
                            className="rounded-xl border border-slate-200 p-3 text-left hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                          >
                            <strong>{t.label}</strong>
                            <p className={muted}>
                              {t.count} questões · {pct(t.percent)} no conteúdo
                            </p>
                          </button>
                        ))}
                      </div>
                      {!data.topics.length && (
                        <p className={muted}>
                          Sem assuntos com vínculo confiável.
                        </p>
                      )}
                      {data.unmappedTopicQuestions > 0 && (
                        <p className={muted}>
                          {data.unmappedTopicQuestions} questões sem vínculo de
                          assunto confiável. Nenhuma associação foi inventada.
                        </p>
                      )}
                      {data.topicsCanOverlap && (
                        <p className={muted}>
                          Uma questão pode aparecer em mais de um assunto; as
                          incidências podem se sobrepor.
                        </p>
                      )}
                    </section>
                  )}
                  <details className={panel}>
                    <summary className="cursor-pointer font-bold">
                      Comparar dois períodos
                    </summary>
                    <p className={muted + " mt-2"}>
                      Escolha os limites dos períodos A e B. Bases incompletas
                      não comprovam mudança na prova oficial.
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {(["compareA", "compareB"] as const).flatMap(key =>
                        (["from", "to"] as const).map(bound => (
                          <Filter
                            key={key + bound}
                            title={
                              "Período " +
                              (key === "compareA" ? "A" : "B") +
                              (bound === "from" ? " · início" : " · fim")
                            }
                            value={
                              filters[key]
                                ? String(filters[key]![bound])
                                : undefined
                            }
                            choices={years}
                            all="Escolher"
                            onChange={v => {
                              if (!v) {
                                setRequested({ ...filters, [key]: undefined });
                                return;
                              }
                              const previous = filters[key] ?? {
                                from: Number(v),
                                to: Number(v),
                              };
                              const next = { ...previous, [bound]: Number(v) };
                              // Keep the other bound compatible; both selects use real database years.
                              if (next.from > next.to)
                                next[bound === "from" ? "to" : "from"] =
                                  Number(v);
                              setRequested({ ...filters, [key]: next });
                            }}
                          />
                        ))
                      )}
                    </div>
                    {compared && (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {(["a", "b"] as const).map(key => (
                          <div
                            className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"
                            key={key}
                          >
                            <strong>Período {key.toUpperCase()}</strong>
                            <p>
                              {compared[key].count} /{" "}
                              {compared[key].denominator} questões ·{" "}
                              {pct(compared[key].percent)}
                            </p>
                            <p className={muted}>
                              {compared[key].yearCount} anos com dados
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    {compared &&
                      filters.content &&
                      compared.a.percent !== null &&
                      compared.b.percent !== null && (
                        <p className="mt-3 font-semibold">
                          Variação do recorte selecionado:{" "}
                          {pp(compared.b.percent - compared.a.percent)}
                        </p>
                      )}
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <caption className="sr-only">
                          Comparação de incidências por período
                        </caption>
                        <thead>
                          <tr>
                            <th className="p-2">
                              {filters.content ? "Assunto" : "Conteúdo"}
                            </th>
                            <th className="p-2">A: questões / base</th>
                            <th className="p-2">B: questões / base</th>
                            <th className="p-2">Diferença</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.comparisons.map(c => (
                            <tr
                              className="border-t border-slate-200 dark:border-slate-700"
                              key={c.key}
                            >
                              <td className="p-2">{c.label}</td>
                              <td className="p-2">
                                {c.a.count} / {c.a.denominator} ·{" "}
                                {pct(c.a.percent)}
                              </td>
                              <td className="p-2">
                                {c.b.count} / {c.b.denominator} ·{" "}
                                {pct(c.b.percent)}
                              </td>
                              <td className="p-2">
                                {c.difference === null
                                  ? "Sem dados"
                                  : pp(c.difference)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className={muted + " mt-3"}>
                      {data.growth
                        ? "Maior aumento no banco: " +
                          data.growth.label +
                          " (" +
                          pp(data.growth.difference!) +
                          "). "
                        : "Sem base anual completa ou aumento para destacar. "}
                      {data.reduction
                        ? "Maior redução: " +
                          data.reduction.label +
                          " (" +
                          pp(data.reduction.difference!) +
                          ")."
                        : "Sem redução com cobertura suficiente."}
                    </p>
                  </details>
                  <details className={panel}>
                    <summary className="cursor-pointer text-sm font-semibold">
                      Como os dados são calculados
                    </summary>
                    <p className={muted + " mt-2"}>
                      Apenas questões publicadas, deduplicadas pelo ID.
                      Incidência = questões distintas com a tag ÷ total do
                      recorte. Rosca = soma dos pesos 1/N por questão ÷ total do
                      recorte. Assuntos respeitam seus vínculos canônicos;
                      listas antigas só têm fallback quando existe um único
                      conteúdo. O denominador anual não muda ao selecionar
                      conteúdo ou assunto. Comparações usam os mesmos filtros
                      globais, independentes do intervalo principal. Tendências
                      só aparecem com dados em todos os anos de ambos os
                      intervalos; isso ainda não garante cobertura completa da
                      prova.
                    </p>
                  </details>
                </>
              )}
            </>
          )
        )}
      </main>
    </div>
  );
}
