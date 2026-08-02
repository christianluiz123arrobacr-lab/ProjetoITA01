import type { Question } from "@/types/question";

export type VetTrainingBlock = "ataque" | "consolidacao" | "manutencao";

export type VetProfile = {
  target_exam: string;
  months_until_exam: number;
  hours_per_day: number;
  focus_subject: string;
};

export type VetAttempt = {
  id: string;
  user_id: string;
  question_id: string;
  selected_option?: string | null;
  is_correct: boolean;
  time_spent_seconds?: number | null;
  answered_at?: string | null;
  attempt_number?: number | null;
  subject?: string | null;
  conteudo?: string | null;
  assunto?: string | null;
  banca?: string | null;
  ano?: number | null;
  difficulty?: string | null;
};

export type VetWeight = {
  id?: string;
  exam: string;
  subject: string;
  conteudo: string;
  weight: number;
};

export type VetCollectiveContentStat = {
  exam: string;
  subject: string;
  conteudo: string;
  assunto?: string | null;
  total_attempts: number;
  correct_attempts: number;
  wrong_attempts: number;
  collective_accuracy: number;
  avg_time_seconds?: number | null;
};

export type VetSubjectStat = {
  subject: string;
  total: number;
  correct: number;
  wrong: number;
  accuracy: number;
};

export type VetHistoricalMetric = {
  subject: string;
  conteudo: string;
  totalQuestions: number;
  yearsAppeared: number;
  totalYearsAnalyzed: number;
  recurrenceRate: number;
  recencyScore: number;
  trendScore: number;
  frequencyScore: number;
  difficultyScore: number;
  historicalScore: number;
  lastYearAppeared?: number;
  yearlyCounts: Record<number, number>;
  confidence: "low" | "medium" | "high";
};

export type VetPersonalMetric = {
  subject: string;
  conteudo: string;
  total: number;
  correct: number;
  wrong: number;
  accuracy: number;
  avgTimeSeconds: number;
  hasData: boolean;
  recentTotal: number;
  recentCorrect: number;
  recentWrong: number;
  recentAccuracy: number;
  recentWrong7Days: number;
  recentWrong30Days: number;
  repeatedWrongQuestions: number;
  neverCorrectQuestions: number;
  lastAttemptAt?: string | null;
  lastWrongAt?: string | null;
};

export type VetStrategicContent = {
  subject: string;
  conteudo: string;

  block: VetTrainingBlock;
  priorityScore: number;

  weight: number;

  personal: VetPersonalMetric;
  historical: VetHistoricalMetric | null;
  collective: VetCollectiveContentStat | null;

  weaknessScore: number;
  wrongVolumeScore: number;
  urgencyTimeScore: number;
  collectiveGapScore: number;
  historicalImportanceScore: number;
  recentErrorScore: number;
  recurringErrorScore: number;
  noAttemptPenalty: number;

  explanation: string[];
  hasAdministrativeWeight: boolean;
  scoreBreakdown: {
    historicalImportance: number;
    administrativeWeight: number;
    weakness: number;
    wrongVolume: number;
    recentErrors: number;
    recurringErrors: number;
    noPractice: number;
    urgency: number;
    collectiveGap: number;
    timeSignal: number;
    confidenceAdjustment: number;
    finalScore: number;
  };
};

export type VetEngineResult = {
  profile: VetProfile;
  totalAttempts: number;
  totalCorrect: number;
  totalWrong: number;
  generalAccuracy: number;
  avgTimeSeconds: number;

  subjectStats: VetSubjectStat[];

  historicalMetrics: VetHistoricalMetric[];
  strategicContents: VetStrategicContent[];

  attack: VetStrategicContent[];
  consolidation: VetStrategicContent[];
  maintenance: VetStrategicContent[];

  topPriority: VetStrategicContent | null;
  strongestSubject: VetSubjectStat | null;
  weakestSubject: VetSubjectStat | null;

  recentWrongAttempts: number;
  repeatedWrongQuestionCount: number;
  neverCorrectQuestionCount: number;
  reviewContents: VetStrategicContent[];
  engineVersion: string;
  generatedAt: string;
  diagnosticConfidence: {
    level: "initial" | "forming" | "intermediate" | "reliable";
    score: number;
    totalAttempts: number;
    distinctContents: number;
    reason: string;
  };
};

