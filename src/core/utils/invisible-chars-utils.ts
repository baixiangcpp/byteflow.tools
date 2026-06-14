/**
 * Utilities for detecting and cleaning invisible characters, control characters,
 * and confusable whitespace in text.
 */

export type CharacterCategory =
    | "zero-width"
    | "control"
    | "whitespace-non-standard"
    | "bom"
    | "line-ending"
    | "tab"

export interface SuspiciousCharacter {
    index: number // code point index
    line: number // 1-based
    column: number // 1-based, code point-based
    codePoint: number
    char: string
    displayName: string
    category: CharacterCategory
}

export interface TextAnalysis {
    totalChars: number // code points
    totalLines: number
    suspiciousChars: SuspiciousCharacter[]
}

const CHAR_DATABASE: Record<number, { name: string; category: CharacterCategory }> = {
    // Zero-width characters
    0x200b: { name: "Zero Width Space", category: "zero-width" },
    0x200c: { name: "Zero Width Non-Joiner", category: "zero-width" },
    0x200d: { name: "Zero Width Joiner", category: "zero-width" },
    0xfeff: { name: "Zero Width No-Break Space (BOM)", category: "bom" },

    // Non-standard whitespace
    0x00a0: { name: "Non-Breaking Space", category: "whitespace-non-standard" },
    0x3000: { name: "Ideographic Space", category: "whitespace-non-standard" },
    0x2009: { name: "Thin Space", category: "whitespace-non-standard" },
    0x200a: { name: "Hair Space", category: "whitespace-non-standard" },
    0x202f: { name: "Narrow No-Break Space", category: "whitespace-non-standard" },

    // Line endings
    0x000d: { name: "Carriage Return (CR)", category: "line-ending" },
    0x000a: { name: "Line Feed (LF)", category: "line-ending" },

    // Tab
    0x0009: { name: "Tab", category: "tab" },
}

// C0 control characters (0x00-0x1F) except tab, LF, CR
const C0_CONTROLS = Array.from({ length: 32 }, (_, i) => i).filter(
    (cp) => cp !== 0x09 && cp !== 0x0a && cp !== 0x0d,
)

// C1 control characters (0x80-0x9F)
const C1_CONTROLS = Array.from({ length: 32 }, (_, i) => i + 0x80)

/**
 * Analyze text for suspicious characters.
 * Uses code point iteration to handle emojis and surrogate pairs correctly.
 */
export function analyzeText(text: string): TextAnalysis {
    const codePoints = Array.from(text) // splits by code point, not code unit
    const suspiciousChars: SuspiciousCharacter[] = []
    let line = 1
    let column = 1

    codePoints.forEach((char, index) => {
        const codePoint = char.codePointAt(0)!

        // Check if suspicious
        let isSuspicious = false
        let displayName = ""
        let category: CharacterCategory | null = null

        // Check database first
        if (CHAR_DATABASE[codePoint]) {
            isSuspicious = true
            displayName = CHAR_DATABASE[codePoint].name
            category = CHAR_DATABASE[codePoint].category
        }
        // Check C0 control
        else if (C0_CONTROLS.includes(codePoint)) {
            isSuspicious = true
            displayName = `C0 Control (U+${codePoint.toString(16).toUpperCase().padStart(4, "0")})`
            category = "control"
        }
        // Check C1 control
        else if (C1_CONTROLS.includes(codePoint)) {
            isSuspicious = true
            displayName = `C1 Control (U+${codePoint.toString(16).toUpperCase().padStart(4, "0")})`
            category = "control"
        }

        if (isSuspicious && category) {
            suspiciousChars.push({
                index,
                line,
                column,
                codePoint,
                char,
                displayName,
                category,
            })
        }

        // Update line/column tracking
        if (codePoint === 0x0a) {
            // LF
            line++
            column = 1
        } else if (codePoint === 0x0d) {
            // CR - check for CRLF
            const nextChar = codePoints[index + 1]
            if (nextChar && nextChar.codePointAt(0) === 0x0a) {
                // CRLF, don't increment line yet (LF will do it)
            } else {
                // CR alone
                line++
                column = 1
            }
        } else {
            column++
        }
    })

    return {
        totalChars: codePoints.length,
        totalLines: line,
        suspiciousChars,
    }
}

export interface CleanOptions {
    removeZeroWidth: boolean
    normalizeSpaces: boolean
    removeControlExceptNewlineTab: boolean
}

/**
 * Clean text based on options.
 */
export function cleanText(text: string, options: CleanOptions): string {
    const codePoints = Array.from(text)
    const result: string[] = []

    codePoints.forEach((char) => {
        const cp = char.codePointAt(0)!
        let keep = true

        // Remove zero-width
        if (options.removeZeroWidth) {
            if ([0x200b, 0x200c, 0x200d].includes(cp)) {
                keep = false
            }
        }

        // Remove BOM
        if (options.removeZeroWidth && cp === 0xfeff) {
            keep = false
        }

        // Normalize spaces
        if (options.normalizeSpaces) {
            // Non-breaking space → regular space
            if (cp === 0x00a0 || cp === 0x202f) {
                result.push(" ")
                keep = false
            }
            // Ideographic space → regular space
            if (cp === 0x3000) {
                result.push(" ")
                keep = false
            }
            // Thin/hair space → regular space
            if (cp === 0x2009 || cp === 0x200a) {
                result.push(" ")
                keep = false
            }
        }

        // Remove control characters (except newline and tab)
        if (options.removeControlExceptNewlineTab) {
            if (C0_CONTROLS.includes(cp) || C1_CONTROLS.includes(cp)) {
                keep = false
            }
        }

        if (keep) {
            result.push(char)
        }
    })

    return result.join("")
}

/**
 * Get a human-readable label for a category.
 */
export function getCategoryLabel(category: CharacterCategory): string {
    const labels: Record<CharacterCategory, string> = {
        "zero-width": "Zero-Width",
        control: "Control Character",
        "whitespace-non-standard": "Non-Standard Whitespace",
        bom: "Byte Order Mark",
        "line-ending": "Line Ending",
        tab: "Tab",
    }
    return labels[category]
}

/**
 * Format code point as U+ notation.
 */
export function formatCodePoint(codePoint: number): string {
    return `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`
}
