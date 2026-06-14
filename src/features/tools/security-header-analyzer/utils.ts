export type HeaderStatus = "pass" | "warn" | "fail"

export type SecurityHeaderAssessment = {
    key: string
    status: HeaderStatus
    value: string | null
    summary: string
    recommendations: string[]
}

export type SecurityHeaderSummary = {
    score: number
    maxScore: number
    percentage: number
    passCount: number
    warnCount: number
    failCount: number
    assessments: SecurityHeaderAssessment[]
}

export type SecurityHeaderReportLabels = {
    scoreTitle: string
    summaryStatus: {
        pass: string
        warn: string
        fail: string
    }
    sectionSummary: string
    sectionValue: string
    sectionRecommendations: string
}

const DEFAULT_REPORT_LABELS: SecurityHeaderReportLabels = {
    scoreTitle: "Security Header Score",
    summaryStatus: {
        pass: "PASS",
        warn: "WARN",
        fail: "FAIL",
    },
    sectionSummary: "Summary",
    sectionValue: "Value",
    sectionRecommendations: "Recommendations",
}

type ParsedHeaders = Map<string, string>

function parseHeaderBlock(input: string): ParsedHeaders {
    const map = new Map<string, string>()
    const lines = input
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)

    for (const line of lines) {
        // Ignore status lines such as: HTTP/1.1 200 OK
        if (/^HTTP\/\d(?:\.\d)?\s+\d+/.test(line)) continue

        const separatorIndex = line.indexOf(":")
        if (separatorIndex <= 0) continue

        const rawKey = line.slice(0, separatorIndex).trim().toLowerCase()
        const rawValue = line.slice(separatorIndex + 1).trim()
        if (!rawKey || !rawValue) continue

        if (map.has(rawKey)) {
            map.set(rawKey, `${map.get(rawKey)}, ${rawValue}`)
        } else {
            map.set(rawKey, rawValue)
        }
    }

    return map
}

function parseHstsMaxAge(value: string): number | null {
    const match = value.match(/max-age\s*=\s*(\d+)/i)
    if (!match) return null
    const seconds = Number(match[1])
    return Number.isFinite(seconds) ? seconds : null
}

function assessCsp(value: string | undefined): SecurityHeaderAssessment {
    if (!value) {
        return {
            key: "Content-Security-Policy",
            status: "fail",
            value: null,
            summary: "Missing Content-Security-Policy header.",
            recommendations: [
                "Set a baseline policy such as: default-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'.",
            ],
        }
    }

    const normalized = value.toLowerCase()
    const recommendations: string[] = []
    let status: HeaderStatus = "pass"

    if (!normalized.includes("script-src")) {
        status = "warn"
        recommendations.push("Add script-src to explicitly control JavaScript execution sources.")
    }

    if (!normalized.includes("object-src")) {
        status = "warn"
        recommendations.push("Add object-src 'none' to disable legacy plugin execution.")
    } else if (!/object-src\s+'none'/.test(normalized)) {
        status = "warn"
        recommendations.push("Prefer object-src 'none' for safer defaults.")
    }

    if (normalized.includes("'unsafe-inline'") || normalized.includes("'unsafe-eval'")) {
        status = "warn"
        recommendations.push("Avoid 'unsafe-inline' and 'unsafe-eval'; use nonces or hashes instead.")
    }

    return {
        key: "Content-Security-Policy",
        status,
        value,
        summary: status === "pass" ? "CSP present with safer baseline directives." : "CSP present but can be tightened.",
        recommendations,
    }
}