export function normalizeVetText(value?: string | number | null) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
  const aliases: Record<string, string> = {
    "academia da forca aerea": "afa", "colegio naval": "cn",
    "epcar": "epcar", "escola preparatoria de cadetes do ar": "epcar",
    "espcex": "espcex", "escola preparatoria de cadetes do exercito": "espcex",
    "funcao do segundo grau": "funcao quadratica",
  };
  return aliases[normalized] ?? normalized;
}

export function prettifyVetText(value?: string | null) {
  const raw = String(value ?? "").trim();

  if (!raw) return "—";

  const normalized = normalizeVetText(raw);

  if (normalized === "fisica") return "Física";
  if (normalized === "matematica") return "Matemática";
  if (normalized === "quimica") return "Química";
  if (normalized === "todas") return "Todas";

  return raw
    .split(" ")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

export function formatVetPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function formatVetTime(seconds: number) {
  if (!seconds || seconds <= 0) return "—";

  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);

  if (minutes <= 0) return `${rest}s`;

  return `${minutes}m ${rest}s`;
}

const VET_DAY_MS = 1000 * 60 * 60 * 24;

function getDaysSince(dateValue?: string | null) {
  if (!dateValue) return Number.POSITIVE_INFINITY;

  const time = new Date(dateValue).getTime();
  if (Number.isNaN(time)) return Number.POSITIVE_INFINITY;

  return (Date.now() - time) / VET_DAY_MS;
}

function isAttemptWithin(attempt: VetAttempt, days: number) {
  return getDaysSince(attempt.answered_at) <= days;
}

export function getQuestionTopicsForVet(question: Question) {
  if (Array.isArray(question.topics) && question.topics.length > 0) {
    return question.topics.filter(Boolean);
  }

  return question.topic ? [question.topic] : [];
}

export function getQuestionSubtopicsForVet(question: Question) {
  if (Array.isArray(question.subtopics) && question.subtopics.length > 0) {
    return question.subtopics.filter(Boolean);
  }

  return question.subtopic ? [question.subtopic] : [];
}

function matchesTargetExam(question: Question, targetExam: string) {
  const target = normalizeVetText(targetExam);

  const institution = normalizeVetText(question.institution);
  const exam = normalizeVetText(question.exam);

  return institution === target || exam === target;
}

function matchesFocusSubject(subject: string | null | undefined, focus: string) {
  if (normalizeVetText(focus) === "todas") return true;

  return normalizeVetText(subject) === normalizeVetText(focus);
}

function getQuestionDifficultyNumeric(question: Question) {
  const difficulty = normalizeVetText(question.difficulty);

  if (difficulty === "facil") return 1;
  if (difficulty === "medio") return 2;
  if (difficulty === "dificil") return 3;

  return 2;
}

function getWeightForContent(
  weights: VetWeight[],
  profile: VetProfile,
  subject: string,
  conteudo: string
) {
  const found = weights.find((weight) => {
    const sameExam =
      normalizeVetText(weight.exam) === normalizeVetText(profile.target_exam);

    const sameSubject =
      normalizeVetText(profile.focus_subject) === "todas" ||
      normalizeVetText(weight.subject) === normalizeVetText(subject);

    const sameContent =
      normalizeVetText(weight.conteudo) === normalizeVetText(conteudo);

    return sameExam && sameSubject && sameContent;
  });

  return { weight: found?.weight ?? 3, configured: Boolean(found) };
}

function getUrgencyTimeScore(monthsUntilExam: number) {
  if (monthsUntilExam <= 1) return 10;
  if (monthsUntilExam <= 2) return 8;
  if (monthsUntilExam <= 4) return 6;
  if (monthsUntilExam <= 6) return 4;
  if (monthsUntilExam <= 9) return 2;
  return 1;
}

function getWeaknessScore(accuracy: number, hasData: boolean) {
  if (!hasData) return 6;
  if (accuracy < 35) return 10;
  if (accuracy < 50) return 8;
  if (accuracy < 65) return 5;
  if (accuracy < 80) return 3;
  return 1;
}

