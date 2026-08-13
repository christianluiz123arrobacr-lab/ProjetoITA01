import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InteractiveQuiz } from "@/components/InteractiveQuiz";
import { exportQuestionsForPdf, getQuestions } from "@/services/questions.service";
import { buildPdfFilterSummary } from "@/lib/questionPdfLayout";
import type { QuestionPdfFilters } from "@shared/questionPdf";
import { trpc } from "@/lib/trpc";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import type { Question } from "@/types/question";
import {
  ArrowLeft,
  Zap,
  BarChart3,
  BookMarked,
  Filter,
  BrainCircuit,
  ChevronDown,
  Building2,
  CalendarDays,
  GraduationCap,
  FolderOpen,
  Tags,
  Gauge,
  X,
  ListFilter,
  Search,
  FileDown,
  LoaderCircle,
  NotebookPen,
} from "lucide-react";

function normalizeText(value?: string | null) {
  return (value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function parseVetFiltersFromUrl() {
  if (typeof window === "undefined") {
    return {
      subjects: [] as string[],
      institution: "",
      topics: [] as string[],
      block: "",
    };
  }

  const params = new URLSearchParams(window.location.search);

  const subject = params.get("subject") || "";
  const institution = params.get("institution") || "";
  const block = params.get("block") || "";
  const topicsParam = params.get("topics") || "";

  const topics = topicsParam
    .split(",")
    .map((item) => decodeURIComponent(item))
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    subjects: subject ? [subject] : [],
    institution,
    topics,
    block,
  };
}

function toggleValue(list: string[], value: string) {
  const normalized = normalizeText(value);

  return list.some((item) => normalizeText(item) === normalized)
    ? list.filter((item) => normalizeText(item) !== normalized)
    : [...list, value];
}

function matchesMulti(
  value: string | number | null | undefined,
  selected: string[]
) {
  if (selected.length === 0) return true;

  const normalizedValue = normalizeText(String(value ?? ""));

  return selected.some((item) => normalizeText(item) === normalizedValue);
}

function matchesMultiList(values: string[], selected: string[]) {
  if (selected.length === 0) return true;

  const normalizedValues = values.map((value) => normalizeText(value));

  return selected.some((item) => normalizedValues.includes(normalizeText(item)));
}

function getQuestionTopics(question: Question) {
  if (Array.isArray(question.topics) && question.topics.length > 0) {
    return question.topics.filter(Boolean);
  }

  return question.topic ? [question.topic] : [];
}

function getQuestionSubtopics(question: Question) {
  if (Array.isArray(question.subtopics) && question.subtopics.length > 0) {
    return question.subtopics.filter(Boolean);
  }

  return question.subtopic ? [question.subtopic] : [];
}

function getQuestionSubtopicsForTopics(
  question: Question,
  selectedTopics: string[]
) {
  if (selectedTopics.length === 0) {
    return getQuestionSubtopics(question);
  }

  const grouped = question.subtopicsByTopic ?? [];

  if (grouped.length === 0) {
    return getQuestionSubtopics(question);
  }

  const selectedNormalized = selectedTopics.map((topic) =>
    normalizeText(topic)
  );

  const subtopics = grouped
    .filter((item) => selectedNormalized.includes(normalizeText(item.topic)))
    .flatMap((item) => item.subtopics)
    .filter(Boolean);

  return Array.from(new Set(subtopics));
}

function formatSubjectLabel(value: string) {
  const normalized = normalizeText(value);

  if (normalized === "fisica") return "Física";
  if (normalized === "matematica") return "Matemática";
  if (normalized === "quimica") return "Química";

  return value;
}

function formatDifficultyLabel(value: string) {
  const normalized = normalizeText(value);

  if (normalized === "facil") return "Fácil";
  if (normalized === "medio") return "Médio";
  if (normalized === "dificil") return "Difícil";

  return value;
}

function sortSubjects(values: string[]) {
  const order: Record<string, number> = {
    fisica: 1,
    matematica: 2,
    quimica: 3,
  };

  return [...values].sort(
    (a, b) =>
      (order[normalizeText(a)] ?? 99) - (order[normalizeText(b)] ?? 99) ||
      a.localeCompare(b, "pt-BR")
  );
}

function sortDifficulties(values: string[]) {
  const order: Record<string, number> = {
    facil: 1,
    medio: 2,
    dificil: 3,
  };

  return [...values].sort(
    (a, b) =>
      (order[normalizeText(a)] ?? 99) - (order[normalizeText(b)] ?? 99) ||
      a.localeCompare(b, "pt-BR")
  );
}

type PracticeStatusFilter =
  | "all"
  | "unanswered"
  | "answered"
  | "correct"
  | "wrong";

type UserQuestionAttemptStatus = {
  attempted: boolean;
  latestIsCorrect: boolean | null;
  attempts: number;
  lastAnsweredAt?: string | null;
};

type UserAttemptSummaryRow = {
  question_id: string | null;
  is_correct: boolean | null;
  answered_at?: string | null;
};

const PRACTICE_STATUS_OPTIONS: { value: PracticeStatusFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "unanswered", label: "Não feitas" },
  { value: "answered", label: "Já feitas" },
  { value: "correct", label: "Acertei por último" },
  { value: "wrong", label: "Errei por último" },
];

