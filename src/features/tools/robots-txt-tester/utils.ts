export interface RobotsRule {
    userAgent: string
    allows: string[]
    disallows: string[]
    crawlDelay?: number
}

export const NO_MATCH_RULE = "__DEFAULT_ALLOWED__"

export function parseRobotsTxt(content: string): RobotsRule[] {
    const rules: RobotsRule[] = []
    let current: RobotsRule | null = null

    for (const rawLine of content.split("\n")) {
        const line = rawLine.trim()
        if (!line || line.startsWith("#")) continue

        const colonIdx = line.indexOf(":")
        if (colonIdx < 0) continue

        const directive = line.slice(0, colonIdx).trim().toLowerCase()
        const value = line.slice(colonIdx + 1).trim()

        if (directive === "user-agent") {
            current = { userAgent: value, allows: [], disallows: [] }
            rules.push(current)
        } else if (current) {
            if (directive === "allow") current.allows.push(value)
            if (directive === "disallow") current.disallows.push(value)
            if (directive === "crawl-delay") current.crawlDelay = parseFloat(value)
        }
    }

    return rules
}

export function matchRobotsPath(pattern: string, path: string): boolean {
    if (!pattern) return false

    let regex = pattern
        .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, ".*")

    if (pattern.endsWith("$")) {
        regex = regex.slice(0, -2) + "$"
    } else {
        regex += ".*"
    }

    try {
        return new RegExp(`^${regex}`).test(path)
    } catch {
        return false
    }
}

type RobotsMatch = {
    allowed: boolean
    matchedAgent: string
    matchedRule: string
}

type RobotsMatchCandidate = {
    allowed: boolean
    pattern: string
    matchedAgent: string
    specificity: number
}

export function testRobotsUrl(rules: RobotsRule[], userAgent: string, path: string): RobotsMatch {
    const normalizedUserAgent = userAgent.trim().toLowerCase()
    const matchingRules = rules.filter((rule) => {
        const candidate = rule.userAgent.trim().toLowerCase()
        return candidate === "*" || candidate === normalizedUserAgent
    })

    const specificRules = matchingRules.filter((rule) => rule.userAgent.trim() !== "*")
    const effectiveRules = specificRules.length > 0 ? specificRules : matchingRules

    let bestMatch: RobotsMatchCandidate | null = null

    for (const rule of effectiveRules) {
        for (const allow of rule.allows) {
            if (!matchRobotsPath(allow, path)) continue

            const candidate: RobotsMatchCandidate = {
                allowed: true,
                pattern: allow,
                matchedAgent: rule.userAgent,
                specificity: allow.length,
            }

            if (!bestMatch
                || candidate.specificity > bestMatch.specificity
                || (candidate.specificity === bestMatch.specificity && candidate.allowed && !bestMatch.allowed)) {
                bestMatch = candidate
            }
        }
        for (const disallow of rule.disallows) {
            if (!matchRobotsPath(disallow, path)) continue

            const candidate: RobotsMatchCandidate = {
                allowed: false,
                pattern: disallow,
                matchedAgent: rule.userAgent,
                specificity: disallow.length,
            }

            if (!bestMatch
                || candidate.specificity > bestMatch.specificity
                || (candidate.specificity === bestMatch.specificity && candidate.allowed && !bestMatch.allowed)) {
                bestMatch = candidate
            }
        }
    }

    if (bestMatch !== null) {
        return {
            allowed: bestMatch.allowed,
            matchedAgent: bestMatch.matchedAgent,
            matchedRule: `${bestMatch.allowed ? "Allow" : "Disallow"}: ${bestMatch.pattern}`,
        }
    }

    return {
        allowed: true,
        matchedAgent: userAgent,
        matchedRule: NO_MATCH_RULE,
    }
}
