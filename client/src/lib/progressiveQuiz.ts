/** A partial transport page is never a completed training session. */
export function progressiveQuizState(
  loaded: number,
  total: number,
  answered: number,
  index: number,
  blocked = false
) {
  return {
    complete: !blocked && total > 0 && loaded === total && answered === total,
    canAdvance: index + 1 < total,
    prefetch: !blocked && loaded < total && index >= Math.max(0, loaded - 5),
  };
}
