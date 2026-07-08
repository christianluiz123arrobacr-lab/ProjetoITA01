import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Pencil,
  Save,
  Target,
  Trophy,
  Clock3,
  Flame,
  CalendarDays,
  BrainCircuit,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Award,
  Shield,
  Zap,
  Medal,
  Star,
  Crown,
  BarChart3,
  TimerReset,
  Layers3,
  Sparkles,
  Activity,
  Swords,
  ChevronUp,
} from "lucide-react";

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

type ProfileRow = {
  id: string;
  nome: string | null;
  email: string | null;
  role: string | null;
  ativo: boolean | null;
  created_at: string | null;
  last_seen_at?: string | null;
  avatar_key?: string | null;
  bio?: string | null;
  prova_alvo?: string | null;
  foco_atual?: string | null;
  meta_semanal_questoes?: number | null;
};

type EditableProfile = {
  nome: string;
  avatar_key: string;
  bio: string;
  prova_alvo: string;
  foco_atual: string;
  meta_semanal_questoes: string;
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

const GOAL_SUGGESTIONS = [30, 50, 70, 100, 140];
const TARGET_EXAM_SUGGESTIONS = ["ITA", "IME", "FUVEST", "ENEM", "UNESP", "UNICAMP", "EPCAR", "EFOMM"];
const FOCUS_SUGGESTIONS = [
  "Física",
  "Matemática",
  "Química",
  "Revisão",
  "Correção de erros",
  "Dificuldade alta",
  "Base teórica",
];

const INITIAL_FORM: EditableProfile = {
  nome: "",
  avatar_key: "avatar_1",
  bio: "",
  prova_alvo: "",
  foco_atual: "",
  meta_semanal_questoes: "",
};

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
      const difficulty = (a.difficulty || "").toLowerCase().trim();
      const weight = difficulty === "dificil" ? 3 : difficulty === "medio" ? 2 : 1;
      return a.is_correct ? weight : 0;
    });

  const maxDifficultyWeights = currentAttempts
    .filter((a) => a.difficulty)
    .map((a) => {
      const difficulty = (a.difficulty || "").toLowerCase().trim();
      return difficulty === "dificil" ? 3 : difficulty === "medio" ? 2 : 1;
    });

  const difficultyScore =
    maxDifficultyWeights.length > 0
      ? (difficultyWeights.reduce((a, b) => a + b, 0) /
          maxDifficultyWeights.reduce((a, b) => a + b, 0)) *
        100
      : 0;

  const prevDifficultyWeights = previousAttempts
    .filter((a) => a.difficulty)
    .map((a) => {
      const difficulty = (a.difficulty || "").toLowerCase().trim();
      const weight = difficulty === "dificil" ? 3 : difficulty === "medio" ? 2 : 1;
      return a.is_correct ? weight : 0;
    });

  const prevMaxDifficultyWeights = previousAttempts
    .filter((a) => a.difficulty)
    .map((a) => {
      const difficulty = (a.difficulty || "").toLowerCase().trim();
      return difficulty === "dificil" ? 3 : difficulty === "medio" ? 2 : 1;
    });

  const prevDifficultyScore =
    prevMaxDifficultyWeights.length > 0
      ? (prevDifficultyWeights.reduce((a, b) => a + b, 0) /
          prevMaxDifficultyWeights.reduce((a, b) => a + b, 0)) *
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
      description: "Mede seu aproveitamento geral nas questões.",
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
      description: "Mostra quão ágil você está resolvendo.",
    },
    {
      label: "Cobertura",
      value: coverageScore,
      delta: coverageScore - prevCoverageScore,
      description: "Mede quantos conteúdos diferentes você está tocando.",
    },
    {
      label: "Dificuldade",
      value: clamp(difficultyScore),
      delta: clamp(difficultyScore) - clamp(prevDifficultyScore),
      description: "Mede como você rende em níveis mais exigentes.",
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
      description: "Você ainda está formando base e dando volume ao estudo.",
      tone: "blue",
    };
  }

  if (accuracy >= 70 && streak >= 5 && coverage >= 45) {
    return {
      title: "Fase de consolidação",
      description: "Seu perfil já mostra consistência e domínio crescente.",
      tone: "green",
    };
  }

  if (accuracy >= 60 && coverage < 45) {
    return {
      title: "Fase de expansão",
      description: "Você já tem base, mas precisa aumentar cobertura.",
      tone: "purple",
    };
  }

  if (accuracy < 55) {
    return {
      title: "Fase de correção",
      description: "Seu foco agora deve ser atacar gargalos com mais precisão.",
      tone: "orange",
    };
  }

  return {
    title: "Fase de refinamento",
    description: "Você está ajustando o jogo e ganhando consistência.",
    tone: "slate",
  };
}

