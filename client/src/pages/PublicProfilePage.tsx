import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { formatDifficultyLabel, getDifficultyWeight, normalizeDifficulty } from "@/lib/difficulty";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Target,
  Trophy,
  Clock3,
  Flame,
  CalendarDays,
  BrainCircuit,
  Award,
  Shield,
  Zap,
  Medal,
  Star,
  Crown,
  BarChart3,
  Layers3,
  Sparkles,
  Activity,
} from "lucide-react";

type AttemptRow = {
  id: string;
  user_id: string;
  question_id: string;
  selected_option?: string | null;
  is_correct: boolean;
  time_spent_seconds: number | null;
  answered_at: string;
  attempt_number?: number;
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
  email?: string | null;
  role?: string | null;
  ativo?: boolean | null;
  created_at?: string | null;
  last_seen_at?: string | null;
  avatar_key?: string | null;
  bio?: string | null;
  prova_alvo?: string | null;
  foco_atual?: string | null;
  meta_semanal_questoes?: number | null;
};

type GroupedStat = {
  label: string;
  total: number;
  correct: number;
  wrong: number;
  accuracy: number;
};

type Achievement = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  icon: "award" | "flame" | "target" | "shield" | "zap" | "medal" | "star" | "crown";
  progress?: number;
  progressMax?: number;
};

type RadarMetric = {
  label: string;
  value: number;
  description: string;
  delta?: number;
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
};

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

function formatDate(date?: string | null) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(date?: string | null) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSeconds(seconds?: number | null) {
  if (!seconds || seconds <= 0) return "-";
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  if (min === 0) return `${sec}s`;
  return `${min}m ${sec}s`;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function groupAttempts(
  attempts: AttemptRow[],
  key: (attempt: AttemptRow) => string | null | undefined
): GroupedStat[] {
  const map = new Map<string, { total: number; correct: number; wrong: number }>();

  for (const attempt of attempts) {
    const label = key(attempt)?.trim() || "Não informado";
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

function buildStreakInfo(attempts: AttemptRow[]) {
  const activeKeys = getActiveDateKeys(attempts);

  if (!activeKeys.length) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      activeDays7: 0,
      activeDays30: 0,
      totalActiveDays: 0,
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

      if (diffToToday <= 1) currentStreak = 1;
      else break;
    } else {
      const prev = new Date(`${reversed[i - 1]}T00:00:00`);
      const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);

      if (diffDays === 1) currentStreak += 1;
      else break;
    }
  }

  return {
    currentStreak,
    bestStreak,
    activeDays7,
    activeDays30,
    totalActiveDays: activeKeys.length,
  };
}

function getPreviousPeriodAttempts(attempts: AttemptRow[], days: number) {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() - days);

  const start = new Date(now);
  start.setDate(start.getDate() - days * 2);

  return attempts.filter((attempt) => {
    const date = new Date(attempt.answered_at);
    return date >= start && date < end;
  });
}

function getAccuracy(attempts: AttemptRow[]) {
  if (!attempts.length) return 0;
  const correct = attempts.filter((attempt) => attempt.is_correct).length;
  return (correct / attempts.length) * 100;
}

function getAverageTime(attempts: AttemptRow[]) {
  const valid = attempts.filter((a) => typeof a.time_spent_seconds === "number");
  if (!valid.length) return 0;
  return valid.reduce((sum, a) => sum + (a.time_spent_seconds ?? 0), 0) / valid.length;
}

