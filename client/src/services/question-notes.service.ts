import { supabase } from "@/lib/supabase";

export type ScratchpadPoint = {
  x: number;
  y: number;
  pressure?: number;
  width?: number;
  time?: number;
};

export type ScratchpadBrush = "pen" | "brush" | "highlighter";
export type ScratchpadShape = "line" | "arrow" | "rectangle" | "ellipse";
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
  userId,
  questionId,
}: {
  userId: string;
  questionId: string;
}) {
  const { data, error } = await supabase
    .from("question_notes")
    .select("*")
    .eq("user_id", userId)
    .eq("question_id", questionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as QuestionNote | null;
}

export async function saveQuestionNote({
  userId,
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
  const payload = {
    user_id: userId,
    question_id: questionId,
    strokes,
    canvas_width: canvasWidth,
    canvas_height: canvasHeight,
    background_type: backgroundType,
    title: title ?? null,
    updated_at: new Date().toISOString(),
  };

  const existing = await getQuestionNote({ userId, questionId });

  if (existing?.id) {
    const { data, error } = await supabase
      .from("question_notes")
      .update(payload)
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data as QuestionNote;
  }

  const { data, error } = await supabase
    .from("question_notes")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as QuestionNote;
}

export async function deleteQuestionNote({
  userId,
  questionId,
}: {
  userId: string;
  questionId: string;
}) {
  const { error } = await supabase
    .from("question_notes")
    .delete()
    .eq("user_id", userId)
    .eq("question_id", questionId);

  if (error) {
    throw error;
  }
}

