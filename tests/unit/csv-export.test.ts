import { describe, expect, it } from "vitest"
import {
    neutralizeSpreadsheetFormula,
    serializeSpreadsheetSafeCsv,
    serializeSpreadsheetSafeCsvCell,
} from "@/core/files/csv-export"

describe("spreadsheet-safe CSV export", () => {
    it("neutralizes formula triggers after leading whitespace and controls", () => {
        const dangerous = [
            "=1+1",
            "+SUM(1,1)",
            "-1+2",
            "@SUM(1,1)",
            "\t=1+1",
            "\r=1+1",
            " \tplain text",
            "\n\u200b=1+1",
            "\u00a0\u0001@SUM(1,1)",
        ]

        for (const value of dangerous) {
            expect(neutralizeSpreadsheetFormula(value)).toBe(`'${value}`)
        }
    })

    it("does not double-neutralize safe content", () => {
        expect(neutralizeSpreadsheetFormula("'=1+1")).toBe("'=1+1")
        expect(neutralizeSpreadsheetFormula(" '=1+1")).toBe(" '=1+1")
        expect(neutralizeSpreadsheetFormula("total=42")).toBe("total=42")
    })

    it("keeps typed negative numbers numeric while protecting negative strings", () => {
        expect(serializeSpreadsheetSafeCsvCell(-42)).toBe("-42")
        expect(serializeSpreadsheetSafeCsvCell("-42")).toBe("'-42")
        expect(serializeSpreadsheetSafeCsv([
            ["=header", "negative_number", "negative_text"],
            ["=1+1", -42, "-42"],
        ])).toBe("'=header,negative_number,negative_text\n'=1+1,-42,'-42")
    })

    it("applies structural quoting after formula neutralization", () => {
        expect(serializeSpreadsheetSafeCsvCell("+SUM(1,1)"))
            .toBe("\"'+SUM(1,1)\"")
        expect(serializeSpreadsheetSafeCsvCell('line "one"\nline two'))
            .toBe('"line ""one""\nline two"')
        expect(serializeSpreadsheetSafeCsvCell("a;b", ";")).toBe('"a;b"')
    })

    it("rejects an empty delimiter", () => {
        expect(() => serializeSpreadsheetSafeCsvCell("value", "")).toThrow("CSV delimiter must not be empty")
    })
})
