export type CaseStyle =
    | "slug"
    | "camel"
    | "pascal"
    | "snake"
    | "kebab"
    | "constant"
    | "dot"
    | "title"
    | "sentence"

export type CaseOptions = {
    locale: string
    preserveAcronyms: boolean
}

export type SlugQualityLevel = "excellent" | "good" | "fair" | "poor"
export type SlugWarningCode = "empty_slug" | "too_short" | "too_long" | "blocked_chars"
export type SlugHintCode = "normalized"

export type SlugQualityAnalysis = {
    score: number
    level: SlugQualityLevel
    blockedChars: string[]
    warnings: SlugWarningCode[]
    hints: SlugHintCode[]
    slugLength: number
}

type WordToken = {
    raw: string
    isAcronym: boolean
}

export const CASE_STYLES: CaseStyle[] = [
    "slug",
    "camel",
    "pascal",
    "snake",
    "kebab",
    "constant",
    "dot",
    "title",
    "sentence",
]

function safeLower(value: string, locale: string): string {
    try {
        return value.toLocaleLowerCase(locale)
    } catch {
        return value.toLowerCase()
    }
}

function safeUpper(value: string, locale: string): string {
    try {
        return value.toLocaleUpperCase(locale)
    } catch {
        return value.toUpperCase()
    }
}

function capitalizeWord(value: string, locale: string): string {
    const lower = safeLower(value, locale)
    if (!lower) return ""
    return safeUpper(lower.charAt(0), locale) + lower.slice(1)
}

function splitWords(input: string): WordToken[] {
    const prepared = input
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
        .replace(/[_\-.\s]+/g, " ")
        .trim()

    if (!prepared) return []

    return prepared
        .split(/\s+/)
        .map((word) => word.replace(/[^\p{L}\p{N}]+/gu, ""))
        .filter(Boolean)
        .map((raw) => ({
            raw,
            isAcronym: raw.length > 1 && /^[A-Z0-9]+$/.test(raw),
        }))
}

function toSlug(words: WordToken[], locale: string): string {
    return words
        .map((word) =>
            safeLower(word.raw, locale)
                .replace(/ß/g, "ss")
                .normalize("NFKD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^\p{L}\p{N}]+/gu, ""),
        )
        .filter(Boolean)
        .join("-")
}

function toLowerWord(word: WordToken, options: CaseOptions): string {
    if (options.preserveAcronyms && word.isAcronym) {
        return safeUpper(word.raw, options.locale)
    }
    return safeLower(word.raw, options.locale)
}

function toCapitalizedWord(word: WordToken, options: CaseOptions): string {
    if (options.preserveAcronyms && word.isAcronym) {
        return safeUpper(word.raw, options.locale)
    }
    return capitalizeWord(word.raw, options.locale)
}

function getSlugQualityLevel(score: number): SlugQualityLevel {
    if (score >= 90) return "excellent"
    if (score >= 75) return "good"
    if (score >= 55) return "fair"
    return "poor"
}

export function analyzeSlugQuality(input: string, slug: string): SlugQualityAnalysis {
    const trimmedInput = input.trim()
    const trimmedSlug = slug.trim()
    const blockedChars = Array.from(new Set((trimmedInput.match(/[^\p{L}\p{N}\s_.-]/gu) || [])))

    const warnings: SlugWarningCode[] = []
    const hints: SlugHintCode[] = []
    let score = 100

    if (!trimmedInput || !trimmedSlug) {
        return {
            score: 0,
            level: "poor",
            blockedChars,
            warnings: ["empty_slug"],
            hints: [],
            slugLength: 0,
        }
    }

    if (blockedChars.length > 0) {
        warnings.push("blocked_chars")
        score -= Math.min(24, blockedChars.length * 6)
    }

    if (trimmedSlug.length < 8) {
        warnings.push("too_short")
        score -= 18
    } else if (trimmedSlug.length > 60) {
        warnings.push("too_long")
        score -= 20
    }

    if (trimmedInput !== trimmedSlug) {
        hints.push("normalized")
    }

    const nextScore = Math.max(0, Math.min(100, score))

    return {
        score: nextScore,
        level: getSlugQualityLevel(nextScore),
        blockedChars,
        warnings,
        hints,
        slugLength: trimmedSlug.length,
    }
}

export function convertCase(input: string, style: CaseStyle, options: CaseOptions): string {
    const words = splitWords(input)
    if (words.length === 0) return ""

    switch (style) {
        case "slug":
            return toSlug(words, options.locale)
        case "camel":
            return words
                .map((word, index) =>
                    index === 0
                        ? safeLower(word.raw, options.locale)
                        : toCapitalizedWord(word, options),
                )
                .join("")
        case "pascal":
            return words.map((word) => toCapitalizedWord(word, options)).join("")
        case "snake":
            return words.map((word) => toLowerWord(word, options)).join("_")
        case "kebab":
            return words.map((word) => toLowerWord(word, options)).join("-")
        case "constant":
            return words.map((word) => safeUpper(word.raw, options.locale)).join("_")
        case "dot":
            return words.map((word) => toLowerWord(word, options)).join(".")
        case "title":
            return words.map((word) => toCapitalizedWord(word, options)).join(" ")
        case "sentence":
            return words
                .map((word, index) =>
                    index === 0
                        ? toCapitalizedWord(word, options)
                        : toLowerWord(word, options),
                )
                .join(" ")
        default:
            return input
    }
}
