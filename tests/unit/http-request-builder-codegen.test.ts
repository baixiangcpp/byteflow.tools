import { describe, expect, it } from "vitest"
import {
    buildUrlWithQueryParams,
    generateCurl,
    generateFetch,
    generatePythonRequests,
    validateRequestUrl,
    type HeaderEntry,
    type QueryEntry,
    type HttpMethod,
} from "@/features/tools/http-request-builder/logic"

const maliciousHeaders: HeaderEntry[] = [
    {
        id: "h1",
        key: "X-Test'\nconsole.log('HEADER_INJECTED')//",
        value: "v' ; echo SHELL_INJECTED ; #'",
        enabled: true,
    },
]

const maliciousUrl = "https://api.example.com/x'; console.log('JS_INJECTED'); //'"
const maliciousBody = "x' ; echo BODY_INJECTED ; #'"

describe("http request builder codegen", () => {
    it("validates only absolute HTTP and HTTPS URLs", () => {
        expect(validateRequestUrl("https://api.example.com/users").ok).toBe(true)
        expect(validateRequestUrl("http://localhost:3000/health").ok).toBe(true)
        expect(validateRequestUrl("")).toMatchObject({ ok: false, reason: "empty" })
        expect(validateRequestUrl("/relative/path")).toMatchObject({ ok: false, reason: "invalid" })
        expect(validateRequestUrl("ftp://example.com/file")).toMatchObject({ ok: false, reason: "unsupported_protocol" })
    })

    it("appends enabled query parameters with URL encoding and stable order", () => {
        const queryParams: QueryEntry[] = [
            { id: "q1", key: "search", value: "a b", enabled: true },
            { id: "q2", key: "tag", value: "one/two", enabled: true },
            { id: "q3", key: "disabled", value: "ignored", enabled: false },
        ]

        expect(buildUrlWithQueryParams("https://api.example.com/users?active=true", queryParams))
            .toBe("https://api.example.com/users?active=true&search=a+b&tag=one%2Ftwo")
    })

    it("generates all primary HTTP methods without bodies by default", () => {
        const methods: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"]

        for (const method of methods) {
            const curl = generateCurl(method, "https://api.example.com/items", [], "none", "")
            const fetchCode = generateFetch(method, "https://api.example.com/items", [], "none", "")
            const python = generatePythonRequests(method, "https://api.example.com/items", [], "none", "")

            if (method === "GET") expect(curl).not.toContain("-X GET")
            else expect(curl).toContain(`-X ${method}`)
            expect(fetchCode).toContain(`method: "${method}"`)
            expect(python).toContain(`requests.${method.toLowerCase()}(`)
        }
    })

    it("preserves method, query, headers, auth placeholder, and body across snippets", () => {
        const headers: HeaderEntry[] = [
            { id: "h1", key: "Accept", value: "application/json", enabled: true },
            { id: "h2", key: "Authorization", value: "Bearer TOKEN_PLACEHOLDER", enabled: true },
        ]
        const url = "https://api.example.com/users?active=true"
        const body = '{ "name": "Alice" }'

        const curl = generateCurl("POST", url, headers, "json", body)
        const fetchCode = generateFetch("POST", url, headers, "json", body)
        const python = generatePythonRequests("POST", url, headers, "json", body)

        expect(curl).toContain("-X POST")
        expect(curl).toContain("'https://api.example.com/users?active=true'")
        expect(curl).toContain("-H 'Authorization: Bearer TOKEN_PLACEHOLDER'")
        expect(curl).toContain(`-d '${body}'`)

        expect(fetchCode).toContain(`fetch(${JSON.stringify(url)}, {`)
        expect(fetchCode).toContain(`method: "POST"`)
        expect(fetchCode).toContain(`"Authorization": "Bearer TOKEN_PLACEHOLDER"`)
        expect(fetchCode).toContain("body: JSON.stringify({")
        expect(fetchCode).toContain(`"name": "Alice"`)

        expect(python).toContain(`response = requests.post(${JSON.stringify(url)}, headers=headers, json=payload)`)
        expect(python).toContain(`"Authorization": "Bearer TOKEN_PLACEHOLDER"`)
        expect(python).toContain(`payload = json.loads(${JSON.stringify(body)})`)
    })

    it("omits disabled headers and applies body content types consistently", () => {
        const headers: HeaderEntry[] = [
            { id: "h1", key: "Accept", value: "application/json", enabled: true },
            { id: "h2", key: "X-Disabled", value: "secret", enabled: false },
        ]
        const formBody = "mode=test&limit=10"

        const curl = generateCurl("PATCH", "https://api.example.com/items", headers, "form-urlencoded", formBody)
        const fetchCode = generateFetch("PATCH", "https://api.example.com/items", headers, "form-urlencoded", formBody)
        const python = generatePythonRequests("PATCH", "https://api.example.com/items", headers, "form-urlencoded", formBody)

        expect(curl).toContain("-X PATCH")
        expect(curl).toContain("-H 'Content-Type: application/x-www-form-urlencoded'")
        expect(curl).not.toContain("X-Disabled")

        expect(fetchCode).toContain('"Content-Type": "application/x-www-form-urlencoded"')
        expect(fetchCode).toContain(`body: "mode=test&limit=10"`)
        expect(fetchCode).not.toContain("X-Disabled")

        expect(python).toContain('"Content-Type": "application/x-www-form-urlencoded"')
        expect(python).toContain(`data = "mode=test&limit=10"`)
        expect(python).not.toContain("X-Disabled")
    })

    it("falls back to string body syntax when JSON body is malformed", () => {
        const body = "{ invalid"

        expect(generateFetch("POST", "https://api.example.com/items", [], "json", body)).toContain(`body: "{ invalid"`)
        expect(generatePythonRequests("POST", "https://api.example.com/items", [], "json", body)).toContain(`data = "{ invalid"`)
    })

    it("escapes generated shell arguments", () => {
        const curl = generateCurl("POST", maliciousUrl, maliciousHeaders, "raw", maliciousBody)

        expect(curl).toContain("'https://api.example.com/x'\\''; console.log('\\''JS_INJECTED'\\''); //'\\'''")
        expect(curl).toContain("-d 'x'\\'' ; echo BODY_INJECTED ; #'\\'''")
        expect(curl).not.toContain(`'${maliciousBody}'`)
    })

    it("uses JavaScript string literals instead of executable interpolation", () => {
        const code = generateFetch("POST", maliciousUrl, maliciousHeaders, "raw", maliciousBody)

        expect(code).toContain(`fetch(${JSON.stringify(maliciousUrl)}, {`)
        expect(code).toContain(`body: ${JSON.stringify(maliciousBody)}`)
        expect(code).not.toContain("fetch('https://api.example.com/x';")
    })

    it("uses Python string literals for URL and body", () => {
        const code = generatePythonRequests("POST", maliciousUrl, maliciousHeaders, "raw", maliciousBody)

        expect(code).toContain(`data = ${JSON.stringify(maliciousBody)}`)
        expect(code).toContain(`response = requests.post(${JSON.stringify(maliciousUrl)}, headers=headers, data=data)`)
        expect(code).not.toContain("data = 'x' ; echo BODY_INJECTED")
    })
})
