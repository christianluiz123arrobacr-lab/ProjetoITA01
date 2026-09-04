import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Trophy,
  Target,
  Timer,
  TrendingUp,
  TrendingDown,
  Filter,
  AlertTriangle,
  PieChart,
  CheckCircle2,
  XCircle,
  Gauge,
  Clock3,
  BookOpen,
} from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

type AttemptRow = {
  id: string;
  user_id: string;
  question_id: string;
  selected_option: string | null;
  is_correct: boolean;
  time_spent_seconds: number | null;
  answered_at: string;
  attempt_number: number;
  subject: string | null;
  conteudo: string | null;
  assunto: string | null;
  banca: string | null;
  ano: number | null;
  difficulty: string | null;
};

type GroupedStat = {
  label: string;
  total: number;
  correct: number;
  wrong: number;
  accuracy: number;
};

type DailyStat = {
  date: string;
  total: number;
  correct: number;
  wrong: number;
  accuracy: number;
};

type TimeBySubjectStat = {
  label: string;
  avgSeconds: number;
  total: number;
};

type PieDatum = {
  label: string;
  value: number;
  color: string;
  percent: number;
};

type ComparisonMetric = {
  current: number;
  previous: number;
  delta: number;
  deltaPercent?: number;
};

type StreakInfo = {
  currentStreak: number;
  bestStreak: number;
  activeDays7: number;
  activeDays30: number;
};

type EvolutionRow = {
  label: string;
  currentAccuracy: number;
  previousAccuracy: number;
  delta: number;
  totalCurrent: number;
  totalPrevious: number;
};

type CoverageInfo = {
  uniqueQuestions: number;
  uniqueSubjects: number;
  uniqueConteudos: number;
  uniqueAssuntos: number;
};

const PIE_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#16a34a",
  "#ea580c",
  "#dc2626",
  "#0891b2",
  "#ca8a04",
  "#4f46e5",
  "#db2777",
  "#475569",
];