function formatPracticeStatusLabel(value: PracticeStatusFilter) {
  return (
    PRACTICE_STATUS_OPTIONS.find((option) => option.value === value)?.label ??
    "Todas"
  );
}

function matchesPracticeStatus(
  questionId: string,
  status: PracticeStatusFilter,
  statusByQuestionId: Record<string, UserQuestionAttemptStatus>,
  hasUser: boolean
) {
  if (status === "all") return true;

  if (!hasUser) return false;

  const item = statusByQuestionId[questionId];
  const attempted = !!item?.attempted;

  if (status === "unanswered") return !attempted;
  if (status === "answered") return attempted;
  if (status === "correct") return attempted && item.latestIsCorrect === true;
  if (status === "wrong") return attempted && item.latestIsCorrect === false;

  return true;
}

function areNormalizedListsEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;

  return a.every((item, index) => normalizeText(item) === normalizeText(b[index]));
}

function keepOnlyAvailableSelected(selected: string[], available: string[]) {
  const availableNormalized = available.map((item) => normalizeText(item));

  const filtered = selected.filter((item) =>
    availableNormalized.includes(normalizeText(item))
  );

  return areNormalizedListsEqual(selected, filtered) ? selected : filtered;
}

function getMultiSelectLabel(
  selected: string[],
  placeholder: string,
  formatter?: (value: string) => string
) {
  if (selected.length === 0) return placeholder;

  if (selected.length === 1) {
    return formatter ? formatter(selected[0]) : selected[0];
  }

  return `${selected.length} selecionados`;
}

function questionMatchesSearch(question: Question, searchTerm: string) {
  const term = normalizeText(searchTerm);

  if (!term) return true;

  const searchableParts = [
    question.codigo,
    question.id,
    question.statement,
    question.statementAfterImage,
    question.exam,
    question.institution,
    String(question.year ?? ""),
    question.subject,
    formatSubjectLabel(question.subject),
    question.difficulty,
    formatDifficultyLabel(String(question.difficulty ?? "")),
    ...getQuestionTopics(question),
    ...getQuestionSubtopics(question),
  ];

  return searchableParts.some((part) => normalizeText(part).includes(term));
}

type MultiSelectDropdownProps = {
  title: string;
  index?: number;
  items: string[];
  selected: string[];
  onToggle: (value: string) => void;
  placeholder: string;
  emptyMessage: string;
  formatter?: (value: string) => string;
  icon?: ComponentType<{ className?: string }>;
};

