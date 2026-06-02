import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { MathFormula } from "./MathFormula";
import { QuestionScratchpad } from "@/components/question-notes/QuestionScratchpad";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  UserSquare2,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Eye,
  Trophy,
  MessageSquareWarning,
  Send,
  Loader2,
} from "lucide-react";
import type { Question } from "@/types/question";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export type QuizCompletionData = {
  totalQuestions: number;
  totalAnswered: number;
  score: number;
  accuracy: number;
  correctQuestionIds: string[];
  wrongQuestionIds: string[];
  wrongTopics: { topic: string; count: number }[];
  wrongDifficulties: { difficulty: string; count: number }[];
};

type InteractiveQuizProps = {
  questions: Question[];
  onComplete?: (data: QuizCompletionData) => void;
};

type ResolutionMetaRow = {
  questao_id: string;
  autor_nome?: string | null;
};

const REPORT_TYPES = [
  { value: "enunciado", label: "Enunciado com erro" },
  { value: "alternativa", label: "Alternativa com erro" },
  { value: "gabarito", label: "Gabarito incorreto" },
  { value: "resolucao", label: "Resolução confusa" },
  { value: "imagem", label: "Imagem quebrada" },
  { value: "latex", label: "Formatação/LaTeX bugado" },
  { value: "outro", label: "Outro" },
];

function getQuestionTopics(question?: Question | null) {
  if (!question) return [];

  if (Array.isArray(question.topics) && question.topics.length > 0) {
    return question.topics.filter(Boolean);
  }

  return question.topic ? [question.topic] : [];
}

function getQuestionSubtopics(question?: Question | null) {
  if (!question) return [];

  if (Array.isArray(question.subtopics) && question.subtopics.length > 0) {
    return question.subtopics.filter(Boolean);
  }

  return question.subtopic ? [question.subtopic] : [];
}

function formatSubjectLabel(value?: string | null) {
  const normalized = (value || "").trim().toLowerCase();

  if (normalized === "fisica") return "Física";
  if (normalized === "matematica") return "Matemática";
  if (normalized === "quimica") return "Química";

  return value || "Disciplina";
}

function formatDifficultyLabel(value?: string | null) {
  const normalized = (value || "").trim().toLowerCase();

  if (normalized === "facil") return "Fácil";
  if (normalized === "medio") return "Médio";
  if (normalized === "dificil") return "Difícil";

  return value || "Dificuldade";
}

function getDifficultyClasses(value?: string | null) {
  const normalized = (value || "").trim().toLowerCase();

  if (normalized === "facil") {
    return {
      pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
      result: "bg-emerald-50 border-emerald-200",
    };
  }

  if (normalized === "medio") {
    return {
      pill: "bg-amber-50 text-amber-700 border-amber-200",
      result: "bg-amber-50 border-amber-200",
    };
  }

  if (normalized === "dificil") {
    return {
      pill: "bg-rose-50 text-rose-700 border-rose-200",
      result: "bg-rose-50 border-rose-200",
    };
  }

  return {
    pill: "bg-slate-50 text-slate-700 border-slate-200",
    result: "bg-slate-50 border-slate-200",
  };
}

