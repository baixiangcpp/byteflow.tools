import { describe, expect, it } from "vitest"
import {
    parseCurl,
    type CurlDiagnosticCode,
    type CurlParseResult,
} from "@/features/tools/curl-to-code/logic"

function expectSuccess(command: string): Extract<CurlParseResult, { ok: true }> {
    const result = parseCurl(command)
    expect(result.ok, JSON.stringify(result)).toBe(true)
    if (!result.ok) throw new Error(`Expected parse success: ${JSON.stringify(result.diagnostics)}`)
    return result
}

function expectFailure(command: string, code: CurlDiagnosticCode): Extract<CurlParseResult, { ok: false }> {
    const result = parseCurl(command)
    expect(result.ok, JSON.stringify(result)).toBe(false)
    if (result.ok) throw new Error(`Expected parse failure: ${JSON.stringify(result.request)}`)
    expect(result.diagnostics.at(-1)).toMatchObject({ code, severity: "error" })
    expect(result.diagnostics.at(-1)?.position).toBeGreaterThan(0)
    return result
}

describe("curl to code parser", () => {
    it("preserves a single-quoted JSON body containing double quotes", () => {
        const result = expectSuccess(`curl https://api.example.com/users \\
  -H 'Content-Type: application/json' \\
  -d '{"name":"Ada","enabled":true}'`)

        expect(result.request).toMatchObject({
            method: "POST",
            url: "https://api.example.com/users",
            headers: { "Content-Type": "application/json" },
            data: '{"name":"Ada","enabled":true}',
            dataType: "json",
        })
        expect(JSON.parse(result.request.data)).toEqual({ name: "Ada", enabled: true })
    })

    it("applies shell-style double-quote and backslash escaping without executing expansions", () => {
        const command = String.raw`curl --request=POST --url="https://api.example.com/a b" --header="X-Path: C:\\temp" --data-raw="{\"message\":\"Ada \\\"Lovelace\\\"\",\"path\":\"C:\\\\tmp\"}"`
        const result = expectSuccess(command)

        expect(result.request.method).toBe("POST")
        expect(result.request.url).toBe("https://api.example.com/a b")
        expect(result.request.headers).toEqual({ "X-Path": "C:\\temp" })
        expect(JSON.parse(result.request.data)).toEqual({
            message: 'Ada "Lovelace"',
            path: "C:\\tmp",
        })
    })

    it.each([
        ['curl https://api.example.com -H "Authorization: Bearer $TOKEN"', "$TOKEN"],
        ['curl https://api.example.com -H "Authorization: Bearer ${TOKEN}"', "${TOKEN}"],
    ])("rejects unsupported shell expansion in %j", (command, token) => {
        const result = expectFailure(command, "unsupported_operator")

        expect(result.diagnostics.at(-1)?.token).toBe(token)
    })

    it("keeps escaped and single-quoted dollar signs literal", () => {
        const escaped = expectSuccess(String.raw`curl https://api.example.com -H "X-Token: \$TOKEN"`)
        const singleQuoted = expectSuccess("curl https://api.example.com -H 'X-Token: $TOKEN'")

        expect(escaped.request.headers).toEqual({ "X-Token": "$TOKEN" })
        expect(singleQuoted.request.headers).toEqual({ "X-Token": "$TOKEN" })
    })

    it("recognizes long aliases, equals forms, and unquoted headers", () => {
        const result = expectSuccess(
            "curl --request POST --header 'Accept: application/json' -H X-Test:value " +
            "--url=https://api.example.com/items --data-binary='mode=test'",
        )

        expect(result.request).toMatchObject({
            method: "POST",
            url: "https://api.example.com/items",
            headers: {
                Accept: "application/json",
                "X-Test": "value",
            },
            data: "mode=test",
            dataType: "form",
        })
        expect(result.request.headerEntries).toEqual([
            { name: "Accept", value: "application/json" },
            { name: "X-Test", value: "value" },
        ])
    })

    it("derives body semantics from Content-Type instead of payload shape", () => {
        const defaultJsonShaped = expectSuccess(`curl https://api.example.com -d '{"id":9007199254740993}'`)
        const explicitJson = expectSuccess(
            "curl https://api.example.com -H 'content-type: application/problem+json; charset=utf-8' -d 'plain text'",
        )
        const explicitText = expectSuccess(
            "curl https://api.example.com -H 'Content-Type: text/plain' -d 'mode=test'",
        )

        expect(defaultJsonShaped.request.dataType).toBe("form")
        expect(explicitJson.request.dataType).toBe("json")
        expect(explicitText.request.dataType).toBe("raw")
    })

    it("combines repeated data flags in order and preserves an explicit GET", () => {
        const result = expectSuccess(
            "curl -X GET https://api.example.com/search " +
            "-d 'a=1' --data 'b=two' --data-raw 'q=hello world'",
        )

        expect(result.request.method).toBe("GET")
        expect(result.request.data).toBe("a=1&b=two&q=hello world")
        expect(result.request.dataParts).toEqual([
            { option: "-d", value: "a=1" },
            { option: "--data", value: "b=two" },
            { option: "--data-raw", value: "q=hello world" },
        ])
    })

    it("preserves repeated header order and warns when generated headers use last-wins semantics", () => {
        const result = expectSuccess(
            "curl https://api.example.com -H 'X-Test: first' --header 'x-test: second'",
        )

        expect(result.request.headerEntries).toEqual([
            { name: "X-Test", value: "first" },
            { name: "x-test", value: "second" },
        ])
        expect(result.request.headers).toEqual({ "x-test": "second" })
        expect(result.diagnostics).toEqual([
            expect.objectContaining({
                code: "duplicate_header",
                severity: "warning",
                token: "x-test",
            }),
        ])
    })

    it.each(["\n", "\r\n"])("supports %j line continuations", (newline) => {
        const command = [
            "curl https://api.example.com/users \\",
            "  --header 'X-Test: continued' \\",
            "  --data-raw 'hello world'",
        ].join(newline)

        const result = expectSuccess(command)
        expect(result.request.headers).toEqual({ "X-Test": "continued" })
        expect(result.request.data).toBe("hello world")
    })

    it("supports escaped spaces and operators in unquoted arguments", () => {
        const result = expectSuccess(String.raw`curl https://api.example.com/search?q=one\&page=2 -H X-Name:Ada\ Lovelace`)

        expect(result.request.url).toBe("https://api.example.com/search?q=one&page=2")
        expect(result.request.headers).toEqual({ "X-Name": "Ada Lovelace" })
    })

    it("accepts an explicitly empty data argument and infers POST", () => {
        const result = expectSuccess("curl https://api.example.com -d ''")

        expect(result.request.method).toBe("POST")
        expect(result.request.dataParts).toEqual([{ option: "-d", value: "" }])
        expect(result.request.data).toBe("")
    })

    it.each([
        ["curl https://api.example.com --compressed", "unsupported_option", "--compressed"],
        ["curl https://api.example.com --data-urlencode 'q=hello world'", "unsupported_option", "--data-urlencode"],
        ["curl https://api.example.com; echo injected", "unsupported_operator", ";"],
        ["curl https://api.example.com && echo injected", "unsupported_operator", "&&"],
        ["curl https://api.example.com | cat", "unsupported_operator", "|"],
        ["curl https://api.example.com\necho injected", "unsupported_operator", "newline"],
        ['curl https://api.example.com -H "X-Test: $(whoami)"', "unsupported_operator", "$("],
    ] as const)("rejects unsupported syntax in %j", (command, code, token) => {
        const result = expectFailure(command, code)
        expect(result.diagnostics.at(-1)?.token).toBe(token)
    })

    it.each([
        ["curl https://api.example.com -d 'unterminated", "unterminated_quote"],
        ['curl https://api.example.com -H "unterminated', "unterminated_quote"],
        ["curl https://api.example.com \\", "dangling_escape"],
    ] as const)("rejects malformed quoting in %j", (command, code) => {
        expectFailure(command, code)
    })

    it.each([
        ["wget https://api.example.com", "expected_curl"],
        ["curl", "missing_url"],
        ["curl api.example.com", "invalid_url"],
        ["curl https://api.example.com https://other.example.com", "multiple_urls"],
        ["curl https://api.example.com trailing", "unexpected_argument"],
        ["curl https://api.example.com --request", "missing_option_value"],
        ["curl https://api.example.com -H invalid", "invalid_header"],
        ["curl --request 'BAD METHOD' https://api.example.com", "invalid_method"],
    ] as const)("returns a structured %s diagnostic", (command, code) => {
        expectFailure(command, code)
    })

    it("rejects data sources that would read a file or stdin", () => {
        expectFailure("curl https://api.example.com -d @payload.json", "unsupported_data_file")
        expectFailure("curl https://api.example.com --data-binary @-", "unsupported_data_file")

        const raw = expectSuccess("curl https://api.example.com --data-raw @literal")
        expect(raw.request.data).toBe("@literal")
    })
})
