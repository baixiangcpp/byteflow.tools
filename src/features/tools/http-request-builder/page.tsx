"use client"

import * as React from "react"
import { Copy, Eraser, Terminal, Plus, Trash2, Code2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS"
type BodyType = "none" | "json" | "raw" | "form-urlencoded"

interface HeaderEntry {
    id: string
    key: string
    value: string
    enabled: boolean
}

let nextId = 0

const DEFAULT_URL = "https://api.example.com/endpoint"
const JSON_BODY_PLACEHOLDER = '{\n  "id": 123,\n  "enabled": true\n}'
const FORM_BODY_PLACEHOLDER = "mode=test&limit=10"

function createDefaultHeaders(): HeaderEntry[] {
    return [{ id: `h_${nextId++}`, key: "Accept", value: "application/json", enabled: true }]
}

// ─── Code Generators ────────────────────────────────────────────────────────

function generateCurl(method: HttpMethod, url: string, headers: HeaderEntry[], bodyType: BodyType, body: string): string {
    const parts = ["curl"]
    if (method !== "GET") parts.push(`-X ${method}`)
    parts.push(`'${url}'`)

    for (const h of headers.filter((h) => h.enabled && h.key)) {
        parts.push(`-H '${h.key}: ${h.value}'`)
    }

    if (bodyType === "json" && body) {
        parts.push(`-H 'Content-Type: application/json'`)
        parts.push(`-d '${body}'`)
    } else if (bodyType === "raw" && body) {
        parts.push(`-d '${body}'`)
    } else if (bodyType === "form-urlencoded" && body) {
        parts.push(`-H 'Content-Type: application/x-www-form-urlencoded'`)
        parts.push(`--data-urlencode '${body}'`)
    }

    return parts.join(" \\\n  ")
}

function generateFetch(method: HttpMethod, url: string, headers: HeaderEntry[], bodyType: BodyType, body: string): string {
    const headersObj: Record<string, string> = {}
    for (const h of headers.filter((h) => h.enabled && h.key)) {
        headersObj[h.key] = h.value
    }
    if (bodyType === "json") headersObj["Content-Type"] = "application/json"
    if (bodyType === "form-urlencoded") headersObj["Content-Type"] = "application/x-www-form-urlencoded"

    const options: Record<string, unknown> = { method }
    if (Object.keys(headersObj).length > 0) options.headers = headersObj
    if (body && bodyType !== "none") {
        options.body = bodyType === "json" ? `JSON.stringify(${body})` : body
    }

    let code = `const response = await fetch('${url}'`
    if (Object.keys(options).length > 1 || method !== "GET") {
        const optStr = JSON.stringify(options, null, 2)
            .replace(/"JSON\.stringify\((.*?)\)"/, "JSON.stringify($1)")
        code += `, ${optStr}`
    }
    code += ");\n"
    code += "const data = await response.json();\n"
    code += "console.log(data);"

    return code
}

function generatePythonRequests(method: HttpMethod, url: string, headers: HeaderEntry[], bodyType: BodyType, body: string): string {
    const lines = ["import requests", ""]
    const headersObj: Record<string, string> = {}
    for (const h of headers.filter((h) => h.enabled && h.key)) {
        headersObj[h.key] = h.value
    }

    const methodLower = method.toLowerCase()
    let callArgs = `'${url}'`

    if (Object.keys(headersObj).length > 0) {
        lines.push(`headers = ${JSON.stringify(headersObj, null, 4)}`)
        callArgs += ", headers=headers"
    }

    if (body && bodyType !== "none") {
        if (bodyType === "json") {
            lines.push(`payload = ${body}`)
            callArgs += ", json=payload"
        } else {
            lines.push(`data = '${body}'`)
            callArgs += ", data=data"
        }
    }

    lines.push("")
    lines.push(`response = requests.${methodLower}(${callArgs})`)
    lines.push("print(response.status_code)")
    lines.push("print(response.json())")

    return lines.join("\n")
}

export function HttpRequestBuilderPage() {
    const { t } = useLang()
    const toolT = t.tools["http_request_builder"] as Record<string, string>
    const urlInputId = React.useId()
    const [method, setMethod] = React.useState<HttpMethod>("GET")
    const [url, setUrl] = React.useState(DEFAULT_URL)
    const [headers, setHeaders] = React.useState<HeaderEntry[]>(() => createDefaultHeaders())
    const [bodyType, setBodyType] = React.useState<BodyType>("none")
    const [body, setBody] = React.useState("")
    const [codeType, setCodeType] = React.useState<"curl" | "fetch" | "python">("curl")

    const addHeader = () => {
        setHeaders((prev) => [...prev, { id: `h_${nextId++}`, key: "", value: "", enabled: true }])
    }

    const removeHeader = (id: string) => {
        setHeaders((prev) => prev.filter((h) => h.id !== id))
    }

    const updateHeader = (id: string, field: "key" | "value" | "enabled", val: string | boolean) => {
        setHeaders((prev) => prev.map((h) => (h.id === id ? { ...h, [field]: val } : h)))
    }

    const handleClear = () => {
        setMethod("GET")
        setUrl(DEFAULT_URL)
        setHeaders(createDefaultHeaders())
        setBodyType("none")
        setBody("")
    }

    const generatedCode = React.useMemo(() => {
        switch (codeType) {
            case "curl": return generateCurl(method, url, headers, bodyType, body)
            case "fetch": return generateFetch(method, url, headers, bodyType, body)
            case "python": return generatePythonRequests(method, url, headers, bodyType, body)
        }
    }, [codeType, method, url, headers, bodyType, body])

    const handleCopy = async () => {
        const result = await safeClipboardWrite(generatedCode)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }

    const methodColors: Record<HttpMethod, string> = {
        GET: "text-emerald-500",
        POST: "text-blue-500",
        PUT: "text-amber-500",
        DELETE: "text-red-500",
        PATCH: "text-purple-500",
        HEAD: "text-teal-500",
        OPTIONS: "text-gray-500",
    }

    return (
        <div className="flex flex-col h-full space-y-6 max-w-5xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Terminal className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {toolT.description}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleClear}>
                        <Eraser className="mr-2 h-4 w-4" />{t.common.clear}
                    </Button>
                </div>
            </div>

            {/* Method + URL */}
            <div className="flex gap-2">
                <Select value={method} onValueChange={(v) => setMethod(v as HttpMethod)}>
                    <SelectTrigger className={`w-32 font-bold ${methodColors[method]}`}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"] as HttpMethod[]).map((m) => (
                            <SelectItem key={m} value={m} className={`font-bold ${methodColors[m]}`}>{m}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Input
                    id={urlInputId}
                    aria-label={toolT.url_label}
                    className="flex-1 font-mono text-sm"
                    placeholder={DEFAULT_URL}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Headers + Body */}
                <div className="space-y-6">
                    {/* Headers */}
                    <div className="p-5 border rounded-lg bg-card shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{toolT.headers}</h3>
                            <Button variant="outline" size="sm" onClick={addHeader}>
                                <Plus className="mr-1 h-3.5 w-3.5" />{toolT.add_header}
                            </Button>
                        </div>
                        {headers.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic text-center py-2">{toolT.no_headers}</p>
                        ) : (
                            <div className="space-y-2">
                                {headers.map((h) => (
                                    <div key={h.id} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={h.enabled}
                                            onChange={(e) => updateHeader(h.id, "enabled", e.target.checked)}
                                            className="rounded border-input"
                                            aria-label={toolT.header_enabled}
                                        />
                                        <Input
                                            className="flex-1 font-mono text-xs"
                                            aria-label={toolT.header_name_placeholder}
                                            placeholder={toolT.header_name_placeholder}
                                            value={h.key}
                                            onChange={(e) => updateHeader(h.id, "key", e.target.value)}
                                        />
                                        <Input
                                            className="flex-1 font-mono text-xs"
                                            aria-label={toolT.header_value_placeholder}
                                            placeholder={toolT.header_value_placeholder}
                                            value={h.value}
                                            onChange={(e) => updateHeader(h.id, "value", e.target.value)}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 shrink-0"
                                            onClick={() => removeHeader(h.id)}
                                            aria-label={toolT.remove_header}
                                        >
                                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                            <span className="sr-only">{toolT.remove_header}</span>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Body */}
                    <div className="p-5 border rounded-lg bg-card shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{toolT.body}</h3>
                            <Select value={bodyType} onValueChange={(v) => setBodyType(v as BodyType)}>
                                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">{toolT.body_type_none}</SelectItem>
                                    <SelectItem value="json">JSON</SelectItem>
                                    <SelectItem value="raw">{toolT.body_type_raw}</SelectItem>
                                    <SelectItem value="form-urlencoded">{toolT.body_type_form_urlencoded}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {bodyType !== "none" && (
                            <Textarea
                                className="min-h-[150px] font-mono text-sm"
                                placeholder={bodyType === "json" ? JSON_BODY_PLACEHOLDER : FORM_BODY_PLACEHOLDER}
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                spellCheck={false}
                            />
                        )}
                    </div>
                </div>

                {/* Right: Generated Code */}
                <div className="p-5 border rounded-lg bg-card shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Code2 className="h-4 w-4" /> {toolT.generated_code}
                        </h3>
                        <div className="flex items-center gap-2">
                            <Select value={codeType} onValueChange={(v) => setCodeType(v as "curl" | "fetch" | "python")}>
                                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="curl">cURL</SelectItem>
                                    <SelectItem value="fetch">{toolT.code_type_fetch}</SelectItem>
                                    <SelectItem value="python">Python</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="sm" onClick={() => void handleCopy()}>
                                <Copy className="mr-2 h-4 w-4" />{t.common.copy}
                            </Button>
                        </div>
                    </div>
                    <pre className="p-4 bg-muted/50 rounded-md font-mono text-sm overflow-x-auto min-h-[300px] leading-6 whitespace-pre-wrap break-all select-all">
                        {generatedCode}
                    </pre>
                </div>
            </div>

            <RelatedTools toolKey="http_request_builder" />
        </div>
    )
}
