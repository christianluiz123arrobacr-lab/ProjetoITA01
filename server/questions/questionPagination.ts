export const QUESTION_LIST_BATCH_SIZE = 500;

export async function fetchAllQuestionPages<T>(
  fetchPage: (from: number, to: number) => Promise<T[]>,
  batchSize = QUESTION_LIST_BATCH_SIZE
) {
  if (!Number.isInteger(batchSize) || batchSize < 1) {
    throw new Error("Question page size must be a positive integer.");
  }

  const rows: T[] = [];

  for (let from = 0; ; from += batchSize) {
    const page = await fetchPage(from, from + batchSize - 1);
    rows.push(...page);

    if (page.length < batchSize) return rows;
  }
}
