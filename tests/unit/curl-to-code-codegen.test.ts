import { describe, expect, it } from "vitest"
import {
    convertCurlToCode,
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
    it("does not emit attacker-controlled URL as JavaScript syntax", () => {
        const code = convertCurlToCode(MALICIOUS_CURL, "javascript", "parse error")

        expect(code).toContain(`fetch(${JSON.stringify("https://api.example.com/x")}, {`)
        expect(code).not.toContain("fetch('https://api.example.com/x';")
    })

    it("does not emit attacker-controlled body as Python syntax", () => {
        const code = convertCurlToCode(MALICIOUS_CURL, "python", "parse error")

        expect(code).toContain(`data = ${JSON.stringify("x")}`)
        expect(code).not.toContain("data = 'x' ; echo BODY_INJECTED")
    })

    it("uses safe string literal encoders across generated languages", () => {
        const parsed = {
            method: "POST",
            url: "https://api.example.com/x\"; injected(); //",
            headers: { "X-Test": "v\"; injected(); //" },
            data: "body\"#; injected(); //",
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
