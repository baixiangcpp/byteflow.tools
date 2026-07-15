import { describe, expect, it } from "vitest"
import {
    convertCurlToCode,
    parseCurl,
    toGo,
    toJavaScript,
    toPhp,
    toPython,
    toRust,
} from "@/features/tools/curl-to-code/logic"

const MALICIOUS_CURL = `curl -X POST 'https://api.example.com/x'; console.log('JS_INJECTED'); //'' \\
  -H 'X-Test': 'v'; print('PY_INJECTED') #' \\
  -d 'x' ; echo BODY_INJECTED ; #''`

describe("curl to code codegen", () => {
    it("rejects shell operators before JavaScript code generation", () => {
        const parsed = parseCurl(MALICIOUS_CURL)
        const code = convertCurlToCode(MALICIOUS_CURL, "javascript", "parse error")

        expect(parsed.ok).toBe(false)
        if (!parsed.ok) expect(parsed.diagnostics.at(-1)?.code).toBe("unsupported_operator")
        expect(code).toBe("parse error")
        expect(code).not.toContain("JS_INJECTED")
    })

    it("rejects shell operators before Python code generation", () => {
        const code = convertCurlToCode(MALICIOUS_CURL, "python", "parse error")

        expect(code).toBe("parse error")
        expect(code).not.toContain("BODY_INJECTED")
    })

    it("uses safe string literal encoders across generated languages", () => {
        const parsed = {
            method: "POST",
            url: "https://api.example.com/x\"; injected(); //",
            headers: { "X-Test": "v\"; injected(); //" },
            headerEntries: [{ name: "X-Test", value: "v\"; injected(); //" }],
            data: "body\"#; injected(); //",
            dataParts: [{ option: "--data-raw" as const, value: "body\"#; injected(); //" }],
            dataType: "raw" as const,
        }

        expect(toJavaScript(parsed)).toContain(`fetch(${JSON.stringify(parsed.url)}, {`)
        expect(toPython(parsed)).toContain(`requests.post(${JSON.stringify(parsed.url)}`)
        expect(toGo(parsed)).toContain(`http.NewRequest("POST", ${JSON.stringify(parsed.url)}, body)`)
        expect(toPhp(parsed)).toContain("curl_setopt($ch, CURLOPT_URL, 'https://api.example.com/x\"; injected(); //');")
        expect(toRust(parsed)).toContain('client.post(r#"https://api.example.com/x"; injected(); //"#)')
        expect(toRust(parsed)).toContain('body(r##"body"#; injected(); //"##)')
    })
})
