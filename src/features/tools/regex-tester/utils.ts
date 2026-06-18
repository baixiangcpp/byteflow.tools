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
    }
    | {
        ok: false
        error: string
        matches: []
        limited: false
    }

const MAX_PATTERN_LENGTH = 500
const MAX_TEST_STRING_LENGTH = 20_000
const NESTED_QUANTIFIER_RE = /\((?:[^()\\]|\\.)*[+*](?:[^()\\]|\\.)*\)\s*[+*{]/
const REPEATED_GROUP_WITH_RANGE_RE = /\((?:[^()\\]|\\.)*\{(?:\d+,?\d*|,\d+)\}(?:[^()\\]|\\.)*\)\s*[+*{]/

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

export function testRegexPattern(pattern: string, flags: string, testString: string, maxMatches = 5_000): RegexTestResult {
    if (!pattern || testString === "") {
        return { ok: true, matches: [], limited: false }
    }

    const safetyError = assessRegexSafety(pattern, testString)
    if (safetyError) {
        return { ok: false, error: safetyError, matches: [], limited: false }
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

        return { ok: true, matches, limited }
    } catch (error) {
        return {
            ok: false,
            error: error instanceof Error ? error.message : "Invalid regular expression.",
            matches: [],
            limited: false,
        }
    }
}
