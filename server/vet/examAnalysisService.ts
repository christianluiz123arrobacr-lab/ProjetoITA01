import { TRPCError } from "@trpc/server";
import { supabaseAdmin } from "../_core/supabaseAdmin.js";
import { fetchAllQuestionPages } from "../questions/questionPagination.js";
import {
  buildExamAnalysis,
  type ExamAnalysisFilters,
  type ExamAnalysisRow,
} from "../../shared/vet/examAnalysis.js";

export async function getExamAnalysis(filters: ExamAnalysisFilters) {
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
  return buildExamAnalysis(rows, filters);
}
