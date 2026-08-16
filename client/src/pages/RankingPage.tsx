import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { getDifficultyWeight, normalizeDifficulty } from "@/lib/difficulty";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Award,
  BarChart3,
  CalendarDays,
  Clock3,
  Crown,
  Flame,
  Gauge,
  Medal,
  Minus,
  Shield,
  Star,
  Target,
  Timer,
  Trophy,
  UserCircle2,
  Zap,
} from "lucide-react";

type AttemptRow = {
  id: string;
  user_id: string;
  question_id: string;
  is_correct: boolean;
  time_spent_seconds: number | null;
  answered_at: string;
  subject: string | null;
  conteudo: string | null;
  assunto: string | null;
  banca: string | null;
  ano: number | null;
  difficulty: string | null;
};

type ProfileRow = {
  id: string;
  nome: string | null;
  avatar_key?: string | null;
  ativo?: boolean | null;
};

type RankingPeriod = "24h" | "season" | "7d" | "30d" | "all";
type RankingSubject = "all" | "matematica" | "fisica" | "quimica";

type BadgeItem = {
  label: string;
  className: string;
};

type DivisionInfo = {
  label: string;
  className: string;
  description: string;
};

type RankingEntry = {
  userId: string;
  nome: string;
  avatarKey: string;
  score: number;
  correctCount: number;
  totalAttempts: number;
  accuracy: number;
  avgTimeSeconds: number;
  lastActivityAt: string | null;
  easyCorrect: number;
  mediumCorrect: number;
  hardCorrect: number;
  veryHardCorrect: number;
  topStreak: number;
  positionDelta: number | null;
  badges: BadgeItem[];
  division: DivisionInfo;
};

const PERIOD_OPTIONS: Array<{ key: RankingPeriod; label: string }> = [
  { key: "24h", label: "24h" },
  { key: "season", label: "Semana atual" },
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "1 mês" },
  { key: "all", label: "Todo período" },
];

const SUBJECT_OPTIONS: Array<{ key: RankingSubject; label: string }> = [
  { key: "all", label: "Geral" },
  { key: "matematica", label: "Matemática" },
  { key: "fisica", label: "Física" },
  { key: "quimica", label: "Química" },
];

const AVATAR_OPTIONS = [
  { key: "avatar_1", emoji: "🧠", bg: "from-blue-500 to-indigo-600" },
  { key: "avatar_2", emoji: "🚀", bg: "from-purple-500 to-fuchsia-600" },
  { key: "avatar_3", emoji: "⚡", bg: "from-amber-400 to-orange-500" },
  { key: "avatar_4", emoji: "📘", bg: "from-cyan-500 to-sky-600" },
  { key: "avatar_5", emoji: "🎯", bg: "from-emerald-500 to-green-600" },
  { key: "avatar_6", emoji: "🔥", bg: "from-rose-500 to-red-600" },
  { key: "avatar_7", emoji: "🛡️", bg: "from-slate-500 to-slate-700" },
  { key: "avatar_8", emoji: "🏆", bg: "from-yellow-400 to-amber-500" },
  { key: "avatar_9", emoji: "📈", bg: "from-teal-500 to-cyan-600" },
  { key: "avatar_10", emoji: "🧪", bg: "from-violet-500 to-purple-700" },
  { key: "avatar_11", emoji: "🛰️", bg: "from-sky-500 to-blue-700" },
  { key: "avatar_12", emoji: "⚙️", bg: "from-zinc-500 to-slate-700" },
];

function getAvatarConfig(avatarKey?: string | null) {
  return (
    AVATAR_OPTIONS.find((avatar) => avatar.key === avatarKey) ??
    AVATAR_OPTIONS[0]
  );
}