function buildRadarMetrics(currentAttempts: AttemptRow[], previousAttempts: AttemptRow[]): RadarMetric[] {
  const totalAnswered = currentAttempts.length;
  const totalCorrect = currentAttempts.filter((a) => a.is_correct).length;
  const accuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;

  const prevAccuracy = getAccuracy(previousAttempts);
  const streakInfo = buildStreakInfo(currentAttempts);

  const avgTime = getAverageTime(currentAttempts);
  const prevAvgTime = getAverageTime(previousAttempts);

  const uniqueConteudos = new Set(
    currentAttempts.map((a) => a.conteudo?.trim()).filter(Boolean)
  ).size;

  const prevUniqueConteudos = new Set(
    previousAttempts.map((a) => a.conteudo?.trim()).filter(Boolean)
  ).size;

  const difficultyWeights = currentAttempts
    .filter((a) => a.difficulty)
    .map((a) => {
      const weight = getDifficultyWeight(a.difficulty);
      return a.is_correct ? weight : 0;
    });

  const maxDifficultyWeights = currentAttempts
    .filter((a) => a.difficulty)
    .map((a) => {
      return getDifficultyWeight(a.difficulty);
    });

  const difficultyScore =
    maxDifficultyWeights.length > 0
      ? (difficultyWeights.reduce((a: number, b: number) => a + b, 0) /
          maxDifficultyWeights.reduce((a: number, b: number) => a + b, 0)) *
        100
      : 0;

  const prevDifficultyWeights = previousAttempts
    .filter((a) => a.difficulty)
    .map((a) => {
      const weight = getDifficultyWeight(a.difficulty);
      return a.is_correct ? weight : 0;
    });

  const prevMaxDifficultyWeights = previousAttempts
    .filter((a) => a.difficulty)
    .map((a) => {
      return getDifficultyWeight(a.difficulty);
    });

  const prevDifficultyScore =
    prevMaxDifficultyWeights.length > 0
      ? (prevDifficultyWeights.reduce((a: number, b: number) => a + b, 0) /
          prevMaxDifficultyWeights.reduce((a: number, b: number) => a + b, 0)) *
        100
      : 0;

  const consistencyScore = clamp((streakInfo.activeDays30 / 20) * 100);
  const prevConsistencyScore = clamp((buildStreakInfo(previousAttempts).activeDays30 / 20) * 100);
  const speedScore = avgTime > 0 ? clamp(((300 - avgTime) / 240) * 100) : 0;
  const prevSpeedScore = prevAvgTime > 0 ? clamp(((300 - prevAvgTime) / 240) * 100) : 0;
  const coverageScore = clamp((uniqueConteudos / 20) * 100);
  const prevCoverageScore = clamp((prevUniqueConteudos / 20) * 100);

  return [
    {
      label: "Precisão",
      value: clamp(accuracy),
      delta: clamp(accuracy) - clamp(prevAccuracy),
      description: "Mede o aproveitamento geral nas questões.",
    },
    {
      label: "Consistência",
      value: consistencyScore,
      delta: consistencyScore - prevConsistencyScore,
      description: "Mostra frequência e regularidade de estudo.",
    },
    {
      label: "Velocidade",
      value: speedScore,
      delta: speedScore - prevSpeedScore,
      description: "Mostra quão ágil está resolvendo.",
    },
    {
      label: "Cobertura",
      value: coverageScore,
      delta: coverageScore - prevCoverageScore,
      description: "Mede quantos conteúdos diferentes foram treinados.",
    },
    {
      label: "Dificuldade",
      value: clamp(difficultyScore),
      delta: clamp(difficultyScore) - clamp(prevDifficultyScore),
      description: "Mede o rendimento em níveis mais exigentes.",
    },
  ];
}

function RadarChart({ metrics }: { metrics: RadarMetric[] }) {
  const size = 320;
  const center = size / 2;
  const radius = 110;
  const levels = 5;

  const points = metrics.map((metric, index) => {
    const angle = (Math.PI * 2 * index) / metrics.length - Math.PI / 2;
    const r = (metric.value / 100) * radius;
    const x = center + Math.cos(angle) * r;
    const y = center + Math.sin(angle) * r;
    return `${x},${y}`;
  });

  return (
    <div className="w-full flex justify-center">
      <svg width={size} height={size} className="overflow-visible">
        {Array.from({ length: levels }).map((_, levelIndex) => {
          const levelRadius = radius * ((levelIndex + 1) / levels);
          const levelPoints = metrics.map((_, index) => {
            const angle = (Math.PI * 2 * index) / metrics.length - Math.PI / 2;
            const x = center + Math.cos(angle) * levelRadius;
            const y = center + Math.sin(angle) * levelRadius;
            return `${x},${y}`;
          });

          return (
            <polygon
              key={levelIndex}
              points={levelPoints.join(" ")}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="1"
            />
          );
        })}

        {metrics.map((metric, index) => {
          const angle = (Math.PI * 2 * index) / metrics.length - Math.PI / 2;
          const x = center + Math.cos(angle) * radius;
          const y = center + Math.sin(angle) * radius;

          return (
            <g key={metric.label}>
              <line x1={center} y1={center} x2={x} y2={y} stroke="#cbd5e1" strokeWidth="1" />
              <text
                x={center + Math.cos(angle) * (radius + 28)}
                y={center + Math.sin(angle) * (radius + 28)}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-slate-700 text-[12px] font-semibold"
              >
                {metric.label}
              </text>
            </g>
          );
        })}

        <polygon
          points={points.join(" ")}
          fill="rgba(59,130,246,0.18)"
          stroke="#2563eb"
          strokeWidth="3"
        />

        {metrics.map((metric, index) => {
          const angle = (Math.PI * 2 * index) / metrics.length - Math.PI / 2;
          const r = (metric.value / 100) * radius;
          const x = center + Math.cos(angle) * r;
          const y = center + Math.sin(angle) * r;

          return <circle key={metric.label} cx={x} cy={y} r="5" fill="#2563eb" />;
        })}
      </svg>
    </div>
  );
}

function getAvatarConfig(avatarKey?: string | null) {
  return AVATAR_OPTIONS.find((avatar) => avatar.key === avatarKey) ?? AVATAR_OPTIONS[0];
}

function getProfilePhase({
  totalAnswered,
  accuracy,
  streak,
  coverage,
}: {
  totalAnswered: number;
  accuracy: number;
  streak: number;
  coverage: number;
}) {
  if (totalAnswered < 30) {
    return {
      title: "Fase de construção",
      description: "Este perfil ainda está formando base e dando volume ao estudo.",
      tone: "blue",
    };
  }

  if (accuracy >= 70 && streak >= 5 && coverage >= 45) {
    return {
      title: "Fase de consolidação",
      description: "O perfil já mostra consistência e domínio crescente.",
      tone: "green",
    };
  }

  if (accuracy >= 60 && coverage < 45) {
    return {
      title: "Fase de expansão",
      description: "Já existe base, mas ainda falta aumentar cobertura.",
      tone: "purple",
    };
  }

  if (accuracy < 55) {
    return {
      title: "Fase de correção",
      description: "O foco agora deve ser atacar gargalos com mais precisão.",
      tone: "orange",
    };
  }

  return {
    title: "Fase de refinamento",
    description: "O perfil está ajustando o jogo e ganhando consistência.",
    tone: "slate",
  };
}

