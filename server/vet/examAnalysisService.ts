import { TRPCError } from "@trpc/server";
import { supabaseAdmin } from "../_core/supabaseAdmin.js";
import { fetchAllQuestionPages } from "../questions/questionPagination.js";
import {
  buildExamAnalysis,
  type ExamAnalysisFilters,
  type ExamAnalysisRow,
} from "../../shared/vet/examAnalysis.js";

// Only public metadata, shared after platform authorization. Bounded, process-local
// lifetime: not a persistent cache and never contains user performance or identities.
let cache: { rows: ExamAnalysisRow[]; expires: number } | undefined;
let pending: Promise<ExamAnalysisRow[]> | undefined;
export function clearExamAnalysisCache() {
  cache = undefined;
  pending = undefined;
}
async function readRows() {
  if (cache && cache.expires > Date.now()) return cache.rows;
  if (pending) return pending;
  pending = loadRows();
  try {
    const rows = await pending;
    cache = { rows, expires: Date.now() + 60_000 };
    return rows;
  } finally {
    pending = undefined;
  }
}
async function loadRows() {
  const rows = await fetchAllQuestionPages<ExamAnalysisRow>(
    async (from, to) => {
      const { data, error } = await supabaseAdmin
        .from("questoes")
        .select(
          "id,publicada,instituição,disciplina,banca,ano,conteudo,conteudos,assunto,assuntos,assuntos_por_conteudo"
        )
        .eq("publicada", true)
        .order("id", { ascending: true })
        .range(from, to);
      if (error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Não foi possível carregar a análise das provas. Tente novamente.",
        });
      return (data ?? []) as unknown as ExamAnalysisRow[];
    }
  );
  return rows;
}
export async function getExamAnalysis(filters: ExamAnalysisFilters) {
  return buildExamAnalysis(await readRows(), filters);
}
