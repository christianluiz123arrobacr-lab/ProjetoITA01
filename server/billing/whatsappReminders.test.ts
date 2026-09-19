import { describe, expect, it } from "vitest";
import { isWhatsAppRemindersEnabled, reminderForDueDate } from "./whatsappReminders";

describe("WhatsApp billing reminders", () => {
  const now = new Date("2026-08-28T12:00:00.000Z");
  it("selects only the three due-date windows", () => {
    expect(reminderForDueDate(new Date("2026-08-30T12:00:00.000Z"), now)).toBe("expires_in_2_days");
    expect(reminderForDueDate(new Date("2026-08-29T12:00:00.000Z"), now)).toBe("expires_in_1_day");
    expect(reminderForDueDate(new Date("2026-08-28T12:00:00.000Z"), now)).toBe("expired_today");
    expect(reminderForDueDate(new Date("2026-09-01T12:00:00.000Z"), now)).toBeNull();
  });
  it("requires the exact enabled flag, keeping all other environments dry-run", () => {
    const previous = process.env.WHATSAPP_REMINDERS_ENABLED;
    process.env.WHATSAPP_REMINDERS_ENABLED = "false";
    expect(isWhatsAppRemindersEnabled()).toBe(false);
    process.env.WHATSAPP_REMINDERS_ENABLED = "true";
    expect(isWhatsAppRemindersEnabled()).toBe(true);
    process.env.WHATSAPP_REMINDERS_ENABLED = previous;
  });
});
