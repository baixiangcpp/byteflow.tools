import {
    goStringLiteral,
    jsJsonBodyExpression,
    jsStringLiteral,
    phpStringLiteral,
    pythonJsonBodyExpression,
    pythonStringLiteral,
    rustStringLiteral,
} from "@/core/codegen/literals"
import {
    parseCurl,
    type CurlDiagnostic,
    type ParsedRequest,
} from "./parser"

export { parseCurl } from "./parser"
export type {
    CurlDataOption,
    CurlDiagnostic,
    CurlDiagnosticCode,
    CurlDiagnosticSeverity,
    CurlParseResult,
    ParsedDataPart,
    ParsedHeader,
    ParsedRequest,
} from "./parser"

export type OutputLang = "javascript" | "python" | "go" | "php" | "rust"

export function toJavaScript(req: ParsedRequest): string {
    const lines: string[] = []
    const hasHeaders = Object.keys(req.headers).length > 0
    const hasBody = !!req.data

    lines.push(`const response = await fetch(${jsStringLiteral(req.url)}, {`)
    lines.push(`  method: ${jsStringLiteral(req.method)},`)
    if (hasHeaders) {
        lines.push(`  headers: ${JSON.stringify(req.headers, null, 2).replace(/\n/g, "\n  ")},`)
    }
    if (hasBody) {
        const jsonExpression = req.dataType === "json" ? jsJsonBodyExpression(req.data) : null
        lines.push(`  body: ${jsonExpression ?? jsStringLiteral(req.data)},`)
    }
    lines.push("});")
    lines.push("")
    lines.push("const data = await response.json();")
    lines.push("console.log(data);")
    return lines.join("\n")
}

export function toPython(req: ParsedRequest): string {
    const lines: string[] = ["import requests"]
    const hasHeaders = Object.keys(req.headers).length > 0
    const method = req.method.toLowerCase()
    const args = [pythonStringLiteral(req.url)]

    if (hasHeaders) {
        lines.push("", `headers = ${JSON.stringify(req.headers, null, 4)}`)
        args.push("headers=headers")
    }

    if (req.data) {
        if (req.dataType === "json") {
            const payloadExpression = pythonJsonBodyExpression(req.data)
            if (payloadExpression) {
                lines[0] = "import json"
                lines.push("", `payload = ${payloadExpression}`)
                args.push("json=payload")
            } else {
                lines.push("", `data = ${pythonStringLiteral(req.data)}`)
                args.push("data=data")
            }
        } else {
            lines.push("", `data = ${pythonStringLiteral(req.data)}`)
            args.push("data=data")
        }
    }

    lines.push("")
    lines.push(`response = requests.${method}(${args.join(", ")})`)
    lines.push("print(response.status_code)")
    lines.push("print(response.json())")
    return lines.join("\n")
}

export function toGo(req: ParsedRequest): string {
    const lines: string[] = [
        "package main", "", "import (", "    \"fmt\"", "    \"io\"", "    \"net/http\"",
    ]
    if (req.data) lines.push("    \"strings\"")
    lines.push(")", "")
    lines.push("func main() {")

    if (req.data) {
        lines.push(`    body := strings.NewReader(${goStringLiteral(req.data)})`)
        lines.push(`    req, err := http.NewRequest(${goStringLiteral(req.method)}, ${goStringLiteral(req.url)}, body)`)
    } else {
        lines.push(`    req, err := http.NewRequest(${goStringLiteral(req.method)}, ${goStringLiteral(req.url)}, nil)`)
    }
    lines.push("    if err != nil { panic(err) }")

    for (const [key, value] of Object.entries(req.headers)) {
        lines.push(`    req.Header.Set(${goStringLiteral(key)}, ${goStringLiteral(value)})`)
    }

    lines.push("    resp, err := http.DefaultClient.Do(req)")
    lines.push("    if err != nil { panic(err) }")
    lines.push("    defer resp.Body.Close()")
    lines.push("    data, _ := io.ReadAll(resp.Body)")
    lines.push("    fmt.Println(string(data))")
    lines.push("}")
    return lines.join("\n")
}

export function toPhp(req: ParsedRequest): string {
    const lines: string[] = ["<?php", "", "$ch = curl_init();", ""]
    lines.push(`curl_setopt($ch, CURLOPT_URL, ${phpStringLiteral(req.url)});`)
    lines.push("curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);")
    if (req.method !== "GET") {
        lines.push(`curl_setopt($ch, CURLOPT_CUSTOMREQUEST, ${phpStringLiteral(req.method)});`)
    }
    if (req.data) {
        lines.push(`curl_setopt($ch, CURLOPT_POSTFIELDS, ${phpStringLiteral(req.data)});`)
    }
    const headerEntries = Object.entries(req.headers)
    if (headerEntries.length > 0) {
        lines.push("curl_setopt($ch, CURLOPT_HTTPHEADER, [")
        for (const [key, value] of headerEntries) {
            lines.push(`    ${phpStringLiteral(`${key}: ${value}`)},`)
        }
        lines.push("]);")
    }
    lines.push("")
    lines.push("$response = curl_exec($ch);")
    lines.push("curl_close($ch);")
    lines.push("echo $response;")
    return lines.join("\n")
}

export function toRust(req: ParsedRequest): string {
    const lines: string[] = [
        "use reqwest;", "", "#[tokio::main]", "async fn main() -> Result<(), Box<dyn std::error::Error>> {",
        "    let client = reqwest::Client::new();", "",
    ]
    const method = req.method.toLowerCase()
    lines.push(`    let response = client.${method}(${rustStringLiteral(req.url)})`)
    for (const [key, value] of Object.entries(req.headers)) {
        lines.push(`        .header(${rustStringLiteral(key)}, ${rustStringLiteral(value)})`)
    }
    if (req.data) {
        lines.push(`        .body(${rustStringLiteral(req.data)})`)
    }
    lines.push("        .send()")
    lines.push("        .await?;")
    lines.push("")
    lines.push("    println!(\"{}\", response.text().await?);")
    lines.push("    Ok(())")
    lines.push("}")
    return lines.join("\n")
}

function generateCode(request: ParsedRequest, lang: OutputLang): string {
    switch (lang) {
        case "javascript": return toJavaScript(request)
        case "python": return toPython(request)
        case "go": return toGo(request)
        case "php": return toPhp(request)
        case "rust": return toRust(request)
    }
}

export interface CurlConversionResult {
    code: string
    diagnostics: CurlDiagnostic[]
}

export function convertCurlToCodeResult(curl: string, lang: OutputLang): CurlConversionResult {
    if (!curl.trim()) return { code: "", diagnostics: [] }
    const parsed = parseCurl(curl)
    if (!parsed.ok) return { code: "", diagnostics: parsed.diagnostics }
    return {
        code: generateCode(parsed.request, lang),
        diagnostics: parsed.diagnostics,
    }
}

export function convertCurlToCode(curl: string, lang: OutputLang, parseError: string): string {
    const result = convertCurlToCodeResult(curl, lang)
    if (result.diagnostics.some((item) => item.severity === "error")) return parseError
    return result.code
}
