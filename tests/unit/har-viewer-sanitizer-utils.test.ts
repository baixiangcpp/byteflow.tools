import { describe, expect, it } from "vitest"
import { parseHarSummary, sanitizeHar } from "../../src/lib/har-viewer-sanitizer-utils"

const SAMPLE_HAR = JSON.stringify({
    log: {
        entries: [
            {
                startedDateTime: "2026-06-10T10:00:00.000Z",
                time: 123,
                request: {
                    method: "POST",
                    url: "https://api.example.com/users?token=secret&debug=1",
                    headers: [{ name: "Authorization", value: "Bearer secret" }],
                    cookies: [{ name: "session", value: "cookie-secret" }],
                    queryString: [{ name: "token", value: "secret" }],
                    postData: { mimeType: "application/json", text: "{\"password\":\"secret\"}" },
                },
                response: {
                    status: 200,
                    headers: [{ name: "Set-Cookie", value: "id=secret" }],
                    cookies: [{ name: "id", value: "secret" }],
                    content: { mimeType: "application/json", text: "{\"ok\":true}" },
                },
            },
        ],
    },
})

describe("HAR viewer and sanitizer utilities", () => {
    it("summarizes HAR entries", () => {
        const summary = parseHarSummary(SAMPLE_HAR)

        expect(summary.error).toBeUndefined()
        expect(summary.totalRequests).toBe(1)
        expect(summary.totalTime).toBe(123)
        expect(summary.statusCounts["2xx"]).toBe(1)
        expect(summary.hostCounts["api.example.com"]).toBe(1)
    })

    it("redacts query values in parse summary display URLs", () => {
        const summary = parseHarSummary(SAMPLE_HAR)

        expect(summary.entries[0].url).toContain("token=[REDACTED]")
        expect(summary.entries[0].url).toContain("debug=[REDACTED]")
        expect(summary.entries[0].url).not.toContain("secret")
        expect(summary.entries[0].url).not.toContain("debug=1")
    })

    it("redacts multiple query params and hash fragments in parse summary display URLs", () => {
        const summary = parseHarSummary(JSON.stringify({
            log: {
                entries: [{
                    request: { method: "GET", url: "https://api.example.com/users?token=secret&session=abc#access_token=hash-secret" },
                    response: { status: 401, content: { mimeType: "application/json" } },
                    time: 10,
                }],
            },
        }))

        expect(summary.entries[0].url).toContain("token=[REDACTED]")
        expect(summary.entries[0].url).toContain("session=[REDACTED]")
        expect(summary.entries[0].url).toContain("#[REDACTED]")
        expect(summary.entries[0].url).not.toContain("secret")
        expect(summary.entries[0].url).not.toContain("abc")
        expect(summary.entries[0].url).not.toContain("hash-secret")
    })

    it("best-effort redacts malformed URL-like strings in parse summaries", () => {
        const summary = parseHarSummary(JSON.stringify({
            log: {
                entries: [{
                    request: { method: "GET", url: "not a url?token=secret&session=abc#frag-secret" },
                    response: { status: 200, content: { mimeType: "text/plain" } },
                    time: 4,
                }],
            },
        }))

        expect(summary.entries[0].url).toBe("not a url?token=[REDACTED]&session=[REDACTED]#[REDACTED]")
    })

    it("redacts headers, cookies, query strings, bodies, and content", () => {
        const result = sanitizeHar(SAMPLE_HAR)
        const sanitized = JSON.parse(result.output)

        expect(result.error).toBeUndefined()
        expect(result.redactionCount).toBeGreaterThanOrEqual(6)
        expect(result.summary).toMatchObject({
            header: 2,
            cookie: 2,
            query: 3,
            postData: 1,
            content: 1,
        })
        expect(sanitized.log._byteflowSanitizerSummary).toMatchObject({
            generatedBy: "byteflow.tools HAR Viewer / Sanitizer",
            redactionCount: result.redactionCount,
            reviewRequired: true,
        })
        expect(result.output).toContain("[REDACTED]")
        expect(result.output).toContain("token=[REDACTED]")
        expect(result.output).not.toContain("Bearer secret")
        expect(result.output).not.toContain("cookie-secret")
        expect(result.output).not.toContain("\"password\":\"secret\"")
        expect(result.output).not.toContain("\"ok\":true")
    })

    it("honors disabled sanitizer options", () => {
        const result = sanitizeHar(SAMPLE_HAR, {
            headers: false,
            cookies: false,
            queryStrings: false,
            postData: false,
            responseContent: false,
        })

        expect(result.redactionCount).toBe(0)
        expect(result.summary).toEqual({})
        expect(result.output).toContain("Bearer secret")
        expect(result.output).toContain("_byteflowSanitizerSummary")
    })

    it("documents aggressive defaults in sanitized exports", () => {
        const result = sanitizeHar(SAMPLE_HAR)
        const sanitized = JSON.parse(result.output)

        expect(sanitized.log._byteflowSanitizerSummary.defaults).toEqual({
            headers: true,
            cookies: true,
            queryStrings: true,
            postData: true,
            responseContent: true,
        })
    })

    it("returns parse errors without throwing", () => {
        const result = parseHarSummary("{}")

        expect(result.error).toBeTruthy()
        expect(result.entries).toEqual([])
    })

    it("handles empty, malformed, and large HAR inputs with sanitized exports", () => {
        expect(parseHarSummary("").error).toBeTruthy()
        expect(sanitizeHar("{not-json").error).toBeTruthy()

        const entries = Array.from({ length: 250 }, (_, index) => ({
            startedDateTime: "2026-06-10T10:00:00.000Z",
            time: index,
            request: {
                method: "GET",
                url: `https://api.example.com/items/${index}?token=secret-${index}&email=user${index}@example.com`,
                headers: [{ name: "Authorization", value: `Bearer secret-${index}` }],
                cookies: [{ name: "session", value: `cookie-${index}` }],
                queryString: [
                    { name: "token", value: `secret-${index}` },
                    { name: "email", value: `user${index}@example.com` },
                ],
            },
            response: {
                status: index % 2 === 0 ? 200 : 500,
                headers: [{ name: "Set-Cookie", value: `id=secret-${index}` }],
                cookies: [{ name: "id", value: `secret-${index}` }],
                content: { mimeType: "application/json", text: `{"token":"secret-${index}"}` },
            },
        }))
        const input = JSON.stringify({ log: { entries } })
        const summary = parseHarSummary(input)
        const sanitized = sanitizeHar(input)

        expect(summary.error).toBeUndefined()
        expect(summary.totalRequests).toBe(250)
        expect(summary.entries[249].url).not.toContain("secret-249")
        expect(sanitized.error).toBeUndefined()
        expect(sanitized.output).not.toContain("secret-249")
        expect(sanitized.output).not.toContain("user249@example.com")
        expect(sanitized.output).toContain("_byteflowSanitizerSummary")
        expect(sanitized.redactionCount).toBeGreaterThan(1_000)
    })
})