function normalizeText(value?: string | number | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getSubjectLabel(subject: RankingSubject) {
  return SUBJECT_OPTIONS.find((item) => item.key === subject)?.label ?? "Geral";
}

function getRankingTitle(subject: RankingSubject) {
  if (subject === "all") return "Ranking geral por pontuação";

  return `Ranking de ${getSubjectLabel(subject)} por pontuação`;
}

function getDifficultyPoints(difficulty?: string | null) {
  return getDifficultyWeight(difficulty);
}

function getDifficultyBucket(difficulty?: string | null) {
  const value = normalizeDifficulty(difficulty);

  if (value === "facil") return "easy";
  if (value === "medio") return "medium";
  if (value === "dificil") return "hard";
  if (value === "muito_dificil") return "very_hard";

  return "unknown";
}

function startOfToday(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfCurrentWeek(date: Date) {
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = startOfToday(date);

  start.setDate(start.getDate() + mondayOffset);

  return start;
}

function getPeriodRange(period: RankingPeriod) {
  const now = new Date();

  if (period === "all") {
    return {
      start: null,
      end: null,
      previousStart: null,
      previousEnd: null,
    };
  }

  if (period === "season") {
    const start = startOfCurrentWeek(now);
    const duration = now.getTime() - start.getTime();

    const previousStart = new Date(start);
    previousStart.setDate(previousStart.getDate() - 7);

    const previousEnd = new Date(previousStart.getTime() + duration);

    return {
      start,
      end: now,
      previousStart,
      previousEnd,
    };
  }

  const hours =
    period === "24h" ? 24 : period === "7d" ? 24 * 7 : 24 * 30;

  const durationMs = hours * 60 * 60 * 1000;
  const start = new Date(now.getTime() - durationMs);
  const previousStart = new Date(start.getTime() - durationMs);
  const previousEnd = start;

  return {
    start,
    end: now,
    previousStart,
    previousEnd,
  };
}

function isInsideRange(
  date: string,
  start: Date | null,
  end: Date | null
) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return false;

  if (start && parsed < start) return false;
  if (end && parsed > end) return false;

  return true;
}

function matchesSubject(attempt: AttemptRow, subject: RankingSubject) {
  if (subject === "all") return true;

  return normalizeText(attempt.subject) === normalizeText(subject);
}

function filterAttempts(
  attempts: AttemptRow[],
  subject: RankingSubject,
  start: Date | null,
  end: Date | null
) {
  return attempts.filter((attempt) => {
    if (!matchesSubject(attempt, subject)) return false;

    return isInsideRange(attempt.answered_at, start, end);
  });
}

function formatSeconds(seconds?: number | null) {
  if (!seconds || seconds <= 0) return "-";

  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);

  if (min === 0) return `${sec}s`;

  return `${min}m ${sec}s`;
}

