export type ScrubFindingType =
    | "email"
    | "ipv4"
    | "jwt"
    | "bearer-token"
    | "api-key"
    | "aws-access-key"
    | "private-key"
    | "url-credential"

export interface ScrubOptions {
    emails: boolean
    ipAddresses: boolean
    jwtTokens: boolean
    bearerTokens: boolean
    apiKeys: boolean
    awsAccessKeys: boolean
    privateKeys: boolean
    urlCredentials: boolean
}

export interface ScrubFinding {
    type: ScrubFindingType
    label: string
    index: number
    line: number
    column: number
    matchLength: number
    maskedPreview: string
    replacement: string
}

export interface ScrubResult {
    output: string
    findings: ScrubFinding[]
    redactionCount: number
}

export const DEFAULT_SCRUB_OPTIONS: ScrubOptions = {
    emails: true,
    ipAddresses: true,
    jwtTokens: true,
    bearerTokens: true,
    apiKeys: true,
    awsAccessKeys: true,
    privateKeys: true,
    urlCredentials: true,
}

type ScrubRule = {
    enabled: keyof ScrubOptions
    type: ScrubFindingType
    label: string
    replacement: string
    pattern: RegExp
    replace?: (match: string) => string
}

type ScrubMatch = {
    rule: ScrubRule
    start: number
    end: number
    match: string
    replacement: string
}

const RULES: ScrubRule[] = [
    {
        enabled: "privateKeys",
        type: "private-key",
        label: "Private key block",
        replacement: "[PRIVATE_KEY_REDACTED]",
        pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
    },
    {
        enabled: "urlCredentials",
        type: "url-credential",
        label: "URL credentials",
        replacement: "[URL_CREDENTIALS_REDACTED]",
        pattern: /\b([a-z][a-z0-9+.-]*:\/\/)([^/\s:@]+):([^/\s@]+)@/gi,
        replace: (match) => match.replace(/:\/\/[^/\s:@]+:[^/\s@]+@/i, "://[USERPASS_REDACTED]@"),
    },
    {
        enabled: "jwtTokens",
        type: "jwt",
        label: "JWT",
        replacement: "[JWT_REDACTED]",
        pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
    },
    {
        enabled: "bearerTokens",
        type: "bearer-token",
        label: "Bearer token",
        replacement: "Bearer [TOKEN_REDACTED]",
        pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}\b/gi,
    },
    {
        enabled: "awsAccessKeys",
        type: "aws-access-key",
        label: "AWS access key",
        replacement: "[AWS_ACCESS_KEY_REDACTED]",
        pattern: /\b(A3T[A-Z0-9]|AKIA|ASIA|AGPA|AIDA|AROA|AIPA|ANPA)[A-Z0-9]{16}\b/g,
    },
    {
        enabled: "apiKeys",
        type: "api-key",
        label: "Key/value secret",
        replacement: "$1[SECRET_REDACTED]",
        pattern: /\b((?:api[_-]?key|access[_-]?token|auth[_-]?token|secret|password|passwd|pwd|client[_-]?secret)\s*[:=]\s*)(["']?)[^\s"',;]+(\2)/gi,
        replace: (match) => match.replace(/(:|=)\s*(["']?)[^\s"',;]+(\2)$/i, "$1 $2[SECRET_REDACTED]$3"),
    },
    {
        enabled: "emails",
        type: "email",
        label: "Email address",
        replacement: "[EMAIL_REDACTED]",
        pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    },
    {
        enabled: "ipAddresses",
        type: "ipv4",
        label: "IPv4 address",
        replacement: "[IP_REDACTED]",
        pattern: /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g,
    },
]

function getLineColumn(text: string, index: number): { line: number; column: number } {
    let line = 1
    let column = 1
    for (const char of Array.from(text.slice(0, index))) {
        if (char === "\n") {
            line += 1
            column = 1
        } else {
            column += 1
        }
    }
    return { line, column }
}

function maskSensitiveMatch(value: string): string {
    const compact = value.replace(/\s+/g, " ").trim()
    if (!compact) return "********"
    if (compact.length <= 8) return "*".repeat(compact.length)
    return `${compact.slice(0, 2)}...${compact.slice(-2)} (${compact.length} chars)`
}

function collectMatches(input: string, options: ScrubOptions): ScrubMatch[] {
    const matches: ScrubMatch[] = []

    for (const rule of RULES) {
        if (!options[rule.enabled]) continue

        const pattern = new RegExp(rule.pattern.source, rule.pattern.flags)
        for (const match of input.matchAll(pattern)) {
            const value = match[0]
            if (!value) continue

            const start = match.index ?? input.indexOf(value)
            const replacement = rule.replace ? rule.replace(value) : rule.replacement
            matches.push({
                rule,
                start,
                end: start + value.length,
                match: value,
                replacement,
            })
        }
    }

    return matches
        .sort((left, right) => {
            if (left.start !== right.start) return left.start - right.start
            return (right.end - right.start) - (left.end - left.start)
        })
        .reduce<ScrubMatch[]>((accepted, next) => {
            const last = accepted[accepted.length - 1]
            if (last && next.start < last.end) return accepted
            accepted.push(next)
            return accepted
        }, [])
}

export function scrubLogs(input: string, options: ScrubOptions = DEFAULT_SCRUB_OPTIONS): ScrubResult {
    const matches = collectMatches(input, options)
    const findings: ScrubFinding[] = matches.map((match) => {
        const position = getLineColumn(input, match.start)
        return {
            type: match.rule.type,
            label: match.rule.label,
            index: match.start,
            line: position.line,
            column: position.column,
            matchLength: Array.from(match.match).length,
            maskedPreview: maskSensitiveMatch(match.match),
            replacement: match.replacement,
        }
    })

    let cursor = 0
    let output = ""
    for (const match of matches) {
        output += input.slice(cursor, match.start)
        output += match.replacement
        cursor = match.end
    }
    output += input.slice(cursor)

    return {
        output,
        findings,
        redactionCount: findings.length,
    }
}

export function summarizeFindings(findings: ScrubFinding[]): Record<ScrubFindingType, number> {
    return findings.reduce((summary, finding) => {
        summary[finding.type] = (summary[finding.type] || 0) + 1
        return summary
    }, {} as Record<ScrubFindingType, number>)
}
