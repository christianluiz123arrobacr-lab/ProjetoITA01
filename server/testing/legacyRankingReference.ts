// Frozen reference from eb86f960. Test-only; never imported by production.
import { summarizeAttempts } from "../../shared/statistics.js";
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
  correctAttempts: number;
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

function normalizeText(value?: string | number | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeDifficulty(difficulty?: string | null) {
  return normalizeText(difficulty);
}

function getDifficultyPoints(difficulty?: string | null) {
  const value = normalizeDifficulty(difficulty);

  if (value === "facil") return 2;
  if (value === "medio") return 4;
  if (value === "dificil") return 8;
  if (value === "muito_dificil") return 16;

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
    const { accuracy, correctAttempts } = summarizeAttempts(userAttempts);

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
      correctAttempts,
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


export function legacyRanking(input: Record<string,any>[], profiles: ProfileRow[], period: RankingPeriod, subject: RankingSubject) {
 const attempts = (function(attemptRows: Record<string,any>[]) {
      const groups = new Map<string, any>();
      for (const attempt of attemptRows) {
        const day = String(attempt.answered_at ?? "").slice(0, 10);
        const key = [attempt.user_id, attempt.question_id, day, attempt.subject ?? "", attempt.difficulty ?? "", attempt.is_correct ? "1" : "0"].join("|");
        const current = groups.get(key) ?? { user_id: attempt.user_id, question_id: attempt.question_id, answered_at: `${day}T12:00:00.000Z`, subject: attempt.subject, difficulty: attempt.difficulty, is_correct: attempt.is_correct, count: 0, total_time: 0, timed: 0 };
        current.count += 1;
        if (typeof attempt.time_spent_seconds === "number") { current.total_time += attempt.time_spent_seconds; current.timed += 1; }
        groups.set(key, current);
      }
      const attempts = Array.from(groups.values()).flatMap(group => Array.from({ length: group.count }, () => ({ user_id: group.user_id, question_id: group.question_id, answered_at: group.answered_at, subject: group.subject, difficulty: group.difficulty, is_correct: group.is_correct, time_spent_seconds: group.timed ? group.total_time / group.timed : null })));
      return attempts;

})(input);
 const range = getPeriodRange(period);
 const current = buildRankingRows(filterAttempts(attempts as AttemptRow[], subject, range.start, range.end), profiles);
 const previous = range.previousStart ? buildRankingRows(filterAttempts(attempts as AttemptRow[], subject, range.previousStart, range.previousEnd), profiles) : [];
 const positions = new Map(previous.map((entry, index) => [entry.userId,index+1]));
 return current.map((entry,index) => { const {division,lastActivityAt,...row}=entry; return {...row, lastActivityDay:lastActivityAt?.slice(0,10)??null,positionDelta:positions.has(entry.userId)?positions.get(entry.userId)!-index-1:null}; });
}
