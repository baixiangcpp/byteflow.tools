export type SpreadsheetSafeCsvCell = string | number | boolean | bigint | null | undefined

type SpreadsheetSafeCsvOptions = {
    delimiter?: string
    lineEnding?: "\n" | "\r\n"
}

const FORMULA_TRIGGERS = new Set(["=", "+", "-", "@"])
const LEADING_IGNORABLE_CHARACTER = /[\p{White_Space}\p{Cc}\p{Cf}]/u

function hasDangerousSpreadsheetPrefix(value: string): boolean {
    for (const character of value) {
        // Tabs and carriage returns are formula triggers in spreadsheet imports.
        if (character === "\t" || character === "\r") return true
        if (LEADING_IGNORABLE_CHARACTER.test(character)) continue
        return FORMULA_TRIGGERS.has(character)
    }
    return false
}

/**
 * Prefix formula-like string cells with an apostrophe before CSV quoting.
 * Typed numeric cells bypass this policy, so negative numbers stay numeric.
 * Protected strings intentionally do not round-trip byte-for-byte.
 */
export function neutralizeSpreadsheetFormula(value: string): string {
    return hasDangerousSpreadsheetPrefix(value) ? `'${value}` : value
}

export function serializeSpreadsheetSafeCsvCell(
    cell: SpreadsheetSafeCsvCell,
    delimiter = ",",
): string {
    if (!delimiter) throw new Error("CSV delimiter must not be empty.")

    const value = typeof cell === "string"
        ? neutralizeSpreadsheetFormula(cell)
        : cell === null || cell === undefined
            ? ""
            : String(cell)

    if (value.includes('"') || value.includes(delimiter) || value.includes("\n") || value.includes("\r")) {
        return `"${value.replace(/"/g, '""')}"`
    }
    return value
}

export function serializeSpreadsheetSafeCsv(
    rows: readonly (readonly SpreadsheetSafeCsvCell[])[],
    options: SpreadsheetSafeCsvOptions = {},
): string {
    const delimiter = options.delimiter ?? ","
    const lineEnding = options.lineEnding ?? "\n"

    return rows
        .map((row) => row.map((cell) => serializeSpreadsheetSafeCsvCell(cell, delimiter)).join(delimiter))
        .join(lineEnding)
}
