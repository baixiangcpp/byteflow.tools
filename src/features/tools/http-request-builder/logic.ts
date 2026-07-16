import {
    shellSingleQuote,
} from "@/core/codegen/literals"
import {
    emitJavaScriptFetch,
    emitPythonRequests,
    normalizeHttpRequest,
    type NormalizedHttpBody,
    type NormalizedHttpHeader,
} from "@/core/codegen/http-request"

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS"
export type BodyType = "none" | "json" | "raw" | "form-urlencoded"

export interface HeaderEntry {
    id: string
    key: string
    value: string
    enabled: boolean
}

export interface QueryEntry {
    id: string
    key: string
    value: string
    enabled: boolean
}

export type UrlValidationResult =
    | { ok: true; url: string }
    | { ok: false; reason: "empty" | "invalid" | "unsupported_protocol"; message: string }

function enabledHeaders(headers: HeaderEntry[]): HeaderEntry[] {
    return headers.filter((header) => header.enabled && header.key.trim())
}

function enabledQueryParams(queryParams: QueryEntry[]): QueryEntry[] {
    return queryParams.filter((param) => param.enabled && param.key.trim())
}

function normalizedHeaders(headers: HeaderEntry[], bodyType?: BodyType): NormalizedHttpHeader[] {
    const result = enabledHeaders(headers).map((header) => ({ name: header.key, value: header.value }))
    if (bodyType === "json") result.push({ name: "Content-Type", value: "application/json" })
    if (bodyType === "form-urlencoded") result.push({ name: "Content-Type", value: "application/x-www-form-urlencoded" })
    return result
}

function normalizedBody(bodyType: BodyType, body: string): NormalizedHttpBody | null {
    if (!body || bodyType === "none") return null
    return {
        type: bodyType === "form-urlencoded" ? "form" : bodyType,
        value: body,
    }
}

function normalizedBuilderRequest(method: HttpMethod, url: string, headers: HeaderEntry[], bodyType: BodyType, body: string) {
    return normalizeHttpRequest({
        method,
        url,
        headers: normalizedHeaders(headers, bodyType),
        body: normalizedBody(bodyType, body),
    })
}

export function validateRequestUrl(url: string): UrlValidationResult {
    if (!url.trim()) {
        return {
            ok: false,
            reason: "empty",
            message: "Enter an absolute HTTP or HTTPS URL.",
        }
    }

    try {
        const parsed = new URL(url)
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            return {
                ok: false,
                reason: "unsupported_protocol",
                message: "Use an http:// or https:// URL.",
            }
        }
        return { ok: true, url: parsed.toString() }
    } catch {
        return {
            ok: false,
            reason: "invalid",
            message: "Enter a valid absolute URL, for example https://api.example.com/users.",
        }
    }
}

export function buildUrlWithQueryParams(url: string, queryParams: QueryEntry[]): string {
    const parsed = new URL(url)
    for (const param of enabledQueryParams(queryParams)) {
        parsed.searchParams.append(param.key, param.value)
    }
    return parsed.toString()
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
        parts.push(`--data-raw ${shellSingleQuote(body)}`)
    }

    return parts.join(" \\\n  ")
}

export function generateFetch(method: HttpMethod, url: string, headers: HeaderEntry[], bodyType: BodyType, body: string): string {
    return emitJavaScriptFetch(normalizedBuilderRequest(method, url, headers, bodyType, body)).code
}

export function generatePythonRequests(method: HttpMethod, url: string, headers: HeaderEntry[], bodyType: BodyType, body: string): string {
    return emitPythonRequests(normalizedBuilderRequest(method, url, headers, bodyType, body)).code
}
