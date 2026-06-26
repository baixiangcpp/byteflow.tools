import { describe, expect, it } from "vitest"
import { DEFAULT_SCRUB_OPTIONS, scrubLogs, summarizeFindings } from "../../src/lib/log-scrubber-utils"

function joinTokenParts(parts: string[], separator = "") {
    return parts.join(separator)
}

describe("scrubLogs", () => {
    it("redacts emails, IPs, bearer tokens, and key/value secrets", () => {
        const input = "user=alice@example.com ip=192.168.1.10 ipv6=2001:0db8:0000:0000:0000:ff00:0042:8329 Authorization: Bearer abcdefghijklmnop password=secret"
        const result = scrubLogs(input)

        expect(result.output).toContain("[EMAIL_REDACTED]")
        expect(result.output).toContain("[IP_REDACTED]")
        expect(result.output).toContain("Bearer [TOKEN_REDACTED]")
        expect(result.output).toContain("password= [SECRET_REDACTED]")
        expect(result.redactionCount).toBe(5)
    })

    it("reports positions from the original input when earlier replacements change length", () => {
        const input = "password=very-long-secret-value user=alice@example.com"
        const result = scrubLogs(input)
        const emailFinding = result.findings.find((finding) => finding.type === "email")

        expect(emailFinding).toMatchObject({
            line: 1,
            column: input.indexOf("alice@example.com") + 1,
        })
        expect(result.output).toContain("password= [SECRET_REDACTED]")
        expect(result.output).toContain("[EMAIL_REDACTED]")
    })

    it("reports correct columns for multiple findings on the same line", () => {
        const input = "alice@example.com 203.0.113.42"
        const result = scrubLogs(input)

        expect(result.findings).toHaveLength(2)
        expect(result.findings[0]).toMatchObject({ type: "email", line: 1, column: 1 })
        expect(result.findings[1]).toMatchObject({ type: "ipv4", line: 1, column: 19 })
    })

    it("reports correct lines for findings across multiple lines", () => {
        const input = "INFO boot\nERROR ip=203.0.113.42\nWARN email=alice@example.com"
        const result = scrubLogs(input)

        expect(result.findings.find((finding) => finding.type === "ipv4")).toMatchObject({ line: 2, column: 10 })
        expect(result.findings.find((finding) => finding.type === "email")).toMatchObject({ line: 3, column: 12 })
    })

    it("uses a stable overlap strategy without duplicate redactions", () => {
        const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature"
        const result = scrubLogs(`Authorization: Bearer ${jwt}`)

        expect(result.findings).toHaveLength(1)
        expect(result.findings[0].type).toBe("bearer-token")
        expect(result.output).toBe("Authorization: Bearer [TOKEN_REDACTED]")
    })

    it("does not retain full raw secrets in findings", () => {
        const fakeApiKey = joinTokenParts(["sk", "live", "secretvalue"], "_")
        const input = `email=alice@example.com Authorization: Bearer abcdefghijklmnop api_key=${fakeApiKey}`
        const result = scrubLogs(input)
        const serializedFindings = JSON.stringify(result.findings)

        expect(serializedFindings).not.toContain("alice@example.com")
        expect(serializedFindings).not.toContain("abcdefghijklmnop")
        expect(serializedFindings).not.toContain(fakeApiKey)
        expect(result.findings.every((finding) => finding.maskedPreview.length > 0)).toBe(true)
        expect(result.output).toContain("[EMAIL_REDACTED]")
        expect(result.output).toContain("Bearer [TOKEN_REDACTED]")
        expect(result.output).toContain("api_key= [SECRET_REDACTED]")
    })

    it("redacts JWT and AWS access keys", () => {
        const input = "jwt=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature key=AKIAIOSFODNN7EXAMPLE AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
        const result = scrubLogs(input)

        expect(result.output).toContain("[JWT_REDACTED]")
        expect(result.output).toContain("[AWS_ACCESS_KEY_REDACTED]")
        expect(result.output).toContain("AWS_SECRET_ACCESS_KEY= [SECRET_REDACTED]")
    })

    it("redacts common cloud tokens, cookies, session IDs, and certificate blocks", () => {
        const githubToken = joinTokenParts(["gh", "p_abcdefghijklmnopqrstuvwxyz1234567890"])
        const stripeToken = joinTokenParts(["sk", "live", "1234567890abcdef1234567890abcdef"], "_")
        const sendgridToken = joinTokenParts(["S", "G.abcdefghijklmnop.qrstuvwxyz123456"])
        const googleToken = joinTokenParts(["AI", "zaSyDUMMYDUMMYDUMMYDUMMYDUMMYDUMMY123"])
        const slackToken = joinTokenParts(["xo", "xb-123456789012-abcdefghijklmnopqrstuv"])
        const input = [
            `github=${githubToken}`,
            `stripe=${stripeToken}`,
            `sendgrid=${sendgridToken}`,
            `google=${googleToken}`,
            `slack=${slackToken}`,
            "Cookie: sid=abc123; theme=dark",
            "session_id=sess_1234567890abcdef request_id=req_1234567890",
            "-----BEGIN CERTIFICATE-----\nMIIDdummy\n-----END CERTIFICATE-----",
        ].join("\n")

        const result = scrubLogs(input)

        expect(result.output).not.toContain(githubToken)
        expect(result.output).not.toContain(stripeToken)
        expect(result.output).not.toContain("sid=abc123")
        expect(result.output).not.toContain("sess_1234567890abcdef")
        expect(result.output).not.toContain("MIIDdummy")
        expect(result.output).toContain("[TOKEN_REDACTED]")
        expect(result.output).toContain("Cookie: [COOKIE_REDACTED]")
        expect(result.output).toContain("session_id= [SESSION_REDACTED]")
        expect(result.output).toContain("[CERTIFICATE_REDACTED]")
        expect(summarizeFindings(result.findings)).toMatchObject({
            "cloud-token": 5,
            cookie: 1,
            "session-id": 2,
            certificate: 1,
        })
    })

    it("preserves URL host while redacting URL credentials", () => {
        const result = scrubLogs("postgres://user:pass@db.example.com:5432/app")

        expect(result.output).toBe("postgres://[USERPASS_REDACTED]@db.example.com:5432/app")
        expect(result.findings[0].type).toBe("url-credential")
    })

    it("honors disabled options", () => {
        const result = scrubLogs("alice@example.com 10.0.0.1", {
            ...DEFAULT_SCRUB_OPTIONS,
            emails: false,
        })

        expect(result.output).toContain("alice@example.com")
        expect(result.output).toContain("[IP_REDACTED]")
    })

    it("summarizes finding counts", () => {
        const result = scrubLogs("a@example.com b@example.com 127.0.0.1")
        const summary = summarizeFindings(result.findings)

        expect(summary.email).toBe(2)
        expect(summary.ipv4).toBe(1)
    })

    it("handles empty, malformed, and large inputs without leaking known secrets", () => {
        expect(scrubLogs("").output).toBe("")
        expect(scrubLogs("{{{{ not-json but still a log line").redactionCount).toBe(0)

        const secret = joinTokenParts(["sk", "live", "largeinputsecret1234567890"], "_")
        const largeInput = Array.from({ length: 1_000 }, (_, index) => (
            `2026-06-10T10:${String(index % 60).padStart(2, "0")}:00Z ERROR user${index}@example.com token=${secret} ip=203.0.113.${index % 255}`
        )).join("\n")
        const result = scrubLogs(largeInput)

        expect(result.redactionCount).toBe(3_000)
        expect(result.output).not.toContain(secret)
        expect(result.output).not.toContain("user999@example.com")
        expect(result.output).toContain("[EMAIL_REDACTED]")
        expect(result.output).toContain("[IP_REDACTED]")
        expect(result.output).toContain("[TOKEN_REDACTED]")
    })
})
