"use client"

import * as React from "react"
import { Search, Globe, Copy } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { useLang } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { ToolPageContainer } from "@/components/layout/page-container"

type HttpCategory = "1xx" | "2xx" | "3xx" | "4xx" | "5xx"

const HTTP_CODES: { code: number; text: string; description: string; category: HttpCategory }[] = [
    // 1xx
    { code: 100, text: "Continue", description: "Server has received the request headers; client should proceed to send the body.", category: "1xx" },
    { code: 101, text: "Switching Protocols", description: "Server is switching to a different protocol as requested by the client.", category: "1xx" },
    { code: 102, text: "Processing", description: "Server has received and is processing the request, but no response is available yet.", category: "1xx" },
    // 2xx
    { code: 200, text: "OK", description: "Standard response for successful HTTP requests.", category: "2xx" },
    { code: 201, text: "Created", description: "Request has been fulfilled and resulted in a new resource being created.", category: "2xx" },
    { code: 202, text: "Accepted", description: "Request accepted for processing, but processing has not been completed.", category: "2xx" },
    { code: 204, text: "No Content", description: "Server successfully processed the request but returns no content.", category: "2xx" },
    { code: 206, text: "Partial Content", description: "Server is delivering only part of the resource due to a range header.", category: "2xx" },
    // 3xx
    { code: 301, text: "Moved Permanently", description: "Resource has been permanently moved to a new URL. All future requests should use the new URL.", category: "3xx" },
    { code: 302, text: "Found", description: "Resource resides temporarily at a different URL. Continue using original URL for future requests.", category: "3xx" },
    { code: 304, text: "Not Modified", description: "Resource has not been modified since the last request. Use cached version.", category: "3xx" },
    { code: 307, text: "Temporary Redirect", description: "Request should be repeated with another URL, but future requests should still use the original.", category: "3xx" },
    { code: 308, text: "Permanent Redirect", description: "All future requests should be directed to the given URL using the same HTTP method.", category: "3xx" },
    // 4xx
    { code: 400, text: "Bad Request", description: "Server cannot process the request due to client error (malformed syntax, invalid framing, etc.).", category: "4xx" },
    { code: 401, text: "Unauthorized", description: "Authentication is required and has failed or has not been provided.", category: "4xx" },
    { code: 403, text: "Forbidden", description: "Server understood the request but refuses to authorize it. Authentication won't help.", category: "4xx" },
    { code: 404, text: "Not Found", description: "The requested resource could not be found on the server.", category: "4xx" },
    { code: 405, text: "Method Not Allowed", description: "Request method is not supported for the requested resource.", category: "4xx" },
    { code: 408, text: "Request Timeout", description: "Server timed out waiting for the request from the client.", category: "4xx" },
    { code: 409, text: "Conflict", description: "Request conflicts with the current state of the server (e.g., edit conflict).", category: "4xx" },
    { code: 413, text: "Payload Too Large", description: "Request entity is larger than the server is willing or able to process.", category: "4xx" },
    { code: 415, text: "Unsupported Media Type", description: "Media format of the requested data is not supported by the server.", category: "4xx" },
    { code: 422, text: "Unprocessable Entity", description: "Request was well-formed but unable to be followed due to semantic errors.", category: "4xx" },
    { code: 429, text: "Too Many Requests", description: "User has sent too many requests in a given amount of time (rate limiting).", category: "4xx" },
    // 5xx
    { code: 500, text: "Internal Server Error", description: "A generic error when an unexpected condition was encountered on the server.", category: "5xx" },
    { code: 501, text: "Not Implemented", description: "Server does not recognize the request method or lacks the ability to fulfil it.", category: "5xx" },
    { code: 502, text: "Bad Gateway", description: "Server received an invalid response from the upstream server.", category: "5xx" },
    { code: 503, text: "Service Unavailable", description: "Server is temporarily unavailable, usually due to overload or maintenance.", category: "5xx" },
    { code: 504, text: "Gateway Timeout", description: "Upstream server failed to send a request in the time allowed by the server.", category: "5xx" },
]