function getProfileSignature(metrics: RadarMetric[]) {
  const sorted = [...metrics].sort((a, b) => b.value - a.value);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];

  if (!top || !bottom) return "Perfil ainda em formação.";

  return `Seu perfil é de ${top.label.toLowerCase()} forte, mas ainda precisa crescer em ${bottom.label.toLowerCase()}.`;
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
  const value = (difficulty || "").trim().toLowerCase();

  if (value === "facil") return 2;
  if (value === "medio") return 4;
  if (value === "dificil") return 7;

  return 0;
}

function getDifficultyBucket(difficulty?: string | null) {
  const value = (difficulty || "").trim().toLowerCase();

  if (value === "facil") return "easy";
  if (value === "medio") return "medium";
  if (value === "dificil") return "hard";

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

  for (const [userId, userAttempts] of byUser.entries()) {
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

    for (const attempt of uniqueCorrectByQuestion.values()) {
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
      nome: profile.nome?.trim() || profile.email || "Aluno",
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

export default function ProfilePage() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const trpcUtils = trpc.useUtils();
  const [, setLocation] = useLocation();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [form, setForm] = useState<EditableProfile>(INITIAL_FORM);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        setSuccessMessage("");

        const data = await trpcUtils.quiz.getProfileStats.fetch();

        const profileData = (data.profile as ProfileRow | null) ?? null;
        const attemptsData = (data.attempts as AttemptRow[]) ?? [];
        const profilesData = (data.profiles as ProfileRow[]) ?? [];

        setProfile(profileData);
        setAttempts(attemptsData);
        setProfiles(profilesData);

        setForm({
          nome: profileData?.nome ?? user.user_metadata?.name ?? "",
          avatar_key: profileData?.avatar_key ?? "avatar_1",
          bio: profileData?.bio ?? "",
          prova_alvo: profileData?.prova_alvo ?? "",
          foco_atual: profileData?.foco_atual ?? "",
          meta_semanal_questoes: profileData?.meta_semanal_questoes
            ? String(profileData.meta_semanal_questoes)
            : "",
        });
      } catch (err) {
        console.error(err);
        setError("Ocorreu um erro inesperado ao carregar o perfil.");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) loadData();
  }, [user?.id, authLoading, user?.user_metadata, trpcUtils]);

  function updateField<K extends keyof EditableProfile>(field: K, value: EditableProfile[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSaveProfile() {
    if (!user?.id || saving) return;

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      if (!form.nome.trim()) {
        setError("Preencha seu nome.");
        return;
      }

      if (form.bio.length > 180) {
        setError("A bio precisa ter no máximo 180 caracteres.");
        return;
      }

      const metaSemanal = form.meta_semanal_questoes.trim()
        ? Number(form.meta_semanal_questoes)
        : null;

      if (form.meta_semanal_questoes.trim() && (Number.isNaN(metaSemanal) || metaSemanal! < 0)) {
        setError("A meta semanal precisa ser um número válido.");
        return;
      }

      const payload = {
        id: user.id,
        nome: form.nome.trim(),
        email: profile?.email ?? user.email ?? null,
        avatar_key: form.avatar_key,
        bio: form.bio.trim() || null,
        prova_alvo: form.prova_alvo.trim() || null,
        foco_atual: form.foco_atual.trim() || null,
        meta_semanal_questoes: metaSemanal,
      };

      const { data, error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" })
        .select("*")
        .single();

      if (error) {
        console.error(error);
        setError("Não foi possível salvar seu perfil.");
        return;
      }

      setProfile(data as ProfileRow);
      setEditing(false);
      setSuccessMessage("Perfil salvo com sucesso.");
    } catch (err) {
      console.error(err);
      setError("Ocorreu um erro inesperado ao salvar o perfil.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await supabase.auth.signOut();
      setLocation("/login");
    } catch (err) {
      console.error(err);
      setError("Não foi possível sair da conta.");
    } finally {
      setLoggingOut(false);
    }
  }

  const myAttempts = useMemo(
    () => attempts.filter((attempt) => attempt.user_id === user?.id),
    [attempts, user?.id]
  );

  const totalAnswered = myAttempts.length;
  const totalCorrect = useMemo(() => myAttempts.filter((attempt) => attempt.is_correct).length, [myAttempts]);
  const totalWrong = totalAnswered - totalCorrect;
  const accuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;
  const avgTimeSeconds = useMemo(() => getAverageTime(myAttempts), [myAttempts]);
  const streakInfo = useMemo(() => buildStreakInfo(myAttempts), [myAttempts]);
  const bySubject = useMemo(() => groupAttempts(myAttempts, (attempt) => attempt.subject), [myAttempts]);
  const byConteudo = useMemo(() => groupAttempts(myAttempts, (attempt) => attempt.conteudo), [myAttempts]);
  const byAssunto = useMemo(() => groupAttempts(myAttempts, (attempt) => attempt.assunto), [myAttempts]);
  const byBanca = useMemo(() => groupAttempts(myAttempts, (attempt) => attempt.banca), [myAttempts]);
  const recentAttempts = useMemo(() => myAttempts.slice(0, 5), [myAttempts]);

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
    return myAttempts.filter((attempt) => new Date(attempt.answered_at) >= cutoff);
  }, [myAttempts]);

  const monthlyAttempts = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 30);
    return myAttempts.filter((attempt) => new Date(attempt.answered_at) >= cutoff);
  }, [myAttempts]);

  const previous7dAttempts = useMemo(() => getPreviousPeriodAttempts(myAttempts, 7), [myAttempts]);
  const previous30dAttempts = useMemo(() => getPreviousPeriodAttempts(myAttempts, 30), [myAttempts]);

  const weeklyQuestions = weeklyAttempts.length;
  const weeklyGoal = Number(profile?.meta_semanal_questoes ?? 0);
  const weeklyGoalPercent = weeklyGoal > 0 ? Math.min(100, (weeklyQuestions / weeklyGoal) * 100) : 0;
  const uniqueConteudos = useMemo(
    () => new Set(myAttempts.map((a) => a.conteudo?.trim()).filter(Boolean)).size,
    [myAttempts]
  );
  const uniqueAssuntos = useMemo(
    () => new Set(myAttempts.map((a) => a.assunto?.trim()).filter(Boolean)).size,
    [myAttempts]
  );
  const uniqueQuestions = useMemo(
    () => new Set(myAttempts.map((a) => a.question_id).filter(Boolean)).size,
    [myAttempts]
  );

  const weeklyAccuracy = useMemo(() => getAccuracy(weeklyAttempts), [weeklyAttempts]);
  const previous7dAccuracy = useMemo(() => getAccuracy(previous7dAttempts), [previous7dAttempts]);
  const monthlyAccuracy = useMemo(() => getAccuracy(monthlyAttempts), [monthlyAttempts]);
  const previous30dAccuracy = useMemo(() => getAccuracy(previous30dAttempts), [previous30dAttempts]);

  const weeklyAvgTime = useMemo(() => getAverageTime(weeklyAttempts), [weeklyAttempts]);
  const previous7dAvgTime = useMemo(() => getAverageTime(previous7dAttempts), [previous7dAttempts]);

  const radarMetrics = useMemo(
    () => buildRadarMetrics(myAttempts, previous30dAttempts),
    [myAttempts, previous30dAttempts]
  );

  const ranking = useMemo(() => buildRanking(profiles, attempts), [profiles, attempts]);
  const myRankingIndex = useMemo(
    () => ranking.findIndex((entry) => entry.userId === user?.id),
    [ranking, user?.id]
  );
  const myRankingEntry = myRankingIndex >= 0 ? ranking[myRankingIndex] : null;
  const myPosition = myRankingIndex >= 0 ? myRankingIndex + 1 : null;
  const nextRankingEntry = myRankingIndex > 0 ? ranking[myRankingIndex - 1] : null;
  const top3Ranking = ranking.slice(0, 3);

  const rankingTier = getRankingTier(myPosition);

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

  const recommendations = useMemo(() => {
    const recs: string[] = [];

    if (mostCriticalConteudo) {
      recs.push(`Revisar ${mostCriticalConteudo.label}, que é seu conteúdo mais crítico agora.`);
    }

    if (worstSubject) {
      recs.push(`Retomar ${worstSubject.label}, sua disciplina mais fraca no momento.`);
    }

    if (weeklyGoal > 0 && weeklyQuestions < weeklyGoal) {
      recs.push(`Faltam ${weeklyGoal - weeklyQuestions} questões para bater sua meta semanal.`);
    }

    if (streakInfo.currentStreak <= 1) {
      recs.push("Tente manter sequência de estudo por mais dias seguidos.");
    }

    if (!recs.length) {
      recs.push("Seu perfil está equilibrado. Continue mantendo ritmo e revisões.");
    }

    return recs.slice(0, 4);
  }, [mostCriticalConteudo, worstSubject, weeklyGoal, weeklyQuestions, streakInfo.currentStreak]);

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
  const avatar = getAvatarConfig(form.avatar_key);

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
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
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
        ) : !user ? (
          <Card className="p-8">
            <p className="text-slate-700">Você precisa estar logado para ver seu perfil.</p>
          </Card>
        ) : (
          <>
            {error ? (
              <Card className="p-5 border-red-200 bg-red-50">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h2 className="text-lg font-bold text-red-700 mb-1">Erro no perfil</h2>
                    <p className="text-red-600">{error}</p>
                  </div>
                </div>
              </Card>
            ) : null}

            {successMessage ? (
              <Card className="p-5 border-emerald-200 bg-emerald-50">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <p className="text-emerald-700 font-medium">{successMessage}</p>
                </div>
              </Card>
            ) : null}

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
                    <h2 className="text-3xl font-bold text-slate-900">
                      {form.nome || user.email || "Aluno"}
                    </h2>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                        {form.prova_alvo || "Prova-alvo não definida"}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold">
                        {form.foco_atual || "Foco atual não definido"}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-semibold">
                        {rankingTier}
                      </span>
                    </div>

                    <p className="text-slate-600 mt-4 max-w-2xl">
                      {form.bio || "Adicione uma bio curta para deixar seu perfil mais pessoal."}
                    </p>

                    <div className="flex flex-wrap gap-3 mt-4 text-sm text-slate-500">
                      <span>Na plataforma desde {formatDate(profile?.created_at)}</span>
                      <span>•</span>
                      <span>Última atividade: {formatDateTime(profile?.last_seen_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {!editing ? (
                    <Button
                      variant="outline"
                      className="rounded-2xl"
                      onClick={() => {
                        setEditing(true);
                        setError("");
                        setSuccessMessage("");
                      }}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar perfil
                    </Button>
                  ) : (
                    <Button className="rounded-2xl" onClick={handleSaveProfile} disabled={saving}>
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? "Salvando..." : "Salvar perfil"}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="rounded-2xl border-red-200 text-red-600 hover:bg-red-50"
                    onClick={handleLogout}
                    disabled={loggingOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {loggingOut ? "Saindo..." : "Sair"}
                  </Button>
                </div>
              </div>
            </Card>

            <Card className={`p-5 border ${phaseToneClasses(profilePhase.tone)}`}>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-wide font-semibold mb-1">
                    Seu momento atual
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

            {editing ? (
              <Card className="p-6 border-slate-200 bg-white">
                <h3 className="text-xl font-bold text-slate-900 mb-5">Editar perfil</h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Escolha seu avatar
                    </label>

                    <div className="grid grid-cols-4 md:grid-cols-6 xl:grid-cols-12 gap-3">
                      {AVATAR_OPTIONS.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => updateField("avatar_key", option.key)}
                          className={`h-16 rounded-2xl bg-gradient-to-br ${option.bg} text-white text-2xl flex items-center justify-center border-2 transition-all ${
                            form.avatar_key === option.key ? "border-slate-900 scale-105" : "border-transparent"
                          }`}
                        >
                          {option.emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Nome</label>
                      <input
                        value={form.nome}
                        onChange={(e) => updateField("nome", e.target.value)}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                        placeholder="Seu nome"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Prova-alvo
                      </label>
                      <input
                        list="exam-suggestions"
                        value={form.prova_alvo}
                        onChange={(e) => updateField("prova_alvo", e.target.value)}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                        placeholder="Ex.: ITA, IME, FUVEST"
                      />
                      <datalist id="exam-suggestions">
                        {TARGET_EXAM_SUGGESTIONS.map((exam) => (
                          <option key={exam} value={exam} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Foco atual
                      </label>
                      <input
                        list="focus-suggestions"
                        value={form.foco_atual}
                        onChange={(e) => updateField("foco_atual", e.target.value)}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                        placeholder="Ex.: Física, Matemática, revisão"
                      />
                      <datalist id="focus-suggestions">
                        {FOCUS_SUGGESTIONS.map((focus) => (
                          <option key={focus} value={focus} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Meta semanal de questões
                      </label>
                      <input
                        value={form.meta_semanal_questoes}
                        onChange={(e) => updateField("meta_semanal_questoes", e.target.value)}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                        placeholder="Ex.: 70"
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        {GOAL_SUGGESTIONS.map((goal) => (
                          <button
                            key={goal}
                            type="button"
                            onClick={() => updateField("meta_semanal_questoes", String(goal))}
                            className="px-3 py-1 rounded-full text-sm bg-slate-100 hover:bg-slate-200 text-slate-700"
                          >
                            {goal}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Bio curta
                    </label>
                    <textarea
                      rows={4}
                      value={form.bio}
                      onChange={(e) => updateField("bio", e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                      placeholder="Fale rapidamente sobre seu momento de estudo."
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      {form.bio.length}/180 caracteres
                    </p>
                  </div>
                </div>
              </Card>
            ) : null}

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
                <p className="text-3xl font-bold text-purple-600">{formatSeconds(Math.round(avgTimeSeconds))}</p>
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
                  <h3 className="text-xl font-bold text-slate-900">Leitura do seu perfil</h3>
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
                        Ele mostra seu perfil de estudo em 5 frentes: acerto, constância, rapidez,
                        variedade de conteúdos e desempenho em níveis mais exigentes.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-xl font-bold text-slate-900">Seu ranking</h3>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm uppercase tracking-wide text-slate-500 mb-2">Posição atual</p>
                    <p className="text-4xl font-bold text-slate-900">
                      {myPosition ? `#${myPosition}` : "—"}
                    </p>
                    <p className="text-slate-600 mt-2">{rankingTier}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm text-slate-500 mb-1">Score</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {myRankingEntry?.score ?? "—"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm text-slate-500 mb-1">Próximo acima</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {myRankingEntry && nextRankingEntry ? nextRankingEntry.score - myRankingEntry.score : "—"}
                      </p>
                    </div>
                  </div>

                  <Link href="/ranking">
                    <Button className="rounded-2xl w-full">
                      Ver ranking completo
                    </Button>
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
                    const isMe = entry.userId === user?.id;

                    return (
                      <div
                        key={entry.userId}
                        className={`rounded-2xl border p-4 ${
                          isMe ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50"
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

                        {isMe ? (
                          <p className="text-xs font-bold text-blue-600 mt-3">Você está no top 3</p>
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
                    <p className={`text-sm mt-1 font-semibold ${weeklyAccuracy - previous7dAccuracy >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {formatDelta(weeklyAccuracy - previous7dAccuracy)} pts vs 7d anteriores
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500 mb-1">Acerto 30 dias</p>
                    <p className="text-2xl font-bold text-slate-900">{monthlyAccuracy.toFixed(0)}%</p>
                    <p className={`text-sm mt-1 font-semibold ${monthlyAccuracy - previous30dAccuracy >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {formatDelta(monthlyAccuracy - previous30dAccuracy)} pts vs 30d anteriores
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500 mb-1">Tempo médio 7 dias</p>
                    <p className="text-2xl font-bold text-slate-900">{formatSeconds(Math.round(weeklyAvgTime))}</p>
                    <p className={`text-sm mt-1 font-semibold ${weeklyAvgTime - previous7dAvgTime <= 0 ? "text-emerald-600" : "text-red-600"}`}>
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
                <h3 className="text-xl font-bold text-slate-900">Sua identidade acadêmica</h3>
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
                    <p className="font-bold text-slate-900">{form.prova_alvo || "Ainda não definida"}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                    <p className="text-sm text-slate-500 mb-1">Foco atual</p>
                    <p className="font-bold text-slate-900">{form.foco_atual || "Ainda não definido"}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                    <p className="text-sm text-slate-500 mb-2">Meta semanal</p>
                    <p className="font-bold text-slate-900 mb-3">
                      {weeklyGoal > 0 ? `${weeklyQuestions} de ${weeklyGoal} questões` : `${weeklyQuestions} questões nesta semana`}
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
                        : "Defina uma meta semanal para acompanhar seu ritmo"}
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

            <div className="grid xl:grid-cols-2 gap-6">
              <Card className="p-6 bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <Swords className="w-5 h-5 text-orange-500" />
                  <h3 className="text-xl font-bold text-slate-900">Leitura estratégica</h3>
                </div>

                <div className="space-y-3">
                  {recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-slate-700"
                    >
                      {rec}
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <TimerReset className="w-5 h-5 text-blue-600" />
                  <h3 className="text-xl font-bold text-slate-900">Histórico pessoal</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500 mb-1">Conta criada em</p>
                    <p className="font-bold text-slate-900">{formatDate(profile?.created_at)}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500 mb-1">Melhor sequência</p>
                    <p className="font-bold text-slate-900">{streakInfo.bestStreak} dias</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500 mb-1">Melhor acerto 7d</p>
                    <p className="font-bold text-slate-900">{weeklyAccuracy.toFixed(0)}%</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500 mb-1">Total de dias ativos</p>
                    <p className="font-bold text-slate-900">{streakInfo.totalActiveDays}</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6 bg-white">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="w-5 h-5 text-blue-600" />
                <h3 className="text-xl font-bold text-slate-900">Últimas atividades</h3>
              </div>

              {recentAttempts.length > 0 ? (
                <div className="space-y-3">
                  {recentAttempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="rounded-xl border border-slate-200 p-4 bg-white flex flex-col gap-2"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`text-sm font-bold ${
                            attempt.is_correct ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {attempt.is_correct ? "Acertou" : "Errou"}
                        </span>

                        <span className="text-sm text-slate-500">
                          {formatDateTime(attempt.answered_at)}
                        </span>
                      </div>

                      <p className="font-semibold text-slate-900">
                        {attempt.subject ?? "Sem disciplina"} • {attempt.conteudo ?? "Sem conteúdo"}
                        {attempt.assunto ? ` • ${attempt.assunto}` : ""}
                      </p>

                      <p className="text-sm text-slate-500">
                        {attempt.banca ?? "Sem banca"} {attempt.ano ? `• ${attempt.ano}` : ""}
                        {attempt.difficulty ? ` • ${attempt.difficulty}` : ""}
                        {" • "}
                        {formatSeconds(attempt.time_spent_seconds)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">Ainda não há atividade suficiente para mostrar aqui.</p>
              )}
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
