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

    it("keeps Python imports executable for JSON payloads and reads responses as text", () => {
        const parsed = parseCurl(`curl https://api.example.com/items -H 'Content-Type: application/json' -d '{"ok":true}'`)
        expect(parsed.ok).toBe(true)
        if (!parsed.ok) return

        const code = toPython(parsed.request)
        expect(code).toContain("import json")
        expect(code).toContain("import requests")
        expect(code).toContain("requests.post(")
        expect(code).toContain("print(response.text)")
        expect(code).not.toContain("response.json()")
    })

    it("preserves JSON text exactly in Fetch output", () => {
        const body = '{\n  "id": 900719925474099312345,\n  "role": "first",\n  "role": "last"\n}\n'
        const parsed = parseCurl(`curl https://api.example.com/items -H 'Content-Type: application/json' -d '${body}'`)
        expect(parsed.ok).toBe(true)
        if (!parsed.ok) return

        const code = toJavaScript(parsed.request)
        expect(code).toContain(`body: ${JSON.stringify(body)}`)
        expect(code).not.toContain("JSON.parse(")
        expect(code).not.toContain("JSON.stringify(")
    })

    it("preserves cURL's default form Content-Type in every generated language", () => {
        const body = '{"id":900719925474099312345}'
        const parsed = parseCurl(`curl https://api.example.com/items -d '${body}'`)
        expect(parsed.ok).toBe(true)
        if (!parsed.ok) return

        const javascript = toJavaScript(parsed.request)
        const python = toPython(parsed.request)
        const go = toGo(parsed.request)
        const php = toPhp(parsed.request)
        const rust = toRust(parsed.request)
        const outputs = [javascript, python, go, php, rust]
        for (const code of outputs) {
            expect(code).toContain("application/x-www-form-urlencoded")
        }
        expect(javascript).toContain(`body: ${JSON.stringify(body)}`)
        expect(python).toContain(`data = ${JSON.stringify(body)}`)
        expect(python).not.toContain("json.loads(")
        expect(go).toContain(`strings.NewReader(${JSON.stringify(body)})`)
        expect(php).toContain(`CURLOPT_POSTFIELDS, '${body}'`)
        expect(rust).toContain(`.body(r#"${body}"#)`)
    })

    it("uses generic request APIs for custom Python and Rust methods", () => {
        const custom = parseCurl("curl -X PROPFIND https://api.example.com/resource")
        const options = parseCurl("curl -X OPTIONS https://api.example.com/resource")
        expect(custom.ok).toBe(true)
        expect(options.ok).toBe(true)
        if (!custom.ok || !options.ok) return

        expect(toPython(custom.request)).toContain('requests.request("PROPFIND", "https://api.example.com/resource")')
        expect(toRust(custom.request)).toContain('client.request(reqwest::Method::from_bytes(r"PROPFIND".as_bytes())?,')
        expect(toRust(options.request)).toContain('client.request(reqwest::Method::from_bytes(r"OPTIONS".as_bytes())?,')
    })

    it("omits an explicit GET body only from Fetch output", () => {
        const parsed = parseCurl("curl -X GET https://api.example.com/search -d 'q=test'")
        expect(parsed.ok).toBe(true)
        if (!parsed.ok) return

        expect(toJavaScript(parsed.request)).not.toContain('body: "q=test"')
        expect(toJavaScript(parsed.request)).toContain("configured body was omitted")
        expect(toPython(parsed.request)).toContain('data = "q=test"')
        expect(toGo(parsed.request)).toContain('strings.NewReader("q=test")')
    })

    it.each(["GET", "HEAD", "DELETE"])("preserves an explicit %s method with a body across emitters", (method) => {
        const parsed = parseCurl(`curl -X ${method} https://api.example.com/items -d 'q=1'`)
        expect(parsed.ok).toBe(true)
        if (!parsed.ok) return

        expect(toJavaScript(parsed.request)).toContain(`method: ${JSON.stringify(method)}`)
        expect(toPython(parsed.request)).toContain(`requests.${method.toLowerCase()}(`)
        expect(toGo(parsed.request)).toContain(`http.NewRequest(${JSON.stringify(method)},`)
        expect(toPhp(parsed.request)).toContain(`CURLOPT_CUSTOMREQUEST, '${method}'`)
        expect(toRust(parsed.request)).toContain(`client.${method.toLowerCase()}(`)
    })

    it("preserves an explicitly empty request body in non-Fetch emitters", () => {
        const parsed = parseCurl("curl https://api.example.com/items -d ''")
        expect(parsed.ok).toBe(true)
        if (!parsed.ok) return

        expect(toPython(parsed.request)).toContain('data = ""')
        expect(toGo(parsed.request)).toContain('strings.NewReader("")')
        expect(toPhp(parsed.request)).toContain("CURLOPT_POSTFIELDS, ''")
        expect(toRust(parsed.request)).toContain('.body(r"")')
    })
})