function MetaPill({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${className}`}
    >
      {children}
    </span>
  );
}

function MarkdownContent({
  children,
  large = false,
}: {
  children: string;
  large?: boolean;
}) {
  return (
    <div
      className={`prose prose-slate max-w-none ${
        large
          ? "prose-p:my-3 text-base md:text-lg"
          : "prose-p:my-2 text-sm md:text-base"
      }`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-bold">{children}</strong>
          ),
          ul: ({ children }) => <ul className="list-disc pl-5 mb-3">{children}</ul>,
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 mb-3">{children}</ol>
          ),
          li: ({ children }) => <li className="mb-1">{children}</li>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

export function InteractiveQuiz({ questions, onComplete }: InteractiveQuizProps) {
  const { user } = useSupabaseAuth();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answersByQuestion, setAnswersByQuestion] = useState<Record<number, string>>({});
  const [showExplanationByQuestion, setShowExplanationByQuestion] =
    useState<Record<number, boolean>>({});
  const [questionStartedAt, setQuestionStartedAt] = useState<number>(Date.now());
  const [hasSentCompletion, setHasSentCompletion] = useState(false);
  const [resolutionAuthorsByQuestionId, setResolutionAuthorsByQuestionId] =
    useState<Record<string, string>>({});

  const [reportOpen, setReportOpen] = useState(false);
  const [reportType, setReportType] = useState("enunciado");
  const [reportComment, setReportComment] = useState("");
  const [reportSending, setReportSending] = useState(false);
  const [reportSuccess, setReportSuccess] = useState("");
  const [reportError, setReportError] = useState("");

  const question = questions[currentQuestion] ?? null;

  const selectedAnswer = answersByQuestion[currentQuestion] ?? null;
  const answered = selectedAnswer !== null;
  const showExplanation = showExplanationByQuestion[currentQuestion] ?? false;
  const isCorrect = question ? selectedAnswer === question.correctOptionId : false;
  const resolutionAuthor = question
    ? resolutionAuthorsByQuestionId[question.id] ?? ""
    : "";

  const questionTopics = getQuestionTopics(question);
  const questionSubtopics = getQuestionSubtopics(question);

  const score = useMemo(() => {
    return questions.reduce((total, q, index) => {
      return answersByQuestion[index] === q.correctOptionId ? total + 1 : total;
    }, 0);
  }, [answersByQuestion, questions]);

  const totalAnswered = useMemo(() => {
    return Object.keys(answersByQuestion).length;
  }, [answersByQuestion]);

  const isQuizComplete =
    questions.length > 0 && totalAnswered === questions.length;

  const progressPercentage =
    questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  const completionData = useMemo<QuizCompletionData | null>(() => {
    if (!isQuizComplete) return null;

    const correctQuestionIds: string[] = [];
    const wrongQuestionIds: string[] = [];
    const wrongTopicMap = new Map<string, number>();
    const wrongDifficultyMap = new Map<string, number>();

    questions.forEach((q, index) => {
      const selected = answersByQuestion[index];
      const correct = selected === q.correctOptionId;

      if (correct) {
        correctQuestionIds.push(q.id);
        return;
      }

      wrongQuestionIds.push(q.id);

      const topics = getQuestionTopics(q);
      const safeTopics = topics.length > 0 ? topics : ["Sem conteúdo"];

      for (const topic of safeTopics) {
        wrongTopicMap.set(topic, (wrongTopicMap.get(topic) ?? 0) + 1);
      }

      const difficulty = formatDifficultyLabel(q.difficulty);

      wrongDifficultyMap.set(
        difficulty,
        (wrongDifficultyMap.get(difficulty) ?? 0) + 1
      );
    });

    return {
      totalQuestions: questions.length,
      totalAnswered,
      score,
      accuracy: questions.length > 0 ? (score / questions.length) * 100 : 0,
      correctQuestionIds,
      wrongQuestionIds,
      wrongTopics: Array.from(wrongTopicMap.entries())
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count),
      wrongDifficulties: Array.from(wrongDifficultyMap.entries())
        .map(([difficulty, count]) => ({ difficulty, count }))
        .sort((a, b) => b.count - a.count),
    };
  }, [answersByQuestion, isQuizComplete, questions, score, totalAnswered]);

  useEffect(() => {
    if (!questions.length) {
      setCurrentQuestion(0);
      return;
    }

    if (currentQuestion > questions.length - 1) {
      setCurrentQuestion(questions.length - 1);
    }
  }, [questions, currentQuestion]);

  useEffect(() => {
    setQuestionStartedAt(Date.now());

    setReportOpen(false);
    setReportType("enunciado");
    setReportComment("");
    setReportSuccess("");
    setReportError("");
    setReportSending(false);
  }, [currentQuestion, questions]);

  useEffect(() => {
    setHasSentCompletion(false);
  }, [questions]);

  useEffect(() => {
    async function loadResolutionAuthors() {
      try {
        const uniqueQuestionIds = Array.from(
          new Set(questions.map((item) => item.id).filter(Boolean))
        );

        if (!uniqueQuestionIds.length) {
          setResolutionAuthorsByQuestionId({});
          return;
        }

        const { data, error } = await supabase
          .from("resolucoes_meta")
          .select("questao_id, autor_nome")
          .in("questao_id", uniqueQuestionIds);

        if (error) {
          console.error("Erro ao carregar autores das resoluções:", error);
          return;
        }

        const authorMap: Record<string, string> = {};

        ((data as ResolutionMetaRow[]) || []).forEach((item) => {
          if (item.questao_id && item.autor_nome) {
            authorMap[item.questao_id] = item.autor_nome;
          }
        });

        setResolutionAuthorsByQuestionId(authorMap);
      } catch (error) {
        console.error("Erro inesperado ao carregar autores das resoluções:", error);
      }
    }

    loadResolutionAuthors();
  }, [questions]);

  useEffect(() => {
    if (isQuizComplete && completionData && onComplete && !hasSentCompletion) {
      onComplete(completionData);
      setHasSentCompletion(true);
    }
  }, [completionData, hasSentCompletion, isQuizComplete, onComplete]);

  const saveAttempt = async (optionId: string) => {
    if (!user?.id || !question) return;

    try {
      const elapsedSeconds = Math.max(
        1,
        Math.round((Date.now() - questionStartedAt) / 1000)
      );

      const { count, error: countError } = await supabase
        .from("user_question_attempts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("question_id", question.id);

      if (countError) {
        console.error("Erro ao contar tentativas:", countError);
        return;
      }

      const attemptNumber = (count ?? 0) + 1;
      const correct = optionId === question.correctOptionId;

      const { error: insertError } = await supabase
        .from("user_question_attempts")
        .insert({
          user_id: user.id,
          question_id: question.id,
          selected_option: optionId,
          is_correct: correct,
          time_spent_seconds: elapsedSeconds,
          attempt_number: attemptNumber,
          subject: question.subject,
          conteudo: getQuestionTopics(question)[0] ?? null,
          assunto: getQuestionSubtopics(question)[0] ?? null,
          banca: question.exam,
          ano: question.year,
          difficulty: question.difficulty,
        });

      if (insertError) {
        console.error("Erro ao salvar tentativa:", insertError);
      }
    } catch (error) {
      console.error("Erro inesperado ao salvar tentativa:", error);
    }
  };

  const handleAnswer = async (optionId: string) => {
    if (answered || !question) return;

    setAnswersByQuestion((prev) => ({
      ...prev,
      [currentQuestion]: optionId,
    }));

    setShowExplanationByQuestion((prev) => ({
      ...prev,
      [currentQuestion]: true,
    }));

    await saveAttempt(optionId);
  };

  const handleSubmitReport = async () => {
    if (!question) return;

    setReportError("");
    setReportSuccess("");

    if (!user?.id) {
      setReportError("Você precisa estar logado para reportar um erro.");
      return;
    }

    if (!reportType.trim()) {
      setReportError("Selecione o tipo do problema.");
      return;
    }

    try {
      setReportSending(true);

      const { error } = await supabase.from("question_reports").insert({
        question_id: question.id,
        user_id: user.id,
        report_type: reportType,
        comment: reportComment.trim() || null,
        status: "pendente",
      });

      if (error) {
        console.error("Erro ao enviar report:", error);

        setReportError(
          error.message
            ? `Não foi possível enviar o report: ${error.message}`
            : "Não foi possível enviar o report."
        );

        return;
      }

      setReportSuccess("Erro reportado com sucesso. Obrigado pelo aviso.");
      setReportComment("");
      setReportType("enunciado");
    } catch (error) {
      console.error("Erro inesperado ao enviar report:", error);
      setReportError("Ocorreu um erro inesperado ao enviar o report.");
    } finally {
      setReportSending(false);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setAnswersByQuestion({});
    setShowExplanationByQuestion({});
    setQuestionStartedAt(Date.now());
    setHasSentCompletion(false);
    setReportOpen(false);
    setReportType("enunciado");
    setReportComment("");
    setReportSuccess("");
    setReportError("");
  };

  if (!questions.length) {
    return (
      <div className="bg-white rounded-3xl shadow-sm p-8 border border-slate-200">
        <h3 className="text-xl font-bold text-slate-900 mb-3">
          Questões filtradas
        </h3>
        <p className="text-slate-600">Nenhuma questão encontrada.</p>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="bg-white rounded-3xl shadow-sm p-8 border border-slate-200">
        <h3 className="text-xl font-bold text-slate-900 mb-3">
          Questões filtradas
        </h3>
        <p className="text-slate-600">Carregando questão...</p>
      </div>
    );
  }

  const difficultyClasses = getDifficultyClasses(question.difficulty);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-violet-50/60 px-5 md:px-7 py-5">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center rounded-full bg-violet-600 text-white px-3 py-1 text-xs font-bold">
                Questão {currentQuestion + 1} de {questions.length}
              </span>

              {question.codigo ? (
                <span className="inline-flex items-center rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600">
                  {question.codigo}
                </span>
              ) : null}
            </div>

            <h3 className="text-2xl font-bold text-slate-900">
              Exercícios Interativos
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            <MetaPill className="bg-blue-50 text-blue-700 border-blue-200">
              {question.institution || question.exam}
            </MetaPill>

            <MetaPill className="bg-slate-50 text-slate-700 border-slate-200">
              {question.year}
            </MetaPill>

            <MetaPill className="bg-indigo-50 text-indigo-700 border-indigo-200">
              {formatSubjectLabel(question.subject)}
            </MetaPill>

            <MetaPill className={difficultyClasses.pill}>
              {formatDifficultyLabel(question.difficulty)}
            </MetaPill>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-500">
              Progresso do treino
            </p>

            <p className="text-xs font-bold text-slate-600">
              {Math.round(progressPercentage)}%
            </p>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-violet-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-5 md:p-7">
        <div className="flex flex-wrap gap-2 mb-6">
          {questionTopics.map((topic) => (
            <MetaPill
              key={`topic-${topic}`}
              className="bg-purple-50 text-purple-700 border-purple-200"
            >
              {topic}
            </MetaPill>
          ))}

          {questionSubtopics.map((subtopic) => (
            <MetaPill
              key={`subtopic-${subtopic}`}
              className="bg-cyan-50 text-cyan-700 border-cyan-200"
            >
              {subtopic}
            </MetaPill>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 md:p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-violet-600" />
            <p className="font-bold text-slate-900">Enunciado</p>
          </div>

          <MarkdownContent large>{question.statement}</MarkdownContent>

          {question.imageUrl ? (
            <div className="mt-5">
              <img
                src={question.imageUrl}
                alt="Imagem da questão"
                className="max-w-full rounded-2xl border border-slate-200 bg-white"
              />
            </div>
          ) : null}

          {question.statementAfterImage ? (
            <div className="mt-5">
              <MarkdownContent large>{question.statementAfterImage}</MarkdownContent>
            </div>
          ) : null}

          {question.formula ? (
            <div className="mt-5 p-4 bg-white rounded-2xl border border-slate-200">
              <p className="text-xs font-semibold text-slate-500 mb-2">
                Fórmula útil
              </p>
              <MathFormula
                formula={question.formula.replace(/^\$\$?|\$\$?$/g, "").trim()}
                display={true}
              />
            </div>
          ) : null}
        </div>

        <QuestionScratchpad
          userId={user?.id}
          questionId={question.id}
          questionCode={question.codigo}
        />

        <div className="space-y-3 mb-6">
          {question.options.map((option) => {
            const isSelected = selectedAnswer === option.id;
            const isCorrectOption = option.id === question.correctOptionId;

            const optionClass = !answered
              ? "border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50 cursor-pointer"
              : isSelected
                ? isCorrectOption
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : "border-rose-300 bg-rose-50 text-rose-900"
                : isCorrectOption
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : "border-slate-200 bg-slate-50 text-slate-600";

            return (
              <button
                key={option.id}
                onClick={() => !answered && handleAnswer(option.id)}
                disabled={answered}
                className={`w-full rounded-2xl border p-4 text-left transition-all ${optionClass}`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      answered && isCorrectOption
                        ? "bg-emerald-600 text-white"
                        : answered && isSelected && !isCorrectOption
                          ? "bg-rose-600 text-white"
                          : "bg-violet-50 text-violet-700 border border-violet-200"
                    }`}
                  >
                    {option.label}
                  </div>

                  <div className="flex-1 min-w-0">
                    {option.text ? (
                      <MarkdownContent>{option.text}</MarkdownContent>
                    ) : null}

                    {option.imageUrl ? (
                      <img
                        src={option.imageUrl}
                        alt={`Alternativa ${option.label}`}
                        className="mt-3 max-h-48 max-w-full object-contain rounded-xl border border-slate-200 bg-white"
                      />
                    ) : null}
                  </div>

                  <div className="shrink-0 pt-1">
                    {answered && isCorrectOption ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    ) : null}

                    {answered && isSelected && !isCorrectOption ? (
                      <XCircle className="w-5 h-5 text-rose-600" />
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {showExplanation ? (
          <div
            className={`rounded-3xl border p-5 md:p-6 mb-6 ${
              isCorrect
                ? "bg-emerald-50 border-emerald-200"
                : "bg-amber-50 border-amber-200"
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <div className="flex items-start gap-3">
                {isCorrect ? (
                  <CheckCircle className="w-6 h-6 text-emerald-600 mt-1" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-amber-600 mt-1" />
                )}

                <div>
                  <p
                    className={`text-lg font-bold ${
                      isCorrect ? "text-emerald-900" : "text-amber-900"
                    }`}
                  >
                    {isCorrect ? "Correto!" : "Incorreto"}
                  </p>

                  <p
                    className={`text-sm ${
                      isCorrect ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    Confira a resolução comentada abaixo.
                  </p>
                </div>
              </div>

              {resolutionAuthor ? (
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold self-start">
                  <UserSquare2 className="w-4 h-4" />
                  Resolução por: {resolutionAuthor}
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl bg-white/80 border border-white p-4">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-5 h-5 text-violet-600" />
                <p className="font-bold text-slate-900">Resolução</p>
              </div>

              {question.explanationBlocks && question.explanationBlocks.length > 0 ? (
                <div className="space-y-4">
                  {question.explanationBlocks
                    .sort((a, b) => a.order - b.order)
                    .map((block, index) => {
                      if (block.type === "imagem" && block.imageUrl) {
                        return (
                          <div
                            key={`${block.type}-${block.order}-${index}`}
                            className="rounded-2xl overflow-hidden border border-slate-200 bg-white p-3"
                          >
                            <img
                              src={block.imageUrl}
                              alt={`Imagem da resolução ${index + 1}`}
                              className="max-w-full rounded-xl mx-auto"
                            />
                          </div>
                        );
                      }

                      if (block.content) {
                        return (
                          <div
                            key={`${block.type}-${block.order}-${index}`}
                            className={
                              block.type === "latex"
                                ? "rounded-2xl border border-slate-200 bg-white p-4"
                                : ""
                            }
                          >
                            <MarkdownContent>{block.content}</MarkdownContent>
                          </div>
                        );
                      }

                      return null;
                    })}
                </div>
              ) : (
                <MarkdownContent>
                  {question.explanation || "Sem resolução cadastrada."}
                </MarkdownContent>
              )}
            </div>
          </div>
        ) : null}

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                <MessageSquareWarning className="w-5 h-5 text-amber-700" />
              </div>

              <div>
                <p className="font-bold text-slate-900">Encontrou algum erro?</p>
                <p className="text-sm text-slate-500">
                  Avise o ADM sobre problema no enunciado, gabarito, alternativa, imagem ou resolução.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setReportOpen((prev) => !prev);
                setReportSuccess("");
                setReportError("");
              }}
              className="rounded-2xl"
            >
              <MessageSquareWarning className="w-4 h-4 mr-2" />
              Reportar erro
            </Button>
          </div>

          {reportOpen ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Tipo do problema
                  </label>

                  <select
                    value={reportType}
                    onChange={(event) => setReportType(event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {REPORT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Questão
                  </label>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                    {question.codigo || question.id}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Comentário
                </label>

                <textarea
                  value={reportComment}
                  onChange={(event) => setReportComment(event.target.value)}
                  placeholder="Explique o que está errado. Ex.: gabarito deveria ser B, imagem não aparece, resolução pulou uma etapa..."
                  rows={4}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {reportError ? (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {reportError}
                </div>
              ) : null}

              {reportSuccess ? (
                <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {reportSuccess}
                </div>
              ) : null}

              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setReportOpen(false);
                    setReportError("");
                    setReportSuccess("");
                  }}
                  className="rounded-2xl"
                >
                  Cancelar
                </Button>

                <Button
                  onClick={handleSubmitReport}
                  disabled={reportSending}
                  className="rounded-2xl bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {reportSending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar report
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        {isQuizComplete ? (
          <div className="rounded-3xl border border-violet-200 bg-violet-50 p-5 mb-6">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-violet-600" />
              <div>
                <p className="font-bold text-slate-900">Treino concluído</p>
                <p className="text-sm text-slate-600">
                  Você acertou {score} de {questions.length} questões.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="flex-1 rounded-2xl py-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Questão anterior
          </Button>

          {currentQuestion < questions.length - 1 ? (
            <Button
              onClick={handleNext}
              className="flex-1 rounded-2xl py-6 bg-violet-600 hover:bg-violet-700 text-white"
            >
              Próxima questão
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleRestart}
              className="flex-1 rounded-2xl py-6 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reiniciar treino
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
