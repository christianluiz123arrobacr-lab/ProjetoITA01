import { normalizeVetText } from "../../shared/vet/vetEngine.js";

export type VetQuestionCandidate = {
  id: string;
  banca?: string | null;
  instituição?: string | null;
  disciplina?: string | null;
  conteudo?: string | null;
  assunto?: string | null;
  conteudos?: string[] | null;
};

const EXAM_ALIASES: Record<string, string[]> = {
  afa: ["AFA", "Academia da Força Aérea", "Academia da Forca Aerea"],
  epcar: ["EPCAr", "EPCAR", "Escola Preparatória de Cadetes do Ar", "Escola Preparatoria de Cadetes do Ar"],
  espcex: ["EsPCEx", "ESPCEX", "Escola Preparatória de Cadetes do Exército", "Escola Preparatoria de Cadetes do Exercito"],
  cn: ["CN", "Colégio Naval", "Colegio Naval"],
};

const SUBJECT_ALIASES: Record<string, string[]> = {
  fisica: ["Física", "Fisica", "fisica"],
  matematica: ["Matemática", "Matematica", "matematica"],
  quimica: ["Química", "Quimica", "quimica"],
};

function aliasesFor(value: string, aliases: Record<string, string[]>) {
  const canonical = normalizeVetText(value);
  return Array.from(new Set([value, canonical, ...(aliases[canonical] ?? [])]));
}

export const getExamAliases = (exam: string) => aliasesFor(exam, EXAM_ALIASES);
export const getSubjectAliases = (subject: string) => aliasesFor(subject, SUBJECT_ALIASES);

export function matchesVetExam(question: VetQuestionCandidate, targetExam: string) {
  const target = normalizeVetText(targetExam);
  return [question.banca, question.instituição].some(value => normalizeVetText(value) === target);
}

export function matchesVetSubject(question: VetQuestionCandidate, focusSubject: string) {
  const target = normalizeVetText(focusSubject);
  return target === "todas" || normalizeVetText(question.disciplina) === target;
}

export function matchesVetContent(question: VetQuestionCandidate, content: string) {
  const target = normalizeVetText(content);
  const values = question.conteudos?.length ? question.conteudos : [question.conteudo, question.assunto];
  return values.some(value => normalizeVetText(value) === target);
}

export function filterVetQuestionPool<T extends VetQuestionCandidate>(questions: T[], targetExam: string, focusSubject: string) {
  return questions.filter(question => matchesVetExam(question, targetExam) && matchesVetSubject(question, focusSubject));
}

export function prioritizeVetCandidates<T extends VetQuestionCandidate>(questions: T[], attemptedIds: Set<string>, stableOrder: (id: string) => number) {
  return [...questions].sort((a, b) => Number(attemptedIds.has(a.id)) - Number(attemptedIds.has(b.id)) || stableOrder(a.id) - stableOrder(b.id));
}

export function postgrestAliasFilter(columns: string[], aliases: string[]) {
  const safeAliases = aliases.map(alias => alias.replace(/[,%()]/g, "")).filter(Boolean);
  return columns.flatMap(column => safeAliases.map(alias => `${column}.ilike.%${alias}%`)).join(",");
}
