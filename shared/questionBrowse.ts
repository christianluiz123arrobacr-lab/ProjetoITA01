import { z } from "zod";

const values = z.array(z.string().max(240)).max(100).default([]);
export const questionBrowseFiltersSchema = z.object({
  search: z.string().max(500).default(""),
  institutions: values,
  subjects: values,
  years: z.array(z.number().int().min(1900).max(2200)).max(100).default([]),
  topics: values,
  subtopics: values,
  difficulties: values,
  exams: values,
  yearFrom: z.number().int().optional(),
  yearTo: z.number().int().optional(),
  publication: z.enum(["all", "published", "unpublished"]).default("all"),
  practiceStatus: z
    .enum(["all", "answered", "unanswered", "correct", "wrong"])
    .default("all"),
});
export const questionBrowseSchema = z.object({
  filters: questionBrowseFiltersSchema.default(() =>
    questionBrowseFiltersSchema.parse({})
  ),
  page: z.number().int().min(0).max(100000).default(0),
  pageSize: z.number().int().min(1).max(100).default(20),
});
export type BrowseFilters = z.infer<typeof questionBrowseFiltersSchema>;
export function hasMeaningfulBrowseFilters(filters: Partial<BrowseFilters>) {
  return Boolean(filters.search?.trim() || filters.yearFrom || filters.yearTo ||
    (filters.practiceStatus && filters.practiceStatus !== "all") ||
    [filters.institutions, filters.years, filters.subjects, filters.topics, filters.subtopics, filters.difficulties, filters.exams].some(values => values?.length));
}

export function appendUniqueQuestions<T extends { id: string }>(pages: T[][]): T[] {
  const seen = new Set<string>();
  return pages.flat().filter(row => { if (seen.has(row.id)) return false; seen.add(row.id); return true; });
}
export type BrowseInput = z.infer<typeof questionBrowseSchema>;
export const questionFilterOptionsSchema = z.object({
  institutions: z.array(z.string()), years: z.array(z.string()), subjects: z.array(z.string()),
  topics: z.array(z.string()), subtopics: z.array(z.string()), difficulties: z.array(z.string()),
});
export type BrowseRow = Record<string, any> & { id: string };
export type BrowseResult = {
  rows: BrowseRow[];
  total: number;
  page: number;
  pageSize: number;
  facets: {
    institutions: string[];
    years: string[];
    subjects: string[];
    topics: string[];
    subtopics: string[];
    difficulties: string[];
  };
  stats: {
    total: number;
    totalDifficulties: number;
    subjects: Record<string, number>;
    difficulties: Record<string, number>;
    filteredDifficulties: Record<string, number>;
    answered: number;
    correct: number;
    wrong: number;
    unanswered: number;
  };
  resolutionSummaries: {
    questao_id: string;
    totalBlocks: number;
    totalImages: number;
  }[];
};

/** Pages are never a substitute for a full quiz/export selection. */
export async function collectBrowsePages<T extends { id: string }>(
  load: (page: number) => Promise<{ rows: T[]; total: number }>
) {
  const rows: T[] = [];
  const seen = new Set<string>();
  let total: number | undefined;
  for (let page = 0; ; page++) {
    const result = await load(page);
    if (total !== undefined && result.total !== total)
      throw new Error(
        "A lista mudou durante a seleção. Atualize e tente novamente."
      );
    total = result.total;
    const previousLength = rows.length;
    for (const row of result.rows)
      if (!seen.has(row.id)) {
        seen.add(row.id);
        rows.push(row);
      }
    if (rows.length >= result.total) return rows;
    if (rows.length === previousLength)
      throw new Error(
        "A lista mudou durante a seleção. Atualize e tente novamente."
      );
  }
}
