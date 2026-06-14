import { describe, expect, it } from "vitest"
import { DEFAULT_SCRUB_OPTIONS, scrubLogs, summarizeFindings } from "../../src/lib/log-scrubber-utils"

describe("scrubLogs", () => {
    it("redacts emails, IPs, bearer tokens, and key/value secrets", () => {
        const input = "user=alice@example.com ip=192.168.1.10 Authorization: Bearer abcdefghijklmnop password=secret"
        const result = scrubLogs(input)

        expect(result.output).toContain("[EMAIL_REDACTED]")
        expect(result.output).toContain("[IP_REDACTED]")
        expect(result.output).toContain("Bearer [TOKEN_REDACTED]")
        expect(result.output).toContain("password= [SECRET_REDACTED]")
        expect(result.redactionCount).toBe(4)
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
        const input = "email=alice@example.com Authorization: Bearer abcdefghijklmnop api_key=sk_live_secretvalue"
        const result = scrubLogs(input)
        const serializedFindings = JSON.stringify(result.findings)

        expect(serializedFindings).not.toContain("alice@example.com")
        expect(serializedFindings).not.toContain("abcdefghijklmnop")
        expect(serializedFindings).not.toContain("sk_live_secretvalue")
        expect(result.findings.every((finding) => finding.maskedPreview.length > 0)).toBe(true)
        expect(result.output).toContain("[EMAIL_REDACTED]")
        expect(result.output).toContain("Bearer [TOKEN_REDACTED]")
        expect(result.output).toContain("api_key= [SECRET_REDACTED]")
    })

    it("redacts JWT and AWS access keys", () => {
        const input = "jwt=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature key=AKIAIOSFODNN7EXAMPLE"
        const result = scrubLogs(input)

        expect(result.output).toContain("[JWT_REDACTED]")
        expect(result.output).toContain("[AWS_ACCESS_KEY_REDACTED]")
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
})
