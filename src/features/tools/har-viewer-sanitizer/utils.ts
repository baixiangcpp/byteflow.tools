export interface HarEntrySummary {
    index: number
    method: string
    /** Display-only URL with query values and hash fragments redacted. */
    url: string
    status: number
    mimeType: string
    time: number
    startedDateTime: string
}

export interface HarFinding {
    path: string
    type: "header" | "cookie" | "query" | "postData" | "content"
    label: string
}

export interface HarParseResult {
    entries: HarEntrySummary[]
    totalRequests: number
    totalTime: number
    statusCounts: Record<string, number>
    hostCounts: Record<string, number>
    error?: string
}

export interface HarSanitizeOptions {
    headers: boolean
    cookies: boolean
    queryStrings: boolean
    postData: boolean
    responseContent: boolean
}

export interface HarSanitizeResult {
    output: string
    findings: HarFinding[]
    redactionCount: number
    summary: Partial<Record<HarFinding["type"], number>>
    error?: string
}

export const DEFAULT_HAR_SANITIZE_OPTIONS: HarSanitizeOptions = {
    headers: true,
    cookies: true,
    queryStrings: true,
    postData: true,
    responseContent: true,
}

const SENSITIVE_HEADER_NAMES = new Set([
    "authorization",
    "cookie",
    "set-cookie",
    "proxy-authorization",
    "x-api-key",
    "x-auth-token",
    "x-csrf-token",
    "x-xsrf-token",
    "x-amz-security-token",
])

type HarNameValue = {
    name?: unknown
    value?: unknown
}

type HarEntryRecord = {
    startedDateTime?: unknown
    time?: unknown
    request?: {
        method?: unknown
        url?: unknown
        headers?: HarNameValue[]
        cookies?: HarNameValue[]
        queryString?: HarNameValue[]
        postData?: {
            text?: unknown
        }
    }
    response?: {
        status?: unknown
        headers?: HarNameValue[]
        cookies?: HarNameValue[]
        content?: {
            mimeType?: unknown
            text?: unknown
        }
    }
}

