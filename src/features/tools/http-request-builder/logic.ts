import {
    jsJsonBodyExpression,
    jsStringLiteral,
    pythonJsonBodyExpression,
    pythonStringLiteral,
    shellSingleQuote,
} from "@/core/codegen/literals"

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS"
export type BodyType = "none" | "json" | "raw" | "form-urlencoded"

export interface HeaderEntry {
    id: string
    key: string
    value: string
    enabled: boolean
}

function enabledHeaders(headers: HeaderEntry[]): HeaderEntry[] {
    return headers.filter((header) => header.enabled && header.key.trim())
}

function headersObject(headers: HeaderEntry[], bodyType?: BodyType): Record<string, string> {
    const result: Record<string, string> = {}
    for (const header of enabledHeaders(headers)) {
        result[header.key] = header.value
    }
    if (bodyType === "json") result["Content-Type"] = "application/json"
    if (bodyType === "form-urlencoded") result["Content-Type"] = "application/x-www-form-urlencoded"
    return result
}

export function generateCurl(method: HttpMethod, url: string, headers: HeaderEntry[], bodyType: BodyType, body: string): string {
    const parts = ["curl"]
    if (method !== "GET") parts.push(`-X ${method}`)
    parts.push(shellSingleQuote(url))

    for (const header of enabledHeaders(headers)) {
        parts.push(`-H ${shellSingleQuote(`${header.key}: ${header.value}`)}`)
    }

    if (bodyType === "json" && body) {
        parts.push(`-H ${shellSingleQuote("Content-Type: application/json")}`)
        parts.push(`-d ${shellSingleQuote(body)}`)
    } else if (bodyType === "raw" && body) {
        parts.push(`-d ${shellSingleQuote(body)}`)
    } else if (bodyType === "form-urlencoded" && body) {
        parts.push(`-H ${shellSingleQuote("Content-Type: application/x-www-form-urlencoded")}`)
        parts.push(`--data-urlencode ${shellSingleQuote(body)}`)
    }

    return parts.join(" \\\n  ")
}

export function generateFetch(method: HttpMethod, url: string, headers: HeaderEntry[], bodyType: BodyType, body: string): string {
    const headersObj = headersObject(headers, bodyType)
    const optionLines = [`  method: ${jsStringLiteral(method)},`]

    if (Object.keys(headersObj).length > 0) {
        optionLines.push(`  headers: ${JSON.stringify(headersObj, null, 2).replace(/\n/g, "\n  ")},`)
    }

    if (body && bodyType !== "none") {
        const jsonExpression = bodyType === "json" ? jsJsonBodyExpression(body) : null
        optionLines.push(`  body: ${jsonExpression ?? jsStringLiteral(body)},`)
    }

    return [
        `const response = await fetch(${jsStringLiteral(url)}, {`,
        ...optionLines,
        "});",
        "const data = await response.json();",
        "console.log(data);",
    ].join("\n")
}

export function generatePythonRequests(method: HttpMethod, url: string, headers: HeaderEntry[], bodyType: BodyType, body: string): string {
    const lines = ["import requests"]
    const headersObj = headersObject(headers)
    const methodLower = method.toLowerCase()
    const callArgs = [pythonStringLiteral(url)]

    if (Object.keys(headersObj).length > 0) {
        lines.push("", `headers = ${JSON.stringify(headersObj, null, 4)}`)
        callArgs.push("headers=headers")
    }

    if (body && bodyType !== "none") {
        if (bodyType === "json") {
            const payloadExpression = pythonJsonBodyExpression(body)
            if (payloadExpression) {
                lines[0] = "import json"
                lines.push("", `payload = ${payloadExpression}`)
                callArgs.push("json=payload")
            } else {
                lines.push("", `data = ${pythonStringLiteral(body)}`)
                callArgs.push("data=data")
            }
        } else {
            lines.push("", `data = ${pythonStringLiteral(body)}`)
            callArgs.push("data=data")
        }
    }

    lines.push("")
    lines.push(`response = requests.${methodLower}(${callArgs.join(", ")})`)
    lines.push("print(response.status_code)")
    lines.push("print(response.json())")

    return lines.join("\n")
}
