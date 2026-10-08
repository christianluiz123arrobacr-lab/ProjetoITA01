import { z } from "zod";

export const MISSING_ANALYSIS_VALUE = "__not_informed__";
const periodSchema = z
  .object({
    from: z.number().int().min(1).max(9999),
    to: z.number().int().min(1).max(9999),
  })
  .refine(p => p.from <= p.to, "O ano inicial deve preceder o final.");
export const examAnalysisFiltersSchema = z.object({
  institution: z.string().max(200).optional(),
  subject: z.string().max(200).optional(),
  exam: z.string().max(200).optional(),
  year: z.number().int().min(1).max(9999).optional(),
  period: periodSchema.optional(),
  compareA: periodSchema.optional(),
  compareB: periodSchema.optional(),
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
      typeof row.ano === "number" &&
      Number.isInteger(row.ano) &&
      row.ano > 0 &&
      row.ano <= 9999
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
    (!filters.year || row.year === filters.year) &&
    (!filters.period ||
      (row.year !== null &&
        row.year >= filters.period.from &&
        row.year <= filters.period.to))
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
  if (
    !filters.year &&
    requested.period &&
    years.includes(requested.period.from) &&
    years.includes(requested.period.to) &&
    requested.period.from <= requested.period.to
  )
    filters.period = requested.period;
  for (const key of ["compareA", "compareB"] as const)
    if (
      requested[key] &&
      years.includes(requested[key]!.from) &&
      years.includes(requested[key]!.to) &&
      requested[key]!.from <= requested[key]!.to
    )
      filters[key] = requested[key];
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
  const chartYears = filters.year
    ? [filters.year]
    : years.filter(
        year =>
          !filters.period ||
          (year >= filters.period.from && year <= filters.period.to)
      );
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
  const weights = new Map<string, number>();
  for (const row of filtered)
    for (const key of row.contents)
      weights.set(key, (weights.get(key) ?? 0) + 1 / row.contents.length);
  const distribution = contents
    .map(item => ({
      ...item,
      weight: weights.get(item.key) ?? 0,
      share: filtered.length
        ? ((weights.get(item.key) ?? 0) / filtered.length) * 100
        : 0,
    }))
    .sort(
      (a, b) => b.share - a.share || a.label.localeCompare(b.label, "pt-BR")
    );
  // Keep the most important slice, even in a very fragmented bank.
  const small = distribution.filter(
    (item, index) => index > 0 && item.share < 5
  );
  const donut = distribution
    .filter(item => !small.includes(item))
    .map(item => ({
      key: item.key,
      label: item.label,
      share: item.share,
      members: [item.key],
    }));
  if (small.length)
    donut.push({
      key: "__others__",
      label: "Outros",
      share: small.reduce((sum, item) => sum + item.share, 0),
      members: small.map(item => item.key),
    });
  const timelineYears = chartYears.length
    ? Array.from(
        { length: chartYears.at(-1)! - chartYears[0] + 1 },
        (_, i) => chartYears[0] + i
      )
    : [];
  const annualTotals = new Map<number, number>();
  for (const row of filtered)
    if (row.year !== null)
      annualTotals.set(row.year, (annualTotals.get(row.year) ?? 0) + 1);
  const seriesFor = (
    items: typeof contents,
    getKeys: (row: AnalysisQuestion) => string[]
  ) => {
    const counts = new Map<string, Map<number, number>>();
    for (const row of filtered)
      if (row.year !== null)
        for (const key of getKeys(row)) {
          const annual = counts.get(key) ?? new Map<number, number>();
          annual.set(row.year, (annual.get(row.year) ?? 0) + 1);
          counts.set(key, annual);
        }
    return items.map(item => ({
      key: item.key,
      label: item.label,
      points: timelineYears.map(year => {
        const denominator = annualTotals.get(year) ?? 0;
        const count = counts.get(item.key)?.get(year) ?? 0;
        return {
          year,
          denominator,
          count: denominator ? count : null,
          percent: denominator ? (count / denominator) * 100 : null,
        };
      }),
    }));
  };
  const contentSeries = seriesFor(contents, row => row.contents);
  const topicSeries = seriesFor(topics, row =>
    row.contents.includes(filters.content!) ? topicKeys(row) : []
  );
  const volumeSeries = timelineYears.map(year => {
    const denominator = annualTotals.get(year) ?? 0;
    return {
      year,
      denominator,
      count: denominator || null,
      percent: denominator ? 100 : null,
    };
  });
  const compared = (period: ExamAnalysisFilters["period"], key?: string) => {
    const annual = period
      ? base.filter(
          row =>
            row.year !== null &&
            row.year >= period.from &&
            row.year <= period.to
        )
      : [];
    const count = annual.filter(row =>
      filters.content
        ? row.contents.includes(filters.content) &&
          (!key || (row.relations.get(filters.content) ?? []).includes(key))
        : !key || row.contents.includes(key)
    ).length;
    return {
      count,
      denominator: annual.length,
      percent: annual.length ? (count / annual.length) * 100 : null,
      yearCount: new Set(annual.map(row => row.year)).size,
    };
  };
  const compareItems = filters.content
    ? incidence(
        base.filter(row => row.contents.includes(filters.content!)),
        topicKeys,
        base.length
      )
    : incidence(base, row => row.contents, base.length);
  const comparisons = compareItems.map(item => {
    const a = compared(filters.compareA, item.key),
      b = compared(filters.compareB, item.key);
    return {
      key: item.key,
      label: item.label,
      a,
      b,
      difference:
        a.percent !== null && b.percent !== null ? b.percent - a.percent : null,
    };
  });
  const comparison = {
    a: compared(filters.compareA, filters.topic),
    b: compared(filters.compareB, filters.topic),
  };
  const covered = (p: ExamAnalysisFilters["period"], n: number) =>
    !!p && n === p.to - p.from + 1;
  const trendCandidates = comparisons.filter(
    item =>
      item.difference !== null &&
      covered(filters.compareA, item.a.yearCount) &&
      covered(filters.compareB, item.b.yearCount)
  );
  const growth =
    [...trendCandidates]
      .filter(item => item.difference! > 0)
      .sort(
        (a, b) =>
          b.difference! - a.difference! ||
          a.label.localeCompare(b.label, "pt-BR")
      )[0] ?? null;
  const reduction =
    [...trendCandidates]
      .filter(item => item.difference! < 0)
      .sort(
        (a, b) =>
          a.difference! - b.difference! ||
          a.label.localeCompare(b.label, "pt-BR")
      )[0] ?? null;
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
    distribution,
    donut,
    contentSeries,
    topicSeries,
    volumeSeries,
    comparisons,
    comparison,
    growth,
    reduction,
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

// The bank reuses its existing filters, plus a removable exam/interval recorte.
export function examAnalysisBankLink(filters: ExamAnalysisFilters) {
  const params = new URLSearchParams();
  if (filters.institution && filters.institution !== MISSING_ANALYSIS_VALUE)
    params.set("institution", filters.institution);
  if (filters.subject && filters.subject !== MISSING_ANALYSIS_VALUE)
    params.set("subject", filters.subject);
  if (filters.content && filters.content !== MISSING_ANALYSIS_VALUE)
    params.set("topics", filters.content);
  if (filters.topic && filters.topic !== MISSING_ANALYSIS_VALUE)
    params.set("subtopics", filters.topic);
  if (filters.exam && filters.exam !== MISSING_ANALYSIS_VALUE)
    params.set("exam", filters.exam);
  if (filters.year) params.set("years", String(filters.year));
  if (filters.period) {
    params.set("yearFrom", String(filters.period.from));
    params.set("yearTo", String(filters.period.to));
  }
  return `/banco-de-questoes${params.size ? `?${params}` : ""}`;
}
