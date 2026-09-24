export function normalizeQuestionTaxonomyKey(value: string) {
  return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
}

function strings(value: unknown): string[] {
  if (typeof value === "string") return value.trim() ? [value] : [];
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string" && !!item.trim());
  return [];
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

export function getExistingQuestionTaxonomy(rows: unknown) {
  const contents = new Set<string>();
  const subjects = new Set<string>();
  const addContents = (value: unknown) => strings(value).forEach((item) => contents.add(normalizeQuestionTaxonomyKey(item)));
  const addSubjects = (value: unknown) => strings(value).forEach((item) => subjects.add(normalizeQuestionTaxonomyKey(item)));

  if (!Array.isArray(rows)) return { contents, subjects };
  for (const value of rows) {
    const row = record(value);
    if (!row) continue;
    addContents(row.conteudo);
    addContents(row.conteudos);
    addSubjects(row.assunto);
    addSubjects(row.assuntos);

    const groups = row.assuntos_por_conteudo;
    if (Array.isArray(groups)) {
      for (const value of groups) {
        const group = record(value);
        if (!group) continue;
        addContents(group.conteudo);
        addSubjects(group.assuntos);
      }
    } else {
      const groupMap = record(groups);
      if (!groupMap) continue;
      if ("conteudo" in groupMap || "assuntos" in groupMap) {
        addContents(groupMap.conteudo);
        addSubjects(groupMap.assuntos);
      } else {
        for (const [content, topics] of Object.entries(groupMap)) {
          addContents(content);
          addSubjects(topics);
        }
      }
    }
  }
  return { contents, subjects };
}
