export type StudyCanvasPointer = { pointerId: number; pointerType: string };

/** Multitouch is reserved for navigation and must never become canvas ink. */
export function isMultitouchGesture(
  pointers: Iterable<StudyCanvasPointer>
): boolean {
  let touches = 0;
  for (const pointer of Array.from(pointers)) {
    if (pointer.pointerType === "touch" && ++touches >= 2) return true;
  }
  return false;
}

export function shouldCancelInkForPointerDown(
  activePointers: Iterable<StudyCanvasPointer>,
  incoming: StudyCanvasPointer
): boolean {
  return isMultitouchGesture([...Array.from(activePointers), incoming]);
}

export function shouldNavigateInsteadOfDraw(pointerType: string, lockTouchToPan: boolean, drawWithTouch: boolean) {
  return pointerType === "touch" && (lockTouchToPan || !drawWithTouch);
}
