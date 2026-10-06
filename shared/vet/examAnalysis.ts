import { z } from "zod";

export const MISSING_ANALYSIS_VALUE = "__not_informed__";
export const examAnalysisFiltersSchema = z.object({
  institution: z.string().max(200).optional(),
  subject: z.string().max(200).optional(),
  exam: z.string().max(200).optional(),
  year: z.number().int().min(1).max(9999).optional(),
  content: z.string().max(240).optional(),
  topic: z.string().max(240).optional(),
});
export type ExamAnalysisFilters = z.infer<typeof examAnalysisFiltersSchema>;
export type ExamAnalysisRow = {
  id: string;
  publicada: boolean | null;
  instituição?: string | null;
  disciplina?: string | null;
  banca?: string | null;
  ano?: number | null;
  conteudo?: string | null;
  conteudos?: string[] | null;
  assunto?: string | null;
  assuntos?: string[] | null;
  assuntos_por_conteudo?: unknown;
};

const label = (value: string) =>
  value === MISSING_ANALYSIS_VALUE ? "Não informado" : value;
const value = (text?: string | null) => text?.trim() || MISSING_ANALYSIS_VALUE;
const list = (items: unknown, fallback?: string | null): string[] => {
  const valid = Array.isArray(items)
    ? items
        .filter(
          (item): item is string => typeof item === "string" && !!item.trim()
        )
        .map(item => item.trim())
    : [];
  return Array.from(
    new Set(valid.length ? valid : fallback?.trim() ? [fallback.trim()] : [])
  );
};

function question(row: ExamAnalysisRow) {
  const contents = list(row.conteudos, row.conteudo);
  const topics = list(row.assuntos, row.assunto);
  const relations = new Map<string, string[]>();
  const groups = row.assuntos_por_conteudo;
  const add = (content: string, subjects: unknown) => {
    const key = content.trim();
    if (key)
      relations.set(
        key,
        Array.from(new Set([...(relations.get(key) ?? []), ...list(subjects)]))
      );
  };
  if (Array.isArray(groups)) {
    for (const group of groups)
      if (group && typeof group.conteudo === "string")
        add(group.conteudo, group.assuntos);
  } else if (groups && typeof groups === "object") {
    const record = groups as Record<string, unknown>;
    if (typeof record.conteudo === "string")
      add(record.conteudo, record.assuntos);
    else
      for (const [content, subjects] of Object.entries(record))
        add(content, subjects);
  }
  // A legacy flat list has an unambiguous parent only with one content.
  // With multiple contents, leave unmapped subjects unassigned instead of inventing links.
  if (!relations.size && contents.length === 1)
    relations.set(
      contents[0],
      topics.length ? topics : [MISSING_ANALYSIS_VALUE]
    );
  const allContents = Array.from(
    new Set([...contents, ...Array.from(relations.keys())])
  );
  return {
    id: row.id,
    institution: value(row.instituição),
    subject: value(row.disciplina),
    exam: value(row.banca),
    year:
      typeof row.ano === "number" && Number.isInteger(row.ano) && row.ano > 0
        ? row.ano
        : null,
    contents: allContents.length ? allContents : [MISSING_ANALYSIS_VALUE],
    relations,
  };
}
type AnalysisQuestion = ReturnType<typeof question>;

function matches(row: AnalysisQuestion, filters: ExamAnalysisFilters) {
  return (
    (!filters.institution || row.institution === filters.institution) &&
    (!filters.subject || row.subject === filters.subject) &&
    (!filters.exam || row.exam === filters.exam) &&
    (!filters.year || row.year === filters.year)
  );
}
function options(
  rows: AnalysisQuestion[],
  field: "institution" | "subject" | "exam"
) {
  return Array.from(new Set(rows.map(row => row[field])))
    .sort((a, b) => label(a).localeCompare(label(b), "pt-BR"))
    .map(key => ({ value: key, label: label(key) }));
}
function incidence(
  rows: AnalysisQuestion[],
  getKeys: (row: AnalysisQuestion) => string[],
  denominator: number
) {
  const counts = new Map<string, number>();
  for (const row of rows)
    for (const key of Array.from(new Set(getKeys(row))))
      counts.set(key, (counts.get(key) ?? 0) + 1);
  return Array.from(counts)
    .map(([key, count]) => ({
      key,
      label: label(key),
      count,
      denominator,
      percent: denominator ? (count / denominator) * 100 : 0,
    }))
    .sort(
      (a, b) => b.count - a.count || a.label.localeCompare(b.label, "pt-BR")
    );
}

