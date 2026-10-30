import { describe, expect, it } from "vitest";
import { displayDay, presetPeriod, shiftDay, validPeriod } from "../../client/src/lib/affiliatePeriod";
describe("affiliate reporting UTC calendar boundaries", () => {
 it("includes the final day through an exclusive API boundary", () => { expect(shiftDay("2026-12-31",1)).toBe("2027-01-01"); expect(shiftDay("2024-02-29",1)).toBe("2024-03-01"); });
 it("handles previous month and year without host timezone dependence", () => {expect(presetPeriod("previous",new Date("2026-01-01T01:00:00Z"))).toEqual({from:"2025-12-01",end:"2025-12-31"}); expect(presetPeriod("last30",new Date("2026-01-01T01:00:00Z"))).toEqual({from:"2025-12-03",end:"2026-01-01"});});
 it("accepts one day and 366 inclusive days, rejects empty, reversed, excessive or invalid periods", () => {expect(validPeriod("2026-10-29","2026-10-29")).toBe(true);expect(validPeriod("2024-01-01","2024-12-31")).toBe(true); for(const [a,b] of [["",""],["2026-11-01","2026-10-31"],["2024-01-01","2025-01-01"],["2026-02-30","2026-03-01"]])expect(validPeriod(a,b)).toBe(false);});
 it("presents UTC days in Brazilian format", () => expect(displayDay("2026-10-29")).toBe("29/10/2026"));
});