const CATEGORY_COLORS: Record<HttpCategory, string> = {
    "1xx": "text-blue-400",
    "2xx": "text-green-400",
    "3xx": "text-yellow-400",
    "4xx": "text-orange-400",
    "5xx": "text-red-400",
}

const CATEGORY_BG: Record<HttpCategory, string> = {
    "1xx": "bg-blue-400/10",
    "2xx": "bg-green-400/10",
    "3xx": "bg-yellow-400/10",
    "4xx": "bg-orange-400/10",
    "5xx": "bg-red-400/10",
}

export function HttpStatusCodesPage() {
    const { t, lang } = useLang()
    const [query, setQuery] = React.useState("")
    const toolT = t.tools["http_status_codes"] as Record<string, string>
    const categoryLabels = React.useMemo<Record<HttpCategory, string>>(
        () => ({
            "1xx": toolT.category_1xx_label,
            "2xx": toolT.category_2xx_label,
            "3xx": toolT.category_3xx_label,
            "4xx": toolT.category_4xx_label,
            "5xx": toolT.category_5xx_label,
        }),
        [toolT],
    )

    const localizedCodes = React.useMemo(
        () => HTTP_CODES.map((item) => ({
            ...item,
            categoryLabel: categoryLabels[item.category],
            localizedDescription:
                lang === "en"
                    ? item.description
                    : `${toolT.status_code_prefix} ${item.code} (${item.text}). ${toolT.category_prefix}: ${categoryLabels[item.category]}.`,
        })),
        [categoryLabels, lang, toolT.category_prefix, toolT.status_code_prefix],
    )

    const filtered = localizedCodes.filter(c =>
        c.code.toString().includes(query) ||
        c.text.toLowerCase().includes(query.toLowerCase()) ||
        c.localizedDescription.toLowerCase().includes(query.toLowerCase())
    )

    const grouped = filtered.reduce<Record<HttpCategory, typeof localizedCodes>>((acc, code) => {
        if (!acc[code.category]) acc[code.category] = []
        acc[code.category].push(code)
        return acc
    }, {} as Record<HttpCategory, typeof localizedCodes>)

    const handleCopyCode = async (value: string, label: string) => {
        const result = await safeClipboardWrite(value)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        const copyMessage = `${toolT.copy_prefix}: ${label}`
        toast.success(copyMessage)
    }

    return (
        <ToolPageContainer className="flex flex-col h-full">
            <div className="flex items-center justify-between border-b px-4 py-3 gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">{toolT.title}</h1>
                        <p className="text-xs text-muted-foreground">{toolT.description}</p>
                    </div>
                </div>
                <span className="text-xs text-muted-foreground">{filtered.length} {toolT.codes_count}</span>
            </div>

            <div className="border-b px-4 py-2 flex items-center gap-2 bg-muted/20">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="border-0 bg-transparent shadow-none focus-visible:ring-1 focus-visible:ring-ring/50 text-sm"
                    placeholder={toolT.search_placeholder}
                />
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-6">
                {(Object.entries(grouped) as [HttpCategory, typeof localizedCodes][]).map(([category, codes]) => (
                    <div key={category}>
                        <h2 className={`text-sm font-bold mb-2 ${CATEGORY_COLORS[category] || "text-foreground"}`}>{codes[0]?.categoryLabel || category}</h2>
                        <div className="grid gap-1.5">
                            {codes.map(c => (
                                <button
                                    key={c.code}
                                    onClick={() => void handleCopyCode(`${c.code} ${c.text}`, `${c.code} ${c.text}`)}
                                    className={`group flex items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/50 ${CATEGORY_BG[category] || ""}`}
                                >
                                    <span className={`font-mono font-bold text-lg tabular-nums shrink-0 w-12 ${CATEGORY_COLORS[category]}`}>{c.code}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                                            {c.text}
                                            <Copy className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{c.localizedDescription}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </ToolPageContainer>
    )
}
