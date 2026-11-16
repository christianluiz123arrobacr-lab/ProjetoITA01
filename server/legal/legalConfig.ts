/** A configured phone is public, so accept only digits and common separators. */
export function parseLegalContactPhone(
  value: string | undefined
): string | null {
  const text = value?.trim();
  if (!text || !/^\+?[\d ().-]+$/.test(text)) return null;
  const phone = text.replace(/[ ().-]/g, "");
  return /^\+?[1-9]\d{7,14}$/.test(phone) ? phone : null;
}
