import { StudyCanvasWorkspace } from "@/components/study-canvas/StudyCanvasWorkspace";

type QuestionScratchpadProps = {
  userId?: string | null;
  questionId: string;
  questionCode?: string | null;
};

/** Question-specific adapter for the shared professional study canvas. */
export function QuestionScratchpad(props: QuestionScratchpadProps) {
  return <StudyCanvasWorkspace {...props} />;
}