function getProfileSignature(metrics: RadarMetric[]) {
  const sorted = [...metrics].sort((a, b) => b.value - a.value);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];

  if (!top || !bottom) return "Perfil ainda em formação.";

  return `Perfil de ${top.label.toLowerCase()} forte, mas ainda precisa crescer em ${bottom.label.toLowerCase()}.`;
}

function getAchievementIcon(icon: Achievement["icon"]) {
  switch (icon) {
    case "award":
      return Award;
    case "flame":
      return Flame;
    case "target":
      return Target;
    case "shield":
      return Shield;
    case "zap":
      return Zap;
    case "medal":
      return Medal;
    case "star":
      return Star;
    case "crown":
      return Crown;
    default:
      return Award;
  }
}

function formatDelta(delta?: number) {
  const value = delta ?? 0;
  if (value > 0) return `+${value.toFixed(0)}`;
  if (value < 0) return `${value.toFixed(0)}`;
  return "0";
}

function getDifficultyPoints(difficulty?: string | null) {
  const value = normalizeDifficulty(difficulty);

  if (value === "facil") return 2;
  if (value === "medio") return 4;
  if (value === "dificil") return 7;
  if (value === "muito_dificil") return 10;

  return 0;
}

function getDifficultyBucket(difficulty?: string | null) {
  const value = normalizeDifficulty(difficulty);

  if (value === "facil") return "easy";
  if (value === "medio") return "medium";
  if (value === "dificil") return "hard";
  if (value === "muito_dificil") return "very_hard";

  return "unknown";
}

function buildRanking(profiles: ProfileRow[], attempts: AttemptRow[]) {
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

  const rows: RankingEntry[] = [];

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

    for (const attempt of Array.from(uniqueCorrectByQuestion.values())) {
      const bucket = getDifficultyBucket(attempt.difficulty);
      const points = getDifficultyPoints(attempt.difficulty);

      score += points;

      if (bucket === "easy") easyCorrect += 1;
      if (bucket === "medium") mediumCorrect += 1;
      if (bucket === "hard") hardCorrect += 1;
    }

    const correctCount = uniqueCorrectByQuestion.size;
    const totalAttempts = userAttempts.length;
    const accuracy = totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0;

    const timedAttempts = userAttempts.filter(
      (attempt) => typeof attempt.time_spent_seconds === "number"
    );
    const avgTimeSeconds =
      timedAttempts.length > 0
        ? timedAttempts.reduce((sum, attempt) => sum + (attempt.time_spent_seconds ?? 0), 0) /
          timedAttempts.length
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
    });
  }

  return rows
    .filter((row) => row.correctCount > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;

      const aTime = a.avgTimeSeconds || Number.MAX_SAFE_INTEGER;
      const bTime = b.avgTimeSeconds || Number.MAX_SAFE_INTEGER;
      if (aTime !== bTime) return aTime - bTime;

      const aLast = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
      const bLast = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
      return bLast - aLast;
    });
}

function getRankingTier(position: number | null) {
  if (position === null) return "Fora do ranking";
  if (position === 1) return "Lenda";
  if (position <= 3) return "Elite";
  if (position <= 10) return "Destaque";
  if (position <= 25) return "Competidor";
  return "Em ascensão";
}

