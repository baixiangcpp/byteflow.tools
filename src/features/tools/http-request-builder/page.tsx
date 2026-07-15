"use client"

import * as React from "react"
import { Copy, Eraser, Terminal, Plus, Trash2, Code2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { SensitiveInputWarning } from "@/features/tool-shell/sensitive-input-warning"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { fetchMethodAllowsBody } from "@/core/codegen/http-request"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    generateCurl,
    generateFetch,
    generatePythonRequests,
    buildUrlWithQueryParams,
    validateRequestUrl,
    type BodyType,
    type HeaderEntry,
    type HttpMethod,
    type QueryEntry,
} from "./logic"
import { ToolPageContainer } from "@/components/layout/page-container"

let nextId = 0

const DEFAULT_URL = "https://api.example.com/endpoint"
const JSON_BODY_PLACEHOLDER = '{\n  "id": 123,\n  "enabled": true\n}'
const FORM_BODY_PLACEHOLDER = "mode=test&limit=10"

function createDefaultHeaders(): HeaderEntry[] {
    return [{ id: `h_${nextId++}`, key: "Accept", value: "application/json", enabled: true }]
}

function createDefaultQueryParams(): QueryEntry[] {
    return []
}

export function HttpRequestBuilderPage() {
    const { t } = useLang()
    const toolT = t.tools["http_request_builder"] as Record<string, string>
    const urlInputId = React.useId()
    const [method, setMethod] = React.useState<HttpMethod>("GET")
    const [url, setUrl] = React.useState(DEFAULT_URL)
    const [queryParams, setQueryParams] = React.useState<QueryEntry[]>(() => createDefaultQueryParams())
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

    const addQueryParam = () => {
        setQueryParams((prev) => [...prev, { id: `q_${nextId++}`, key: "", value: "", enabled: true }])
    }

    const removeQueryParam = (id: string) => {
        setQueryParams((prev) => prev.filter((param) => param.id !== id))
    }

    const updateQueryParam = (id: string, field: "key" | "value" | "enabled", val: string | boolean) => {
        setQueryParams((prev) => prev.map((param) => (param.id === id ? { ...param, [field]: val } : param)))
    }

    const updateHeader = (id: string, field: "key" | "value" | "enabled", val: string | boolean) => {
        setHeaders((prev) => prev.map((h) => (h.id === id ? { ...h, [field]: val } : h)))
    }

    const handleClear = () => {
        setMethod("GET")
        setUrl(DEFAULT_URL)
        setQueryParams(createDefaultQueryParams())
        setHeaders(createDefaultHeaders())
        setBodyType("none")
        setBody("")
    }

    const urlValidation = React.useMemo(() => validateRequestUrl(url), [url])
    const urlValidationMessage = React.useMemo(() => {
        if (urlValidation.ok) return ""
        const key = `error_url_${urlValidation.reason}`
        return toolT[key] || urlValidation.message
    }, [toolT, urlValidation])
    const requestUrl = React.useMemo(() => {
        if (!urlValidation.ok) return url
        return buildUrlWithQueryParams(urlValidation.url, queryParams)
    }, [queryParams, url, urlValidation])
    const bodyAllowed = fetchMethodAllowsBody(method)
    const effectiveBodyType = bodyAllowed ? bodyType : "none"
    const effectiveBody = bodyAllowed ? body : ""

    const generatedCode = React.useMemo(() => {
        if (!urlValidation.ok) return urlValidationMessage
        switch (codeType) {
            case "curl": return generateCurl(method, requestUrl, headers, effectiveBodyType, effectiveBody)
            case "fetch": return generateFetch(method, requestUrl, headers, effectiveBodyType, effectiveBody)
            case "python": return generatePythonRequests(method, requestUrl, headers, effectiveBodyType, effectiveBody)
        }
    }, [codeType, effectiveBody, effectiveBodyType, headers, method, requestUrl, urlValidation, urlValidationMessage])

    const handleCopy = async () => {
        if (!urlValidation.ok) return
        const result = await safeClipboardWrite(generatedCode)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }

    const actions: ToolAction[] = [
        {
            id: "clear",
            label: t.common.clear,
            icon: Eraser,
            onClick: handleClear,
            destructive: true,
        },
        {
            id: "copy_code",
            label: t.common.copy,
            icon: Copy,
            onClick: handleCopy,
            disabled: !urlValidation.ok,
            disabledReason: urlValidation.ok ? undefined : urlValidationMessage,
        },
    ]

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
        <ToolPageContainer className="flex flex-col h-full space-y-6">
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
                <ToolActionBar actions={actions} />
            </div>

            <SensitiveInputWarning variant="request" />

            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-200">
                <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                    <div className="space-y-1">
                        <p className="font-semibold">{toolT.no_send_title}</p>
                        <p>{toolT.no_send_desc}</p>
                    </div>
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
                    aria-invalid={!urlValidation.ok}
                    aria-describedby={!urlValidation.ok ? `${urlInputId}-error` : undefined}
                    className="flex-1 font-mono text-sm"
                    placeholder={DEFAULT_URL}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                />
            </div>
            {!urlValidation.ok ? (
                <div id={`${urlInputId}-error`} role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {urlValidationMessage}
                </div>
            ) : null}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Headers + Body */}
                <div className="space-y-6">
                    <div className="p-5 border rounded-lg bg-card shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{toolT.query_params}</h3>
                            <Button variant="outline" size="sm" onClick={addQueryParam}>
                                <Plus className="mr-1 h-3.5 w-3.5" />{toolT.add_query_param}
                            </Button>
                        </div>
                        {queryParams.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic text-center py-2">{toolT.no_query_params}</p>
                        ) : (
                            <div className="space-y-2">
                                {queryParams.map((param) => (
                                    <div key={param.id} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={param.enabled}
                                            onChange={(e) => updateQueryParam(param.id, "enabled", e.target.checked)}
                                            className="rounded border-input"
                                            aria-label={toolT.query_param_enabled}
                                        />
                                        <Input
                                            className="flex-1 font-mono text-xs"
                                            aria-label={toolT.query_param_name_placeholder}
                                            placeholder={toolT.query_param_name_placeholder}
                                            value={param.key}
                                            onChange={(e) => updateQueryParam(param.id, "key", e.target.value)}
                                        />
                                        <Input
                                            className="flex-1 font-mono text-xs"
                                            aria-label={toolT.query_param_value_label}
                                            placeholder={toolT.query_param_value_placeholder}
                                            value={param.value}
                                            onChange={(e) => updateQueryParam(param.id, "value", e.target.value)}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 shrink-0"
                                            onClick={() => removeQueryParam(param.id)}
                                            aria-label={toolT.remove_query_param}
                                        >
                                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                            <span className="sr-only">{toolT.remove_query_param}</span>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

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
                            <Select value={bodyType} onValueChange={(v) => setBodyType(v as BodyType)} disabled={!bodyAllowed}>
                                <SelectTrigger
                                    className="w-40"
                                    aria-label={toolT.body}
                                    aria-describedby={!bodyAllowed ? "http-body-method-warning" : undefined}
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">{toolT.body_type_none}</SelectItem>
                                    <SelectItem value="json">JSON</SelectItem>
                                    <SelectItem value="raw">{toolT.body_type_raw}</SelectItem>
                                    <SelectItem value="form-urlencoded">{toolT.body_type_form_urlencoded}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {!bodyAllowed && (
                            <p id="http-body-method-warning" role="status" className="text-sm text-muted-foreground">
                                {toolT.body_not_allowed}
                            </p>
                        )}
                        {bodyType !== "none" && (
                            <Textarea
                                aria-label={toolT.body_input_label}
                                className="min-h-[150px] font-mono text-sm"
                                placeholder={bodyType === "json" ? JSON_BODY_PLACEHOLDER : FORM_BODY_PLACEHOLDER}
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                disabled={!bodyAllowed}
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
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => void handleCopy()}
                                aria-label={`${t.common.copy}: ${toolT.generated_code}`}
                                disabled={!urlValidation.ok}
                            >
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
        </ToolPageContainer>
    )
}