function groupAttempts(
  attempts: AttemptRow[],
  key: (attempt: AttemptRow) => string | null | undefined
): GroupedStat[] {
  const map = new Map<string, { total: number; correct: number; wrong: number }>();

  for (const attempt of attempts) {
    const rawLabel = key(attempt);
    const label = rawLabel?.trim() || "Não informado";

    const current = map.get(label) ?? { total: 0, correct: 0, wrong: 0 };
    current.total += 1;
    if (attempt.is_correct) current.correct += 1;
    else current.wrong += 1;

    map.set(label, current);
  }

  return Array.from(map.entries())
    .map(([label, value]) => ({
      label,
      total: value.total,
      correct: value.correct,
      wrong: value.wrong,
      accuracy: value.total > 0 ? (value.correct / value.total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total || b.accuracy - a.accuracy);
}

function groupAverageTimeBySubject(attempts: AttemptRow[]): TimeBySubjectStat[] {
  const map = new Map<string, { totalSeconds: number; total: number }>();

  for (const attempt of attempts) {
    if (typeof attempt.time_spent_seconds !== "number") continue;

    const label = attempt.subject?.trim() || "Não informado";
    const current = map.get(label) ?? { totalSeconds: 0, total: 0 };
    current.totalSeconds += attempt.time_spent_seconds;
    current.total += 1;
    map.set(label, current);
  }

  return Array.from(map.entries())
    .map(([label, value]) => ({
      label,
      avgSeconds: value.total > 0 ? value.totalSeconds / value.total : 0,
      total: value.total,
    }))
    .sort((a, b) => b.avgSeconds - a.avgSeconds || b.total - a.total);
}

function formatSeconds(seconds?: number | null) {
  if (!seconds || seconds <= 0) return "-";
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  if (min === 0) return `${sec}s`;
  return `${min}m ${sec}s`;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function getCutoffDate(period: string): Date | null {
  const now = new Date();

  if (period === "7d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }

  if (period === "30d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return d;
  }

  if (period === "90d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 90);
    return d;
  }

  return null;
}

function getPreviousPeriodRange(period: string): { start: Date; end: Date } | null {
  const now = new Date();

  if (period === "7d") {
    const end = new Date(now);
    end.setDate(end.getDate() - 7);

    const start = new Date(now);
    start.setDate(start.getDate() - 14);

    return { start, end };
  }

  if (period === "30d") {
    const end = new Date(now);
    end.setDate(end.getDate() - 30);

    const start = new Date(now);
    start.setDate(start.getDate() - 60);

    return { start, end };
  }

  if (period === "90d") {
    const end = new Date(now);
    end.setDate(end.getDate() - 90);

    const start = new Date(now);
    start.setDate(start.getDate() - 180);

    return { start, end };
  }

  return null;
}

function getComparisonMetric(current: number, previous: number): ComparisonMetric {
  const delta = current - previous;
  const deltaPercent = previous > 0 ? (delta / previous) * 100 : undefined;

  return {
    current,
    previous,
    delta,
    deltaPercent,
  };
}

function buildDailyStats(attempts: AttemptRow[]): DailyStat[] {
  const map = new Map<string, { total: number; correct: number; wrong: number }>();

  for (const attempt of attempts) {
    const date = new Date(attempt.answered_at).toLocaleDateString("pt-BR");

    const current = map.get(date) ?? { total: 0, correct: 0, wrong: 0 };
    current.total += 1;
    if (attempt.is_correct) current.correct += 1;
    else current.wrong += 1;

    map.set(date, current);
  }

  return Array.from(map.entries())
    .map(([date, value]) => ({
      date,
      total: value.total,
      correct: value.correct,
      wrong: value.wrong,
      accuracy: value.total > 0 ? (value.correct / value.total) * 100 : 0,
    }))
    .sort((a, b) => {
      const [da, ma, ya] = a.date.split("/");
      const [db, mb, yb] = b.date.split("/");
      const aTime = new Date(`${ya}-${ma}-${da}`).getTime();
      const bTime = new Date(`${yb}-${mb}-${db}`).getTime();
      return aTime - bTime;
    });
}

function buildPieData(
  rows: Array<{ label: string; value: number }>,
  limit = 6
): PieDatum[] {
  const filtered = rows.filter((row) => row.value > 0).slice(0, limit);
  const total = filtered.reduce((sum, item) => sum + item.value, 0);

  if (!total) return [];

  return filtered.map((item, index) => ({
    label: item.label,
    value: item.value,
    color: PIE_COLORS[index % PIE_COLORS.length],
    percent: (item.value / total) * 100,
  }));
}

function getPieBackground(data: PieDatum[]) {
  if (!data.length) return "#e2e8f0";

  let current = 0;
  const parts = data.map((item) => {
    const start = current;
    const end = current + item.percent;
    current = end;
    return `${item.color} ${start}% ${end}%`;
  });

  return `conic-gradient(${parts.join(", ")})`;
}

function PieLegend({ data }: { data: PieDatum[] }) {
  return (
    <div className="space-y-2 md:space-y-2.5">
      {data.map((item) => (
        <div
          key={item.label}
          className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-2.5 md:p-2 lg:p-3"
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <span
              className="mt-1 h-3 w-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 break-words text-sm md:text-[13px] lg:text-sm">
                {item.label}
              </p>
              <p className="text-xs md:text-[11px] lg:text-xs text-slate-500">
                {item.value} questão(ões)
              </p>
            </div>
          </div>

          <span className="text-xs md:text-[11px] lg:text-sm font-bold text-slate-700 whitespace-nowrap">
            {item.percent.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}

function PieCard({
  title,
  subtitle,
  data,
  emptyMessage,
}: {
  title: string;
  subtitle?: string;
  data: PieDatum[];
  emptyMessage: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-3 lg:p-4 xl:p-5 h-full">
      <div className="flex items-center gap-2 mb-2">
        <PieChart className="w-4 h-4 md:w-4 md:h-4 lg:w-5 lg:h-5 text-slate-700" />
        <h3 className="text-base md:text-[15px] lg:text-lg font-bold text-slate-900 leading-tight">
          {title}
        </h3>
      </div>

      {subtitle && (
        <p className="text-sm md:text-xs lg:text-sm text-slate-500 mb-4 md:mb-3 lg:mb-4">
          {subtitle}
        </p>
      )}

      {data.length > 0 ? (
        <div className="grid gap-4 md:gap-3 lg:gap-5 items-center">
          <div className="flex justify-center">
            <div
              className="relative h-32 w-32 md:h-24 md:w-24 lg:h-32 lg:w-32 xl:h-40 xl:w-40 rounded-full border-8 border-white shadow-md"
              style={{ background: getPieBackground(data) }}
            >
              <div className="absolute inset-[26%] rounded-full bg-white flex items-center justify-center text-center p-2">
                <div>
                  <p className="text-[10px] md:text-[9px] lg:text-[10px] uppercase tracking-wide text-slate-500">
                    Total
                  </p>
                  <p className="text-xl md:text-base lg:text-xl xl:text-2xl font-bold text-slate-900">
                    {data.reduce((sum, item) => sum + item.value, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <PieLegend data={data} />
        </div>
      ) : (
        <p className="text-slate-500 text-sm">{emptyMessage}</p>
      )}
    </div>
  );
}

function getActiveDateKeys(attempts: AttemptRow[]) {
  return Array.from(
    new Set(
      attempts.map((attempt) => {
        const date = new Date(attempt.answered_at);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      })
    )
  ).sort();
}

function buildStreakInfo(attempts: AttemptRow[]): StreakInfo {
  const activeKeys = getActiveDateKeys(attempts);

  if (!activeKeys.length) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      activeDays7: 0,
      activeDays30: 0,
    };
  }

  const today = new Date();
  const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const last7 = new Date(normalizedToday);
  last7.setDate(last7.getDate() - 6);

  const last30 = new Date(normalizedToday);
  last30.setDate(last30.getDate() - 29);

  const activeDays7 = activeKeys.filter((key) => new Date(`${key}T00:00:00`) >= last7).length;
  const activeDays30 = activeKeys.filter((key) => new Date(`${key}T00:00:00`) >= last30).length;

  let bestStreak = 1;
  let currentRun = 1;

  for (let i = 1; i < activeKeys.length; i++) {
    const prev = new Date(`${activeKeys[i - 1]}T00:00:00`);
    const curr = new Date(`${activeKeys[i]}T00:00:00`);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);

    if (diffDays === 1) {
      currentRun += 1;
      bestStreak = Math.max(bestStreak, currentRun);
    } else {
      currentRun = 1;
    }
  }

  let currentStreak = 0;
  const reversed = [...activeKeys].reverse();

  for (let i = 0; i < reversed.length; i++) {
    const curr = new Date(`${reversed[i]}T00:00:00`);

    if (i === 0) {
      const diffToToday = Math.round((normalizedToday.getTime() - curr.getTime()) / 86400000);

      if (diffToToday <= 1) {
        currentStreak = 1;
      } else {
        break;
      }
    } else {
      const prev = new Date(`${reversed[i - 1]}T00:00:00`);
      const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);

      if (diffDays === 1) {
        currentStreak += 1;
      } else {
        break;
      }
    }
  }

  return {
    currentStreak,
    bestStreak,
    activeDays7,
    activeDays30,
  };
}

function buildEvolutionRows(
  currentAttempts: AttemptRow[],
  previousAttempts: AttemptRow[],
  key: (attempt: AttemptRow) => string | null | undefined
): EvolutionRow[] {
  const currentStats = groupAttempts(currentAttempts, key);
  const previousStats = groupAttempts(previousAttempts, key);

  const currentMap = new Map(currentStats.map((item) => [item.label, item]));
  const previousMap = new Map(previousStats.map((item) => [item.label, item]));

  const labels = Array.from(new Set([...Array.from(currentMap.keys()), ...Array.from(previousMap.keys())]));

  return labels
    .map((label) => {
      const current = currentMap.get(label);
      const previous = previousMap.get(label);

      return {
        label,
        currentAccuracy: current?.accuracy ?? 0,
        previousAccuracy: previous?.accuracy ?? 0,
        delta: (current?.accuracy ?? 0) - (previous?.accuracy ?? 0),
        totalCurrent: current?.total ?? 0,
        totalPrevious: previous?.total ?? 0,
      };
    })
    .filter((item) => item.totalCurrent >= 2 || item.totalPrevious >= 2)
    .sort((a, b) => b.delta - a.delta);
}

function buildCoverageInfo(attempts: AttemptRow[]): CoverageInfo {
  return {
    uniqueQuestions: new Set(attempts.map((a) => a.question_id).filter(Boolean)).size,
    uniqueSubjects: new Set(attempts.map((a) => a.subject?.trim()).filter(Boolean)).size,
    uniqueConteudos: new Set(attempts.map((a) => a.conteudo?.trim()).filter(Boolean)).size,
    uniqueAssuntos: new Set(attempts.map((a) => a.assunto?.trim()).filter(Boolean)).size,
  };
}

function formatDelta(delta: number, suffix = " pts") {
  const rounded = Math.round(delta * 10) / 10;
  if (rounded > 0) return `+${rounded}${suffix}`;
  if (rounded < 0) return `${rounded}${suffix}`;
  return `0${suffix}`;
}

export default function Progress() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const trpcUtils = trpc.useUtils();
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [subjectFilter, setSubjectFilter] = useState("todas");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [chartSubject, setChartSubject] = useState("todas");

  useEffect(() => {
    async function loadAttempts() {
      if (!user?.id) {
        setAttempts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await trpcUtils.quiz.getMyAttempts.fetch();
        setAttempts((data as unknown as AttemptRow[]) ?? []);
      } catch (error) {
        console.error("Erro ao buscar progresso:", error);
        setError("Não foi possível carregar seu progresso.");
        setAttempts([]);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadAttempts();
    }
  }, [user?.id, authLoading, trpcUtils]);

  const availableSubjects = useMemo(() => {
    return Array.from(
      new Set(
        attempts
          .map((attempt) => attempt.subject?.trim())
          .filter((value): value is string => !!value)
      )
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [attempts]);

  const periodFilteredAttempts = useMemo(() => {
    let result = [...attempts];

    const cutoff = getCutoffDate(periodFilter);
    if (cutoff) {
      result = result.filter((attempt) => new Date(attempt.answered_at) >= cutoff);
    }

    return result;
  }, [attempts, periodFilter]);

  const filteredAttempts = useMemo(() => {
    let result = [...periodFilteredAttempts];

    if (subjectFilter !== "todas") {
      result = result.filter((attempt) => (attempt.subject?.trim() || "") === subjectFilter);
    }

    return result;
  }, [periodFilteredAttempts, subjectFilter]);

  const previousPeriodAttempts = useMemo(() => {
    const range = getPreviousPeriodRange(periodFilter);
    if (!range) return [];

    let result = attempts.filter((attempt) => {
      const date = new Date(attempt.answered_at);
      return date >= range.start && date < range.end;
    });

    if (subjectFilter !== "todas") {
      result = result.filter((attempt) => (attempt.subject?.trim() || "") === subjectFilter);
    }

    return result;
  }, [attempts, periodFilter, subjectFilter]);

  const chartAvailableSubjects = useMemo(() => {
    const source = subjectFilter === "todas" ? periodFilteredAttempts : filteredAttempts;

    return Array.from(
      new Set(
        source
          .map((attempt) => attempt.subject?.trim())
          .filter((value): value is string => !!value)
      )
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [subjectFilter, periodFilteredAttempts, filteredAttempts]);

  useEffect(() => {
    if (!chartAvailableSubjects.length) {
      setChartSubject("todas");
      return;
    }

    if (chartSubject !== "todas" && !chartAvailableSubjects.includes(chartSubject)) {
      setChartSubject(chartAvailableSubjects[0]);
    }

    if (subjectFilter !== "todas" && chartSubject !== subjectFilter) {
      setChartSubject(subjectFilter);
    }
  }, [chartAvailableSubjects, chartSubject, subjectFilter]);

  const totalAnswered = filteredAttempts.length;

  const totalCorrect = useMemo(
    () => filteredAttempts.filter((attempt) => attempt.is_correct).length,
    [filteredAttempts]
  );

  const totalWrong = totalAnswered - totalCorrect;
  const accuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;

  const avgTimeSeconds = useMemo(() => {
    const valid = filteredAttempts.filter((a) => typeof a.time_spent_seconds === "number");
    if (!valid.length) return 0;
    const total = valid.reduce((sum, a) => sum + (a.time_spent_seconds ?? 0), 0);
    return total / valid.length;
  }, [filteredAttempts]);

  const previousTotalAnswered = previousPeriodAttempts.length;
  const previousTotalCorrect = previousPeriodAttempts.filter((attempt) => attempt.is_correct).length;
  const previousTotalWrong = previousTotalAnswered - previousTotalCorrect;
  const previousAccuracy =
    previousTotalAnswered > 0 ? (previousTotalCorrect / previousTotalAnswered) * 100 : 0;

  const previousAvgTimeSeconds = useMemo(() => {
    const valid = previousPeriodAttempts.filter((a) => typeof a.time_spent_seconds === "number");
    if (!valid.length) return 0;
    const total = valid.reduce((sum, a) => sum + (a.time_spent_seconds ?? 0), 0);
    return total / valid.length;
  }, [previousPeriodAttempts]);

  const comparisonAccuracy = useMemo(
    () => getComparisonMetric(accuracy, previousAccuracy),
    [accuracy, previousAccuracy]
  );

  const comparisonTotal = useMemo(
    () => getComparisonMetric(totalAnswered, previousTotalAnswered),
    [totalAnswered, previousTotalAnswered]
  );

  const comparisonAvgTime = useMemo(
    () => getComparisonMetric(avgTimeSeconds, previousAvgTimeSeconds),
    [avgTimeSeconds, previousAvgTimeSeconds]
  );

  const streakInfo = useMemo(() => buildStreakInfo(filteredAttempts), [filteredAttempts]);

  const coverageInfo = useMemo(() => buildCoverageInfo(filteredAttempts), [filteredAttempts]);

  const avgTimeCorrect = useMemo(() => {
    const valid = filteredAttempts.filter(
      (a) => a.is_correct && typeof a.time_spent_seconds === "number"
    );
    if (!valid.length) return 0;
    const total = valid.reduce((sum, a) => sum + (a.time_spent_seconds ?? 0), 0);
    return total / valid.length;
  }, [filteredAttempts]);

  const avgTimeWrong = useMemo(() => {
    const valid = filteredAttempts.filter(
      (a) => !a.is_correct && typeof a.time_spent_seconds === "number"
    );
    if (!valid.length) return 0;
    const total = valid.reduce((sum, a) => sum + (a.time_spent_seconds ?? 0), 0);
    return total / valid.length;
  }, [filteredAttempts]);

  const bySubject = useMemo(
    () => groupAttempts(filteredAttempts, (attempt) => attempt.subject),
    [filteredAttempts]
  );

  const byConteudo = useMemo(
    () => groupAttempts(filteredAttempts, (attempt) => attempt.conteudo),
    [filteredAttempts]
  );

  const byAssunto = useMemo(
    () => groupAttempts(filteredAttempts, (attempt) => attempt.assunto),
    [filteredAttempts]
  );

  const byDifficulty = useMemo(
    () => groupAttempts(filteredAttempts, (attempt) => attempt.difficulty),
    [filteredAttempts]
  );

  const byBanca = useMemo(
    () => groupAttempts(filteredAttempts, (attempt) => attempt.banca),
    [filteredAttempts]
  );

  const averageTimeBySubject = useMemo(
    () => groupAverageTimeBySubject(filteredAttempts),
    [filteredAttempts]
  );

  const recentAttempts = useMemo(() => filteredAttempts.slice(0, 12), [filteredAttempts]);

  const wrongAttempts = useMemo(
    () => filteredAttempts.filter((attempt) => !attempt.is_correct).slice(0, 12),
    [filteredAttempts]
  );

  const dailyStats = useMemo(() => buildDailyStats(filteredAttempts), [filteredAttempts]);

  const maxDailyTotal = useMemo(() => {
    return dailyStats.length ? Math.max(...dailyStats.map((item) => item.total)) : 1;
  }, [dailyStats]);

  const bestSubject = useMemo(() => {
    return bySubject
      .filter((item) => item.total >= 2)
      .sort((a, b) => b.accuracy - a.accuracy || b.total - a.total)[0];
  }, [bySubject]);

  const worstSubject = useMemo(() => {
    return bySubject
      .filter((item) => item.total >= 2)
      .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)[0];
  }, [bySubject]);

  const mostWrongConteudo = useMemo(() => {
    return [...byConteudo].sort((a, b) => b.wrong - a.wrong || b.total - a.total)[0];
  }, [byConteudo]);

  const worstConteudoByAccuracy = useMemo(() => {
    return byConteudo
      .filter((item) => item.total >= 2)
      .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)[0];
  }, [byConteudo]);

  const worstAssuntoByAccuracy = useMemo(() => {
    return byAssunto
      .filter((item) => item.total >= 2)
      .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)[0];
  }, [byAssunto]);

  const bestAssunto = useMemo(() => {
    return byAssunto
      .filter((item) => item.total >= 2)
      .sort((a, b) => b.accuracy - a.accuracy || b.total - a.total)[0];
  }, [byAssunto]);

  const slowestSubject = useMemo(() => {
    return averageTimeBySubject.find((item) => item.total >= 2);
  }, [averageTimeBySubject]);

  const subjectEvolution = useMemo(
    () => buildEvolutionRows(filteredAttempts, previousPeriodAttempts, (attempt) => attempt.subject),
    [filteredAttempts, previousPeriodAttempts]
  );

  const conteudoEvolution = useMemo(
    () => buildEvolutionRows(filteredAttempts, previousPeriodAttempts, (attempt) => attempt.conteudo),
    [filteredAttempts, previousPeriodAttempts]
  );

  const topImprovements = useMemo(() => {
    return [...conteudoEvolution]
      .filter((item) => item.delta > 0)
      .sort((a, b) => b.delta - a.delta)
      .slice(0, 5);
  }, [conteudoEvolution]);

  const topDrops = useMemo(() => {
    return [...conteudoEvolution]
      .filter((item) => item.delta < 0)
      .sort((a, b) => a.delta - b.delta)
      .slice(0, 5);
  }, [conteudoEvolution]);

  const recommendations = useMemo(() => {
    const recs: string[] = [];

    if (worstSubject) {
      recs.push(
        `Sua disciplina mais fraca no período filtrado é ${worstSubject.label}, com ${worstSubject.accuracy.toFixed(
          0
        )}% de acerto.`
      );
    }

    if (mostWrongConteudo && mostWrongConteudo.wrong > 0) {
      recs.push(
        `O conteúdo com mais erros neste recorte é ${mostWrongConteudo.label}. Vale revisar esse ponto primeiro.`
      );
    }

    if (slowestSubject) {
      recs.push(
        `Você está levando mais tempo em ${slowestSubject.label}: média de ${formatSeconds(
          Math.round(slowestSubject.avgSeconds)
        )} por questão.`
      );
    }

    if (bestSubject) {
      recs.push(`Seu melhor desempenho no recorte atual está em ${bestSubject.label}.`);
    }

    if (comparisonAccuracy.delta !== 0) {
      recs.push(
        comparisonAccuracy.delta > 0
          ? `Seu acerto subiu ${formatDelta(comparisonAccuracy.delta)} em relação ao período anterior.`
          : `Seu acerto caiu ${formatDelta(comparisonAccuracy.delta)} em relação ao período anterior.`
      );
    }

    if (topDrops[0]) {
      recs.push(
        `O conteúdo que mais caiu foi ${topDrops[0].label}. Pode valer uma retomada rápida.`
      );
    }

    if (avgTimeSeconds > 0) {
      recs.push(
        `Seu tempo médio geral neste filtro está em ${formatSeconds(Math.round(avgTimeSeconds))}.`
      );
    }

    if (!recs.length && filteredAttempts.length === 0) {
      recs.push("Ainda não há dados suficientes nesse filtro.");
    }

    return recs;
  }, [
    worstSubject,
    mostWrongConteudo,
    slowestSubject,
    bestSubject,
    comparisonAccuracy.delta,
    topDrops,
    avgTimeSeconds,
    filteredAttempts.length,
  ]);

  const generalPieData = useMemo(() => {
    return buildPieData(
      [
        { label: "Acertos", value: totalCorrect },
        { label: "Erros", value: totalWrong },
      ],
      2
    );
  }, [totalCorrect, totalWrong]);

  const chartSourceAttempts = useMemo(() => {
    const source = subjectFilter === "todas" ? periodFilteredAttempts : filteredAttempts;

    if (chartSubject === "todas") return source;

    return source.filter((attempt) => (attempt.subject?.trim() || "") === chartSubject);
  }, [subjectFilter, periodFilteredAttempts, filteredAttempts, chartSubject]);

  const selectedChartSubjectLabel = useMemo(() => {
    if (chartSubject !== "todas") return chartSubject;
    if (subjectFilter !== "todas") return subjectFilter;
    return "Todas";
  }, [chartSubject, subjectFilter]);

  const chartCorrectByConteudo = useMemo(() => {
    const map = new Map<string, number>();

    for (const attempt of chartSourceAttempts) {
      if (!attempt.is_correct) continue;
      const label = attempt.conteudo?.trim() || "Não informado";
      map.set(label, (map.get(label) ?? 0) + 1);
    }

    return buildPieData(
      Array.from(map.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value),
      6
    );
  }, [chartSourceAttempts]);

  const chartWrongByConteudo = useMemo(() => {
    const map = new Map<string, number>();

    for (const attempt of chartSourceAttempts) {
      if (attempt.is_correct) continue;
      const label = attempt.conteudo?.trim() || "Não informado";
      map.set(label, (map.get(label) ?? 0) + 1);
    }

    return buildPieData(
      Array.from(map.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value),
      6
    );
  }, [chartSourceAttempts]);

  return (
    <div className="theme-page min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="container py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Seu Progresso</h1>
        </div>
      </header>

      <section className="container py-6 md:py-12 space-y-8">
        {authLoading || loading ? (
          <Card className="p-8">
            <p className="text-slate-600">Carregando progresso...</p>
          </Card>
        ) : error ? (
          <Card className="p-8 border-red-200 bg-red-50">
            <p className="text-red-700 font-medium">{error}</p>
          </Card>
        ) : !user ? (
          <Card className="p-8">
            <p className="text-slate-700 font-medium">
              Você precisa estar logado para ver seu progresso.
            </p>
          </Card>
        ) : (
          <>
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-slate-600" />
                <h2 className="text-xl font-bold text-slate-900">Filtros de análise</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Disciplina
                  </label>
                  <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-white"
                  >
                    <option value="todas">Todas</option>
                    {availableSubjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Período
                  </label>
                  <select
                    value={periodFilter}
                    onChange={(e) => setPeriodFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-white"
                  >
                    <option value="all">Todo o período</option>
                    <option value="7d">Últimos 7 dias</option>
                    <option value="30d">Últimos 30 dias</option>
                    <option value="90d">Últimos 90 dias</option>
                  </select>
                </div>
              </div>
            </Card>

            <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
              <Card className="relative overflow-hidden border-slate-200 bg-white shadow-sm">
                <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-blue-100/60 blur-2xl" />
                <div className="p-6 relative">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">Respondidas</p>
                      <p className="text-3xl font-bold text-slate-900 mt-2">{totalAnswered}</p>
                    </div>
                    <div className="h-11 w-11 rounded-2xl bg-blue-100 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-blue-700" />
                    </div>
                  </div>
                  <p
                    className={`text-sm font-semibold ${
                      comparisonTotal.delta >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {formatDelta(comparisonTotal.delta, "")} vs período anterior
                  </p>
                </div>
              </Card>

              <Card className="relative overflow-hidden border-green-200 bg-white shadow-sm">
                <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-green-100/70 blur-2xl" />
                <div className="p-6 relative">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">Acertos</p>
                      <p className="text-3xl font-bold text-green-600 mt-2">{totalCorrect}</p>
                    </div>
                    <div className="h-11 w-11 rounded-2xl bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-700" />
                    </div>
                  </div>
                  <p className="text-sm text-slate-500">
                    Antes: {previousTotalCorrect} • Agora: {totalCorrect}
                  </p>
                </div>
              </Card>

              <Card className="relative overflow-hidden border-red-200 bg-white shadow-sm">
                <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-red-100/70 blur-2xl" />
                <div className="p-6 relative">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">Erros</p>
                      <p className="text-3xl font-bold text-red-600 mt-2">{totalWrong}</p>
                    </div>
                    <div className="h-11 w-11 rounded-2xl bg-red-100 flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-red-700" />
                    </div>
                  </div>
                  <p className="text-sm text-slate-500">
                    Antes: {previousTotalWrong} • Agora: {totalWrong}
                  </p>
                </div>
              </Card>

              <Card className="relative overflow-hidden border-indigo-200 bg-white shadow-sm">
                <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-indigo-100/70 blur-2xl" />
                <div className="p-6 relative">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">Taxa de acerto</p>
                      <p className="text-3xl font-bold text-indigo-600 mt-2">
                        {accuracy.toFixed(1)}%
                      </p>
                    </div>
                    <div className="h-11 w-11 rounded-2xl bg-indigo-100 flex items-center justify-center">
                      <Gauge className="w-5 h-5 text-indigo-700" />
                    </div>
                  </div>
                  <p
                    className={`text-sm font-semibold ${
                      comparisonAccuracy.delta >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {formatDelta(comparisonAccuracy.delta)} vs período anterior
                  </p>
                </div>
              </Card>

              <Card className="relative overflow-hidden border-purple-200 bg-white shadow-sm">
                <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-purple-100/70 blur-2xl" />
                <div className="p-6 relative">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">Tempo médio</p>
                      <p className="text-3xl font-bold text-purple-600 mt-2">
                        {formatSeconds(Math.round(avgTimeSeconds))}
                      </p>
                    </div>
                    <div className="h-11 w-11 rounded-2xl bg-purple-100 flex items-center justify-center">
                      <Clock3 className="w-5 h-5 text-purple-700" />
                    </div>
                  </div>
                  <p
                    className={`text-sm font-semibold ${
                      comparisonAvgTime.delta <= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {formatDelta(comparisonAvgTime.delta, "s")} vs período anterior
                  </p>
                </div>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  <h2 className="font-bold text-slate-900">Variação do acerto</h2>
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {comparisonAccuracy.current.toFixed(0)}%
                </p>
                <p
                  className={`text-sm mt-1 font-semibold ${
                    comparisonAccuracy.delta >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {formatDelta(comparisonAccuracy.delta)} vs período anterior
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  <h2 className="font-bold text-slate-900">Sequência atual</h2>
                </div>
                <p className="text-2xl font-bold text-slate-900">{streakInfo.currentStreak}</p>
                <p className="text-sm mt-1 text-slate-500">
                  melhor sequência: {streakInfo.bestStreak} dias
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-500" />
                  <h2 className="font-bold text-slate-900">Dias ativos</h2>
                </div>
                <p className="text-2xl font-bold text-slate-900">{streakInfo.activeDays7}/7</p>
                <p className="text-sm mt-1 text-slate-500">
                  últimos 30 dias: {streakInfo.activeDays30}
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Clock3 className="w-5 h-5 text-orange-500" />
                  <h2 className="font-bold text-slate-900">Tempo correto x erro</h2>
                </div>
                <p className="text-sm text-slate-700">
                  Acertos: <span className="font-bold">{formatSeconds(Math.round(avgTimeCorrect))}</span>
                </p>
                <p className="text-sm text-slate-700 mt-1">
                  Erros: <span className="font-bold">{formatSeconds(Math.round(avgTimeWrong))}</span>
                </p>
              </Card>
            </div>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-slate-700" />
                <h2 className="text-xl font-bold text-slate-900">Análise visual</h2>
              </div>

              <div className="max-w-sm mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Disciplina do gráfico
                </label>
                <select
                  value={chartSubject}
                  onChange={(e) => setChartSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-white"
                >
                  {subjectFilter === "todas" && <option value="todas">Todas</option>}
                  {chartAvailableSubjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid md:grid-cols-3 gap-4 md:gap-3 lg:gap-4 xl:gap-6 items-start">
                <PieCard
                  title="Acertos x erros"
                  subtitle="Visão geral do recorte atual"
                  data={generalPieData}
                  emptyMessage="Ainda não há dados suficientes para o gráfico geral."
                />

                <PieCard
                  title="Conteúdos com mais acertos"
                  subtitle={`Disciplina: ${selectedChartSubjectLabel}`}
                  data={chartCorrectByConteudo}
                  emptyMessage="Ainda não há acertos suficientes para montar essa pizza."
                />

                <PieCard
                  title="Conteúdos com mais erros"
                  subtitle={`Disciplina: ${selectedChartSubjectLabel}`}
                  data={chartWrongByConteudo}
                  emptyMessage="Ainda não há erros suficientes para montar essa pizza."
                />
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Evolução por dia</h2>

              {dailyStats.length > 0 ? (
                <div className="overflow-x-auto">
                  <div className="flex items-end gap-3 min-w-max h-64 px-2">
                    {dailyStats.map((item) => {
                      const barHeight = Math.max(16, (item.total / maxDailyTotal) * 180);

                      return (
                        <div key={item.date} className="flex flex-col items-center gap-2 w-16">
                          <div className="text-xs text-slate-500 font-medium">{item.total}</div>

                          <div className="flex items-end h-48">
                            <div
                              className="w-10 rounded-t-xl bg-gradient-to-t from-blue-600 to-purple-500"
                              style={{ height: `${barHeight}px` }}
                              title={`${item.date} • ${item.total} tentativas • ${item.accuracy.toFixed(
                                0
                              )}% acerto`}
                            />
                          </div>

                          <div className="text-[11px] text-center text-slate-600 leading-tight">
                            {item.date}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-slate-500">Ainda não há dados suficientes para o gráfico.</p>
              )}
            </Card>

            <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <h2 className="font-bold text-slate-900">Melhor disciplina</h2>
                </div>
                {bestSubject ? (
                  <>
                    <p className="text-lg font-bold text-slate-900">{bestSubject.label}</p>
                    <p className="text-sm text-slate-500">
                      {bestSubject.accuracy.toFixed(0)}% de acerto
                    </p>
                  </>
                ) : (
                  <p className="text-slate-500">Dados insuficientes.</p>
                )}
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  <h2 className="font-bold text-slate-900">Disciplina mais fraca</h2>
                </div>
                {worstSubject ? (
                  <>
                    <p className="text-lg font-bold text-slate-900">{worstSubject.label}</p>
                    <p className="text-sm text-slate-500">
                      {worstSubject.accuracy.toFixed(0)}% de acerto
                    </p>
                  </>
                ) : (
                  <p className="text-slate-500">Dados insuficientes.</p>
                )}
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-orange-500" />
                  <h2 className="font-bold text-slate-900">Conteúdo mais crítico</h2>
                </div>
                {mostWrongConteudo ? (
                  <>
                    <p className="text-lg font-bold text-slate-900">{mostWrongConteudo.label}</p>
                    <p className="text-sm text-slate-500">
                      {mostWrongConteudo.wrong} erros acumulados
                    </p>
                  </>
                ) : (
                  <p className="text-slate-500">Dados insuficientes.</p>
                )}
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <h2 className="font-bold text-slate-900">Assunto destaque</h2>
                </div>
                {bestAssunto ? (
                  <>
                    <p className="text-lg font-bold text-slate-900">{bestAssunto.label}</p>
                    <p className="text-sm text-slate-500">
                      {bestAssunto.accuracy.toFixed(0)}% de acerto
                    </p>
                  </>
                ) : (
                  <p className="text-slate-500">Dados insuficientes.</p>
                )}
              </Card>
            </div>

            <div className="grid xl:grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  <h2 className="text-xl font-bold text-slate-900">Maiores evoluções</h2>
                </div>

                <div className="space-y-3">
                  {topImprovements.length > 0 ? (
                    topImprovements.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-slate-900">{item.label}</span>
                          <span className="text-sm font-bold text-emerald-700">
                            {formatDelta(item.delta)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          Agora: {item.currentAccuracy.toFixed(0)}% • Antes: {item.previousAccuracy.toFixed(0)}%
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500">Ainda não há evolução suficiente para comparar.</p>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  <h2 className="text-xl font-bold text-slate-900">Maiores quedas</h2>
                </div>

                <div className="space-y-3">
                  {topDrops.length > 0 ? (
                    topDrops.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-red-200 bg-red-50 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-slate-900">{item.label}</span>
                          <span className="text-sm font-bold text-red-700">
                            {formatDelta(item.delta)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          Agora: {item.currentAccuracy.toFixed(0)}% • Antes: {item.previousAccuracy.toFixed(0)}%
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500">Nenhuma queda relevante detectada no período.</p>
                  )}
                </div>
              </Card>
            </div>

            <div className="grid xl:grid-cols-2 gap-6">
              <Card className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                  Desempenho por disciplina
                </h2>

                <div className="space-y-4">
                  {bySubject.length > 0 ? (
                    bySubject.map((item) => (
                      <div key={item.label} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">{item.label}</span>
                          <span className="text-sm font-bold text-slate-600">
                            {item.accuracy.toFixed(0)}%
                          </span>
                        </div>
                        <ProgressBar value={item.accuracy} />
                        <div className="text-sm text-slate-500">
                          {item.correct} acertos • {item.wrong} erros • {item.total} tentativas
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500">Ainda não há dados por disciplina.</p>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                  Desempenho por dificuldade
                </h2>

                <div className="space-y-4">
                  {byDifficulty.length > 0 ? (
                    byDifficulty.map((item) => (
                      <div key={item.label} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 capitalize">
                            {item.label}
                          </span>
                          <span className="text-sm font-bold text-slate-600">
                            {item.accuracy.toFixed(0)}%
                          </span>
                        </div>
                        <ProgressBar value={item.accuracy} />
                        <div className="text-sm text-slate-500">
                          {item.correct} acertos • {item.wrong} erros • {item.total} tentativas
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500">Ainda não há dados por dificuldade.</p>
                  )}
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Gauge className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-bold text-slate-900">Tendência por disciplina</h2>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {subjectEvolution.length > 0 ? (
                  subjectEvolution.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="font-semibold text-slate-900">{item.label}</span>
                        <span
                          className={`text-sm font-bold ${
                            item.delta >= 0 ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {formatDelta(item.delta)}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600">
                        Agora: {item.currentAccuracy.toFixed(0)}%
                      </p>
                      <p className="text-sm text-slate-500">
                        Antes: {item.previousAccuracy.toFixed(0)}%
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        {item.totalCurrent} tentativa(s) agora • {item.totalPrevious} antes
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">
                    Ainda não há dados suficientes para tendência por disciplina.
                  </p>
                )}
              </div>
            </Card>

            <div className="grid xl:grid-cols-2 gap-6">
              <Card className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Taxa de acerto por banca</h2>

                <div className="space-y-3">
                  {byBanca.length > 0 ? (
                    byBanca.slice(0, 10).map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-slate-200 p-4 bg-white"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-slate-800">{item.label}</span>
                          <span className="text-sm font-bold text-slate-600">
                            {item.accuracy.toFixed(0)}%
                          </span>
                        </div>
                        <ProgressBar value={item.accuracy} />
                        <div className="text-sm text-slate-500 mt-2">
                          {item.correct} acertos • {item.wrong} erros • {item.total} tentativas
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500">Ainda não há dados por banca.</p>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                  Tempo médio por disciplina
                </h2>

                <div className="space-y-3">
                  {averageTimeBySubject.length > 0 ? (
                    averageTimeBySubject.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-slate-200 p-4 bg-white"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">{item.label}</span>
                          <span className="text-sm font-bold text-purple-600">
                            {formatSeconds(Math.round(item.avgSeconds))}
                          </span>
                        </div>
                        <div className="text-sm text-slate-500 mt-2">
                          {item.total} tentativas com tempo registrado
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500">
                      Ainda não há dados suficientes de tempo por disciplina.
                    </p>
                  )}
                </div>
              </Card>
            </div>

            <div className="grid xl:grid-cols-2 gap-6">
              <Card className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Top conteúdos</h2>

                <div className="space-y-3">
                  {byConteudo.length > 0 ? (
                    byConteudo.slice(0, 10).map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-slate-200 p-4 bg-white"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-slate-800">{item.label}</span>
                          <span className="text-sm font-bold text-slate-600">
                            {item.accuracy.toFixed(0)}%
                          </span>
                        </div>
                        <ProgressBar value={item.accuracy} />
                        <div className="text-sm text-slate-500 mt-2">
                          {item.correct} acertos • {item.wrong} erros • {item.total} tentativas
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500">Ainda não há dados por conteúdo.</p>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Top assuntos</h2>

                <div className="space-y-3">
                  {byAssunto.length > 0 ? (
                    byAssunto.slice(0, 10).map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-slate-200 p-4 bg-white"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-slate-800">{item.label}</span>
                          <span className="text-sm font-bold text-slate-600">
                            {item.accuracy.toFixed(0)}%
                          </span>
                        </div>
                        <ProgressBar value={item.accuracy} />
                        <div className="text-sm text-slate-500 mt-2">
                          {item.correct} acertos • {item.wrong} erros • {item.total} tentativas
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500">Ainda não há dados por assunto.</p>
                  )}
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-bold text-slate-900">Cobertura do estudo</h2>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="rounded-xl border border-slate-200 p-4 bg-white">
                  <p className="text-sm text-slate-500 mb-1">Questões únicas</p>
                  <p className="text-2xl font-bold text-slate-900">{coverageInfo.uniqueQuestions}</p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4 bg-white">
                  <p className="text-sm text-slate-500 mb-1">Disciplinas tocadas</p>
                  <p className="text-2xl font-bold text-slate-900">{coverageInfo.uniqueSubjects}</p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4 bg-white">
                  <p className="text-sm text-slate-500 mb-1">Conteúdos tocados</p>
                  <p className="text-2xl font-bold text-slate-900">{coverageInfo.uniqueConteudos}</p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4 bg-white">
                  <p className="text-sm text-slate-500 mb-1">Assuntos tocados</p>
                  <p className="text-2xl font-bold text-slate-900">{coverageInfo.uniqueAssuntos}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h2 className="text-xl font-bold text-slate-900">Mapa de fraquezas</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-700 mb-2">Conteúdo com mais erros</p>
                  <p className="font-bold text-slate-900">
                    {mostWrongConteudo?.label ?? "Sem dados"}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {mostWrongConteudo ? `${mostWrongConteudo.wrong} erros` : "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                  <p className="text-sm font-semibold text-orange-700 mb-2">
                    Pior conteúdo por aproveitamento
                  </p>
                  <p className="font-bold text-slate-900">
                    {worstConteudoByAccuracy?.label ?? "Sem dados"}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {worstConteudoByAccuracy
                      ? `${worstConteudoByAccuracy.accuracy.toFixed(0)}% de acerto`
                      : "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                  <p className="text-sm font-semibold text-yellow-700 mb-2">
                    Pior assunto por aproveitamento
                  </p>
                  <p className="font-bold text-slate-900">
                    {worstAssuntoByAccuracy?.label ?? "Sem dados"}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {worstAssuntoByAccuracy
                      ? `${worstAssuntoByAccuracy.accuracy.toFixed(0)}% de acerto`
                      : "—"}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Timer className="w-5 h-5 text-indigo-500" />
                <h2 className="text-xl font-bold text-slate-900">Leitura estratégica</h2>
              </div>

              {recommendations.length > 0 ? (
                <div className="space-y-3">
                  {recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="rounded-xl bg-indigo-50 border border-indigo-200 p-4 text-slate-700"
                    >
                      {rec}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">
                  Responda mais questões para receber recomendações mais úteis.
                </p>
              )}
            </Card>

            <div className="grid xl:grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                  <h2 className="text-xl font-bold text-slate-900">Últimas erradas</h2>

                  <Link href="/caderno-de-erros">
                    <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                      Abrir caderno de erros
                    </Button>
                  </Link>
                </div>

                {wrongAttempts.length > 0 ? (
                  <div className="space-y-3">
                    {wrongAttempts.map((attempt) => (
                      <div
                        key={attempt.id}
                        className="rounded-xl border border-red-200 bg-red-50 p-4"
                      >
                        <p className="font-semibold text-slate-900">
                          {attempt.subject ?? "Sem disciplina"} •{" "}
                          {attempt.conteudo ?? "Sem conteúdo"}
                          {attempt.assunto ? ` • ${attempt.assunto}` : ""}
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
                          {attempt.banca ?? "Sem banca"} {attempt.ano ? `• ${attempt.ano}` : ""}
                          {attempt.difficulty ? ` • ${attempt.difficulty}` : ""}
                        </p>
                        <p className="text-sm text-red-600 font-bold mt-2">
                          Errou • {new Date(attempt.answered_at).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500">Nenhuma questão errada nesse filtro.</p>
                )}
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Últimas tentativas</h2>

                {recentAttempts.length > 0 ? (
                  <div className="space-y-3">
                    {recentAttempts.map((attempt) => (
                      <div
                        key={attempt.id}
                        className="rounded-xl border border-slate-200 p-4 bg-white flex flex-col gap-3"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {attempt.subject ?? "Sem disciplina"} •{" "}
                            {attempt.conteudo ?? "Sem conteúdo"}
                            {attempt.assunto ? ` • ${attempt.assunto}` : ""}
                          </p>
                          <p className="text-sm text-slate-500">
                            {attempt.banca ?? "Sem banca"} {attempt.ano ? `• ${attempt.ano}` : ""}
                            {attempt.difficulty ? ` • ${attempt.difficulty}` : ""}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-sm flex-wrap">
                          <span
                            className={`font-bold ${
                              attempt.is_correct ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {attempt.is_correct ? "Acertou" : "Errou"}
                          </span>
                          <span className="text-slate-500">
                            {formatSeconds(attempt.time_spent_seconds)}
                          </span>
                          <span className="text-slate-500">
                            {new Date(attempt.answered_at).toLocaleString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500">Nenhuma tentativa registrada nesse filtro.</p>
                )}
              </Card>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
