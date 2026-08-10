import { trpcClient } from "@/lib/trpcClient";
import type { Question, QuestionSubtopicsByTopic } from "@/types/question";
import type { QuestionPdfFilters } from "@shared/questionPdf";

type QuestionDifficulty = Question["difficulty"];
type QuestionSubject = Question["subject"];

export type QuestionFilters = {
  subject?: QuestionSubject;
  topic?: string;
  subtopic?: string;
  exam?: string;
  year?: number;
  difficulty?: QuestionDifficulty;
  institution?: string;
  isPublished?: boolean;
};

type QuestaoRow = {
  id: string;
  codigo?: string | null;
  diciplina?: string;
  disciplina?: string;
  assunto: string;
  conteudo?: string | null;
  conteudos?: string[] | null;
  assuntos?: string[] | null;
  assuntos_por_conteudo?: unknown;
  banca?: string | null;
  ano: number;
  dificuldade: QuestionDifficulty;
  enunciado?: string | null;
  enunciado_pos_imagem?: string | null;
  url_imagem?: string | null;
  formula?: string | null;

  a?: string | null;
  b?: string | null;
  c?: string | null;
  d?: string | null;
  e?: string | null;

  A?: string | null;
  B?: string | null;
  C?: string | null;
  D?: string | null;
  E?: string | null;

  options?: Array<{
    id?: string | null;
    label?: string | null;
    text?: string | null;
    imageUrl?: string | null;
  }> | null;

  a_url_imagem?: string | null;
  b_url_imagem?: string | null;
  c_url_imagem?: string | null;
  d_url_imagem?: string | null;
  e_url_imagem?: string | null;

  alternativa_correta?: string | null;
  instituição?: string | null;
  fonte?: string | null;
  tag?: string | null;
  publicada?: boolean | null;
  created_at?: string | null;

  resolucoes?: {
    id: string;
    tipo: string;
    texto?: string | null;
    ordem?: number | null;
    url_imagem?: string | null;
  }[];
};

function normalizarTexto(valor?: string | null): string | undefined {
  if (!valor) return undefined;

  const limpo = valor.trim();

  return limpo.length > 0 ? limpo : undefined;
}