function assessHsts(value: string | undefined): SecurityHeaderAssessment {
    if (!value) {
        return {
            key: "Strict-Transport-Security",
            status: "fail",
            value: null,
            summary: "Missing HSTS header.",
            recommendations: [
                "Enable HSTS with at least: max-age=31536000; includeSubDomains",
                "Only enable HSTS after HTTPS is fully deployed for all subdomains.",
            ],
        }
    }

    const maxAge = parseHstsMaxAge(value)
    const hasIncludeSubdomains = /includesubdomains/i.test(value)
    const hasPreload = /preload/i.test(value)
    const recommendations: string[] = []

    let status: HeaderStatus = "pass"
    if (maxAge === null || maxAge < 31536000) {
        status = "warn"
        recommendations.push("Use max-age=31536000 or higher for stronger transport guarantees.")
    }
    if (!hasIncludeSubdomains) {
        status = "warn"
        recommendations.push("Add includeSubDomains if all subdomains are HTTPS-ready.")
    }
    if (!hasPreload) {
        recommendations.push("Consider preload once HSTS policy is stable and complete.")
    }

    return {
        key: "Strict-Transport-Security",
        status,
        value,
        summary: status === "pass" ? "HSTS is configured with strong baseline." : "HSTS is present but should be strengthened.",
        recommendations,
    }
}

function assessXFrameOptions(value: string | undefined): SecurityHeaderAssessment {
    if (!value) {
        return {
            key: "X-Frame-Options",
            status: "fail",
            value: null,
            summary: "Missing anti-clickjacking header.",
            recommendations: ["Set X-Frame-Options to DENY or SAMEORIGIN."],
        }
    }

    const normalized = value.trim().toUpperCase()
    const pass = normalized === "DENY" || normalized === "SAMEORIGIN"
    return {
        key: "X-Frame-Options",
        status: pass ? "pass" : "fail",
        value,
        summary: pass ? "Anti-clickjacking policy is configured." : "X-Frame-Options value is weak or invalid.",
        recommendations: pass ? [] : ["Use DENY or SAMEORIGIN."],
    }
}

function assessNosniff(value: string | undefined): SecurityHeaderAssessment {
    if (!value) {
        return {
            key: "X-Content-Type-Options",
            status: "fail",
            value: null,
            summary: "Missing MIME-sniffing protection header.",
            recommendations: ["Set X-Content-Type-Options: nosniff."],
        }
    }

    const pass = value.trim().toLowerCase() === "nosniff"
    return {
        key: "X-Content-Type-Options",
        status: pass ? "pass" : "fail",
        value,
        summary: pass ? "MIME-sniffing protection is enabled." : "X-Content-Type-Options should be set to nosniff.",
        recommendations: pass ? [] : ["Set exact value: nosniff."],
    }
}

function assessReferrerPolicy(value: string | undefined): SecurityHeaderAssessment {
    if (!value) {
        return {
            key: "Referrer-Policy",
            status: "warn",
            value: null,
            summary: "Referrer-Policy is missing.",
            recommendations: ["Set strict-origin-when-cross-origin (recommended baseline) or no-referrer."],
        }
    }

    const normalized = value.trim().toLowerCase()
    const strongPolicies = new Set([
        "strict-origin-when-cross-origin",
        "strict-origin",
        "same-origin",
        "no-referrer",
    ])

    const pass = strongPolicies.has(normalized)
    return {
        key: "Referrer-Policy",
        status: pass ? "pass" : "warn",
        value,
        summary: pass ? "Referrer policy is privacy-conscious." : "Referrer policy can be tightened.",
        recommendations: pass ? [] : ["Prefer strict-origin-when-cross-origin for balanced privacy and analytics."],
    }
}

function assessPermissionsPolicy(value: string | undefined): SecurityHeaderAssessment {
    if (!value) {
        return {
            key: "Permissions-Policy",
            status: "warn",
            value: null,
            summary: "Permissions-Policy is missing.",
            recommendations: ["Add least-privilege policy, e.g. camera=(), microphone=(), geolocation=()."],
        }
    }

    return {
        key: "Permissions-Policy",
        status: "pass",
        value,
        summary: "Permissions-Policy is present.",
        recommendations: [],
    }
}

