import { trpcClient } from "@/lib/trpcClient";

export type ScratchpadPoint = {
  x: number;
  y: number;
  pressure?: number;
  width?: number;
  time?: number;
};

export type ScratchpadBrush = "pen" | "brush" | "highlighter";
export type ScratchpadShape = "line" | "arrow" | "rectangle" | "ellipse" | "triangle";
export type ScratchpadBackground = "grid" | "dots" | "lined" | "blank" | "cartesian";

export type ScratchpadStroke = {
  id: string;
  tool: "pen" | "eraser" | "shape" | "text" | "image" | "meta";
  color: string;
  size: number;
  points: ScratchpadPoint[];
  brush?: ScratchpadBrush;
  shape?: ScratchpadShape;
  opacity?: number;
  text?: string;
  imageData?: string;
  rotation?: number;
  pageId?: string;
  payload?: unknown;
};

export type QuestionNote = {
  id: string;
  user_id: string;
  question_id: string;
  strokes: ScratchpadStroke[];
  canvas_width: number;
  canvas_height: number;
  background_type: ScratchpadBackground | string;
  title: string | null;
  created_at: string;
  updated_at: string;
};

export async function getQuestionNote({
  questionId,
}: {
  userId: string;
  questionId: string;
}) {
  const note = await trpcClient.notes.getQuestionNote.query({ questionId });

  return note as QuestionNote | null;
}

export async function saveQuestionNote({
  questionId,
  strokes,
  canvasWidth,
  canvasHeight,
  backgroundType = "grid",
  title,
}: {
  userId: string;
  questionId: string;
  strokes: ScratchpadStroke[];
  canvasWidth: number;
  canvasHeight: number;
  backgroundType?: ScratchpadBackground;
  title?: string | null;
}) {
  const note = await trpcClient.notes.saveQuestionNote.mutate({
    questionId,
    strokes,
    canvasWidth,
    canvasHeight,
    backgroundType,
    title,
  });

  return note as QuestionNote;
}

export async function deleteQuestionNote({
  questionId,
}: {
  userId: string;
  questionId: string;
}) {
  await trpcClient.notes.deleteQuestionNote.mutate({ questionId });
}