export function buildExamAnalysis(
  source: ExamAnalysisRow[],
  requested: ExamAnalysisFilters = {}
) {
  const unique = new Map<string, AnalysisQuestion>();
  for (const row of source)
    if (row.publicada === true && row.id && !unique.has(row.id))
      unique.set(row.id, question(row));
  const all = Array.from(unique.values());
  const filters: ExamAnalysisFilters = {};
  // Resolve dependent filters in order, clearing values invalidated by a parent.
  const institutions = options(all, "institution");
  if (institutions.some(option => option.value === requested.institution))
    filters.institution = requested.institution;
  const institutionRows = all.filter(row => matches(row, filters));
  const subjects = options(institutionRows, "subject");
  if (subjects.some(option => option.value === requested.subject))
    filters.subject = requested.subject;
  const subjectRows = all.filter(row => matches(row, filters));
  const exams = options(subjectRows, "exam");
  if (exams.some(option => option.value === requested.exam))
    filters.exam = requested.exam;
  const base = all.filter(row => matches(row, filters));
  const years = Array.from(
    new Set(base.flatMap(row => (row.year === null ? [] : [row.year])))
  ).sort((a, b) => a - b);
  if (requested.year && years.includes(requested.year))
    filters.year = requested.year;
  const filtered = base.filter(row => matches(row, filters));
  const contents = incidence(filtered, row => row.contents, filtered.length);
  if (contents.some(content => content.key === requested.content))
    filters.content = requested.content;
  const contentRows = filters.content
    ? filtered.filter(row => row.contents.includes(filters.content!))
    : [];
  const topicKeys = (row: AnalysisQuestion) =>
    row.relations.get(filters.content!) ?? [];
  const topics = incidence(contentRows, topicKeys, contentRows.length);
  if (topics.some(topic => topic.key === requested.topic))
    filters.topic = requested.topic;
  const selectedRows = filters.content
    ? contentRows.filter(
        row => !filters.topic || topicKeys(row).includes(filters.topic)
      )
    : filtered;
  const chartYears = filters.year ? [filters.year] : years;
  const byYear = chartYears.map(year => {
    const denominator = filtered.filter(row => row.year === year).length;
    const count = selectedRows.filter(row => row.year === year).length;
    return {
      year,
      count,
      denominator,
      percent: denominator ? (count / denominator) * 100 : 0,
    };
  });
  const gaps: Array<{ from: number; to: number }> = [];
  for (let i = 1; i < chartYears.length; i++)
    if (chartYears[i] > chartYears[i - 1] + 1)
      gaps.push({ from: chartYears[i - 1] + 1, to: chartYears[i] - 1 });
  const hasSharedTopics = topics.some(topic => {
    const parents = new Set<string>();
    for (const row of filtered)
      for (const [parent, subjects] of Array.from(row.relations))
        if (subjects.includes(topic.key)) parents.add(parent);
    return parents.size > 1;
  });
  return {
    filters,
    options: {
      institutions,
      subjects: options(
        all.filter(row => matches(row, { ...filters, subject: undefined })),
        "subject"
      ),
      exams: options(
        all.filter(row => matches(row, { ...filters, exam: undefined })),
        "exam"
      ),
      years,
    },
    total: filtered.length,
    selectedTotal: selectedRows.length,
    yearCount: new Set(
      filtered.flatMap(row => (row.year === null ? [] : [row.year]))
    ).size,
    unknownYearCount: filtered.filter(row => row.year === null).length,
    multiContent: filtered.some(row => row.contents.length > 1),
    contents,
    topics,
    byYear,
    gaps,
    topicsCanOverlap: contentRows.some(row => topicKeys(row).length > 1),
    hasSharedTopics,
    unmappedTopicQuestions: contentRows.filter(row => !topicKeys(row).length)
      .length,
  };
}
export type ExamAnalysis = ReturnType<typeof buildExamAnalysis>;

// The existing bank URL supports subject, institution and contents only.
export function examAnalysisBankLink(filters: ExamAnalysisFilters) {
  const params = new URLSearchParams();
  if (filters.institution && filters.institution !== MISSING_ANALYSIS_VALUE)
    params.set("institution", filters.institution);
  if (filters.subject && filters.subject !== MISSING_ANALYSIS_VALUE)
    params.set("subject", filters.subject);
  if (filters.content && filters.content !== MISSING_ANALYSIS_VALUE)
    params.set("topics", filters.content);
  return `/banco-de-questoes${params.size ? `?${params}` : ""}`;
}
