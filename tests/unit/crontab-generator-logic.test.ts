import { describe, expect, it } from "vitest"
import { normalizeCronExpression, parseCronParts, updateCronPart, validateCronExpression } from "@/features/tools/crontab-generator/logic"

describe("crontab generator logic", () => {
    it("collapses repeated whitespace without shifting fields", () => {
        expect(parseCronParts("*  *  *  *  *")).toEqual(["*", "*", "*", "*", "*"])
        expect(normalizeCronExpression("*  *  *  *  *")).toBe("* * * * *")
    })

    it("preserves and edits six-field cron expressions with seconds", () => {
        expect(validateCronExpression("30 0 9 * * 1", "invalid")).toEqual({
            ok: true,
            parts: ["30", "0", "9", "*", "*", "1"],
            hasSeconds: true,
            normalized: "30 0 9 * * 1",
        })
        expect(updateCronPart("30 0 9 * * 1", 1, "15")).toBe("30 15 9 * * 1")
    })

    it("rejects out-of-range numeric fields with field-specific errors", () => {
        expect(validateCronExpression("90 * * * *", "invalid")).toEqual({
            ok: false,
            error: "Invalid cron minute field. Expected 0-59, got 90.",
        })
        expect(validateCronExpression("0 25 * * *", "invalid")).toEqual({
            ok: false,
            error: "Invalid cron hour field. Expected 0-23, got 25.",
        })
    })
})
