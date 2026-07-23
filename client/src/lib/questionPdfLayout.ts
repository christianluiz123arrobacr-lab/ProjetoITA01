import type { Question } from "@/types/question";
import type { QuestionPdfFilters } from "../../../shared/questionPdf";

const subjectLabels: Record<string, string> = { fisica: "Física", matematica: "Matemática", quimica: "Química" };
const difficultyLabels: Record<string, string> = { facil: "Fácil", medio: "Média", dificil: "Difícil", muito_dificil: "Muito difícil" };

export function buildPdfFilterSummary(filters: QuestionPdfFilters) {
  const parts: string[] = [];
  if (filters.search) parts.push(`Busca: ${filters.search}`);
  if (filters.subjects.length) parts.push(`Disciplina: ${filters.subjects.map(item => subjectLabels[item] ?? item).join(", ")}`);
  if (filters.topics.length) parts.push(`Conteúdo: ${filters.topics.join(", ")}`);
  if (filters.subtopics.length) parts.push(`Assunto: ${filters.subtopics.join(", ")}`);
  if (filters.institutions.length) parts.push(`Instituição: ${filters.institutions.join(", ")}`);
  if (filters.years.length) parts.push(`Anos: ${[...filters.years].sort().join(", ")}`);
  if (filters.difficulties.length) parts.push(`Dificuldade: ${filters.difficulties.map(item => difficultyLabels[item] ?? item).join(", ")}`);
  if (filters.practiceStatus !== "all") parts.push(`Status de prática: ${filters.practiceStatus}`);
  return parts.length ? parts.join(" • ") : "Todas as questões disponíveis para a seleção atual";
}

export function getQuestionPdfTags(question: Question) {
  return Array.from(new Set([
    subjectLabels[question.subject] ?? question.subject,
    ...(question.topics?.length ? question.topics : [question.topic]),
    ...(question.subtopics?.length ? question.subtopics : question.subtopic ? [question.subtopic] : []),
    question.institution,
    question.year ? String(question.year) : undefined,
    difficultyLabels[String(question.difficulty)] ?? String(question.difficulty ?? ""),
  ].map(item => String(item ?? "").trim()).filter(Boolean)));
}

export function chunkAnswers(correctAnswers: string[], columnsPerPage = 4, rowsPerColumn = 10) {
  const perPage = columnsPerPage * rowsPerColumn;
  return Array.from({ length: Math.ceil(correctAnswers.length / perPage) }, (_, page) => {
    const slice = correctAnswers.slice(page * perPage, (page + 1) * perPage);
    return Array.from({ length: Math.ceil(slice.length / rowsPerColumn) }, (_, column) =>
      slice.slice(column * rowsPerColumn, (column + 1) * rowsPerColumn).map((answer, row) => ({
        number: page * perPage + column * rowsPerColumn + row + 1,
        answer: answer.toUpperCase(),
      })),
    );
  });
}

export function planQuestionPages(heights: number[], availableHeight: number) {
  const pages: number[][] = [[]];
  let used = 0;
  heights.forEach((height, index) => {
    if (pages[pages.length - 1].length && used + height > availableHeight) {
      pages.push([]);
      used = 0;
    }
    pages[pages.length - 1].push(index);
    used += Math.min(height, availableHeight);
  });
  return pages;
}

export function buildPdfFileName(date = new Date()) {
  return `projeto-vetor-lista-${date.toISOString().slice(0, 10)}.pdf`;
}
