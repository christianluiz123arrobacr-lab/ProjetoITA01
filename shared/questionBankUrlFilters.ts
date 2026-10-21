/** URLSearchParams decodes once; never decode its values again. */
export function parseQuestionBankUrlFilters(search: string) {
  const p = new URLSearchParams(search);
  const text = (key: string) => {
    const v = p.get(key)?.trim() ?? "";
    return v.length <= 240 && !/[<>\u0000-\u001f]/.test(v) ? v : "";
  };
  const list = (key: string) =>
    Array.from(
      new Set(
        text(key)
          .split(",")
          .map(v => v.trim())
          .filter(Boolean)
      )
    );
  const years = list("years").filter(v => /^\d{1,4}$/.test(v) && Number(v) > 0);
  const from = Number(text("yearFrom")),
    to = Number(text("yearTo"));
  const interval =
    Number.isInteger(from) &&
    Number.isInteger(to) &&
    from > 0 &&
    to <= 9999 &&
    from <= to
      ? { from, to }
      : undefined;
  return {
    subjects: text("subject") ? [text("subject")] : [],
    institution: text("institution"),
    topics: list("topics"),
    subtopics: list("subtopics"),
    exam: text("exam"),
    years,
    interval,
    block: text("block"),
  };
}