function assessCoop(value: string | undefined): SecurityHeaderAssessment {
    if (!value) {
        return {
            key: "Cross-Origin-Opener-Policy",
            status: "warn",
            value: null,
            summary: "COOP header is missing.",
            recommendations: ["Consider Cross-Origin-Opener-Policy: same-origin for stronger process isolation."],
        }
    }

    const normalized = value.trim().toLowerCase()
    const pass = normalized === "same-origin" || normalized === "same-origin-allow-popups"
    return {
        key: "Cross-Origin-Opener-Policy",
        status: pass ? "pass" : "warn",
        value,
        summary: pass ? "COOP is configured for isolation." : "COOP value can be improved.",
        recommendations: pass ? [] : ["Use same-origin unless you require popup interoperability."],
    }
}

function assessCorp(value: string | undefined): SecurityHeaderAssessment {
    if (!value) {
        return {
            key: "Cross-Origin-Resource-Policy",
            status: "warn",
            value: null,
            summary: "CORP header is missing.",
            recommendations: ["Consider Cross-Origin-Resource-Policy: same-origin or same-site where applicable."],
        }
    }

    const normalized = value.trim().toLowerCase()
    const pass = normalized === "same-origin" || normalized === "same-site" || normalized === "cross-origin"
    return {
        key: "Cross-Origin-Resource-Policy",
        status: pass ? "pass" : "warn",
        value,
        summary: pass ? "CORP header is present." : "CORP value is non-standard.",
        recommendations: pass ? [] : ["Use same-origin/same-site/cross-origin according to asset sharing policy."],
    }
}

export function analyzeSecurityHeaders(input: string): SecurityHeaderSummary {
    const headers = parseHeaderBlock(input)
    const assessments: SecurityHeaderAssessment[] = [
        assessCsp(headers.get("content-security-policy")),
        assessHsts(headers.get("strict-transport-security")),
        assessXFrameOptions(headers.get("x-frame-options")),
        assessNosniff(headers.get("x-content-type-options")),
        assessReferrerPolicy(headers.get("referrer-policy")),
        assessPermissionsPolicy(headers.get("permissions-policy")),
        assessCoop(headers.get("cross-origin-opener-policy")),
        assessCorp(headers.get("cross-origin-resource-policy")),
    ]

    const passCount = assessments.filter((item) => item.status === "pass").length
    const warnCount = assessments.filter((item) => item.status === "warn").length
    const failCount = assessments.filter((item) => item.status === "fail").length

    const score = passCount * 2 + warnCount
    const maxScore = assessments.length * 2
    const percentage = maxScore === 0 ? 0 : Math.round((score / maxScore) * 100)

    return {
        score,
        maxScore,
        percentage,
        passCount,
        warnCount,
        failCount,
        assessments,
    }
}

export function formatSecurityHeaderReport(
    summary: SecurityHeaderSummary,
    labels: SecurityHeaderReportLabels = DEFAULT_REPORT_LABELS,
): string {
    const lines: string[] = []
    lines.push(`${labels.scoreTitle}: ${summary.score}/${summary.maxScore} (${summary.percentage}%)`)
    lines.push(
        `${labels.summaryStatus.pass}: ${summary.passCount} | ${labels.summaryStatus.warn}: ${summary.warnCount} | ${labels.summaryStatus.fail}: ${summary.failCount}`,
    )
    lines.push("")

    for (const item of summary.assessments) {
        lines.push(`[${labels.summaryStatus[item.status]}] ${item.key}`)
        lines.push(`  ${labels.sectionSummary}: ${item.summary}`)
        if (item.value) {
            lines.push(`  ${labels.sectionValue}: ${item.value}`)
        }
        if (item.recommendations.length > 0) {
            lines.push(`  ${labels.sectionRecommendations}:`)
            for (const recommendation of item.recommendations) {
                lines.push(`    - ${recommendation}`)
            }
        }
        lines.push("")
    }

    return lines.join("\n").trim()
}
