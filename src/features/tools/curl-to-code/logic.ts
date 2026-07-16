import {
    goStringLiteral,
    phpStringLiteral,
} from "@/core/codegen/literals"
import {
    emitJavaScriptFetch,
    emitPythonRequests,
    emitRustReqwest,
    normalizeHttpRequest,
    type NormalizedHttpRequest,
} from "@/core/codegen/http-request"
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

function effectiveHeaders(req: ParsedRequest): Array<[string, string]> {
    const headers = Object.entries(req.headers)
    const hasContentType = headers.some(([name]) => name.toLowerCase() === "content-type")
    if (req.dataParts.length > 0 && !hasContentType) {
        headers.push(["Content-Type", "application/x-www-form-urlencoded"])
    }
    return headers
}

function normalizedParsedRequest(req: ParsedRequest): NormalizedHttpRequest {
    return normalizeHttpRequest({
        method: req.method,
        url: req.url,
        headers: effectiveHeaders(req).map(([name, value]) => ({ name, value })),
        body: req.dataParts.length > 0
            ? { type: req.dataType === "form" ? "form" : req.dataType, value: req.data }
            : null,
    })
}

export function toJavaScript(req: ParsedRequest): string {
    return emitJavaScriptFetch(normalizedParsedRequest(req)).code
}

export function toPython(req: ParsedRequest): string {
    return emitPythonRequests(normalizedParsedRequest(req)).code
}

export function toGo(req: ParsedRequest): string {
    const hasBody = req.dataParts.length > 0
    const lines: string[] = [
        "package main", "", "import (", "    \"fmt\"", "    \"io\"", "    \"net/http\"",
    ]
    if (hasBody) lines.push("    \"strings\"")
    lines.push(")", "")
    lines.push("func main() {")

    if (hasBody) {
        lines.push(`    body := strings.NewReader(${goStringLiteral(req.data)})`)
        lines.push(`    req, err := http.NewRequest(${goStringLiteral(req.method)}, ${goStringLiteral(req.url)}, body)`)
    } else {
        lines.push(`    req, err := http.NewRequest(${goStringLiteral(req.method)}, ${goStringLiteral(req.url)}, nil)`)
    }
    lines.push("    if err != nil { panic(err) }")

    for (const [key, value] of effectiveHeaders(req)) {
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
    if (req.method !== "GET" || req.dataParts.length > 0) {
        lines.push(`curl_setopt($ch, CURLOPT_CUSTOMREQUEST, ${phpStringLiteral(req.method)});`)
    }
    if (req.dataParts.length > 0) {
        lines.push(`curl_setopt($ch, CURLOPT_POSTFIELDS, ${phpStringLiteral(req.data)});`)
    }
    const headerEntries = effectiveHeaders(req)
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
    return emitRustReqwest(normalizedParsedRequest(req)).code
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