function normalizarListaTexto(
  valores?: string[] | null,
  fallback?: string | null
): string[] {
  const itens = Array.isArray(valores) ? valores : [];
  const base = itens.length > 0 ? itens : fallback ? [fallback] : [];

  return Array.from(
    new Set(
      base
        .map((item) => String(item ?? "").trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

function normalizarAssuntosPorConteudo(
  valor: unknown
): QuestionSubtopicsByTopic[] {
  if (!Array.isArray(valor)) return [];

  return valor
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const rawItem = item as {
        conteudo?: unknown;
        topic?: unknown;
        assuntos?: unknown;
        subtopics?: unknown;
      };

      const topic = String(rawItem.conteudo ?? rawItem.topic ?? "")
        .trim()
        .toLowerCase();

      const rawSubtopics = Array.isArray(rawItem.assuntos)
        ? rawItem.assuntos
        : Array.isArray(rawItem.subtopics)
          ? rawItem.subtopics
          : [];

      const subtopics = normalizarListaTexto(
        rawSubtopics.map((subtopic) => String(subtopic ?? ""))
      );

      if (!topic || subtopics.length === 0) return null;

      return {
        topic,
        subtopics,
      };
    })
    .filter((item): item is QuestionSubtopicsByTopic => !!item);
}

function questionMatchesListFilter(
  values: string[] | undefined,
  filter?: string
) {
  if (!filter?.trim()) return true;

  const normalizedFilter = filter.trim().toLowerCase();
  const list = values ?? [];

  return list.some((item) => item.toLowerCase().includes(normalizedFilter));
}

function questionMatchesSubtopicFilter(
  question: Question,
  topicFilter?: string,
  subtopicFilter?: string
) {
  if (!subtopicFilter?.trim()) return true;

  const normalizedSubtopic = subtopicFilter.trim().toLowerCase();
  const normalizedTopic = topicFilter?.trim().toLowerCase();

  if (
    normalizedTopic &&
    Array.isArray(question.subtopicsByTopic) &&
    question.subtopicsByTopic.length > 0
  ) {
    const groupedSubtopics = question.subtopicsByTopic
      .filter((group) => group.topic.toLowerCase().includes(normalizedTopic))
      .flatMap((group) => group.subtopics);

    return groupedSubtopics.some((subtopic) =>
      subtopic.toLowerCase().includes(normalizedSubtopic)
    );
  }

  return questionMatchesListFilter(question.subtopics, subtopicFilter);
}

function normalizarAlternativas(row: QuestaoRow): Question["options"] {
  if (Array.isArray(row.options) && row.options.length > 0) {
    const canonicalOptions = row.options.flatMap((option) => {
      const id = String(option.id ?? "").trim().toLowerCase();
      const text = normalizarTexto(option.text);
      const imageUrl = normalizarTexto(option.imageUrl);

      if (!/^[a-e]$/.test(id) || (!text && !imageUrl)) return [];

      return [{
        id,
        label: String(option.label ?? id).trim().toUpperCase(),
        text,
        imageUrl,
      }];
    });

    if (canonicalOptions.length > 0) return canonicalOptions;
  }

  const altA = row.a ?? row.A ?? "";
  const altB = row.b ?? row.B ?? "";
  const altC = row.c ?? row.C ?? "";
  const altD = row.d ?? row.D ?? "";
  const altE = row.e ?? row.E ?? "";

  return [
    altA || row.a_url_imagem
      ? {
          id: "a",
          label: "A",
          text: altA || undefined,
          imageUrl: row.a_url_imagem ?? undefined,
        }
      : null,

    altB || row.b_url_imagem
      ? {
          id: "b",
          label: "B",
          text: altB || undefined,
          imageUrl: row.b_url_imagem ?? undefined,
        }
      : null,

    altC || row.c_url_imagem
      ? {
          id: "c",
          label: "C",
          text: altC || undefined,
          imageUrl: row.c_url_imagem ?? undefined,
        }
      : null,

    altD || row.d_url_imagem
      ? {
          id: "d",
          label: "D",
          text: altD || undefined,
          imageUrl: row.d_url_imagem ?? undefined,
        }
      : null,

    altE || row.e_url_imagem
      ? {
          id: "e",
          label: "E",
          text: altE || undefined,
          imageUrl: row.e_url_imagem ?? undefined,
        }
      : null,
  ].filter(Boolean) as Question["options"];
}

export function mapQuestao(row: QuestaoRow): Question {
  const explanationBlocks =
    row.resolucoes
      ?.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
      .map((r) => {
        const tipo = (r.tipo || "").toLowerCase().trim();

        if (tipo === "imagem") {
          return {
            type: "imagem" as const,
            imageUrl: r.url_imagem ?? undefined,
            order: r.ordem ?? 0,
          };
        }

        if (tipo === "latex") {
          return {
            type: "latex" as const,
            content: r.texto ?? "",
            order: r.ordem ?? 0,
          };
        }

        return {
          type: "texto" as const,
          content: r.texto ?? "",
          order: r.ordem ?? 0,
        };
      })
      .filter((block) =>
        block.type === "imagem" ? !!block.imageUrl : !!block.content
      ) || [];

  const resolucaoTexto =
    row.resolucoes
      ?.filter((r) => r.texto)
      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
      .map((r) => r.texto ?? "")
      .join("\n\n") || "Sem resolução cadastrada.";

  const disciplina = (
    row.disciplina ??
    row.diciplina ??
    "fisica"
  )
    .toLowerCase()
    .trim() as QuestionSubject;

  const topics = normalizarListaTexto(row.conteudos, row.conteudo ?? row.assunto);
  const subtopics = normalizarListaTexto(row.assuntos, row.assunto);
  const subtopicsByTopic = normalizarAssuntosPorConteudo(
    row.assuntos_por_conteudo
  );

  return {
    id: row.id,
    codigo: row.codigo ?? undefined,
    subject: disciplina,

    topic: topics[0] ?? "",
    topics,

    subtopic: subtopics[0],
    subtopics,
    subtopicsByTopic,

    exam: normalizarTexto(row.banca) ?? "Sem banca",
    year: row.ano,
    institution: normalizarTexto(row.instituição),

    statement: row.enunciado ?? "Sem enunciado cadastrado.",
    statementAfterImage: row.enunciado_pos_imagem ?? undefined,
    formula: row.formula ?? undefined,
    imageUrl: row.url_imagem ?? undefined,

    options: normalizarAlternativas(row),
    correctOptionId: normalizarTexto(row.alternativa_correta)?.toLowerCase() ?? "",

    explanation: resolucaoTexto,
    explanationBlocks,

    difficulty: row.dificuldade,
    tags: row.tag ? row.tag.split(",").map((t) => t.trim()) : [],
    source: row.fonte ?? undefined,
    isPublished: row.publicada ?? true,

    createdAt: row.created_at ?? undefined,
    updatedAt: row.created_at ?? undefined,
  };
}

export async function exportQuestionsForPdf(filters: QuestionPdfFilters) {
  const result = await trpcClient.questions.exportPdfData.mutate(filters);
  return { ...result, questions: (result.rows as QuestaoRow[]).map(mapQuestao) };
}

export async function getQuestions(
  filters?: QuestionFilters
): Promise<Question[]> {
  try {
    const data = await trpcClient.questions.list.query({
      subject: filters?.subject,
      exam: filters?.exam,
      year: filters?.year,
      difficulty: filters?.difficulty,
      institution: filters?.institution,
    });

    let questions = (data as QuestaoRow[]).map(mapQuestao);

    if (filters?.topic) {
      questions = questions.filter((question) =>
        questionMatchesListFilter(question.topics, filters.topic)
      );
    }

    if (filters?.subtopic) {
      questions = questions.filter((question) =>
        questionMatchesSubtopicFilter(
          question,
          filters.topic,
          filters.subtopic
        )
      );
    }

    return questions;
  } catch (error) {
    console.error("Erro ao buscar questões:", error);
    return [];
  }
}

export async function getQuestionById(id: string): Promise<Question | null> {
  try {
    const data = await trpcClient.questions.getById.query({ id });

    if (!data) return null;

    return mapQuestao(data as QuestaoRow);
  } catch (error) {
    console.error("Erro ao buscar questão por ID:", error);
    return null;
  }
}
