/** Reports use UTC calendar days; the API end date is exclusive. */
export function shiftDay(day: string, amount: number) {
  const date = new Date(day + "T00:00:00Z");
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}
export function validPeriod(from: string, end: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(end))
    return false;
  const start = Date.parse(from + "T00:00:00Z"),
    finish = Date.parse(end + "T00:00:00Z");
  if (!Number.isFinite(start) || !Number.isFinite(finish)) return false;
  return (
    new Date(start).toISOString().slice(0, 10) === from &&
    new Date(finish).toISOString().slice(0, 10) === end &&
    finish >= start &&
    (finish - start) / 86400000 < 366
  );
}
export function presetPeriod(preset: string, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const first = today.slice(0, 7) + "-01";
  if (preset === "month") return { from: first, end: today };
  if (preset === "previous")
    return {
      from: shiftDay(first, -1).slice(0, 7) + "-01",
      end: shiftDay(first, -1),
    };
  return { from: shiftDay(today, -29), end: today };
}
export function displayDay(day: string) {
  return new Date(day.slice(0, 10) + "T00:00:00Z").toLocaleDateString("pt-BR", {
    timeZone: "UTC",
  });
}
