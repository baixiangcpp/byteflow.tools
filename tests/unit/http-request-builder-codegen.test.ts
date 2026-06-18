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