function MultiSelectDropdown({
  title,
  index,
  items,
  selected,
  onToggle,
  placeholder,
  emptyMessage,
  formatter,
  icon: Icon,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current) return;

      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        <span className="inline-flex items-center gap-2">
          {Icon ? <Icon className="w-4 h-4 text-slate-500" /> : null}
          {index ? `${index}. ${title}` : title}
        </span>
      </label>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-left text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 flex items-center justify-between"
      >
        <span className="truncate">
          {getMultiSelectLabel(selected, placeholder, formatter)}
        </span>

        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <div className="absolute z-30 mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-xl p-3 max-h-64 overflow-y-auto">
          {items.length > 0 ? (
            <div className="space-y-2">
              {items.map((item) => {
                const checked = selected.some(
                  (value) => normalizeText(value) === normalizeText(item)
                );

                return (
                  <label
                    key={item}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-50 cursor-pointer transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(item)}
                      className="h-4 w-4 rounded border-slate-300"
                    />

                    <span className="text-sm text-slate-700">
                      {formatter ? formatter(item) : item}
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500 px-2 py-2">{emptyMessage}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

type ActiveFilterChipProps = {
  label: string;
  onRemove: () => void;
};

function ActiveFilterChip({ label, onRemove }: ActiveFilterChipProps) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 text-violet-700 px-3 py-1.5 text-xs font-semibold hover:bg-violet-100 transition-colors"
    >
      <span>{label}</span>
      <X className="w-3.5 h-3.5" />
    </button>
  );
}

export default function QuestionBankPage() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const initialVetFilters = useMemo(() => parseVetFiltersFromUrl(), []);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedInstitutions, setSelectedInstitutions] = useState<string[]>(
    initialVetFilters.institution ? [initialVetFilters.institution] : []
  );
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    initialVetFilters.subjects
  );
  const [selectedTopics, setSelectedTopics] = useState<string[]>(
    initialVetFilters.topics
  );
  const [selectedSubtopics, setSelectedSubtopics] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedPracticeStatus, setSelectedPracticeStatus] =
    useState<PracticeStatusFilter>("all");
  const [userQuestionStatus, setUserQuestionStatus] = useState<
    Record<string, UserQuestionAttemptStatus>
  >({});
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfMessage, setPdfMessage] = useState("");
  const [notebookDialogOpen, setNotebookDialogOpen] = useState(false);
  const [notebookName, setNotebookName] = useState("Lista de exercícios");
  const [notebookPaper, setNotebookPaper] = useState<"a5" | "a4" | "a3" | "infinite">("a4");
  const createNotebook = trpc.notebooks.create.useMutation();

  async function handleCreateLinkedNotebook() {
    const name = notebookName.trim();
    if (!name || filteredQuestions.length === 0) return;
    const result = await createNotebook.mutateAsync({ name, paper: { size: notebookPaper, lined: false }, questionIds: filteredQuestions.slice(0, 100).map(question => question.id) });
    window.location.assign(`/caderno/${result.id}`);
  }

  const [vetTopics, setVetTopics] = useState<string[]>(initialVetFilters.topics);
  const [vetBlock, setVetBlock] = useState<string>(initialVetFilters.block);

  const hasVetFilter = vetTopics.length > 0;

  const effectiveTopics =
    selectedTopics.length > 0 ? selectedTopics : vetTopics;

  const availableInstitutions = useMemo(() => {
    return Array.from(
      new Set(
        questions
          .map((q) => q.institution?.trim())
          .filter(
            (institution): institution is string =>
              !!institution && institution !== ""
          )
      )
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [questions]);

  const questionsForYears = useMemo(() => {
    return questions.filter((q) =>
      matchesMulti(q.institution, selectedInstitutions)
    );
  }, [questions, selectedInstitutions]);

  const availableYears = useMemo(() => {
    return Array.from(
      new Set(questionsForYears.map((q) => String(q.year)).filter(Boolean))
    ).sort((a, b) => Number(b) - Number(a));
  }, [questionsForYears]);

  const questionsForSubjects = useMemo(() => {
    return questions.filter((q) => {
      const matchesInstitution = matchesMulti(
        q.institution,
        selectedInstitutions
      );
      const matchesYear = matchesMulti(String(q.year), selectedYears);

      return matchesInstitution && matchesYear;
    });
  }, [questions, selectedInstitutions, selectedYears]);

  const availableSubjects = useMemo(() => {
    return sortSubjects(
      Array.from(
        new Set(questionsForSubjects.map((q) => q.subject).filter(Boolean))
      )
    );
  }, [questionsForSubjects]);

  const questionsForTopics = useMemo(() => {
    return questions.filter((q) => {
      const matchesInstitution = matchesMulti(
        q.institution,
        selectedInstitutions
      );
      const matchesYear = matchesMulti(String(q.year), selectedYears);
      const matchesSubject = matchesMulti(q.subject, selectedSubjects);

      return matchesInstitution && matchesYear && matchesSubject;
    });
  }, [questions, selectedInstitutions, selectedYears, selectedSubjects]);

  const availableTopics = useMemo(() => {
    return Array.from(
      new Set(
        questionsForTopics
          .flatMap((q) => getQuestionTopics(q))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [questionsForTopics]);

  const questionsForSubtopics = useMemo(() => {
    return questions.filter((q) => {
      const matchesInstitution = matchesMulti(
        q.institution,
        selectedInstitutions
      );
      const matchesYear = matchesMulti(String(q.year), selectedYears);
      const matchesSubject = matchesMulti(q.subject, selectedSubjects);
      const matchesTopic = matchesMultiList(
        getQuestionTopics(q),
        effectiveTopics
      );

      return matchesInstitution && matchesYear && matchesSubject && matchesTopic;
    });
  }, [
    questions,
    selectedInstitutions,
    selectedYears,
    selectedSubjects,
    effectiveTopics,
  ]);

  const availableSubtopics = useMemo(() => {
    return Array.from(
      new Set(
        questionsForSubtopics
          .flatMap((q) => getQuestionSubtopicsForTopics(q, effectiveTopics))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [questionsForSubtopics, effectiveTopics]);

  const questionsForDifficulties = useMemo(() => {
    return questions.filter((q) => {
      const matchesInstitution = matchesMulti(
        q.institution,
        selectedInstitutions
      );
      const matchesYear = matchesMulti(String(q.year), selectedYears);
      const matchesSubject = matchesMulti(q.subject, selectedSubjects);
      const matchesTopic = matchesMultiList(
        getQuestionTopics(q),
        effectiveTopics
      );
      const matchesSubtopic = matchesMultiList(
        getQuestionSubtopicsForTopics(q, effectiveTopics),
        selectedSubtopics
      );

      return (
        matchesInstitution &&
        matchesYear &&
        matchesSubject &&
        matchesTopic &&
        matchesSubtopic
      );
    });
  }, [
    questions,
    selectedInstitutions,
    selectedYears,
    selectedSubjects,
    effectiveTopics,
    selectedSubtopics,
  ]);

  const availableDifficulties = useMemo(() => {
    return sortDifficulties(
      Array.from(
        new Set(
          questionsForDifficulties
            .map((q) => String(q.difficulty ?? ""))
            .filter(Boolean)
        )
      )
    );
  }, [questionsForDifficulties]);

  useEffect(() => {
    if (!questions.length) return;
    setSelectedYears((prev) => keepOnlyAvailableSelected(prev, availableYears));
  }, [availableYears, questions.length]);

  useEffect(() => {
    if (!questions.length) return;
    setSelectedSubjects((prev) =>
      keepOnlyAvailableSelected(prev, availableSubjects)
    );
  }, [availableSubjects, questions.length]);

  useEffect(() => {
    if (!questions.length) return;
    setSelectedTopics((prev) =>
      keepOnlyAvailableSelected(prev, availableTopics)
    );
  }, [availableTopics, questions.length]);

  useEffect(() => {
    if (!questions.length) return;
    setSelectedSubtopics((prev) =>
      keepOnlyAvailableSelected(prev, availableSubtopics)
    );
  }, [availableSubtopics, questions.length]);

  useEffect(() => {
    if (!questions.length) return;
    setSelectedDifficulties((prev) =>
      keepOnlyAvailableSelected(prev, availableDifficulties)
    );
  }, [availableDifficulties, questions.length]);

  const totalSubjects = useMemo(
    () => new Set(questions.map((q) => q.subject).filter(Boolean)).size,
    [questions]
  );

  const totalDifficulties = useMemo(
    () => new Set(questions.map((q) => q.difficulty).filter(Boolean)).size,
    [questions]
  );

  const practiceStats = useMemo(() => {
    const total = questions.length;
    const answered = questions.filter((q) => userQuestionStatus[q.id]?.attempted)
      .length;
    const correct = questions.filter(
      (q) => userQuestionStatus[q.id]?.latestIsCorrect === true
    ).length;
    const wrong = questions.filter(
      (q) => userQuestionStatus[q.id]?.latestIsCorrect === false
    ).length;

    return {
      total,
      answered,
      unanswered: Math.max(0, total - answered),
      correct,
      wrong,
    };
  }, [questions, userQuestionStatus]);

  const subjectStats = useMemo(() => {
    const labels: Record<string, string> = {
      fisica: "Física",
      matematica: "Matemática",
      quimica: "Química",
    };

    const counts = questions.reduce<Record<string, number>>((acc, q) => {
      if (!q.subject) return acc;
      acc[q.subject] = (acc[q.subject] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([key, count]) => ({
        key,
        label: labels[key] ?? key,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [questions]);

  const difficultyStats = useMemo(() => {
    const labels: Record<string, string> = {
      facil: "Fácil",
      medio: "Médio",
      dificil: "Difícil",
    };

    const counts = questions.reduce<Record<string, number>>((acc, q) => {
      if (!q.difficulty) return acc;
      acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
      return acc;
    }, {});

    const order: Record<string, number> = {
      facil: 1,
      medio: 2,
      dificil: 3,
    };

    return Object.entries(counts)
      .map(([key, count]) => ({
        key,
        label: labels[key] ?? key,
        count,
      }))
      .sort((a, b) => (order[a.key] ?? 99) - (order[b.key] ?? 99));
  }, [questions]);

  const filteredDifficultyStats = useMemo(() => {
    const counts = filteredQuestions.reduce<Record<string, number>>((acc, q) => {
      const difficulty = String(q.difficulty ?? "");
      if (!difficulty) return acc;
      acc[difficulty] = (acc[difficulty] || 0) + 1;
      return acc;
    }, {});

    return [
      {
        key: "facil",
        label: "Fácil",
        count: counts.facil || 0,
        colorClass: "bg-emerald-500",
      },
      {
        key: "medio",
        label: "Médio",
        count: counts.medio || 0,
        colorClass: "bg-amber-500",
      },
      {
        key: "dificil",
        label: "Difícil",
        count: counts.dificil || 0,
        colorClass: "bg-rose-500",
      },
    ];
  }, [filteredQuestions]);

  const activeFilterChips = useMemo(() => {
    const chips: Array<{
      key: string;
      label: string;
      onRemove: () => void;
    }> = [];

    if (searchTerm.trim()) {
      chips.push({
        key: "search",
        label: `Busca: ${searchTerm.trim()}`,
        onRemove: () => setSearchTerm(""),
      });
    }

    selectedInstitutions.forEach((item) => {
      chips.push({
        key: `institution-${item}`,
        label: item,
        onRemove: () =>
          setSelectedInstitutions((prev) =>
            prev.filter((value) => normalizeText(value) !== normalizeText(item))
          ),
      });
    });

    selectedYears.forEach((item) => {
      chips.push({
        key: `year-${item}`,
        label: item,
        onRemove: () =>
          setSelectedYears((prev) =>
            prev.filter((value) => normalizeText(value) !== normalizeText(item))
          ),
      });
    });

    selectedSubjects.forEach((item) => {
      chips.push({
        key: `subject-${item}`,
        label: formatSubjectLabel(item),
        onRemove: () =>
          setSelectedSubjects((prev) =>
            prev.filter((value) => normalizeText(value) !== normalizeText(item))
          ),
      });
    });

    selectedTopics.forEach((item) => {
      chips.push({
        key: `topic-${item}`,
        label: item,
        onRemove: () =>
          setSelectedTopics((prev) =>
            prev.filter((value) => normalizeText(value) !== normalizeText(item))
          ),
      });
    });

    selectedSubtopics.forEach((item) => {
      chips.push({
        key: `subtopic-${item}`,
        label: item,
        onRemove: () =>
          setSelectedSubtopics((prev) =>
            prev.filter((value) => normalizeText(value) !== normalizeText(item))
          ),
      });
    });

    selectedDifficulties.forEach((item) => {
      chips.push({
        key: `difficulty-${item}`,
        label: formatDifficultyLabel(item),
        onRemove: () =>
          setSelectedDifficulties((prev) =>
            prev.filter((value) => normalizeText(value) !== normalizeText(item))
          ),
      });
    });

    if (selectedPracticeStatus !== "all") {
      chips.push({
        key: "practice-status",
        label: `Status: ${formatPracticeStatusLabel(selectedPracticeStatus)}`,
        onRemove: () => setSelectedPracticeStatus("all"),
      });
    }

    return chips;
  }, [
    searchTerm,
    selectedInstitutions,
    selectedYears,
    selectedSubjects,
    selectedTopics,
    selectedSubtopics,
    selectedDifficulties,
    selectedPracticeStatus,
  ]);

  const trpcUtils = trpc.useUtils();

  useEffect(() => {
    async function loadQuestions() {
      const data = await getQuestions();
      setQuestions(data);
      setFilteredQuestions(data);
    }

    loadQuestions();
  }, []);

  useEffect(() => {
    async function loadUserAttempts() {
      if (authLoading) return;

      if (!user?.id) {
        setUserQuestionStatus({});
        setAttemptsLoading(false);
        return;
      }

      setAttemptsLoading(true);

      try {
        const data = await trpcUtils.quiz.getMyAttempts.fetch({ summary: true });

        const nextStatus: Record<string, UserQuestionAttemptStatus> = {};

        ((data as unknown as UserAttemptSummaryRow[]) || []).forEach((attempt) => {
        if (!attempt.question_id) return;

        const current = nextStatus[attempt.question_id];

        if (!current) {
          nextStatus[attempt.question_id] = {
            attempted: true,
            latestIsCorrect: attempt.is_correct ?? false,
            attempts: 1,
            lastAnsweredAt: attempt.answered_at ?? null,
          };
          return;
        }

        current.attempts += 1;
      });

        setUserQuestionStatus(nextStatus);
      } catch (error) {
        console.error("Erro ao carregar tentativas do usuário:", error);
        setUserQuestionStatus({});
      } finally {
        setAttemptsLoading(false);
      }
    }

    loadUserAttempts();
  }, [authLoading, trpcUtils, user?.id]);

  useEffect(() => {
    let filtered = questions;

    filtered = filtered.filter((q) => questionMatchesSearch(q, searchTerm));

    filtered = filtered.filter((q) =>
      matchesMulti(q.institution, selectedInstitutions)
    );

    filtered = filtered.filter((q) =>
      matchesMulti(String(q.year), selectedYears)
    );

    filtered = filtered.filter((q) =>
      matchesMulti(q.subject, selectedSubjects)
    );

    if (effectiveTopics.length > 0) {
      filtered = filtered.filter((q) =>
        matchesMultiList(getQuestionTopics(q), effectiveTopics)
      );
    }

    filtered = filtered.filter((q) =>
      matchesMultiList(
        getQuestionSubtopicsForTopics(q, effectiveTopics),
        selectedSubtopics
      )
    );

    filtered = filtered.filter((q) =>
      matchesMulti(q.difficulty, selectedDifficulties)
    );

    filtered = filtered.filter((q) =>
      matchesPracticeStatus(
        q.id,
        selectedPracticeStatus,
        userQuestionStatus,
        !!user?.id
      )
    );

    setFilteredQuestions(filtered);
  }, [
    questions,
    searchTerm,
    selectedInstitutions,
    selectedYears,
    selectedSubjects,
    effectiveTopics,
    selectedSubtopics,
    selectedDifficulties,
    selectedPracticeStatus,
    userQuestionStatus,
    user?.id,
  ]);

  function clearAllFilters() {
    setSearchTerm("");
    setSelectedInstitutions([]);
    setSelectedYears([]);
    setSelectedSubjects([]);
    setSelectedTopics([]);
    setSelectedSubtopics([]);
    setSelectedDifficulties([]);
    setSelectedPracticeStatus("all");
    setVetTopics([]);
    setVetBlock("");
  }

  function clearVetFilterOnly() {
    setVetTopics([]);
    setVetBlock("");
  }

  async function handleExportPdf() {
    if (pdfGenerating || filteredQuestions.length === 0) return;
    const filters: QuestionPdfFilters = {
      search: searchTerm.trim(),
      institutions: selectedInstitutions,
      years: selectedYears.map(Number).filter(Number.isFinite),
      subjects: selectedSubjects,
      topics: effectiveTopics,
      subtopics: selectedSubtopics,
      difficulties: selectedDifficulties,
      practiceStatus: selectedPracticeStatus,
    };
    setPdfGenerating(true);
    setPdfMessage("");
    try {
      const result = await exportQuestionsForPdf(filters);
      if (!result.questions.length) {
        setPdfMessage("Nenhuma questão disponível para os filtros e o seu acesso atual.");
        return;
      }
      const summary = buildPdfFilterSummary(filters);
      const { generateQuestionPdf } = await import("@/lib/questionPdfGenerator");
      const generated = await generateQuestionPdf({ questions: result.questions, filterSummary: summary });
      setPdfMessage(result.truncated
        ? `PDF concluído com ${generated.questions} questões (limite seguro de ${result.limit} por arquivo).`
        : `PDF concluído com ${generated.questions} questões.`);
    } catch (error) {
      console.error("Falha ao gerar lista de questões em PDF", { name: error instanceof Error ? error.name : "UnknownError" });
      const message = error instanceof Error ? error.message : "";
      const safeMessage = [
        "assinatura",
        "acesso",
        "sessão",
        "limite de requisições",
        "Muitas tentativas",
        "buscar as questões",
        "aplicar o filtro",
        "navegador não conseguiu preparar",
        "Nenhuma questão",
      ].some(fragment => message.includes(fragment));
      setPdfMessage(safeMessage
        ? message
        : "Não foi possível gerar o PDF neste navegador. Atualize a página e tente novamente.");
    } finally {
      setPdfGenerating(false);
    }
  }

  function handleQuestionAnswered(questionId: string, isCorrect: boolean) {
    setUserQuestionStatus((prev) => ({
      ...prev,
      [questionId]: {
        attempted: true,
        latestIsCorrect: isCorrect,
        attempts: (prev[questionId]?.attempts ?? 0) + 1,
        lastAnsweredAt: new Date().toISOString(),
      },
    }));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-slate-100">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/70">
        <div className="container py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/">
              <a className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </a>
            </Link>

            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center shadow-md shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>

              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight truncate">
                  Banco de Questões
                </h1>

                <p className="text-xs text-slate-500 truncate">
                  Premium • Questões comentadas
                </p>
              </div>
            </div>
          </div>

          <Card className="hidden sm:flex items-center gap-3 px-4 py-2.5 border-violet-100 bg-white shadow-sm rounded-2xl">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
              <BookMarked className="w-5 h-5 text-white" />
            </div>

            <div>
              <p className="text-xl font-bold text-slate-900 leading-none">
                {filteredQuestions.length}
              </p>

              <p className="text-xs font-semibold text-violet-700">
                questões
              </p>
            </div>
          </Card>
        </div>
      </header>

      <main className="container py-8 space-y-7">
        {hasVetFilter ? (
          <section>
            <Card className="p-4 md:p-5 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <BrainCircuit className="w-5 h-5 text-emerald-700" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">
                      Filtro vindo do VET
                    </h3>

                    <p className="text-sm text-slate-600 mb-3">
                      Você abriu o banco com uma recomendação estratégica
                      {vetBlock ? ` para o bloco de ${vetBlock}` : ""}.
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {vetTopics.map((topic) => (
                        <span
                          key={topic}
                          className="px-3 py-1 rounded-full border border-emerald-200 bg-white text-emerald-700 text-sm font-semibold"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={clearVetFilterOnly}
                  className="rounded-xl"
                >
                  Remover filtro do VET
                </Button>
              </div>
            </Card>
          </section>
        ) : null}

        <section className="grid xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
          <div className="space-y-5">
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-4 border-violet-100 bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-violet-100 flex items-center justify-center">
                    <BookMarked className="w-5 h-5 text-violet-600" />
                  </div>

                  <div>
                    <p className="text-2xl font-bold text-slate-900 leading-tight">
                      {questions.length}
                    </p>

                    <p className="text-sm font-semibold text-slate-800">
                      Total de Questões
                    </p>

                    <p className="text-xs text-slate-500">Disponíveis</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 border-blue-100 bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                  </div>

                  <div>
                    <p className="text-2xl font-bold text-slate-900 leading-tight">
                      {totalSubjects}
                    </p>

                    <p className="text-sm font-semibold text-slate-800">
                      Disciplinas
                    </p>

                    <p className="text-xs text-slate-500">Cobertas</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 border-orange-100 bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-orange-100 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-orange-600" />
                  </div>

                  <div>
                    <p className="text-2xl font-bold text-slate-900 leading-tight">
                      {totalDifficulties}
                    </p>

                    <p className="text-sm font-semibold text-slate-800">
                      Dificuldades
                    </p>

                    <p className="text-xs text-slate-500">
                      Fácil, Média, Difícil
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <Card className="p-5 bg-white border-slate-200 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-4">
                  Questões por disciplina
                </h3>

                <div className="space-y-3">
                  {subjectStats.length > 0 ? (
                    subjectStats.map((item) => {
                      const percentage =
                        questions.length > 0
                          ? Math.round((item.count / questions.length) * 100)
                          : 0;

                      return (
                        <div key={item.key}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-sm font-medium text-slate-700">
                              {item.label}
                            </span>

                            <span className="text-xs text-slate-500">
                              {item.count} ({percentage}%)
                            </span>
                          </div>

                          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-violet-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-slate-500">
                      Nenhuma disciplina cadastrada ainda.
                    </p>
                  )}
                </div>
              </Card>

              <Card className="p-5 bg-white border-slate-200 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-4">
                  Questões por nível
                </h3>

                <div className="space-y-3">
                  {difficultyStats.length > 0 ? (
                    difficultyStats.map((item) => {
                      const percentage =
                        questions.length > 0
                          ? Math.round((item.count / questions.length) * 100)
                          : 0;

                      const colorClass =
                        item.key === "facil"
                          ? "bg-emerald-500"
                          : item.key === "medio"
                            ? "bg-amber-500"
                            : "bg-rose-500";

                      return (
                        <div key={item.key}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-sm font-medium text-slate-700">
                              {item.label}
                            </span>

                            <span className="text-xs text-slate-500">
                              {item.count} ({percentage}%)
                            </span>
                          </div>

                          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${colorClass}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-slate-500">
                      Nenhuma dificuldade cadastrada ainda.
                    </p>
                  )}
                </div>
              </Card>
            </div>

            <Card className="p-4 bg-white border-slate-200 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                    <Filter className="w-4 h-4 text-violet-600" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Filtros
                    </h3>

                    <p className="text-xs text-slate-500">
                      Busque por código, palavra-chave ou refine pela ordem estratégica.
                    </p>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <Button
                    variant="outline"
                    onClick={() => { setNotebookName(`${selectedSubjects[0] || effectiveTopics[0] || "Questões"} — Lista de exercícios`); setNotebookDialogOpen(true); }}
                    disabled={filteredQuestions.length === 0 || authLoading || !user}
                    className="rounded-xl h-9 px-4 text-sm"
                  >
                    <NotebookPen className="mr-2 h-4 w-4" />Resolver no Caderno
                  </Button>
                  <Button
                    onClick={handleExportPdf}
                    disabled={pdfGenerating || filteredQuestions.length === 0 || authLoading || !user}
                    className="rounded-xl h-9 px-4 text-sm bg-cyan-600 hover:bg-cyan-700"
                  >
                    {pdfGenerating ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                    {pdfGenerating ? "Gerando PDF..." : "Exportar PDF"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={clearAllFilters}
                    className="rounded-xl h-9 px-4 text-sm"
                  >
                    Limpar filtros
                  </Button>
                </div>
              </div>

              {pdfMessage ? <p role="status" className="mb-4 text-sm font-medium text-slate-600">{pdfMessage}</p> : null}

              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Buscar questão
                </label>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />

                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Código, enunciado, banca, conteúdo ou assunto..."
                    className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                <MultiSelectDropdown
                  title="Instituição"
                  index={1}
                  items={availableInstitutions}
                  selected={selectedInstitutions}
                  onToggle={(value) =>
                    setSelectedInstitutions((prev) => toggleValue(prev, value))
                  }
                  placeholder="Todas"
                  emptyMessage="Nenhuma instituição disponível."
                  icon={Building2}
                />

                <MultiSelectDropdown
                  title="Ano"
                  index={2}
                  items={availableYears}
                  selected={selectedYears}
                  onToggle={(value) =>
                    setSelectedYears((prev) => toggleValue(prev, value))
                  }
                  placeholder="Todos"
                  emptyMessage="Nenhum ano disponível."
                  icon={CalendarDays}
                />

                <MultiSelectDropdown
                  title="Disciplina"
                  index={3}
                  items={availableSubjects}
                  selected={selectedSubjects}
                  onToggle={(value) =>
                    setSelectedSubjects((prev) => toggleValue(prev, value))
                  }
                  placeholder="Todas"
                  emptyMessage="Nenhuma disciplina disponível."
                  formatter={formatSubjectLabel}
                  icon={GraduationCap}
                />

                <MultiSelectDropdown
                  title="Conteúdo"
                  index={4}
                  items={availableTopics}
                  selected={selectedTopics}
                  onToggle={(value) =>
                    setSelectedTopics((prev) => toggleValue(prev, value))
                  }
                  placeholder="Todos"
                  emptyMessage="Nenhum conteúdo disponível."
                  icon={FolderOpen}
                />

                <MultiSelectDropdown
                  title="Assunto"
                  index={5}
                  items={availableSubtopics}
                  selected={selectedSubtopics}
                  onToggle={(value) =>
                    setSelectedSubtopics((prev) => toggleValue(prev, value))
                  }
                  placeholder="Todos"
                  emptyMessage="Nenhum assunto disponível."
                  icon={Tags}
                />

                <MultiSelectDropdown
                  title="Dificuldade"
                  index={6}
                  items={availableDifficulties}
                  selected={selectedDifficulties}
                  onToggle={(value) =>
                    setSelectedDifficulties((prev) => toggleValue(prev, value))
                  }
                  placeholder="Todas"
                  emptyMessage="Nenhuma dificuldade disponível."
                  formatter={formatDifficultyLabel}
                  icon={Gauge}
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    <span className="inline-flex items-center gap-2">
                      <ListFilter className="w-4 h-4 text-slate-500" />
                      7. Status da questão
                    </span>
                  </label>

                  <select
                    value={selectedPracticeStatus}
                    onChange={(event) =>
                      setSelectedPracticeStatus(
                        event.target.value as PracticeStatusFilter
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {PRACTICE_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  {!user?.id ? (
                    <p className="mt-1.5 text-[11px] font-medium text-amber-600">
                      Entre na conta para filtrar questões feitas.
                    </p>
                  ) : attemptsLoading ? (
                    <p className="mt-1.5 text-[11px] font-medium text-slate-500">
                      Carregando seu histórico...
                    </p>
                  ) : (
                    <p className="mt-1.5 text-[11px] font-medium text-slate-500">
                      {practiceStats.answered} feitas • {practiceStats.unanswered} não feitas
                    </p>
                  )}
                </div>
              </div>

              {activeFilterChips.length > 0 ? (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ListFilter className="w-4 h-4 text-slate-500" />

                    <p className="text-xs font-semibold text-slate-700">
                      Filtros ativos
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {activeFilterChips.map((chip) => (
                      <ActiveFilterChip
                        key={chip.key}
                        label={chip.label}
                        onRemove={chip.onRemove}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </Card>
          </div>

          <Card className="p-5 bg-white border-slate-200 shadow-sm xl:sticky xl:top-24">
            <div className="flex items-center gap-2 mb-5">
              <BookMarked className="w-5 h-5 text-violet-600" />

              <h3 className="text-lg font-bold text-slate-900">
                Resumo do filtro
              </h3>
            </div>

            <div className="space-y-3 text-sm text-slate-700 mb-5">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Busca</span>

                <span className="font-semibold text-right">
                  {searchTerm.trim() ? searchTerm.trim() : "—"}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Instituição</span>

                <span className="font-semibold text-right">
                  {selectedInstitutions.length > 0
                    ? selectedInstitutions.join(", ")
                    : "Todas"}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Ano</span>

                <span className="font-semibold text-right">
                  {selectedYears.length > 0
                    ? selectedYears.join(", ")
                    : "Todos"}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Disciplina</span>

                <span className="font-semibold text-right">
                  {selectedSubjects.length > 0
                    ? selectedSubjects.map(formatSubjectLabel).join(", ")
                    : "Todas"}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Conteúdo</span>

                <span className="font-semibold text-right">
                  {effectiveTopics.length > 0
                    ? effectiveTopics.join(", ")
                    : "Todos"}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Assunto</span>

                <span className="font-semibold text-right">
                  {selectedSubtopics.length > 0
                    ? selectedSubtopics.join(", ")
                    : "Todos"}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Dificuldade</span>

                <span className="font-semibold text-right">
                  {selectedDifficulties.length > 0
                    ? selectedDifficulties.map(formatDifficultyLabel).join(", ")
                    : "Todas"}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Status</span>

                <span className="font-semibold text-right">
                  {formatPracticeStatusLabel(selectedPracticeStatus)}
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 mb-5">
              <p className="text-sm text-slate-500 mb-1">
                Questões encontradas
              </p>

              <p className="text-3xl font-bold text-slate-900">
                {filteredQuestions.length}
              </p>
            </div>

            <div className="rounded-2xl bg-violet-50 border border-violet-100 p-4 mb-5">
              <p className="text-sm font-bold text-slate-900 mb-3">
                Seu histórico
              </p>

              {user?.id ? (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500">Já feitas</p>
                    <p className="text-xl font-bold text-violet-700">
                      {practiceStats.answered}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Não feitas</p>
                    <p className="text-xl font-bold text-slate-900">
                      {practiceStats.unanswered}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Última certa</p>
                    <p className="text-xl font-bold text-emerald-700">
                      {practiceStats.correct}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Última errada</p>
                    <p className="text-xl font-bold text-rose-700">
                      {practiceStats.wrong}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-600">
                  Entre na conta para ver questões feitas, acertos e erros.
                </p>
              )}
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-4">
                Questões por dificuldade
              </h4>

              <div className="space-y-4">
                {filteredDifficultyStats.map((item) => {
                  const percentage =
                    filteredQuestions.length > 0
                      ? Math.round(
                          (item.count / filteredQuestions.length) * 100
                        )
                      : 0;

                  return (
                    <div key={item.key}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${item.colorClass}`}
                          />

                          <span className="text-sm text-slate-700">
                            {item.label}
                          </span>
                        </div>

                        <span className="text-sm text-slate-500">
                          {item.count} ({percentage}%)
                        </span>
                      </div>

                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.colorClass}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </section>

        <section>
          {filteredQuestions.length > 0 ? (
            <InteractiveQuiz
              key={[
                searchTerm,
                selectedInstitutions.join("|"),
                selectedYears.join("|"),
                selectedSubjects.join("|"),
                selectedTopics.join("|"),
                selectedSubtopics.join("|"),
                selectedDifficulties.join("|"),
                selectedPracticeStatus,
                vetTopics.join("|"),
              ].join("::")}
              questions={filteredQuestions}
              onQuestionAnswered={handleQuestionAnswered}
            />
          ) : (
            <Card className="p-12 text-center bg-white border-slate-200">
              <p className="text-lg font-semibold text-slate-800 mb-3">
                Nenhuma questão encontrada com os filtros selecionados.
              </p>

              <p className="text-sm text-slate-500 mb-6">
                Tente remover alguns filtros ou voltar ao conjunto completo.
              </p>

              <Button onClick={clearAllFilters}>Limpar Filtros</Button>
            </Card>
          )}
        </section>
      </main>

      {notebookDialogOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="linked-notebook-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 id="linked-notebook-title" className="text-xl font-bold text-slate-900">Resolver no Caderno</h2>
            <p className="mt-1 text-sm text-slate-500">Crie um arquivo ligado às {Math.min(filteredQuestions.length, 100)} questões desta lista.</p>
            <label className="mt-5 block text-sm font-semibold">Nome<input autoFocus maxLength={80} value={notebookName} onChange={event => setNotebookName(event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" /></label>
            <label className="mt-4 block text-sm font-semibold">Papel<select value={notebookPaper} onChange={event => setNotebookPaper(event.target.value as typeof notebookPaper)} className="mt-1 w-full rounded-xl border px-3 py-2"><option value="a5">A5</option><option value="a4">A4</option><option value="a3">A3</option><option value="infinite">Folha infinita</option></select></label>
            {createNotebook.error ? <p className="mt-3 text-sm text-red-600">Não foi possível criar o caderno. Confirme a conexão com o Google Drive.</p> : null}
            <div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={() => setNotebookDialogOpen(false)}>Cancelar</Button><Button onClick={() => void handleCreateLinkedNotebook()} disabled={!notebookName.trim() || createNotebook.isPending}>{createNotebook.isPending ? "Criando..." : "Criar caderno"}</Button></div>
          </div>
        </div>
      ) : null}

      <footer className="bg-slate-900 text-slate-300 py-12 mt-20">
        <div className="container text-center">
          <p className="mb-4">
            © 2026 Domine Exatas. Banco de Questões Premium.
          </p>

          <p className="text-sm text-slate-500">
            Questões comentadas, análise de desempenho e simulados estratégicos.
          </p>
        </div>
      </footer>
    </div>
  );
}
