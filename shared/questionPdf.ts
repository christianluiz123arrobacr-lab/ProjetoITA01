import { z } from "zod";

export const QUESTION_PDF_EXPORT_LIMIT = 120;

export const questionPdfFiltersSchema = z.object({
  search: z.string().trim().max(160).default(""),
  institutions: z.array(z.string().trim().min(1).max(120)).max(30).default([]),
  years: z.array(z.number().int().min(1900).max(2200)).max(50).default([]),
  subjects: z.array(z.string().trim().min(1).max(80)).max(10).default([]),
  topics: z.array(z.string().trim().min(1).max(160)).max(50).default([]),
  subtopics: z.array(z.string().trim().min(1).max(160)).max(80).default([]),
  difficulties: z.array(z.string().trim().min(1).max(80)).max(10).default([]),
  practiceStatus: z.enum(["all", "unanswered", "answered", "correct", "wrong"]).default("all"),
});

export type QuestionPdfFilters = z.infer<typeof questionPdfFiltersSchema>;

export function normalizePdfFilterText(value: unknown) {
  return String(value ?? "").trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function matchesOne(value: unknown, selected: string[]) {
  if (!selected.length) return true;
  const normalized = normalizePdfFilterText(value);
  return selected.some(item => normalizePdfFilterText(item) === normalized);
}

function matchesList(values: unknown, selected: string[]) {
  if (!selected.length) return true;
  const list = Array.isArray(values) ? values : values ? [values] : [];
  const normalized = list.map(normalizePdfFilterText);
  return selected.some(item => normalized.includes(normalizePdfFilterText(item)));
}

export function questionRowMatchesPdfFilters(row: Record<string, unknown>, filters: QuestionPdfFilters) {
  const topics = Array.isArray(row.conteudos) && row.conteudos.length ? row.conteudos : [row.conteudo ?? row.assunto];
  const subtopics = Array.isArray(row.assuntos) && row.assuntos.length ? row.assuntos : [row.assunto];
  const search = normalizePdfFilterText(filters.search);
  const subject = row.disciplina ?? row.diciplina;
  const searchable = [row.codigo, row.enunciado, row.enunciado_pos_imagem, row.banca, row["instituição"], row.ano, subject, ...topics, ...subtopics]
    .map(normalizePdfFilterText).join(" ");

  return (!search || searchable.includes(search))
    && matchesOne(row["instituição"], filters.institutions)
    && (!filters.years.length || filters.years.includes(Number(row.ano)))
    && matchesOne(subject, filters.subjects)
    && matchesList(topics, filters.topics)
    && matchesList(subtopics, filters.subtopics)
    && matchesOne(row.dificuldade, filters.difficulties);
}