type HarFileRecord = {
    log: {
        _byteflowSanitizerSummary?: unknown
        entries: HarEntryRecord[]
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object"
}

function parseHar(input: string): HarFileRecord {
    const data = JSON.parse(input)
    if (!isRecord(data) || !isRecord(data.log) || !Array.isArray(data.log.entries)) {
        throw new Error("Input is not a valid HAR object with log.entries.")
    }
    return data as HarFileRecord
}

function safeHost(rawUrl: string): string {
    try {
        return new URL(rawUrl).host
    } catch {
        return "(invalid URL)"
    }
}

export function sanitizeDisplayUrl(rawUrl: string): string {
    try {
        const url = new URL(rawUrl)
        for (const key of Array.from(url.searchParams.keys())) {
            url.searchParams.set(key, "[REDACTED]")
        }
        if (url.hash) {
            url.hash = "#[REDACTED]"
        }
        return url.toString().replaceAll("%5BREDACTED%5D", "[REDACTED]")
    } catch {
        return rawUrl
            .replace(/([?&][^=&#]+)=([^&#]*)/g, "$1=[REDACTED]")
            .replace(/#.+$/g, "#[REDACTED]")
    }
}

export function parseHarSummary(input: string): HarParseResult {
    try {
        const har = parseHar(input)
        const statusCounts: Record<string, number> = {}
        const hostCounts: Record<string, number> = {}
        let totalTime = 0

        const entries: HarEntrySummary[] = har.log.entries.map((entry, index) => {
            const rawUrl = String(entry.request?.url || "")
            const status = Number(entry.response?.status || 0)
            const time = Number(entry.time || 0)
            const statusGroup = status > 0 ? `${Math.floor(status / 100)}xx` : "unknown"
            statusCounts[statusGroup] = (statusCounts[statusGroup] || 0) + 1
            const host = safeHost(rawUrl)
            hostCounts[host] = (hostCounts[host] || 0) + 1
            totalTime += time

            return {
                index,
                method: String(entry.request?.method || ""),
                url: sanitizeDisplayUrl(rawUrl),
                status,
                mimeType: String(entry.response?.content?.mimeType || ""),
                time,
                startedDateTime: String(entry.startedDateTime || ""),
            }
        })

        return {
            entries,
            totalRequests: entries.length,
            totalTime,
            statusCounts,
            hostCounts,
        }
    } catch (error) {
        return {
            entries: [],
            totalRequests: 0,
            totalTime: 0,
            statusCounts: {},
            hostCounts: {},
            error: error instanceof Error ? error.message : "Unable to parse HAR.",
        }
    }
}

function redactNameValueList(items: HarNameValue[] | undefined, path: string, findings: HarFinding[], type: HarFinding["type"], shouldRedact: (name: string) => boolean) {
    if (!Array.isArray(items)) return
    items.forEach((item, index) => {
        const name = String(item?.name || "")
        if (!item || typeof item !== "object" || !shouldRedact(name)) return
        if (typeof item.value === "string" && item.value !== "[REDACTED]") {
            item.value = "[REDACTED]"
            findings.push({ path: `${path}[${index}].value`, type, label: name })
        }
    })
}

function sanitizeUrl(rawUrl: string, path: string, findings: HarFinding[]): string {
    try {
        const url = new URL(rawUrl)
        const keys = Array.from(url.searchParams.keys())
        for (const key of keys) {
            url.searchParams.set(key, "[REDACTED]")
            findings.push({ path: `${path}.query.${key}`, type: "query", label: key })
        }
        if (url.hash) {
            url.hash = "#[REDACTED]"
            findings.push({ path: `${path}.hash`, type: "query", label: "hash fragment" })
        }
        return url.toString().replaceAll("%5BREDACTED%5D", "[REDACTED]")
    } catch {
        const redacted = sanitizeDisplayUrl(rawUrl)
        if (redacted !== rawUrl) {
            findings.push({ path, type: "query", label: "URL query or fragment" })
        }
        return redacted
    }
}

function summarizeHarFindings(findings: HarFinding[]): Partial<Record<HarFinding["type"], number>> {
    return findings.reduce((summary, finding) => {
        summary[finding.type] = (summary[finding.type] || 0) + 1
        return summary
    }, {} as Partial<Record<HarFinding["type"], number>>)
}

export function sanitizeHar(input: string, options: HarSanitizeOptions = DEFAULT_HAR_SANITIZE_OPTIONS): HarSanitizeResult {
    try {
        const har = parseHar(input)
        const findings: HarFinding[] = []

        har.log.entries.forEach((entry, index) => {
            const base = `log.entries[${index}]`
            if (options.headers) {
                redactNameValueList(entry.request?.headers, `${base}.request.headers`, findings, "header", (name) => SENSITIVE_HEADER_NAMES.has(name.toLowerCase()))
                redactNameValueList(entry.response?.headers, `${base}.response.headers`, findings, "header", (name) => SENSITIVE_HEADER_NAMES.has(name.toLowerCase()))
            }
            if (options.cookies) {
                redactNameValueList(entry.request?.cookies, `${base}.request.cookies`, findings, "cookie", () => true)
                redactNameValueList(entry.response?.cookies, `${base}.response.cookies`, findings, "cookie", () => true)
            }
            if (options.queryStrings) {
                if (entry.request?.url) entry.request.url = sanitizeUrl(String(entry.request.url), `${base}.request.url`, findings)
                redactNameValueList(entry.request?.queryString, `${base}.request.queryString`, findings, "query", () => true)
            }
            if (options.postData && typeof entry.request?.postData?.text === "string" && entry.request.postData.text) {
                entry.request.postData.text = "[REDACTED]"
                findings.push({ path: `${base}.request.postData.text`, type: "postData", label: "request body" })
            }
            if (options.responseContent && typeof entry.response?.content?.text === "string" && entry.response.content.text) {
                entry.response.content.text = "[REDACTED]"
                findings.push({ path: `${base}.response.content.text`, type: "content", label: "response content" })
            }
        })
        const summary = summarizeHarFindings(findings)
        har.log._byteflowSanitizerSummary = {
            generatedBy: "byteflow.tools HAR Viewer / Sanitizer",
            redactionCount: findings.length,
            categories: summary,
            defaults: {
                headers: DEFAULT_HAR_SANITIZE_OPTIONS.headers,
                cookies: DEFAULT_HAR_SANITIZE_OPTIONS.cookies,
                queryStrings: DEFAULT_HAR_SANITIZE_OPTIONS.queryStrings,
                postData: DEFAULT_HAR_SANITIZE_OPTIONS.postData,
                responseContent: DEFAULT_HAR_SANITIZE_OPTIONS.responseContent,
            },
            reviewRequired: true,
        }

        return {
            output: JSON.stringify(har, null, 2),
            findings,
            redactionCount: findings.length,
            summary,
        }
    } catch (error) {
        return {
            output: "",
            findings: [],
            redactionCount: 0,
            summary: {},
            error: error instanceof Error ? error.message : "Unable to sanitize HAR.",
        }
    }
}