function getWrongVolumeScore(wrong: number) {
  if (wrong >= 10) return 10;
  if (wrong >= 7) return 8;
  if (wrong >= 5) return 6;
  if (wrong >= 3) return 4;
  if (wrong >= 1) return 2;
  return 0;
}

function getRecentErrorScore(recentWrong7Days: number, recentWrong30Days: number) {
  if (recentWrong7Days >= 4) return 10;
  if (recentWrong7Days >= 2) return 8;
  if (recentWrong7Days >= 1) return 6;
  if (recentWrong30Days >= 5) return 6;
  if (recentWrong30Days >= 3) return 4;
  if (recentWrong30Days >= 1) return 2;
  return 0;
}

function getRecurringErrorScore(repeatedWrongQuestions: number, neverCorrectQuestions: number) {
  const score = repeatedWrongQuestions * 3 + neverCorrectQuestions * 2;
  return Math.min(score, 10);
}

function getNoAttemptPenalty(total: number, weight: number, historicalScore: number) {
  if (total > 0) return 0;

  if (weight >= 8 || historicalScore >= 8) return 8;
  if (weight >= 6 || historicalScore >= 6) return 5;
  if (weight >= 4 || historicalScore >= 4) return 3;

  return 1;
}

function getCollectiveGapScore(
  personalAccuracy: number,
  hasPersonalData: boolean,
  collective?: VetCollectiveContentStat | null
) {
  if (!hasPersonalData || !collective) return 0;

  const gap = collective.collective_accuracy - personalAccuracy;

  if (gap >= 30) return 10;
  if (gap >= 20) return 8;
  if (gap >= 12) return 6;
  if (gap >= 6) return 3;
  if (gap <= -10) return -2;

  return 0;
}

function classifyTrainingBlock(score: number, personal: VetPersonalMetric) {
  if (!personal.hasData && score >= 55) return "ataque";
  if (score >= 65) return "ataque";
  if (score >= 40) return "consolidacao";
  return "manutencao";
}

