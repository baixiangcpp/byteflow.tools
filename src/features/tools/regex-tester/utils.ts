export type RegexMatchSummary = {
    match: string
    index: number
    groupIndex: number
    groups: unknown[]
}

export type RegexTestResult =
    | {
        ok: true
        matches: RegexMatchSummary[]
        limited: boolean
        elapsedMs: number
        warnings: string[]
    }
    | {
        ok: false
        error: string
        matches: []
        limited: false
        elapsedMs: number
        warnings: string[]
    }

const MAX_PATTERN_LENGTH = 500
const MAX_TEST_STRING_LENGTH = 20_000
const SLOW_EVALUATION_MS = 50
const NESTED_QUANTIFIER_RE = /\((?:[^()\\]|\\.)*[+*](?:[^()\\]|\\.)*\)\s*[+*{]/
const REPEATED_GROUP_WITH_RANGE_RE = /\((?:[^()\\]|\\.)*\{(?:\d+,?\d*|,\d+)\}(?:[^()\\]|\\.)*\)\s*[+*{]/
const AMBIGUOUS_ALTERNATION_RE = /\((?:[^()\\]|\\.)*\|(?:[^()\\]|\\.)*\)\s*[+*{]/

function getNow(): number {
    return typeof performance !== "undefined" && typeof performance.now === "function"
        ? performance.now()
        : Date.now()
}

export function assessRegexSafety(pattern: string, testString: string): string | null {
    if (pattern.length > MAX_PATTERN_LENGTH) {
        return `Pattern exceeds the ${MAX_PATTERN_LENGTH} character safety limit.`
    }
    if (testString.length > MAX_TEST_STRING_LENGTH) {
        return `Test string exceeds the ${MAX_TEST_STRING_LENGTH} character safety limit.`
    }
    if (NESTED_QUANTIFIER_RE.test(pattern) || REPEATED_GROUP_WITH_RANGE_RE.test(pattern)) {
        return "Pattern contains nested quantifiers that can cause catastrophic backtracking."
    }
    return null
}

export function getRegexPerformanceWarnings(pattern: string, testString: string, elapsedMs = 0): string[] {
    const warnings: string[] = []
    if (NESTED_QUANTIFIER_RE.test(pattern) || REPEATED_GROUP_WITH_RANGE_RE.test(pattern)) {
        warnings.push("Pattern contains nested quantifiers that can cause catastrophic backtracking.")
    }
    if (AMBIGUOUS_ALTERNATION_RE.test(pattern)) {
        warnings.push("Pattern contains repeated alternation that may backtrack on long input.")
    }
    if (testString.length > MAX_TEST_STRING_LENGTH * 0.75) {
        warnings.push("Large test input increases regex evaluation cost.")
    }
    if (elapsedMs >= SLOW_EVALUATION_MS) {
        warnings.push(`Evaluation took ${Math.round(elapsedMs)} ms. Consider simplifying the pattern or testing a smaller sample.`)
    }
    return warnings
}

export function testRegexPattern(pattern: string, flags: string, testString: string, maxMatches = 5_000): RegexTestResult {
    const startedAt = getNow()
    if (!pattern || testString === "") {
        return { ok: true, matches: [], limited: false, elapsedMs: 0, warnings: [] }
    }

    const safetyError = assessRegexSafety(pattern, testString)
    if (safetyError) {
        const elapsedMs = getNow() - startedAt
        return {
            ok: false,
            error: safetyError,
            matches: [],
            limited: false,
            elapsedMs,
            warnings: getRegexPerformanceWarnings(pattern, testString, elapsedMs),
        }
    }

    try {
        const isGlobal = flags.includes("g")
        const safeFlags = isGlobal ? flags : `${flags}g`
        const regex = new RegExp(pattern, safeFlags)
        const matches: RegexMatchSummary[] = []
        let matchCount = 0
        let limited = false

        for (const match of testString.matchAll(regex)) {
            if (!isGlobal && matchCount > 0) break

            matches.push({
                match: match[0],
                index: match.index ?? 0,
                groupIndex: matchCount,
                groups: match.slice(1),
            })

            matchCount += 1
            if (matchCount > maxMatches) {
                limited = true
                break
            }
            if (match[0].length === 0) {
                regex.lastIndex += 1
            }
        }

        const elapsedMs = getNow() - startedAt
        return {
            ok: true,
            matches,
            limited,
            elapsedMs,
            warnings: getRegexPerformanceWarnings(pattern, testString, elapsedMs),
        }
    } catch (error) {
        const elapsedMs = getNow() - startedAt
        return {
            ok: false,
            error: error instanceof Error ? error.message : "Invalid regular expression.",
            matches: [],
            limited: false,
            elapsedMs,
            warnings: getRegexPerformanceWarnings(pattern, testString, elapsedMs),
        }
    }
}
