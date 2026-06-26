import { describe, expect, it } from "vitest"
import { analyzeSecurityHeaders, formatSecurityHeaderReport } from "@/features/tools/security-header-analyzer/utils"

describe("security header analyzer", () => {
    it("returns strong score for solid baseline headers", () => {
        const summary = analyzeSecurityHeaders(`
HTTP/2 200
content-security-policy: default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'
strict-transport-security: max-age=31536000; includeSubDomains; preload
x-frame-options: DENY
x-content-type-options: nosniff
referrer-policy: strict-origin-when-cross-origin
permissions-policy: camera=(), microphone=(), geolocation=()
cross-origin-opener-policy: same-origin
cross-origin-resource-policy: same-origin
`)

        expect(summary.failCount).toBe(0)
        expect(summary.warnCount).toBe(0)
        expect(summary.passCount).toBe(8)
        expect(summary.percentage).toBe(100)
    })

    it("flags missing and weak headers with warnings and failures", () => {
        const summary = analyzeSecurityHeaders(`
HTTP/1.1 200 OK
content-security-policy: default-src *; script-src 'unsafe-inline'
x-frame-options: ALLOWALL
`)

        expect(summary.failCount).toBeGreaterThan(0)
        expect(summary.warnCount).toBeGreaterThan(0)
        expect(summary.passCount).toBeLessThan(8)

        const csp = summary.assessments.find((item) => item.key === "Content-Security-Policy")
        expect(csp?.status).toBe("warn")
        expect(csp?.recommendations.length).toBeGreaterThan(0)

        const hsts = summary.assessments.find((item) => item.key === "Strict-Transport-Security")
        expect(hsts?.status).toBe("fail")
    })

    it("formats report output for copy/export", () => {
        const summary = analyzeSecurityHeaders("x-content-type-options: nosniff")
        const report = formatSecurityHeaderReport(summary)
        expect(report).toContain("Security Header Score")
        expect(report).toContain("X-Content-Type-Options")
        expect(report).toContain("Recommendations")
    })

    it("handles empty, malformed, duplicate, and large header blocks", () => {
        const empty = analyzeSecurityHeaders("")
        expect(empty.failCount).toBeGreaterThan(0)
        expect(empty.percentage).toBeLessThan(50)

        const malformed = analyzeSecurityHeaders("not a header\nx-frame-options DENY\nx-content-type-options: nosniff")
        expect(malformed.assessments.find((item) => item.key === "X-Content-Type-Options")?.status).toBe("pass")
        expect(malformed.assessments.find((item) => item.key === "X-Frame-Options")?.status).toBe("fail")

        const duplicate = analyzeSecurityHeaders("x-frame-options: DENY\nx-frame-options: SAMEORIGIN")
        expect(duplicate.assessments.find((item) => item.key === "X-Frame-Options")?.value).toBe("DENY, SAMEORIGIN")

        const large = analyzeSecurityHeaders([
            "HTTP/2 200",
            ...Array.from({ length: 500 }, (_, index) => `x-debug-${index}: value-${index}`),
            "content-security-policy: default-src 'self'; script-src 'self'; object-src 'none'",
            "strict-transport-security: max-age=31536000; includeSubDomains",
            "x-content-type-options: nosniff",
        ].join("\n"))
        expect(large.assessments.find((item) => item.key === "Content-Security-Policy")?.status).toBe("pass")
        expect(formatSecurityHeaderReport(large)).toContain("Strict-Transport-Security")
    })
})
