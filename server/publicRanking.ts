import type {
  PublicRankingDto,
  PublicRankingInput,
  PublicRankingRow,
} from "../shared/publicRanking.js";
import { summarizeAttempts } from "../shared/statistics.js";

type Range = {
  start: Date | null;
  end: Date | null;
  previousStart: Date | null;
  previousEnd: Date | null;
};
const DAY = 86400000;
// Cache only stateless formatters, never ranking/profile data. Bound the map even
// though the input accepts only Intl-supported timezones.
const calendarFormatters = new Map<string, Intl.DateTimeFormat>();

function midnightInZone(day: string, timeZone: string) {
  const wall = Date.parse(`${day}T00:00:00Z`);
  let instant = wall;
  // Resolve local midnight without depending on the server's own timezone.
  for (let i = 0; i < 3; i++) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(instant);
    const n = (key: string) =>
      Number(parts.find(part => part.type === key)!.value);
    const rendered = Date.UTC(
      n("year"),
      n("month") - 1,
      n("day"),
      n("hour"),
      n("minute"),
      n("second")
    );
    instant += wall - rendered;
  }
  return new Date(instant);
}

function rangeFor(
  period: PublicRankingInput["period"],
  now: Date,
  timeZone: string
): Range {
  if (period === "all")
    return { start: null, end: null, previousStart: null, previousEnd: null };
  if (period === "season") {
    const today = new Date(
      `${getDateKey(now.toISOString(), timeZone)}T00:00:00Z`
    );
    today.setUTCDate(today.getUTCDate() - ((today.getUTCDay() + 6) % 7));
    const start = midnightInZone(today.toISOString().slice(0, 10), timeZone);
    today.setUTCDate(today.getUTCDate() - 7);
    const previousStart = midnightInZone(
      today.toISOString().slice(0, 10),
      timeZone
    );
    return {
      start,
      end: now,
      previousStart,
      previousEnd: new Date(+previousStart + +now - +start),
    };
  }
  const duration =
    period === "24h" ? DAY : period === "7d" ? 7 * DAY : 30 * DAY;
  const start = new Date(+now - duration);
  return {
    start,
    end: now,
    previousStart: new Date(+start - duration),
    previousEnd: start,
  };
}

/** Preserve the existing endpoint's daily grouping/average semantics. These
 * synthetic rows stay on the server and never form part of the public DTO. */
function legacyDailyRows(rows: Record<string, any>[]): AttemptRow[] {
  const groups = new Map<string, any>();
  for (const attempt of rows) {
    const day = String(attempt.answered_at ?? "").slice(0, 10);
    const key = JSON.stringify([
      attempt.user_id,
      attempt.question_id,
      day,
      attempt.subject ?? "",
      attempt.difficulty ?? "",
      Boolean(attempt.is_correct),
    ]);
    const group = groups.get(key) ?? {
      ...attempt,
      answered_at: `${day}T12:00:00.000Z`,
      count: 0,
      totalTime: 0,
      timed: 0,
    };
    group.count++;
    if (typeof attempt.time_spent_seconds === "number") {
      group.totalTime += attempt.time_spent_seconds;
      group.timed++;
    }
    groups.set(key, group);
  }
  return Array.from(groups.values()).flatMap(group =>
    Array.from({ length: group.count }, () => ({
      ...group,
      time_spent_seconds: group.timed ? group.totalTime / group.timed : null,
    }))
  );
}

export function buildPublicRanking(
  attempts: Record<string, any>[],
  profiles: ProfileRow[],
  input: PublicRankingInput,
  now = new Date()
): PublicRankingDto {
  const eligible = profiles.filter(profile => profile.ativo === true);
  const ids = new Set(eligible.map(profile => profile.id));
  const rows = legacyDailyRows(
    attempts.filter(attempt => ids.has(attempt.user_id))
  );
  const aggregate = (range: Range) => {
    const current = buildRankingRows(
      filterAttempts(rows, input.subject, range.start, range.end),
      eligible,
      input.timeZone
    );
    const previous = buildRankingRows(
      filterAttempts(
        rows,
        input.subject,
        range.previousStart,
        range.previousEnd
      ),
      eligible,
      input.timeZone
    );
    const previousPositions = new Map(
      previous.map((row, index) => [row.userId, index + 1])
    );
    return current.map(
      (row, index): PublicRankingRow => ({
        userId: row.userId,
        nome: row.nome,
        avatarKey: row.avatarKey,
        score: row.score,
        correctCount: row.correctCount,
        correctAttempts: row.correctAttempts,
        totalAttempts: row.totalAttempts,
        accuracy: row.accuracy,
        avgTimeSeconds: row.avgTimeSeconds,
        easyCorrect: row.easyCorrect,
        mediumCorrect: row.mediumCorrect,
        hardCorrect: row.hardCorrect,
        veryHardCorrect: row.veryHardCorrect,
        topStreak: row.topStreak,
        lastActivityDay: row.lastActivityAt
          ? getDateKey(row.lastActivityAt, input.timeZone)
          : null,
        positionDelta:
          range.previousStart && previousPositions.has(row.userId)
            ? previousPositions.get(row.userId)! - index - 1
            : null,
      })
    );
  };
  return {
    ranking: aggregate(rangeFor(input.period, now, input.timeZone)),
    seasonRanking: aggregate(rangeFor("season", now, input.timeZone)),
  };
}

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

type RankingSubject = PublicRankingInput["subject"];
type RankingEntry = PublicRankingRow & { lastActivityAt: string | null };
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

function isInsideRange(date: string, start: Date | null, end: Date | null) {
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
  return attempts.filter(attempt => {
    if (!matchesSubject(attempt, subject)) return false;

    return isInsideRange(attempt.answered_at, start, end);
  });
}

function getDateKey(date: string, timeZone?: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return null;

  if (timeZone) {
    let formatter = calendarFormatters.get(timeZone);
    if (!formatter) {
      if (calendarFormatters.size >= 8) calendarFormatters.clear();
      formatter = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
      calendarFormatters.set(timeZone, formatter);
    }
    const parts = formatter.formatToParts(parsed);
    const get = (type: string) => parts.find(part => part.type === type)!.value;
    return `${get("year")}-${get("month")}-${get("day")}`;
  }
  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsed.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getLongestCorrectStreak(attempts: AttemptRow[], timeZone: string) {
  const days = Array.from(
    new Set(
      attempts
        .filter(attempt => attempt.is_correct)
        .map(attempt => getDateKey(attempt.answered_at, timeZone))
        .filter(Boolean) as string[]
    )
  ).sort();

  if (days.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < days.length; i += 1) {
    const previous = new Date(`${days[i - 1]}T00:00:00Z`);
    const actual = new Date(`${days[i]}T00:00:00Z`);
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

function buildRankingRows(
  attempts: AttemptRow[],
  profiles: ProfileRow[],
  timeZone: string
): Array<Omit<RankingEntry, "positionDelta" | "lastActivityDay">> {
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

  const rows: Array<Omit<RankingEntry, "positionDelta" | "lastActivityDay">> =
    [];

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
      attempt => typeof attempt.time_spent_seconds === "number"
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
            .map(attempt => attempt.answered_at)
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
      topStreak: getLongestCorrectStreak(userAttempts, timeZone),
    });
  }

  return rows
    .filter(row => row.correctCount > 0)
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