function formatDateTime(date?: string | null) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDateKey(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return null;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getLongestCorrectStreak(attempts: AttemptRow[]) {
  const days = Array.from(
    new Set(
      attempts
        .filter((attempt) => attempt.is_correct)
        .map((attempt) => getDateKey(attempt.answered_at))
        .filter(Boolean) as string[]
    )
  ).sort();

  if (days.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < days.length; i += 1) {
    const previous = new Date(`${days[i - 1]}T00:00:00`);
    const actual = new Date(`${days[i]}T00:00:00`);
    const diffDays =
      (actual.getTime() - previous.getTime()) / (24 * 60 * 60 * 1000);

    if (diffDays === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

function getDivision(score: number): DivisionInfo {
  if (score >= 600) {
    return {
      label: "Insano",
      description: "Pontuação absurda no recorte atual.",
      className: "bg-violet-100 text-violet-700 border-violet-200",
    };
  }

  if (score >= 300) {
    return {
      label: "Elite",
      description: "Muito acima da média.",
      className: "bg-blue-100 text-blue-700 border-blue-200",
    };
  }

  if (score >= 150) {
    return {
      label: "Avançado",
      description: "Ritmo forte de pontuação.",
      className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    };
  }

  if (score >= 50) {
    return {
      label: "Intermediário",
      description: "Boa base de pontuação.",
      className: "bg-amber-100 text-amber-700 border-amber-200",
    };
  }

  return {
    label: "Base",
    description: "Início da jornada no ranking.",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  };
}

function getBadges(entry: Omit<RankingEntry, "badges" | "positionDelta">) {
  const badges: BadgeItem[] = [];

  if (entry.veryHardCorrect >= 5) {
    badges.push({
      label: "Caçador de Pedrada",
      className: "bg-violet-100 text-violet-700 border-violet-200",
    });
  }

  if (entry.hardCorrect + entry.veryHardCorrect >= 10) {
    badges.push({
      label: "Tanque de Guerra",
      className: "bg-red-100 text-red-700 border-red-200",
    });
  }

  if (entry.topStreak >= 3) {
    badges.push({
      label: "Consistente",
      className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    });
  }

  if (entry.totalAttempts >= 5 && entry.accuracy >= 80) {
    badges.push({
      label: "Precisão Cirúrgica",
      className: "bg-blue-100 text-blue-700 border-blue-200",
    });
  }

  if (entry.score >= 300) {
    badges.push({
      label: "Modo Elite",
      className: "bg-yellow-100 text-yellow-700 border-yellow-200",
    });
  }

  return badges.slice(0, 3);
}

function getPositionDeltaLabel(delta: number | null) {
  if (delta === null) {
    return {
      label: "novo",
      icon: Star,
      className: "bg-blue-100 text-blue-700 border-blue-200",
    };
  }

  if (delta > 0) {
    return {
      label: `subiu ${delta}`,
      icon: ArrowUp,
      className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    };
  }

  if (delta < 0) {
    return {
      label: `caiu ${Math.abs(delta)}`,
      icon: ArrowDown,
      className: "bg-red-100 text-red-700 border-red-200",
    };
  }

  return {
    label: "manteve",
    icon: Minus,
    className: "bg-slate-100 text-slate-700 border-slate-200",
  };
}

function buildPointDistanceText(points: number) {
  if (points <= 0) return "Você já está no topo deste recorte.";

  const easy = Math.ceil(points / 2);
  const medium = Math.ceil(points / 4);
  const hard = Math.ceil(points / 8);
  const veryHard = Math.ceil(points / 16);

  return `Para ultrapassar, faltam ${points} ponto(s): ${easy} fácil(is), ${medium} média(s), ${hard} difícil(eis) ou ${veryHard} muito difícil(eis).`;
}

function buildRankingRows(
  attempts: AttemptRow[],
  profiles: ProfileRow[]
): Array<Omit<RankingEntry, "positionDelta" | "badges">> {
  const profilesMap = new Map<string, ProfileRow>();

  for (const profile of profiles) {
    if (profile.ativo === false) continue;

    profilesMap.set(profile.id, profile);
  }

  const byUser = new Map<string, AttemptRow[]>();

  for (const attempt of attempts) {
    if (!attempt.user_id) continue;
    if (!profilesMap.has(attempt.user_id)) continue;

    const current = byUser.get(attempt.user_id) ?? [];
    current.push(attempt);
    byUser.set(attempt.user_id, current);
  }

  const rows: Array<Omit<RankingEntry, "positionDelta" | "badges">> = [];

  for (const [userId, userAttempts] of Array.from(byUser.entries())) {
    const profile = profilesMap.get(userId);

    if (!profile) continue;

    const uniqueCorrectByQuestion = new Map<string, AttemptRow>();

    for (const attempt of userAttempts) {
      if (!attempt.is_correct) continue;
      if (!attempt.question_id) continue;

      const existing = uniqueCorrectByQuestion.get(attempt.question_id);

      if (!existing) {
        uniqueCorrectByQuestion.set(attempt.question_id, attempt);
        continue;
      }

      const existingDate = new Date(existing.answered_at).getTime();
      const currentDate = new Date(attempt.answered_at).getTime();

      if (currentDate < existingDate) {
        uniqueCorrectByQuestion.set(attempt.question_id, attempt);
      }
    }

    let score = 0;
    let easyCorrect = 0;
    let mediumCorrect = 0;
    let hardCorrect = 0;
    let veryHardCorrect = 0;

    for (const attempt of Array.from(uniqueCorrectByQuestion.values())) {
      const bucket = getDifficultyBucket(attempt.difficulty);
      const points = getDifficultyPoints(attempt.difficulty);

      score += points;

      if (bucket === "easy") easyCorrect += 1;
      if (bucket === "medium") mediumCorrect += 1;
      if (bucket === "hard") hardCorrect += 1;
      if (bucket === "very_hard") veryHardCorrect += 1;
    }

    const correctCount = uniqueCorrectByQuestion.size;
    const totalAttempts = userAttempts.length;
    const accuracy =
      totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0;

    const timedAttempts = userAttempts.filter(
      (attempt) => typeof attempt.time_spent_seconds === "number"
    );

    const avgTimeSeconds =
      timedAttempts.length > 0
        ? timedAttempts.reduce(
            (sum, attempt) => sum + (attempt.time_spent_seconds ?? 0),
            0
          ) / timedAttempts.length
        : 0;

    const lastActivityAt =
      userAttempts.length > 0
        ? userAttempts
            .map((attempt) => attempt.answered_at)
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
        : null;

    rows.push({
      userId,
      nome: profile.nome?.trim() || "Aluno",
      avatarKey: profile.avatar_key || "avatar_1",
      score,
      correctCount,
      totalAttempts,
      accuracy,
      avgTimeSeconds,
      lastActivityAt,
      easyCorrect,
      mediumCorrect,
      hardCorrect,
      veryHardCorrect,
      topStreak: getLongestCorrectStreak(userAttempts),
      division: getDivision(score),
    });
  }

  return rows
    .filter((row) => row.correctCount > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      if (b.correctCount !== a.correctCount) {
        return b.correctCount - a.correctCount;
      }

      if (b.accuracy !== a.accuracy) {
        return b.accuracy - a.accuracy;
      }

      const aTime = a.avgTimeSeconds || Number.MAX_SAFE_INTEGER;
      const bTime = b.avgTimeSeconds || Number.MAX_SAFE_INTEGER;

      if (aTime !== bTime) return aTime - bTime;

      const aLast = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
      const bLast = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;

      return bLast - aLast;
    });
}

function HighlightCard({
  title,
  entry,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  entry: RankingEntry | null;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}) {
  if (!entry) {
    return (
      <Card className="p-5 bg-white border-slate-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Icon className="w-5 h-5 text-slate-600" />
          </div>

          <div>
            <p className="font-bold text-slate-900">{title}</p>
            <p className="text-sm text-slate-500">Sem dados suficientes</p>
          </div>
        </div>

        <p className="text-sm text-slate-500">{description}</p>
      </Card>
    );
  }

  const avatar = getAvatarConfig(entry.avatarKey);

  return (
    <Link href={`/perfil/${entry.userId}`}>
      <Card className="p-5 bg-white border-slate-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition-all">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatar.bg} text-white flex items-center justify-center text-2xl shadow-md`}
            >
              {avatar.emoji}
            </div>

            <div>
              <p className="font-bold text-slate-900">{entry.nome}</p>
              <p className="text-sm text-slate-500">{title}</p>
            </div>
          </div>

          <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center">
            <Icon className="w-5 h-5 text-amber-700" />
          </div>
        </div>

        <p className="text-2xl font-bold text-slate-900 mb-1">{value}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </Card>
    </Link>
  );
}

export default function RankingPage() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const trpcUtils = trpc.useUtils();

  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState<RankingPeriod>("season");
  const [subject, setSubject] = useState<RankingSubject>("all");

  function getProfileHref(userId: string) {
    return userId === user?.id ? "/perfil" : `/perfil/${userId}`;
  }

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const data = await trpcUtils.publicStats.getRankingData.fetch();

        setAttempts((data.attempts as unknown as AttemptRow[]) ?? []);
        setProfiles((data.profiles as unknown as ProfileRow[]) ?? []);
      } catch (err) {
        console.error("Erro inesperado ao carregar ranking:", err);
        setError("Ocorreu um erro inesperado ao carregar o ranking.");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadData();
    }
  }, [authLoading, trpcUtils]);

  const currentRange = useMemo(() => getPeriodRange(period), [period]);
  const seasonRange = useMemo(() => getPeriodRange("season"), []);

  const ranking = useMemo(() => {
    const currentAttempts = filterAttempts(
      attempts,
      subject,
      currentRange.start,
      currentRange.end
    );

    const previousAttempts =
      currentRange.previousStart && currentRange.previousEnd
        ? filterAttempts(
            attempts,
            subject,
            currentRange.previousStart,
            currentRange.previousEnd
          )
        : [];

    const currentRows = buildRankingRows(currentAttempts, profiles);
    const previousRows = buildRankingRows(previousAttempts, profiles);

    const previousPositionMap = new Map<string, number>();

    previousRows.forEach((entry, index) => {
      previousPositionMap.set(entry.userId, index + 1);
    });

    return currentRows.map((entry, index) => {
      const currentPosition = index + 1;
      const previousPosition = previousPositionMap.get(entry.userId);
      const positionDelta =
        previousPosition === undefined
          ? null
          : previousPosition - currentPosition;

      const baseEntry = {
        ...entry,
        positionDelta,
        badges: [],
      };

      return {
        ...baseEntry,
        badges: getBadges(baseEntry),
      };
    });
  }, [
    attempts,
    profiles,
    subject,
    currentRange.start,
    currentRange.end,
    currentRange.previousStart,
    currentRange.previousEnd,
  ]);

  const seasonRanking = useMemo(() => {
    const seasonAttempts = filterAttempts(
      attempts,
      subject,
      seasonRange.start,
      seasonRange.end
    );

    return buildRankingRows(seasonAttempts, profiles).map((entry) => {
      const baseEntry = {
        ...entry,
        positionDelta: null,
        badges: [],
      };

      return {
        ...baseEntry,
        badges: getBadges(baseEntry),
      };
    });
  }, [attempts, profiles, subject, seasonRange.start, seasonRange.end]);

  const myIndex = useMemo(() => {
    if (!user?.id) return -1;

    return ranking.findIndex((entry) => entry.userId === user.id);
  }, [ranking, user?.id]);

  const myEntry = myIndex >= 0 ? ranking[myIndex] : null;
  const nextEntry = myIndex > 0 ? ranking[myIndex - 1] : null;
  const top3 = ranking.slice(0, 3);

  const pointsToNext =
    myEntry && nextEntry ? Math.max(1, nextEntry.score - myEntry.score + 1) : 0;

  const bestAccuracy = useMemo(() => {
    return (
      [...ranking]
        .filter((entry) => entry.totalAttempts >= 5)
        .sort((a, b) => b.accuracy - a.accuracy || b.score - a.score)[0] ??
      null
    );
  }, [ranking]);

  const fastest = useMemo(() => {
    return (
      [...ranking]
        .filter((entry) => entry.correctCount >= 3 && entry.avgTimeSeconds > 0)
        .sort((a, b) => a.avgTimeSeconds - b.avgTimeSeconds)[0] ?? null
    );
  }, [ranking]);

  const mostVeryHard = useMemo(() => {
    return (
      [...ranking]
        .filter((entry) => entry.veryHardCorrect > 0)
        .sort(
          (a, b) =>
            b.veryHardCorrect - a.veryHardCorrect || b.score - a.score
        )[0] ?? null
    );
  }, [ranking]);

  const bestStreak = useMemo(() => {
    return (
      [...seasonRanking]
        .filter((entry) => entry.topStreak > 0)
        .sort((a, b) => b.topStreak - a.topStreak || b.score - a.score)[0] ??
      null
    );
  }, [seasonRanking]);

  function renderTopCard(entry: RankingEntry, position: number) {
    const avatar = getAvatarConfig(entry.avatarKey);
    const delta = getPositionDeltaLabel(entry.positionDelta);
    const DeltaIcon = delta.icon;

    const positionConfig =
      position === 1
        ? {
            icon: Crown,
            badge: "1º lugar",
            border: "border-yellow-200",
            cardBg: "bg-yellow-50",
          }
        : position === 2
          ? {
              icon: Trophy,
              badge: "2º lugar",
              border: "border-slate-200",
              cardBg: "bg-slate-50",
            }
          : {
              icon: Medal,
              badge: "3º lugar",
              border: "border-orange-200",
              cardBg: "bg-orange-50",
            };

    const Icon = positionConfig.icon;

    return (
      <Link key={entry.userId} href={getProfileHref(entry.userId)}>
        <Card
          className={`p-6 ${positionConfig.border} ${positionConfig.cardBg} cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all`}
        >
          <div className="flex items-center justify-between mb-5">
            <span className="px-3 py-1 rounded-full text-sm font-bold bg-white text-slate-700 border border-slate-200">
              {positionConfig.badge}
            </span>

            <Icon className="w-6 h-6 text-slate-700" />
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div
              className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${avatar.bg} text-white flex items-center justify-center text-3xl shadow-lg`}
            >
              {avatar.emoji}
            </div>

            <div>
              <p className="text-xl font-bold text-slate-900">{entry.nome}</p>

              <p className="text-sm text-slate-500">
                {entry.correctCount} acertos únicos
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${delta.className}`}
            >
              <DeltaIcon className="w-3.5 h-3.5" />
              {delta.label}
            </span>

            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${entry.division.className}`}
            >
              {entry.division.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl bg-white p-3 border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Score</p>

              <p className="text-2xl font-bold text-slate-900">
                {entry.score}
              </p>
            </div>

            <div className="rounded-xl bg-white p-3 border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Taxa</p>

              <p className="text-2xl font-bold text-slate-900">
                {entry.accuracy.toFixed(0)}%
              </p>
            </div>
          </div>

          <div className="text-sm text-slate-600 space-y-1">
            <p>
              Fácil:{" "}
              <span className="font-semibold">{entry.easyCorrect}</span> •{" "}
              Médio:{" "}
              <span className="font-semibold">{entry.mediumCorrect}</span> •{" "}
              Difícil:{" "}
              <span className="font-semibold">{entry.hardCorrect}</span> •{" "}
              Muito difícil:{" "}
              <span className="font-semibold">{entry.veryHardCorrect}</span>
            </p>

            <p>
              Tempo médio:{" "}
              <span className="font-semibold">
                {formatSeconds(Math.round(entry.avgTimeSeconds))}
              </span>
            </p>
          </div>

          {entry.badges.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-4">
              {entry.badges.map((badge) => (
                <span
                  key={badge.label}
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${badge.className}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-full px-4 py-2">
            <UserCircle2 className="w-4 h-4" />
            Ver perfil
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-slate-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="container py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>

          <h1 className="text-2xl font-bold text-slate-900">Ranking</h1>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        {authLoading || loading ? (
          <Card className="p-8">
            <p className="text-slate-600">Carregando ranking...</p>
          </Card>
        ) : error ? (
          <Card className="p-8 border-red-200 bg-red-50">
            <p className="text-red-700">{error}</p>
          </Card>
        ) : (
          <>
            <Card className="p-6 md:p-8 border-amber-200 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <p className="text-sm uppercase tracking-wide text-amber-100 mb-2">
                Competição estratégica
              </p>

              <h2 className="text-3xl font-bold mb-3">
                {getRankingTitle(subject)}
              </h2>

              <p className="text-amber-50 leading-relaxed max-w-3xl">
                O ranking considera apenas questões únicas acertadas no período
                escolhido. A pontuação é: <strong>fácil = 2</strong>,{" "}
                <strong>médio = 4</strong>,{" "}
                <strong>difícil = 8</strong> e{" "}
                <strong>muito difícil = 16</strong>.
              </p>
            </Card>

            <Card className="p-6 bg-white border-slate-200">
              <div className="grid xl:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-5 h-5 text-amber-600" />

                    <h3 className="text-xl font-bold text-slate-900">
                      Ranking por matéria
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {SUBJECT_OPTIONS.map((option) => (
                      <Button
                        key={option.key}
                        variant={subject === option.key ? "default" : "outline"}
                        className="rounded-2xl"
                        onClick={() => setSubject(option.key)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarDays className="w-5 h-5 text-amber-600" />

                    <h3 className="text-xl font-bold text-slate-900">
                      Período
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {PERIOD_OPTIONS.map((option) => (
                      <Button
                        key={option.key}
                        variant={period === option.key ? "default" : "outline"}
                        className="rounded-2xl"
                        onClick={() => setPeriod(option.key)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {myEntry ? (
              <Card className="p-6 bg-white border-slate-200">
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
                  <div>
                    <p className="text-sm uppercase tracking-wide text-slate-500 mb-2">
                      Sua posição
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="text-3xl font-bold text-slate-900">
                        #{myIndex + 1}
                      </h3>

                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${myEntry.division.className}`}
                      >
                        {myEntry.division.label}
                      </span>
                    </div>

                    <p className="text-slate-600 mt-2">
                      Score:{" "}
                      <span className="font-semibold">{myEntry.score}</span> •{" "}
                      {myEntry.correctCount} acertos únicos •{" "}
                      {myEntry.accuracy.toFixed(0)}% de taxa
                    </p>

                    <p className="text-sm text-slate-500 mt-3">
                      {nextEntry
                        ? buildPointDistanceText(pointsToNext)
                        : "Você está no topo deste recorte. Aproveite antes que alguém descubra."}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-3 xl:min-w-[560px]">
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                      <p className="text-sm text-slate-500 mb-1">
                        Tempo médio
                      </p>

                      <p className="text-xl font-bold text-slate-900">
                        {formatSeconds(Math.round(myEntry.avgTimeSeconds))}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                      <p className="text-sm text-slate-500 mb-1">
                        Última atividade
                      </p>

                      <p className="text-base font-bold text-slate-900">
                        {formatDateTime(myEntry.lastActivityAt)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                      <p className="text-sm text-slate-500 mb-1">
                        Próximo acima
                      </p>

                      <p className="text-base font-bold text-slate-900">
                        {nextEntry ? `${pointsToNext} pts` : "Topo"}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-6 bg-white border-slate-200">
                <p className="text-slate-600">
                  Você ainda não entrou no ranking neste período. Acerte
                  questões para subir.
                </p>
              </Card>
            )}

            {top3.length > 0 ? (
              <div className="grid xl:grid-cols-3 gap-4">
                {top3.map((entry, index) => renderTopCard(entry, index + 1))}
              </div>
            ) : (
              <Card className="p-8">
                <p className="text-slate-500">
                  Ainda não há pontuação suficiente para montar o ranking neste
                  período.
                </p>
              </Card>
            )}

            <section>
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-amber-600" />

                <h3 className="text-xl font-bold text-slate-900">
                  Destaques da semana
                </h3>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                <HighlightCard
                  title="Maior pontuação"
                  entry={seasonRanking[0] ?? null}
                  value={seasonRanking[0] ? `${seasonRanking[0].score} pts` : "—"}
                  icon={Trophy}
                  description="Top 1 da semana atual."
                />

                <HighlightCard
                  title="Mais muito difíceis"
                  entry={mostVeryHard}
                  value={
                    mostVeryHard
                      ? `${mostVeryHard.veryHardCorrect} acerto(s)`
                      : "—"
                  }
                  icon={Flame}
                  description="Quem mais acertou pedrada."
                />

                <HighlightCard
                  title="Melhor precisão"
                  entry={bestAccuracy}
                  value={
                    bestAccuracy ? `${bestAccuracy.accuracy.toFixed(0)}%` : "—"
                  }
                  icon={Gauge}
                  description="Mínimo de 5 tentativas."
                />

                <HighlightCard
                  title="Maior sequência"
                  entry={bestStreak}
                  value={bestStreak ? `${bestStreak.topStreak} dia(s)` : "—"}
                  icon={Zap}
                  description="Dias consecutivos com acerto."
                />
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-blue-600" />

                <h3 className="text-xl font-bold text-slate-900">
                  Rankings de eficiência
                </h3>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <HighlightCard
                  title="Precisão"
                  entry={bestAccuracy}
                  value={
                    bestAccuracy ? `${bestAccuracy.accuracy.toFixed(0)}%` : "—"
                  }
                  icon={Target}
                  description="Melhor taxa de acerto com mínimo de 5 tentativas."
                />

                <HighlightCard
                  title="Velocidade"
                  entry={fastest}
                  value={
                    fastest
                      ? formatSeconds(Math.round(fastest.avgTimeSeconds))
                      : "—"
                  }
                  icon={Timer}
                  description="Menor tempo médio com pelo menos 3 acertos."
                />

                <HighlightCard
                  title="Pedradas"
                  entry={mostVeryHard}
                  value={
                    mostVeryHard
                      ? `${mostVeryHard.veryHardCorrect} muito difícil(eis)`
                      : "—"
                  }
                  icon={Flame}
                  description="Mais acertos em questões muito difíceis."
                />
              </div>
            </section>

            <Card className="p-6 bg-white border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-amber-500" />

                <h3 className="text-xl font-bold text-slate-900">
                  Classificação geral
                </h3>
              </div>

              {ranking.length > 0 ? (
                <div className="space-y-3">
                  {ranking.map((entry, index) => {
                    const avatar = getAvatarConfig(entry.avatarKey);
                    const isCurrentUser = entry.userId === user?.id;
                    const delta = getPositionDeltaLabel(entry.positionDelta);
                    const DeltaIcon = delta.icon;

                    return (
                      <Link
                        key={entry.userId}
                        href={getProfileHref(entry.userId)}
                      >
                        <div
                          className={`rounded-2xl border p-4 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all ${
                            isCurrentUser
                              ? "border-blue-200 bg-blue-50"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="w-10 text-center">
                                <p className="text-xl font-bold text-slate-900">
                                  #{index + 1}
                                </p>
                              </div>

                              <div
                                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatar.bg} text-white flex items-center justify-center text-2xl shadow-md`}
                              >
                                {avatar.emoji}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-lg font-bold text-slate-900 truncate">
                                    {entry.nome}
                                  </p>

                                  {isCurrentUser ? (
                                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-600 text-white">
                                      Você
                                    </span>
                                  ) : null}

                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-bold ${delta.className}`}
                                  >
                                    <DeltaIcon className="w-3 h-3" />
                                    {delta.label}
                                  </span>

                                  <span
                                    className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold ${entry.division.className}`}
                                  >
                                    {entry.division.label}
                                  </span>

                                  <span className="px-2 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 inline-flex items-center gap-1">
                                    <UserCircle2 className="w-3 h-3" />
                                    Ver perfil
                                  </span>
                                </div>

                                <p className="text-sm text-slate-500">
                                  {entry.correctCount} acertos únicos •{" "}
                                  {entry.totalAttempts} tentativas •{" "}
                                  {entry.accuracy.toFixed(0)}% de taxa
                                </p>

                                {entry.badges.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {entry.badges.map((badge) => (
                                      <span
                                        key={badge.label}
                                        className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${badge.className}`}
                                      >
                                        {badge.label}
                                      </span>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 xl:min-w-[760px]">
                              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <p className="text-xs text-slate-500 mb-1">
                                  Score
                                </p>

                                <p className="text-lg font-bold text-slate-900">
                                  {entry.score}
                                </p>
                              </div>

                              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <p className="text-xs text-slate-500 mb-1">
                                  Fácil
                                </p>

                                <p className="text-lg font-bold text-slate-900">
                                  {entry.easyCorrect}
                                </p>
                              </div>

                              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <p className="text-xs text-slate-500 mb-1">
                                  Médio
                                </p>

                                <p className="text-lg font-bold text-slate-900">
                                  {entry.mediumCorrect}
                                </p>
                              </div>

                              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <p className="text-xs text-slate-500 mb-1">
                                  Difícil
                                </p>

                                <p className="text-lg font-bold text-slate-900">
                                  {entry.hardCorrect}
                                </p>
                              </div>

                              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <p className="text-xs text-slate-500 mb-1">
                                  Muito difícil
                                </p>

                                <p className="text-lg font-bold text-slate-900">
                                  {entry.veryHardCorrect}
                                </p>
                              </div>

                              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <p className="text-xs text-slate-500 mb-1">
                                  Tempo médio
                                </p>

                                <p className="text-lg font-bold text-slate-900">
                                  {formatSeconds(
                                    Math.round(entry.avgTimeSeconds)
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500">
                  Ninguém pontuou ainda nesse período.
                </p>
              )}
            </Card>

            <Card className="p-6 bg-white border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-blue-600" />

                <h3 className="text-xl font-bold text-slate-900">
                  Como esse ranking funciona
                </h3>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-bold text-slate-900 mb-1">
                    Conta só acerto
                  </p>

                  <p className="text-sm text-slate-600">
                    Só questões acertadas geram pontuação.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-bold text-slate-900 mb-1">
                    Questões únicas
                  </p>

                  <p className="text-sm text-slate-600">
                    Repetir a mesma questão não multiplica score.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-bold text-slate-900 mb-1">
                    Dificuldade pesa
                  </p>

                  <p className="text-sm text-slate-600">
                    Fácil vale 2, médio vale 4, difícil vale 8 e muito difícil
                    vale 16.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-bold text-slate-900 mb-1">
                    Desempate justo
                  </p>

                  <p className="text-sm text-slate-600">
                    Score, acertos, taxa, tempo médio e atividade recente.
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
