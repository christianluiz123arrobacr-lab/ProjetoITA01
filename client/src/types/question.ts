export type QuestionOption = {
  id: string;
  label: string;
  text?: string;
  imageUrl?: string;
};

export type ExplanationBlock = {
  id?: string;
  type: "texto" | "latex" | "imagem";
  content?: string;
  imageUrl?: string;
  order: number;
};

export type QuestionSubtopicsByTopic = {
  topic: string;
  subtopics: string[];
};

export type QuestionSubject = "fisica" | "matematica" | "quimica" | string;

export type QuestionDifficulty =
  | "facil"
  | "medio"
  | "dificil"
  | "muito_dificil";

export type Question = {
  id: string;
  codigo?: string;

  subject: string;
  topic: string;
  topics?: string[];

  subtopic?: string;
  subtopics?: string[];
  subtopicsByTopic?: QuestionSubtopicsByTopic[];

  exam: string;
  year: number;
  institution?: string;

  statement: string;
  statementAfterImage?: string;
  formula?: string;
  imageUrl?: string;

  options: QuestionOption[];
  correctOptionId: string;

  explanation?: string;
  explanationBlocks?: ExplanationBlock[];

  difficulty: QuestionDifficulty | string;

  tags?: string[];
  source?: string;
  isPublished?: boolean;

  createdAt?: string;
  updatedAt?: string;
};
