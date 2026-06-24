import { describe, expect, it } from "vitest"
import {
    generateCurl,
    generateFetch,
    generatePythonRequests,
    type HeaderEntry,
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
