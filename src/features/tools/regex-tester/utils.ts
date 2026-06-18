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

export function testRegexPattern(pattern: string, flags: string, testString: string, maxMatches = 5_000): RegexTestResult {
    if (!pattern || testString === "") {
        return { ok: true, matches: [], limited: false }
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
