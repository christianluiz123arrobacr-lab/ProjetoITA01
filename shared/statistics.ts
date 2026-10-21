export type AttemptForStatistics = {
  question_id?: string | null;
  is_correct: boolean | null;
};

/** All recorded attempts are valid; repeated answers count in the accuracy denominator. */
export function summarizeAttempts(attempts: AttemptForStatistics[]) {
  const answered = new Set<string>();
  const correctQuestions = new Set<string>();
  let correctAttempts = 0;
  for (const attempt of attempts) {
    if (attempt.question_id) answered.add(attempt.question_id);
    if (attempt.is_correct === true) {
      correctAttempts++;
      if (attempt.question_id) correctQuestions.add(attempt.question_id);
    }
  }
  return {
    totalAttempts: attempts.length,
    distinctAnswered: answered.size,
    distinctCorrect: correctQuestions.size,
    correctAttempts,
    accuracy: attempts.length ? (correctAttempts / attempts.length) * 100 : 0,
  };
}

export type ResolutionForStatistics = {
  questao_id?: string | null;
  tipo?: string | null;
  texto?: string | null;
  url_imagem?: string | null;
};

/** Matches the student renderer: image needs a URL; other blocks need content. */
export function hasRenderableResolution(block: ResolutionForStatistics) {
  return block.tipo?.trim().toLowerCase() === "imagem"
    ? Boolean(block.url_imagem?.trim())
    : Boolean(block.texto?.trim());
}

export function getQuestionsWithoutResolution<T extends { id: string }>(questions: T[], blocks: ResolutionForStatistics[]) {
  const resolvedIds = new Set(blocks.filter(hasRenderableResolution).map((block) => block.questao_id).filter((id): id is string => Boolean(id)));
  return questions.filter((question) => !resolvedIds.has(question.id));
}