function buildSubjectStats(attempts: VetAttempt[]): VetSubjectStat[] {
  const map = new Map<string, { total: number; correct: number; wrong: number }>();

  for (const attempt of attempts) {
    const subject = normalizeVetText(attempt.subject) || "não informado";
    const current = map.get(subject) ?? { total: 0, correct: 0, wrong: 0 };

    current.total += 1;

    if (attempt.is_correct) {
      current.correct += 1;
    } else {
      current.wrong += 1;
    }

    map.set(subject, current);
  }

  return Array.from(map.entries())
    .map(([subject, value]) => ({
      subject,
      total: value.total,
      correct: value.correct,
      wrong: value.wrong,
      accuracy: value.total ? (value.correct / value.total) * 100 : 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total);
}

function buildPersonalMetrics(
  attempts: VetAttempt[],
  profile: VetProfile
): VetPersonalMetric[] {
  const map = new Map<
    string,
    {
      subject: string;
      conteudo: string;
      total: number;
      correct: number;
      wrong: number;
      totalTime: number;
      timedCount: number;
      recentTotal: number;
      recentCorrect: number;
      recentWrong: number;
      recentWrong7Days: number;
      recentWrong30Days: number;
      lastAttemptAt?: string | null;
      lastWrongAt?: string | null;
      questionMap: Map<
        string,
        {
          total: number;
          correct: number;
          wrong: number;
          lastAttemptAt?: string | null;
        }
      >;
    }
  >();

  for (const attempt of attempts) {
    if (!matchesFocusSubject(attempt.subject, profile.focus_subject)) continue;

    const conteudo = normalizeVetText(attempt.conteudo);
    if (!conteudo) continue;

    const subject = normalizeVetText(attempt.subject) || "não informado";
    const key = `${subject}::${conteudo}`;

    const current =
      map.get(key) ??
      {
        subject: attempt.subject || subject,
        conteudo: attempt.conteudo || conteudo,
        total: 0,
        correct: 0,
        wrong: 0,
        totalTime: 0,
        timedCount: 0,
        recentTotal: 0,
        recentCorrect: 0,
        recentWrong: 0,
        recentWrong7Days: 0,
        recentWrong30Days: 0,
        lastAttemptAt: null,
        lastWrongAt: null,
        questionMap: new Map(),
      };

    current.total += 1;

    if (attempt.is_correct) {
      current.correct += 1;
    } else {
      current.wrong += 1;
    }

    if (isAttemptWithin(attempt, 30)) {
      current.recentTotal += 1;

      if (attempt.is_correct) {
        current.recentCorrect += 1;
      } else {
        current.recentWrong += 1;
      }
    }

    if (!attempt.is_correct && isAttemptWithin(attempt, 7)) {
      current.recentWrong7Days += 1;
    }

    if (!attempt.is_correct && isAttemptWithin(attempt, 30)) {
      current.recentWrong30Days += 1;
    }

    if (typeof attempt.time_spent_seconds === "number") {
      current.totalTime += attempt.time_spent_seconds;
      current.timedCount += 1;
    }

    if (
      attempt.answered_at &&
      (!current.lastAttemptAt ||
        new Date(attempt.answered_at).getTime() >
          new Date(current.lastAttemptAt).getTime())
    ) {
      current.lastAttemptAt = attempt.answered_at;
    }

    if (
      !attempt.is_correct &&
      attempt.answered_at &&
      (!current.lastWrongAt ||
        new Date(attempt.answered_at).getTime() >
          new Date(current.lastWrongAt).getTime())
    ) {
      current.lastWrongAt = attempt.answered_at;
    }

    const questionKey = attempt.question_id || attempt.id;
    const questionStats =
      current.questionMap.get(questionKey) ??
      {
        total: 0,
        correct: 0,
        wrong: 0,
        lastAttemptAt: null,
      };

    questionStats.total += 1;

    if (attempt.is_correct) {
      questionStats.correct += 1;
    } else {
      questionStats.wrong += 1;
    }

    if (
      attempt.answered_at &&
      (!questionStats.lastAttemptAt ||
        new Date(attempt.answered_at).getTime() >
          new Date(questionStats.lastAttemptAt).getTime())
    ) {
      questionStats.lastAttemptAt = attempt.answered_at;
    }

    current.questionMap.set(questionKey, questionStats);
    map.set(key, current);
  }

  return Array.from(map.values()).map((item) => {
    const questionStats = Array.from(item.questionMap.values());
    const repeatedWrongQuestions = questionStats.filter(
      (question) => question.wrong >= 2
    ).length;
    const neverCorrectQuestions = questionStats.filter(
      (question) => question.wrong > 0 && question.correct === 0
    ).length;

    return {
      subject: item.subject,
      conteudo: item.conteudo,
      total: item.total,
      correct: item.correct,
      wrong: item.wrong,
      accuracy: item.total ? (item.correct / item.total) * 100 : 0,
      avgTimeSeconds: item.timedCount ? item.totalTime / item.timedCount : 0,
      hasData: item.total > 0,
      recentTotal: item.recentTotal,
      recentCorrect: item.recentCorrect,
      recentWrong: item.recentWrong,
      recentAccuracy: item.recentTotal
        ? (item.recentCorrect / item.recentTotal) * 100
        : 0,
      recentWrong7Days: item.recentWrong7Days,
      recentWrong30Days: item.recentWrong30Days,
      repeatedWrongQuestions,
      neverCorrectQuestions,
      lastAttemptAt: item.lastAttemptAt,
      lastWrongAt: item.lastWrongAt,
    };
  });
}

export function buildHistoricalMetrics(params: {
  questions: Question[];
  profile: VetProfile;
  yearsBack?: number;
}): VetHistoricalMetric[] {
  const { questions, profile, yearsBack = 5 } = params;

  const examQuestions = questions.filter((question) => {
    const sameExam = matchesTargetExam(question, profile.target_exam);
    const sameSubject = matchesFocusSubject(question.subject, profile.focus_subject);

    return sameExam && sameSubject;
  });

  if (examQuestions.length === 0) return [];

  const maxYear = Math.max(...examQuestions.map((question) => question.year || 0));
  const minYear = maxYear - yearsBack + 1;

  const recentQuestions = examQuestions.filter(
    (question) => question.year >= minYear && question.year <= maxYear
  );

  const years = Array.from(
    new Set(recentQuestions.map((question) => question.year).filter(Boolean))
  ).sort((a, b) => b - a);

  const totalYearsAnalyzed = yearsBack;

  const map = new Map<
    string,
    {
      subject: string;
      conteudo: string;
      totalQuestions: number;
      yearlyCounts: Record<number, number>;
      difficultyTotal: number;
    }
  >();

  for (const question of recentQuestions) {
    const topics = getQuestionTopicsForVet(question);

    for (const topic of topics) {
      const subject = question.subject;
      const conteudo = topic;
      const key = `${normalizeVetText(subject)}::${normalizeVetText(conteudo)}`;

      const current =
        map.get(key) ??
        {
          subject,
          conteudo,
          totalQuestions: 0,
          yearlyCounts: {},
          difficultyTotal: 0,
        };

      current.totalQuestions += 1;
      current.yearlyCounts[question.year] =
        (current.yearlyCounts[question.year] || 0) + 1;
      current.difficultyTotal += getQuestionDifficultyNumeric(question);

      map.set(key, current);
    }
  }

  const maxFrequency = Math.max(
    1,
    ...Array.from(map.values()).map((item) => item.totalQuestions)
  );

  return Array.from(map.values())
    .map((item) => {
      const appearedYears = Object.keys(item.yearlyCounts).map(Number);
      const yearsAppeared = appearedYears.length;
      const recurrenceRate = yearsAppeared / totalYearsAnalyzed;

      const lastYearAppeared =
        appearedYears.length > 0 ? Math.max(...appearedYears) : undefined;

      const recencyDistance = lastYearAppeared ? maxYear - lastYearAppeared : yearsBack;
      const recencyScore = Math.max(0, 10 - recencyDistance * 2);

      const newestHalf = years.slice(0, Math.ceil(years.length / 2));
      const oldestHalf = years.slice(Math.ceil(years.length / 2));

      const newestCount = newestHalf.reduce(
        (sum, year) => sum + (item.yearlyCounts[year] || 0),
        0
      );

      const oldestCount = oldestHalf.reduce(
        (sum, year) => sum + (item.yearlyCounts[year] || 0),
        0
      );

      const trendScore =
        years.length <= 1
          ? 5
          : newestCount > oldestCount
          ? 10
          : newestCount === oldestCount
            ? 5
            : 2;

      const frequencyScore = (item.totalQuestions / maxFrequency) * 10;

      const avgDifficulty =
        item.totalQuestions > 0 ? item.difficultyTotal / item.totalQuestions : 2;

      const difficultyScore =
        avgDifficulty >= 2.7 ? 10 : avgDifficulty >= 2.2 ? 7 : avgDifficulty >= 1.7 ? 4 : 2;

      const historicalScore =
        frequencyScore * 0.35 +
        recurrenceRate * 10 * 0.25 +
        recencyScore * 0.2 +
        trendScore * 0.1 +
        difficultyScore * 0.1;

      return {
        subject: item.subject,
        conteudo: item.conteudo,
        totalQuestions: item.totalQuestions,
        yearsAppeared,
        totalYearsAnalyzed,
        recurrenceRate,
        recencyScore,
        trendScore,
        frequencyScore,
        difficultyScore,
        historicalScore,
        lastYearAppeared,
        yearlyCounts: item.yearlyCounts,
        confidence: years.length >= 4 ? "high" as const : years.length >= 2 ? "medium" as const : "low" as const,
      };
    })
    .sort((a, b) => b.historicalScore - a.historicalScore);
}

function findHistoricalMetric(
  metrics: VetHistoricalMetric[],
  subject: string,
  conteudo: string
) {
  return (
    metrics.find(
      (metric) =>
        normalizeVetText(metric.subject) === normalizeVetText(subject) &&
        normalizeVetText(metric.conteudo) === normalizeVetText(conteudo)
    ) ?? null
  );
}

function findCollectiveStat(
  collectiveStats: VetCollectiveContentStat[],
  profile: VetProfile,
  subject: string,
  conteudo: string
) {
  return (
    collectiveStats.find((stat) => {
      const sameExam =
        normalizeVetText(stat.exam) === normalizeVetText(profile.target_exam);

      const sameSubject =
        normalizeVetText(stat.subject) === normalizeVetText(subject);

      const sameContent =
        normalizeVetText(stat.conteudo) === normalizeVetText(conteudo);

      return sameExam && sameSubject && sameContent;
    }) ?? null
  );
}

function createStrategicExplanation(content: VetStrategicContent) {
  const explanations: string[] = [];

  if (content.historical) {
    explanations.push(
      `${prettifyVetText(content.conteudo)} apareceu em ${
        content.historical.yearsAppeared
      } de ${content.historical.totalYearsAnalyzed} ano(s) analisados, com ${
        content.historical.totalQuestions
      } questão(ões) nos últimos anos.`
    );

    if (content.historical.trendScore >= 8) {
      explanations.push(
        "A tendência recente está subindo, então esse conteúdo ganhou peso estratégico."
      );
    }

    if (content.historical.recencyScore >= 8) {
      explanations.push(
        "O conteúdo apareceu recentemente, então não dá para tratar como assunto morto."
      );
    }
  }

  if (content.personal.hasData) {
    explanations.push(
      `Seu aproveitamento nesse conteúdo é de ${formatVetPercent(
        content.personal.accuracy
      )}, com ${content.personal.wrong} erro(s) em ${
        content.personal.total
      } tentativa(s).`
    );

    if (content.personal.recentWrong30Days > 0) {
      explanations.push(
        `Nos últimos 30 dias, você errou ${content.personal.recentWrong30Days} tentativa(s) nesse conteúdo. Erro recente pesa mais porque mostra uma ferida aberta no estudo, essa delicadeza acadêmica.`
      );
    }

    if (content.personal.repeatedWrongQuestions > 0) {
      explanations.push(
        `${content.personal.repeatedWrongQuestions} questão(ões) desse conteúdo já foram erradas mais de uma vez. Isso indica erro recorrente, não apenas azar estatístico.`
      );
    }

    if (content.personal.neverCorrectQuestions > 0) {
      explanations.push(
        `${content.personal.neverCorrectQuestions} questão(ões) desse conteúdo ainda não foram acertadas nenhuma vez.`
      );
    }
  } else {
    explanations.push(
      "Você ainda não tem tentativas suficientes nesse conteúdo, então o VET aplica penalidade de ausência de treino."
    );
  }

  if (content.collective && content.personal.hasData) {
    const gap = content.collective.collective_accuracy - content.personal.accuracy;

    if (gap > 8) {
      explanations.push(
        `A média dos outros alunos é ${formatVetPercent(
          content.collective.collective_accuracy
        )}, cerca de ${Math.round(gap)} ponto(s) acima do seu desempenho.`
      );
    } else if (gap < -8) {
      explanations.push(
        `Você está acima da média dos outros alunos nesse conteúdo, que é ${formatVetPercent(
          content.collective.collective_accuracy
        )}.`
      );
    } else {
      explanations.push(
        `Seu desempenho está próximo da média dos outros alunos, que é ${formatVetPercent(
          content.collective.collective_accuracy
        )}.`
      );
    }
  }

  explanations.push(content.hasAdministrativeWeight
    ? `Peso editorial configurado para sua prova: ${content.weight}.`
    : `Peso padrão aplicado: ${content.weight}; não há ajuste editorial específico para este conteúdo.`);
  explanations.push(`A urgência pelo tempo até a prova contribuiu com ${content.scoreBreakdown.urgency.toFixed(1)} ponto(s) no score.`);

  return explanations;
}

export function buildVetEngineResult(params: {
  profile: VetProfile;
  attempts: VetAttempt[];
  questions: Question[];
  weights: VetWeight[];
  collectiveStats?: VetCollectiveContentStat[];
  yearsBack?: number;
}): VetEngineResult {
  const {
    profile,
    attempts,
    questions,
    weights,
    collectiveStats = [],
    yearsBack = 5,
  } = params;

  const filteredAttempts = attempts.filter((attempt) =>
    matchesFocusSubject(attempt.subject, profile.focus_subject)
  );

  const totalAttempts = filteredAttempts.length;
  const totalCorrect = filteredAttempts.filter((attempt) => attempt.is_correct).length;
  const totalWrong = totalAttempts - totalCorrect;
  const generalAccuracy =
    totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;

  const timedAttempts = filteredAttempts.filter(
    (attempt) => typeof attempt.time_spent_seconds === "number"
  );

  const avgTimeSeconds =
    timedAttempts.length > 0
      ? timedAttempts.reduce(
          (sum, attempt) => sum + (attempt.time_spent_seconds ?? 0),
          0
        ) / timedAttempts.length
      : 0;

  const subjectStats = buildSubjectStats(filteredAttempts);

  const strongestSubject =
    [...subjectStats]
      .filter((subject) => subject.total >= 2)
      .sort((a, b) => b.accuracy - a.accuracy || b.total - a.total)[0] ?? null;

  const weakestSubject =
    [...subjectStats]
      .filter((subject) => subject.total >= 2)
      .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)[0] ?? null;

  const historicalMetrics = buildHistoricalMetrics({
    questions,
    profile,
    yearsBack,
  });

  const personalMetrics = buildPersonalMetrics(filteredAttempts, profile);

  const contentKeys = new Map<string, { subject: string; conteudo: string }>();

  for (const metric of historicalMetrics) {
    contentKeys.set(`${normalizeVetText(metric.subject)}::${normalizeVetText(metric.conteudo)}`, {
      subject: metric.subject,
      conteudo: metric.conteudo,
    });
  }

  for (const metric of personalMetrics) {
    contentKeys.set(`${normalizeVetText(metric.subject)}::${normalizeVetText(metric.conteudo)}`, {
      subject: metric.subject,
      conteudo: metric.conteudo,
    });
  }

  for (const weight of weights) {
    const sameExam =
      normalizeVetText(weight.exam) === normalizeVetText(profile.target_exam);

    const sameSubject = matchesFocusSubject(weight.subject, profile.focus_subject);

    if (!sameExam || !sameSubject) continue;

    contentKeys.set(`${normalizeVetText(weight.subject)}::${normalizeVetText(weight.conteudo)}`, {
      subject: weight.subject,
      conteudo: weight.conteudo,
    });
  }

  const urgencyTimeScore = getUrgencyTimeScore(profile.months_until_exam);

  const strategicContents: VetStrategicContent[] = Array.from(contentKeys.values())
    .map(({ subject, conteudo }) => {
      const personal =
        personalMetrics.find(
          (metric) =>
            normalizeVetText(metric.subject) === normalizeVetText(subject) &&
            normalizeVetText(metric.conteudo) === normalizeVetText(conteudo)
        ) ??
        {
          subject,
          conteudo,
          total: 0,
          correct: 0,
          wrong: 0,
          accuracy: 0,
          avgTimeSeconds: 0,
          hasData: false,
          recentTotal: 0,
          recentCorrect: 0,
          recentWrong: 0,
          recentAccuracy: 0,
          recentWrong7Days: 0,
          recentWrong30Days: 0,
          repeatedWrongQuestions: 0,
          neverCorrectQuestions: 0,
          lastAttemptAt: null,
          lastWrongAt: null,
        };

      const historical = findHistoricalMetric(historicalMetrics, subject, conteudo);
      const collective = findCollectiveStat(
        collectiveStats,
        profile,
        subject,
        conteudo
      );

      const weightResult = getWeightForContent(weights, profile, subject, conteudo);
      const weight = Math.max(0, Math.min(10, Number(weightResult.weight)));

      // Beta(2,2) smoothing prevents 1/1 and 0/1 from becoming definitive mastery/failure.
      const smoothedAccuracy = personal.hasData
        ? ((personal.correct + 2) / (personal.total + 4)) * 100
        : 0;
      const weaknessScore = getWeaknessScore(smoothedAccuracy, personal.hasData);
      const wrongVolumeScore = getWrongVolumeScore(personal.wrong);
      const historicalImportanceScore = historical?.historicalScore ?? 0;
      const collectiveGapScore = getCollectiveGapScore(
        personal.accuracy,
        personal.hasData,
        collective
      );

      const recentErrorScore = getRecentErrorScore(
        personal.recentWrong7Days,
        personal.recentWrong30Days
      );
      const recurringErrorScore = getRecurringErrorScore(
        personal.repeatedWrongQuestions,
        personal.neverCorrectQuestions
      );

      const noAttemptPenalty = getNoAttemptPenalty(
        personal.total,
        weight,
        historicalImportanceScore
      );

      const sampleConfidence = Math.min(1, personal.total / 12);
      const confidenceAdjustment = personal.hasData ? (sampleConfidence - 1) * weaknessScore * 0.8 : 0;
      const timeSignal = personal.total >= 5 && collective?.avg_time_seconds && personal.avgTimeSeconds > collective.avg_time_seconds * 1.25
        ? Math.min(6, ((personal.avgTimeSeconds / collective.avg_time_seconds) - 1) * 8)
        : 0;
      const scoreBreakdown = {
        historicalImportance: historicalImportanceScore * 2.2,
        administrativeWeight: weightResult.configured ? weight * 1.2 : 0,
        weakness: weaknessScore * 2.0,
        wrongVolume: wrongVolumeScore * 1.1,
        recentErrors: recentErrorScore * 1.4,
        recurringErrors: recurringErrorScore * 1.5,
        noPractice: noAttemptPenalty,
        urgency: urgencyTimeScore,
        collectiveGap: collectiveGapScore * 1.1,
        timeSignal,
        confidenceAdjustment,
        finalScore: 0,
      };
      const priorityScore = Math.max(0, Math.min(100, Object.entries(scoreBreakdown)
        .filter(([key]) => key !== "finalScore")
        .reduce((sum, [, value]) => sum + value, 0)));
      scoreBreakdown.finalScore = priorityScore;

      const block = classifyTrainingBlock(priorityScore, personal);

      const content: VetStrategicContent = {
        subject,
        conteudo,
        block,
        priorityScore,
        weight,
        personal,
        historical,
        collective,
        weaknessScore,
        wrongVolumeScore,
        urgencyTimeScore,
        collectiveGapScore,
        historicalImportanceScore,
        recentErrorScore,
        recurringErrorScore,
        noAttemptPenalty,
        explanation: [],
        hasAdministrativeWeight: weightResult.configured,
        scoreBreakdown,
      };

      content.explanation = createStrategicExplanation(content);

      return content;
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const recentWrongAttempts = filteredAttempts.filter(
    (attempt) => !attempt.is_correct && isAttemptWithin(attempt, 30)
  ).length;

  const repeatedWrongQuestionCount = strategicContents.reduce(
    (sum, content) => sum + content.personal.repeatedWrongQuestions,
    0
  );

  const neverCorrectQuestionCount = strategicContents.reduce(
    (sum, content) => sum + content.personal.neverCorrectQuestions,
    0
  );

  const reviewContents = strategicContents
    .filter(
      (content) =>
        content.personal.recentWrong30Days > 0 ||
        content.personal.repeatedWrongQuestions > 0 ||
        content.personal.neverCorrectQuestions > 0
    )
    .sort(
      (a, b) =>
        b.recurringErrorScore - a.recurringErrorScore ||
        b.recentErrorScore - a.recentErrorScore ||
        b.priorityScore - a.priorityScore
    );

  const distinctContents = strategicContents.filter((content) => content.personal.hasData).length;
  const confidenceLevel = totalAttempts < 5 ? "initial" : totalAttempts < 30 ? "forming" : totalAttempts < 100 || distinctContents < 5 ? "intermediate" : "reliable";
  const confidenceScore = Math.min(100, Math.round(Math.min(1, totalAttempts / 100) * 75 + Math.min(1, distinctContents / 10) * 25));
  return {
    profile,
    totalAttempts,
    totalCorrect,
    totalWrong,
    generalAccuracy,
    avgTimeSeconds,

    subjectStats,

    historicalMetrics,
    strategicContents,

    attack: strategicContents.filter((content) => content.block === "ataque"),
    consolidation: strategicContents.filter(
      (content) => content.block === "consolidacao"
    ),
    maintenance: strategicContents.filter(
      (content) => content.block === "manutencao"
    ),

    topPriority: strategicContents[0] ?? null,
    strongestSubject,
    weakestSubject,

    recentWrongAttempts,
    repeatedWrongQuestionCount,
    neverCorrectQuestionCount,
    reviewContents,
    engineVersion: "vet-2.0",
    generatedAt: new Date().toISOString(),
    diagnosticConfidence: {
      level: confidenceLevel,
      score: confidenceScore,
      totalAttempts,
      distinctContents,
      reason: totalAttempts < 5 ? "Poucas tentativas; recomendações iniciais dependem mais do histórico da prova." : `${totalAttempts} tentativas distribuídas em ${distinctContents} conteúdo(s).`,
    },
  };
}
