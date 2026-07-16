import {
    jsStringLiteral,
    pythonJsonBodyExpression,
    pythonStringLiteral,
    rustStringLiteral,
} from "./literals"

export type NormalizedHttpBodyType = "json" | "raw" | "form"

export interface NormalizedHttpHeader {
    name: string
    value: string
}

export interface NormalizedHttpBody {
    type: NormalizedHttpBodyType
    value: string
}

export interface NormalizedHttpRequest {
    method: string
    url: string
    headers: NormalizedHttpHeader[]
    body: NormalizedHttpBody | null
}

export interface HttpCodegenResult {
    code: string
    bodyOmitted: boolean
}

const FETCH_BODYLESS_METHODS = new Set(["GET", "HEAD"])
const PYTHON_CONVENIENCE_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"])
const RUST_CONVENIENCE_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"])

export function normalizeHttpRequest(request: {
    method: string
    url: string
    headers?: Iterable<NormalizedHttpHeader>
    body?: NormalizedHttpBody | null
}): NormalizedHttpRequest {
    return {
        method: request.method.toUpperCase(),
        url: request.url,
        headers: Array.from(request.headers ?? []),
        body: request.body ?? null,
    }
}

export function fetchMethodAllowsBody(method: string): boolean {
    return !FETCH_BODYLESS_METHODS.has(method.toUpperCase())
}

function headersRecord(headers: NormalizedHttpHeader[]): Record<string, string> {
    const result = Object.create(null) as Record<string, string>
    for (const header of headers) result[header.name] = header.value
    return result
}

export function emitJavaScriptFetch(request: NormalizedHttpRequest): HttpCodegenResult {
    const optionLines = [`  method: ${jsStringLiteral(request.method)},`]
    const headers = headersRecord(request.headers)
    const bodyOmitted = Boolean(request.body && !fetchMethodAllowsBody(request.method))

    if (Object.keys(headers).length > 0) {
        optionLines.push(`  headers: ${JSON.stringify(headers, null, 2).replace(/\n/g, "\n  ")},`)
    }
    if (request.body && !bodyOmitted) {
        optionLines.push(`  body: ${jsStringLiteral(request.body.value)},`)
    }
    if (bodyOmitted) {
        optionLines.push("  // Fetch does not allow a body for GET or HEAD; the configured body was omitted.")
    }

    return {
        bodyOmitted,
        code: [
            `const response = await fetch(${jsStringLiteral(request.url)}, {`,
            ...optionLines,
            "});",
            "const data = await response.text();",
            "console.log(data);",
        ].join("\n"),
    }
}

export function emitPythonRequests(request: NormalizedHttpRequest): HttpCodegenResult {
    const imports = ["import requests"]
    const lines: string[] = []
    const args = [pythonStringLiteral(request.url)]
    const headers = headersRecord(request.headers)

    if (Object.keys(headers).length > 0) {
        lines.push(`headers = ${JSON.stringify(headers, null, 4)}`, "")
        args.push("headers=headers")
    }

    if (request.body) {
        if (request.body.type === "json") {
            const payloadExpression = pythonJsonBodyExpression(request.body.value)
            if (payloadExpression) {
                imports.unshift("import json")
                lines.push(`payload = ${payloadExpression}`, "")
                args.push("json=payload")
            } else {
                lines.push(`data = ${pythonStringLiteral(request.body.value)}`, "")
                args.push("data=data")
            }
        } else {
            lines.push(`data = ${pythonStringLiteral(request.body.value)}`, "")
            args.push("data=data")
        }
    }

    const method = request.method.toUpperCase()
    const call = PYTHON_CONVENIENCE_METHODS.has(method)
        ? `requests.${method.toLowerCase()}(${args.join(", ")})`
        : `requests.request(${pythonStringLiteral(method)}, ${args.join(", ")})`

    return {
        bodyOmitted: false,
        code: [
            ...imports,
            "",
            ...lines,
            `response = ${call}`,
            "print(response.status_code)",
            "print(response.text)",
        ].join("\n"),
    }
}

export function emitRustReqwest(request: NormalizedHttpRequest): HttpCodegenResult {
    const lines: string[] = [
        "use reqwest;", "", "#[tokio::main]", "async fn main() -> Result<(), Box<dyn std::error::Error>> {",
        "    let client = reqwest::Client::new();", "",
    ]
    const method = request.method.toUpperCase()
    const requestBuilder = RUST_CONVENIENCE_METHODS.has(method)
        ? `client.${method.toLowerCase()}(${rustStringLiteral(request.url)})`
        : `client.request(reqwest::Method::from_bytes(${rustStringLiteral(method)}.as_bytes())?, ${rustStringLiteral(request.url)})`
    lines.push(`    let response = ${requestBuilder}`)
    for (const header of request.headers) {
        lines.push(`        .header(${rustStringLiteral(header.name)}, ${rustStringLiteral(header.value)})`)
    }
    if (request.body) {
        lines.push(`        .body(${rustStringLiteral(request.body.value)})`)
    }
    lines.push("        .send()")
    lines.push("        .await?;")
    lines.push("")
    lines.push("    println!(\"{}\", response.text().await?);")
    lines.push("    Ok(())")
    lines.push("}")

    return { code: lines.join("\n"), bodyOmitted: false }
}