export default function PublicProfilePage() {
  const [, params] = useRoute("/perfil/:userId");
  const { loading: authLoading } = useSupabaseAuth();
  const trpcUtils = trpc.useUtils();

  const profileUserId = params?.userId ?? "";

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      if (!profileUserId) {
        setError("Perfil não encontrado.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await trpcUtils.publicStats.getPublicProfile.fetch({
          userId: profileUserId,
        });

        setProfile((data.profile as ProfileRow | null) ?? null);
        setAttempts((data.attempts as unknown as AttemptRow[]) ?? []);
        setProfiles((data.profiles as unknown as ProfileRow[]) ?? []);
      } catch (err) {
        console.error(err);
        setError("Ocorreu um erro inesperado ao carregar o perfil.");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) loadData();
  }, [profileUserId, authLoading, trpcUtils]);

  const profileAttempts = useMemo(
    () => attempts.filter((attempt) => attempt.user_id === profileUserId),
    [attempts, profileUserId]
  );

  const displayName = profile?.nome?.trim() || "Aluno";
  const avatar = getAvatarConfig(profile?.avatar_key || "avatar_1");
  const provaAlvo = profile?.prova_alvo?.trim() || "Prova-alvo não definida";
  const focoAtual = profile?.foco_atual?.trim() || "Foco atual não definido";
  const bio = profile?.bio?.trim() || "Esse aluno ainda não adicionou uma bio curta.";

  const totalAnswered = profileAttempts.length;
  const totalCorrect = useMemo(
    () => profileAttempts.filter((attempt) => attempt.is_correct).length,
    [profileAttempts]
  );
  const totalWrong = totalAnswered - totalCorrect;
  const accuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;
  const avgTimeSeconds = useMemo(() => getAverageTime(profileAttempts), [profileAttempts]);
  const streakInfo = useMemo(() => buildStreakInfo(profileAttempts), [profileAttempts]);

  const bySubject = useMemo(
    () => groupAttempts(profileAttempts, (attempt) => attempt.subject),
    [profileAttempts]
  );
  const byConteudo = useMemo(
    () => groupAttempts(profileAttempts, (attempt) => attempt.conteudo),
    [profileAttempts]
  );
  const byAssunto = useMemo(
    () => groupAttempts(profileAttempts, (attempt) => attempt.assunto),
    [profileAttempts]
  );
  const byBanca = useMemo(
    () => groupAttempts(profileAttempts, (attempt) => attempt.banca),
    [profileAttempts]
  );

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

  const mostTrainedConteudo = useMemo(() => byConteudo[0], [byConteudo]);

  const mostCriticalConteudo = useMemo(() => {
    return byConteudo
      .filter((item) => item.total >= 2)
      .sort((a, b) => b.wrong - a.wrong || a.accuracy - b.accuracy)[0];
  }, [byConteudo]);

  const bestAssunto = useMemo(() => {
    return byAssunto
      .filter((item) => item.total >= 2)
      .sort((a, b) => b.accuracy - a.accuracy || b.total - a.total)[0];
  }, [byAssunto]);

  const worstAssunto = useMemo(() => {
    return byAssunto
      .filter((item) => item.total >= 2)
      .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)[0];
  }, [byAssunto]);

  const bestBanca = useMemo(() => {
    return byBanca
      .filter((item) => item.total >= 2)
      .sort((a, b) => b.accuracy - a.accuracy || b.total - a.total)[0];
  }, [byBanca]);

  const worstBanca = useMemo(() => {
    return byBanca
      .filter((item) => item.total >= 2)
      .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)[0];
  }, [byBanca]);

  const weeklyAttempts = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 7);
    return profileAttempts.filter((attempt) => new Date(attempt.answered_at) >= cutoff);
  }, [profileAttempts]);

  const monthlyAttempts = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 30);
    return profileAttempts.filter((attempt) => new Date(attempt.answered_at) >= cutoff);
  }, [profileAttempts]);

  const previous7dAttempts = useMemo(() => getPreviousPeriodAttempts(profileAttempts, 7), [profileAttempts]);
  const previous30dAttempts = useMemo(() => getPreviousPeriodAttempts(profileAttempts, 30), [profileAttempts]);

  const weeklyQuestions = weeklyAttempts.length;
  const weeklyGoal = Number(profile?.meta_semanal_questoes ?? 0);
  const weeklyGoalPercent = weeklyGoal > 0 ? Math.min(100, (weeklyQuestions / weeklyGoal) * 100) : 0;

  const uniqueConteudos = useMemo(
    () => new Set(profileAttempts.map((a) => a.conteudo?.trim()).filter(Boolean)).size,
    [profileAttempts]
  );

  const uniqueAssuntos = useMemo(
    () => new Set(profileAttempts.map((a) => a.assunto?.trim()).filter(Boolean)).size,
    [profileAttempts]
  );

  const uniqueQuestions = useMemo(
    () => new Set(profileAttempts.map((a) => a.question_id).filter(Boolean)).size,
    [profileAttempts]
  );

  const weeklyAccuracy = useMemo(() => getAccuracy(weeklyAttempts), [weeklyAttempts]);
  const previous7dAccuracy = useMemo(() => getAccuracy(previous7dAttempts), [previous7dAttempts]);
  const monthlyAccuracy = useMemo(() => getAccuracy(monthlyAttempts), [monthlyAttempts]);
  const previous30dAccuracy = useMemo(() => getAccuracy(previous30dAttempts), [previous30dAttempts]);

  const weeklyAvgTime = useMemo(() => getAverageTime(weeklyAttempts), [weeklyAttempts]);
  const previous7dAvgTime = useMemo(() => getAverageTime(previous7dAttempts), [previous7dAttempts]);

  const radarMetrics = useMemo(
    () => buildRadarMetrics(profileAttempts, previous30dAttempts),
    [profileAttempts, previous30dAttempts]
  );

  const ranking = useMemo(() => buildRanking(profiles, attempts), [profiles, attempts]);

  const profileRankingIndex = useMemo(
    () => ranking.findIndex((entry) => entry.userId === profileUserId),
    [ranking, profileUserId]
  );

  const profileRankingEntry = profileRankingIndex >= 0 ? ranking[profileRankingIndex] : null;
  const profilePosition = profileRankingIndex >= 0 ? profileRankingIndex + 1 : null;
  const nextRankingEntry = profileRankingIndex > 0 ? ranking[profileRankingIndex - 1] : null;
  const top3Ranking = ranking.slice(0, 3);
  const rankingTier = getRankingTier(profilePosition);

  const profilePhase = useMemo(
    () =>
      getProfilePhase({
        totalAnswered,
        accuracy,
        streak: streakInfo.currentStreak,
        coverage: uniqueConteudos,
      }),
    [totalAnswered, accuracy, streakInfo.currentStreak, uniqueConteudos]
  );

  const profileSignature = useMemo(() => getProfileSignature(radarMetrics), [radarMetrics]);

  const studyWeekSubjects = useMemo(() => {
    return Array.from(
      new Set(weeklyAttempts.map((a) => a.subject?.trim()).filter(Boolean))
    ) as string[];
  }, [weeklyAttempts]);

  const studyWeekConteudos = useMemo(() => {
    return Array.from(
      new Set(weeklyAttempts.map((a) => a.conteudo?.trim()).filter(Boolean))
    ) as string[];
  }, [weeklyAttempts]);

  const studyWeekLastConteudo = weeklyAttempts[0]?.conteudo?.trim() || null;
  const studyWeekLastSubject = weeklyAttempts[0]?.subject?.trim() || null;

  const achievements = useMemo<Achievement[]>(() => {
    return [
      {
        id: "first_question",
        title: "Primeiro passo",
        description: "Resolver a primeira questão na plataforma.",
        unlocked: totalAnswered >= 1,
        icon: "award",
        progress: Math.min(totalAnswered, 1),
        progressMax: 1,
      },
      {
        id: "fifty_questions",
        title: "Volume inicial",
        description: "Alcançar 50 questões resolvidas.",
        unlocked: totalAnswered >= 50,
        icon: "target",
        progress: Math.min(totalAnswered, 50),
        progressMax: 50,
      },
      {
        id: "hundred_questions",
        title: "Cem resolvidas",
        description: "Bater 100 questões resolvidas.",
        unlocked: totalAnswered >= 100,
        icon: "medal",
        progress: Math.min(totalAnswered, 100),
        progressMax: 100,
      },
      {
        id: "seven_day_streak",
        title: "Constância real",
        description: "Manter 7 dias seguidos de estudo.",
        unlocked: streakInfo.bestStreak >= 7,
        icon: "flame",
        progress: Math.min(streakInfo.bestStreak, 7),
        progressMax: 7,
      },
      {
        id: "accuracy_70",
        title: "Mira calibrada",
        description: "Alcançar 70% de acerto geral.",
        unlocked: accuracy >= 70,
        icon: "shield",
        progress: Math.min(Math.round(accuracy), 70),
        progressMax: 70,
      },
      {
        id: "weekly_goal",
        title: "Meta batida",
        description: "Cumprir a meta semanal de questões.",
        unlocked: weeklyGoal > 0 && weeklyQuestions >= weeklyGoal,
        icon: "star",
        progress: weeklyGoal > 0 ? Math.min(weeklyQuestions, weeklyGoal) : 0,
        progressMax: weeklyGoal > 0 ? weeklyGoal : 1,
      },
      {
        id: "coverage_10",
        title: "Cobertura forte",
        description: "Tocar 10 conteúdos diferentes.",
        unlocked: uniqueConteudos >= 10,
        icon: "zap",
        progress: Math.min(uniqueConteudos, 10),
        progressMax: 10,
      },
      {
        id: "hard_mode",
        title: "Perfil de ataque",
        description: "Ir bem com volume em dificuldades maiores.",
        unlocked: (radarMetrics.find((item) => item.label === "Dificuldade")?.value ?? 0) >= 65,
        icon: "crown",
        progress: Math.min(
          Math.round(radarMetrics.find((item) => item.label === "Dificuldade")?.value ?? 0),
          65
        ),
        progressMax: 65,
      },
    ];
  }, [totalAnswered, streakInfo.bestStreak, accuracy, weeklyGoal, weeklyQuestions, uniqueConteudos, radarMetrics]);

  const unlockedAchievements = achievements.filter((item) => item.unlocked).length;

  function phaseToneClasses(tone: string) {
    if (tone === "green") return "border-emerald-200 bg-emerald-50 text-emerald-700";
    if (tone === "purple") return "border-purple-200 bg-purple-50 text-purple-700";
    if (tone === "orange") return "border-orange-200 bg-orange-50 text-orange-700";
    if (tone === "blue") return "border-blue-200 bg-blue-50 text-blue-700";
    return "border-slate-200 bg-slate-50 text-slate-700";
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="container py-4 flex items-center gap-4">
          <Link href="/ranking">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao ranking
            </Button>
          </Link>

          <h1 className="text-2xl font-bold text-slate-900">Perfil do Aluno</h1>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        {authLoading || loading ? (
          <Card className="p-8">
            <p className="text-slate-600">Carregando perfil...</p>
          </Card>
        ) : error ? (
          <Card className="p-8 border-red-200 bg-red-50">
            <p className="text-red-700">{error}</p>
          </Card>
        ) : profile ? (
          <>
            <Card className="p-6 md:p-8 border-slate-200 bg-white">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex items-start gap-5">
                  <div
                    className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${avatar.bg} text-white flex items-center justify-center text-4xl shadow-lg`}
                  >
                    {avatar.emoji}
                  </div>

                  <div>
                    <p className="text-sm uppercase tracking-wide text-slate-500 mb-2">
                      Central do aluno
                    </p>
                    <h2 className="text-3xl font-bold text-slate-900">{displayName}</h2>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                        {provaAlvo}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold">
                        {focoAtual}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-semibold">
                        {rankingTier}
                      </span>
                    </div>

                    <p className="text-slate-600 mt-4 max-w-2xl">{bio}</p>

                    <div className="flex flex-wrap gap-3 mt-4 text-sm text-slate-500">
                      <span>Na plataforma desde {formatDate(profile?.created_at)}</span>
                      <span>•</span>
                      <span>Última atividade: {formatDateTime(profile?.last_seen_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className={`p-5 border ${phaseToneClasses(profilePhase.tone)}`}>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-wide font-semibold mb-1">
                    Momento atual
                  </p>
                  <h3 className="text-2xl font-bold">{profilePhase.title}</h3>
                  <p className="mt-2 max-w-3xl">{profilePhase.description}</p>
                </div>

                <div className="rounded-2xl bg-white/70 px-4 py-3 border border-white/60">
                  <p className="text-sm font-semibold">Assinatura do perfil</p>
                  <p className="mt-1">{profileSignature}</p>
                </div>
              </div>
            </Card>

            <div className="grid md:grid-cols-2 xl:grid-cols-6 gap-4">
              <Card className="p-5">
                <p className="text-sm text-slate-500 mb-1">Questões resolvidas</p>
                <p className="text-3xl font-bold text-slate-900">{totalAnswered}</p>
              </Card>

              <Card className="p-5">
                <p className="text-sm text-slate-500 mb-1">Taxa de acerto</p>
                <p className="text-3xl font-bold text-emerald-600">{accuracy.toFixed(0)}%</p>
              </Card>

              <Card className="p-5">
                <p className="text-sm text-slate-500 mb-1">Tempo médio</p>
                <p className="text-3xl font-bold text-purple-600">
                  {formatSeconds(Math.round(avgTimeSeconds))}
                </p>
              </Card>

              <Card className="p-5">
                <p className="text-sm text-slate-500 mb-1">Sequência atual</p>
                <p className="text-3xl font-bold text-orange-600">{streakInfo.currentStreak}</p>
              </Card>

              <Card className="p-5">
                <p className="text-sm text-slate-500 mb-1">Dias ativos 30d</p>
                <p className="text-3xl font-bold text-blue-600">{streakInfo.activeDays30}</p>
              </Card>

              <Card className="p-5">
                <p className="text-sm text-slate-500 mb-1">Meta da semana</p>
                <p className="text-3xl font-bold text-slate-900">
                  {weeklyGoal > 0 ? `${weeklyQuestions}/${weeklyGoal}` : weeklyQuestions}
                </p>
              </Card>
            </div>

            <div className="grid xl:grid-cols-3 gap-6">
              <Card className="p-6 bg-white xl:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <BrainCircuit className="w-5 h-5 text-blue-600" />
                  <h3 className="text-xl font-bold text-slate-900">Leitura do perfil</h3>
                </div>

                <div className="grid lg:grid-cols-2 gap-6 items-center">
                  <RadarChart metrics={radarMetrics} />

                  <div className="space-y-3">
                    {radarMetrics.map((metric) => (
                      <div key={metric.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between mb-2 gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">{metric.label}</p>
                            <p className="text-xs text-slate-500 mt-1">{metric.description}</p>
                          </div>

                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">{metric.value.toFixed(0)}</p>
                            <p
                              className={`text-xs font-semibold ${
                                (metric.delta ?? 0) >= 0 ? "text-emerald-600" : "text-red-600"
                              }`}
                            >
                              {formatDelta(metric.delta)}
                            </p>
                          </div>
                        </div>

                        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                            style={{ width: `${metric.value}%` }}
                          />
                        </div>
                      </div>
                    ))}

                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <p className="text-sm font-semibold text-blue-700 mb-1">Como ler esse pentágono</p>
                      <p className="text-sm text-slate-700">
                        Ele mostra o perfil de estudo em 5 frentes: acerto, constância, rapidez,
                        variedade de conteúdos e desempenho em níveis mais exigentes.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-xl font-bold text-slate-900">Ranking do aluno</h3>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm uppercase tracking-wide text-slate-500 mb-2">Posição atual</p>
                    <p className="text-4xl font-bold text-slate-900">
                      {profilePosition ? `#${profilePosition}` : "—"}
                    </p>
                    <p className="text-slate-600 mt-2">{rankingTier}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm text-slate-500 mb-1">Score</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {profileRankingEntry?.score ?? "—"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm text-slate-500 mb-1">Próximo acima</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {profileRankingEntry && nextRankingEntry
                          ? nextRankingEntry.score - profileRankingEntry.score
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <Link href="/ranking">
                    <Button className="rounded-2xl w-full">Ver ranking completo</Button>
                  </Link>
                </div>
              </Card>
            </div>

            <Card className="p-6 bg-white">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="text-xl font-bold text-slate-900">Resumo do ranking</h3>
              </div>

              {top3Ranking.length > 0 ? (
                <div className="grid md:grid-cols-3 gap-4">
                  {top3Ranking.map((entry, index) => {
                    const avatarTop = getAvatarConfig(entry.avatarKey);
                    const isTarget = entry.userId === profileUserId;

                    return (
                      <div
                        key={entry.userId}
                        className={`rounded-2xl border p-4 ${
                          isTarget ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-lg font-bold text-slate-900">#{index + 1}</span>
                          {index === 0 ? <Crown className="w-5 h-5 text-amber-500" /> : null}
                          {index === 1 ? <Trophy className="w-5 h-5 text-slate-500" /> : null}
                          {index === 2 ? <Medal className="w-5 h-5 text-orange-500" /> : null}
                        </div>

                        <div className="flex items-center gap-3">
                          <div
                            className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatarTop.bg} text-white flex items-center justify-center text-2xl`}
                          >
                            {avatarTop.emoji}
                          </div>

                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{entry.nome}</p>
                            <p className="text-sm text-slate-500">{entry.score} pts</p>
                          </div>
                        </div>

                        {isTarget ? (
                          <p className="text-xs font-bold text-blue-600 mt-3">Este aluno está no top 3</p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500">Ainda não há ranking suficiente para mostrar o top 3.</p>
              )}
            </Card>

            <div className="grid xl:grid-cols-2 gap-6">
              <Card className="p-6 bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-xl font-bold text-slate-900">Progresso recente</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500 mb-1">Acerto 7 dias</p>
                    <p className="text-2xl font-bold text-slate-900">{weeklyAccuracy.toFixed(0)}%</p>
                    <p
                      className={`text-sm mt-1 font-semibold ${
                        weeklyAccuracy - previous7dAccuracy >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {formatDelta(weeklyAccuracy - previous7dAccuracy)} pts vs 7d anteriores
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500 mb-1">Acerto 30 dias</p>
                    <p className="text-2xl font-bold text-slate-900">{monthlyAccuracy.toFixed(0)}%</p>
                    <p
                      className={`text-sm mt-1 font-semibold ${
                        monthlyAccuracy - previous30dAccuracy >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {formatDelta(monthlyAccuracy - previous30dAccuracy)} pts vs 30d anteriores
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500 mb-1">Tempo médio 7 dias</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {formatSeconds(Math.round(weeklyAvgTime))}
                    </p>
                    <p
                      className={`text-sm mt-1 font-semibold ${
                        weeklyAvgTime - previous7dAvgTime <= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {formatDelta(previous7dAvgTime - weeklyAvgTime)} s de eficiência
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500 mb-1">Perguntas únicas</p>
                    <p className="text-2xl font-bold text-slate-900">{uniqueQuestions}</p>
                    <p className="text-sm mt-1 text-slate-500">Não conta repetição da mesma questão</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <Layers3 className="w-5 h-5 text-cyan-600" />
                  <h3 className="text-xl font-bold text-slate-900">Rotina da semana</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500 mb-1">Disciplinas tocadas</p>
                    <p className="text-2xl font-bold text-slate-900">{studyWeekSubjects.length}</p>
                    <p className="text-sm mt-1 text-slate-500">
                      {studyWeekSubjects.length ? studyWeekSubjects.join(", ") : "Nenhuma ainda"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500 mb-1">Conteúdos tocados</p>
                    <p className="text-2xl font-bold text-slate-900">{studyWeekConteudos.length}</p>
                    <p className="text-sm mt-1 text-slate-500">
                      {studyWeekConteudos.length ? "Boa semana de cobertura" : "Cobertura zerada"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500 mb-1">Último conteúdo</p>
                    <p className="text-lg font-bold text-slate-900">{studyWeekLastConteudo || "—"}</p>
                    <p className="text-sm mt-1 text-slate-500">
                      {studyWeekLastSubject || "Sem disciplina nesta semana"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500 mb-1">Dias ativos da semana</p>
                    <p className="text-2xl font-bold text-slate-900">{streakInfo.activeDays7}/7</p>
                    <p className="text-sm mt-1 text-slate-500">Ritmo recente de estudo</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6 bg-white">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h3 className="text-xl font-bold text-slate-900">Identidade acadêmica</h3>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-700 mb-1">Melhor disciplina</p>
                  <p className="font-bold text-slate-900">{bestSubject?.label ?? "Sem dados ainda"}</p>
                  <p className="text-sm text-slate-600 mt-1">
                    {bestSubject ? `${bestSubject.accuracy.toFixed(0)}% de acerto` : "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-700 mb-1">Disciplina mais fraca</p>
                  <p className="font-bold text-slate-900">{worstSubject?.label ?? "Sem dados ainda"}</p>
                  <p className="text-sm text-slate-600 mt-1">
                    {worstSubject ? `${worstSubject.accuracy.toFixed(0)}% de acerto` : "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm font-semibold text-blue-700 mb-1">Conteúdo mais treinado</p>
                  <p className="font-bold text-slate-900">{mostTrainedConteudo?.label ?? "Sem dados ainda"}</p>
                  <p className="text-sm text-slate-600 mt-1">
                    {mostTrainedConteudo ? `${mostTrainedConteudo.total} tentativas` : "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                  <p className="text-sm font-semibold text-orange-700 mb-1">Conteúdo mais crítico</p>
                  <p className="font-bold text-slate-900">{mostCriticalConteudo?.label ?? "Sem dados ainda"}</p>
                  <p className="text-sm text-slate-600 mt-1">
                    {mostCriticalConteudo ? `${mostCriticalConteudo.wrong} erros` : "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
                  <p className="text-sm font-semibold text-teal-700 mb-1">Assunto mais forte</p>
                  <p className="font-bold text-slate-900">{bestAssunto?.label ?? "Sem dados ainda"}</p>
                  <p className="text-sm text-slate-600 mt-1">
                    {bestAssunto ? `${bestAssunto.accuracy.toFixed(0)}% de acerto` : "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-sm font-semibold text-rose-700 mb-1">Assunto mais fraco</p>
                  <p className="font-bold text-slate-900">{worstAssunto?.label ?? "Sem dados ainda"}</p>
                  <p className="text-sm text-slate-600 mt-1">
                    {worstAssunto ? `${worstAssunto.accuracy.toFixed(0)}% de acerto` : "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                  <p className="text-sm font-semibold text-indigo-700 mb-1">Melhor banca</p>
                  <p className="font-bold text-slate-900">{bestBanca?.label ?? "Sem dados ainda"}</p>
                  <p className="text-sm text-slate-600 mt-1">
                    {bestBanca ? `${bestBanca.accuracy.toFixed(0)}% de acerto` : "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                  <p className="text-sm font-semibold text-yellow-700 mb-1">Banca mais chata</p>
                  <p className="font-bold text-slate-900">{worstBanca?.label ?? "Sem dados ainda"}</p>
                  <p className="text-sm text-slate-600 mt-1">
                    {worstBanca ? `${worstBanca.accuracy.toFixed(0)}% de acerto` : "—"}
                  </p>
                </div>
              </div>
            </Card>

            <div className="grid xl:grid-cols-2 gap-6">
              <Card className="p-6 bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-purple-600" />
                  <h3 className="text-xl font-bold text-slate-900">Objetivo atual</h3>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                    <p className="text-sm text-slate-500 mb-1">Prova-alvo</p>
                    <p className="font-bold text-slate-900">{profile?.prova_alvo || "Ainda não definida"}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                    <p className="text-sm text-slate-500 mb-1">Foco atual</p>
                    <p className="font-bold text-slate-900">{profile?.foco_atual || "Ainda não definido"}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                    <p className="text-sm text-slate-500 mb-2">Meta semanal</p>
                    <p className="font-bold text-slate-900 mb-3">
                      {weeklyGoal > 0
                        ? `${weeklyQuestions} de ${weeklyGoal} questões`
                        : `${weeklyQuestions} questões nesta semana`}
                    </p>

                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600"
                        style={{ width: `${weeklyGoalPercent}%` }}
                      />
                    </div>

                    <p className="text-sm text-slate-500 mt-2">
                      {weeklyGoal > 0
                        ? `${weeklyGoalPercent.toFixed(0)}% da meta concluída`
                        : "Meta semanal ainda não definida"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                      <p className="text-sm text-slate-500 mb-1">Conteúdos tocados</p>
                      <p className="text-2xl font-bold text-slate-900">{uniqueConteudos}</p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                      <p className="text-sm text-slate-500 mb-1">Assuntos tocados</p>
                      <p className="text-2xl font-bold text-slate-900">{uniqueAssuntos}</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  <h3 className="text-xl font-bold text-slate-900">Perfil vivo</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500 mb-1">Fase atual</p>
                    <p className="font-bold text-slate-900">{profilePhase.title}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500 mb-1">Melhor sequência</p>
                    <p className="font-bold text-slate-900">{streakInfo.bestStreak} dias</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500 mb-1">Dias ativos totais</p>
                    <p className="font-bold text-slate-900">{streakInfo.totalActiveDays}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500 mb-1">Melhor leitura atual</p>
                    <p className="font-bold text-slate-900">{profileSignature}</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6 bg-white">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="text-xl font-bold text-slate-900">Conquistas</h3>
                <span className="text-sm text-slate-500 ml-auto">
                  {unlockedAchievements} de {achievements.length} desbloqueadas
                </span>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                {achievements.map((achievement) => {
                  const Icon = getAchievementIcon(achievement.icon);
                  const progressPercent =
                    achievement.progressMax && achievement.progress !== undefined
                      ? Math.min(100, (achievement.progress / achievement.progressMax) * 100)
                      : 0;

                  return (
                    <div
                      key={achievement.id}
                      className={`rounded-2xl border p-4 transition-all ${
                        achievement.unlocked
                          ? "border-amber-200 bg-amber-50"
                          : "border-slate-200 bg-slate-50 opacity-80"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                            achievement.unlocked
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>

                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-full ${
                            achievement.unlocked
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {achievement.unlocked ? "Desbloqueada" : "Bloqueada"}
                        </span>
                      </div>

                      <p className="font-bold text-slate-900">{achievement.title}</p>
                      <p className="text-sm text-slate-600 mt-1">{achievement.description}</p>

                      {!achievement.unlocked && achievement.progress !== undefined && achievement.progressMax ? (
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                            <span>Progresso</span>
                            <span>
                              {achievement.progress}/{achievement.progressMax}
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-slate-500 to-slate-700"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        ) : null}
      </main>
    </div>
  );
}
