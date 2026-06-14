import { measureUtf8Bytes, PHASE4_LIMITS } from "@/core/utils/phase4-inspector-limits"

export interface UnicodeCharacterInfo {
    index: number
    utf16Index: number
    character: string
    codePoint: string
    decimal: number
    utf16Units: string[]
    utf8Bytes: string[]
    category: string
    name: string
    flags: string[]
}

export interface UnicodeInspectionResult {
    characters: UnicodeCharacterInfo[]
    stats: {
        codePoints: number
        utf16Units: number
        bytes: number
        lines: number
        combiningMarks: number
        controls: number
        invisible: number
        nonAscii: number
        inspectedOnly: boolean
    }
    truncated: boolean
    warnings: string[]
}

const UNICODE_INPUT_TRUNCATED = "Input is larger than the local Unicode Inspector budget. Character rows and stats are based on the inspected subset."
const UNICODE_CHARACTERS_TRUNCATED = "Character rows truncated for performance. Copy JSON exports the inspected subset only."

const KNOWN_NAMES: Record<number, string> = {
    0x0009: "Character Tabulation",
    0x000a: "Line Feed",
    0x000d: "Carriage Return",
    0x0020: "Space",
    0x00a0: "No-Break Space",
    0x200b: "Zero Width Space",
    0x200c: "Zero Width Non-Joiner",
    0x200d: "Zero Width Joiner",
    0x200e: "Left-To-Right Mark",
    0x200f: "Right-To-Left Mark",
    0x2028: "Line Separator",
    0x2029: "Paragraph Separator",
    0x202a: "Left-To-Right Embedding",
    0x202b: "Right-To-Left Embedding",
    0x202c: "Pop Directional Formatting",
    0x202d: "Left-To-Right Override",
    0x202e: "Right-To-Left Override",
    0x2066: "Left-To-Right Isolate",
    0x2067: "Right-To-Left Isolate",
    0x2068: "First Strong Isolate",
    0x2069: "Pop Directional Isolate",
    0x3000: "Ideographic Space",
    0xfeff: "Byte Order Mark",
}

function codePointHex(value: number): string {
    return `U+${value.toString(16).toUpperCase().padStart(value > 0xffff ? 6 : 4, "0")}`
}

function getCategory(codePoint: number): string {
    if (codePoint <= 0x001f || (codePoint >= 0x007f && codePoint <= 0x009f)) return "Control"
    if (codePoint >= 0x0300 && codePoint <= 0x036f) return "Combining mark"
    if (codePoint >= 0x0590 && codePoint <= 0x08ff) return "Right-to-left script"
    if ((codePoint >= 0x2000 && codePoint <= 0x200a) || codePoint === 0x00a0 || codePoint === 0x3000) return "Space separator"
    if (codePoint >= 0x200b && codePoint <= 0x200f) return "Format"
    if (codePoint >= 0x202a && codePoint <= 0x202e) return "Bidirectional format"
    if (codePoint >= 0x2066 && codePoint <= 0x2069) return "Bidirectional isolate"
    if (codePoint >= 0xd800 && codePoint <= 0xdfff) return "Surrogate"
    if (codePoint > 0xffff) return "Supplementary plane"
    if (codePoint <= 0x007f) return "ASCII"
    return "Unicode"
}

function getName(codePoint: number, category: string): string {
    if (KNOWN_NAMES[codePoint]) return KNOWN_NAMES[codePoint]
    if (category === "Control") return `Control ${codePointHex(codePoint)}`
    if (category === "Combining mark") return `Combining mark ${codePointHex(codePoint)}`
    return `${category} ${codePointHex(codePoint)}`
}

function getFlags(codePoint: number, category: string): string[] {
    const flags: string[] = []
    if (category === "Control") flags.push("control")
    if (category === "Combining mark") flags.push("combining")
    if (category.includes("Bidirectional") || codePoint === 0x200e || codePoint === 0x200f) flags.push("bidi")
    if ([0x00a0, 0x200b, 0x200c, 0x200d, 0x2060, 0x3000, 0xfeff].includes(codePoint)) flags.push("invisible")
    if (category === "Right-to-left script") flags.push("rtl-script")
    if (codePoint > 0x007f) flags.push("non-ascii")
    return flags
}

export function inspectUnicode(input: string): UnicodeInspectionResult {
    const characters: UnicodeCharacterInfo[] = []
    const warnings: string[] = []
    const inputBudget = measureUtf8Bytes(input, PHASE4_LIMITS.maxUnicodeInputBytes + 1)
    const rawInputTooLarge = inputBudget.exceeded
    let maxCharactersReached = false
    let utf16Index = 0
    let inspectedBytes = 0
    let lines = 0
    let previousWasCr = false

    for (const character of input) {
        if (characters.length >= PHASE4_LIMITS.maxUnicodeCharacters) {
            maxCharactersReached = true
            break
        }
        const codePoint = character.codePointAt(0) ?? 0
        const category = getCategory(codePoint)
        const utf16Units: string[] = []
        for (let unitIndex = 0; unitIndex < character.length; unitIndex += 1) {
            utf16Units.push(character.charCodeAt(unitIndex).toString(16).toUpperCase().padStart(4, "0"))
        }
        const characterBytes = Array.from(new TextEncoder().encode(character))
        const utf8Bytes = characterBytes.map((byte) => byte.toString(16).toUpperCase().padStart(2, "0"))
        inspectedBytes += characterBytes.length
        if (lines === 0) lines = 1
        if (character === "\n") {
            if (!previousWasCr) lines += 1
            previousWasCr = false
        } else if (character === "\r") {
            lines += 1
            previousWasCr = true
        } else {
            previousWasCr = false
        }
        characters.push({
            index: characters.length,
            utf16Index,
            character,
            codePoint: codePointHex(codePoint),
            decimal: codePoint,
            utf16Units,
            utf8Bytes,
            category,
            name: getName(codePoint, category),
            flags: getFlags(codePoint, category),
        })
        utf16Index += character.length
    }

    if (rawInputTooLarge) warnings.push(UNICODE_INPUT_TRUNCATED)
    if (maxCharactersReached) warnings.push(UNICODE_CHARACTERS_TRUNCATED)
    const truncated = warnings.length > 0

    return {
        characters,
        truncated,
        warnings,
        stats: {
            codePoints: characters.length,
            utf16Units: utf16Index,
            bytes: inspectedBytes,
            lines,
            combiningMarks: characters.filter((char) => char.flags.includes("combining")).length,
            controls: characters.filter((char) => char.flags.includes("control")).length,
            invisible: characters.filter((char) => char.flags.includes("invisible")).length,
            nonAscii: characters.filter((char) => char.flags.includes("non-ascii")).length,
            inspectedOnly: truncated,
        },
    }
}
