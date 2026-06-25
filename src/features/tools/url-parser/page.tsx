"use client"

import * as React from "react"
import { Copy, Eraser, Link2, Plus, Trash2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLang } from "@/core/i18n/lang-provider"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { copyTextWithToolFeedback } from "@/features/tool-shell/tool-action-feedback"
import { TextOutputPanel } from "@/features/tool-shell/text-output-panel"

interface QueryParam {
    id: string
    key: string
    value: string
}

let nextParamId = 0
function genId() {
    return `p_${nextParamId++}`
}

function parseUrl(raw: string) {
    try {
        const url = new URL(raw)
        return {
            href: url.href,
            protocol: url.protocol.replace(":", ""),
            host: url.hostname,
            port: url.port || (url.protocol === "https:" ? "443" : url.protocol === "http:" ? "80" : ""),
            pathname: url.pathname,
            hash: url.hash.replace("#", ""),
            username: url.username,
            password: url.password,
            origin: url.origin,
        }
    } catch {
        return null
    }
}

function extractParams(raw: string): QueryParam[] {
    try {
        const url = new URL(raw)
        const params: QueryParam[] = []
        url.searchParams.forEach((value, key) => {
            params.push({ id: genId(), key, value })
        })
        return params
    } catch {
        return []
    }
}

function buildUrl(
    protocol: string,
    host: string,
    port: string,
    pathname: string,
    params: QueryParam[],
    hash: string,
    username: string,
    password: string,
): string {
    try {
        const scheme = protocol || "https"
        let userinfo = ""
        if (username) {
            userinfo = password ? `${username}:${password}@` : `${username}@`
        }
        const portPart = port && !["80", "443", ""].includes(port) ? `:${port}` : ""
        const path = pathname.startsWith("/") ? pathname : `/${pathname}`
        const qs = params.filter((p) => p.key).map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join("&")
        const hashPart = hash ? `#${hash}` : ""
        return `${scheme}://${userinfo}${host}${portPart}${path}${qs ? `?${qs}` : ""}${hashPart}`
    } catch {
        return ""
    }
}

export function UrlParserPage() {
    const { t } = useLang()
    const toolT = t.tools["url_parser"] as Record<string, string>
    const [rawUrl, setRawUrl] = React.useState("https://example.com/?a=1&b=2#1")
    const [protocol, setProtocol] = React.useState("")
    const [host, setHost] = React.useState("")
    const [port, setPort] = React.useState("")
    const [pathname, setPathname] = React.useState("")
    const [hash, setHash] = React.useState("")
    const [username, setUsername] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [origin, setOrigin] = React.useState("")
    const [params, setParams] = React.useState<QueryParam[]>([])
    const [error, setError] = React.useState<string | null>(null)
    const urlInputId = React.useId()
    const protocolInputId = React.useId()
    const hostInputId = React.useId()
    const portInputId = React.useId()
    const pathInputId = React.useId()
    const hashInputId = React.useId()
    const usernameInputId = React.useId()
    const passwordInputId = React.useId()
    const originInputId = React.useId()

    const doParse = React.useCallback((url: string) => {
        const parsed = parseUrl(url)
        if (!parsed) {
            setError(toolT.invalid_url_format)
            return
        }
        setError(null)
        setProtocol(parsed.protocol)
        setHost(parsed.host)
        setPort(parsed.port)
        setPathname(parsed.pathname)
        setHash(parsed.hash)
        setUsername(parsed.username)
        setPassword(parsed.password)
        setOrigin(parsed.origin)
        setParams(extractParams(url))
    }, [toolT.invalid_url_format])

    // Initial parse
    React.useEffect(() => {
        doParse(rawUrl)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleParse = () => {
        doParse(rawUrl)
    }

    const handleClear = () => {
        setRawUrl("")
        setProtocol("")
        setHost("")
        setPort("")
        setPathname("")
        setHash("")
        setUsername("")
        setPassword("")
        setOrigin("")
        setParams([])
        setError(null)
    }

    const reconstructedUrl = React.useMemo(
        () => buildUrl(protocol, host, port, pathname, params, hash, username, password),
        [protocol, host, port, pathname, params, hash, username, password]
    )

    const handleCopyReconstructed = async () => {
        if (!reconstructedUrl) return
        return copyTextWithToolFeedback(t, reconstructedUrl, toolT.reconstructed_heading)
    }

    const addParam = () => {
        setParams((prev) => [...prev, { id: genId(), key: "", value: "" }])
    }

    const removeParam = (id: string) => {
        setParams((prev) => prev.filter((p) => p.id !== id))
    }

    const updateParam = (id: string, field: "key" | "value", val: string) => {
        setParams((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: val } : p)))
    }

    const FieldRow = ({
        id,
        label,
        value,
        onChange,
        mono,
    }: {
        id: string
        label: string
        value: string
        onChange?: (v: string) => void
        mono?: boolean
    }) => (
        <div className="grid grid-cols-12 gap-3 items-center">
            <label htmlFor={id} className="col-span-3 text-sm font-medium text-muted-foreground text-right">{label}</label>
            <Input
                id={id}
                aria-label={label}
                className={`col-span-9 ${mono ? "font-mono" : ""}`}
                value={value}
                onChange={onChange ? (e) => onChange(e.target.value) : undefined}
                readOnly={!onChange}
            />
        </div>
    )

    return (
        <div className="flex flex-col h-full space-y-6 max-w-5xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Link2 className="h-6 w-6 text-primary" />
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
                    <Button size="sm" onClick={handleParse}>
                        <ArrowRight className="mr-2 h-4 w-4" />{toolT.parse_action}
                    </Button>
                </div>
            </div>

            {/* URL Input */}
            <div className="space-y-2">
                <label htmlFor={urlInputId} className="text-sm font-medium">{toolT.url_label}</label>
                <div className="flex gap-2">
                    <Input
                        id={urlInputId}
                        aria-label={toolT.url_label}
                        className="flex-1 font-mono text-sm"
                        placeholder={toolT.url_placeholder}
                        value={rawUrl}
                        onChange={(e) => setRawUrl(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleParse()}
                    />
                </div>
            </div>

            {error && (
                <div className="p-3 text-sm font-medium text-destructive-foreground bg-destructive/90 rounded-md">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Parsed Components */}
                <div className="space-y-4 p-5 border rounded-lg bg-card shadow-sm">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{toolT.components_heading}</h3>
                    <div className="space-y-3">
                        <FieldRow id={protocolInputId} label={toolT.protocol_label} value={protocol} onChange={setProtocol} mono />
                        <FieldRow id={hostInputId} label={toolT.host_label} value={host} onChange={setHost} mono />
                        <FieldRow id={portInputId} label={toolT.port_label} value={port} onChange={setPort} mono />
                        <FieldRow id={pathInputId} label={toolT.path_label} value={pathname} onChange={setPathname} mono />
                        <FieldRow id={hashInputId} label={toolT.hash_label} value={hash} onChange={setHash} mono />
                        <FieldRow id={usernameInputId} label={toolT.username_label} value={username} onChange={setUsername} mono />
                        <FieldRow id={passwordInputId} label={toolT.password_label} value={password} onChange={setPassword} mono />
                        <FieldRow id={originInputId} label={toolT.origin_label} value={origin} />
                    </div>
                </div>

                {/* Query Parameters */}
                <div className="space-y-4 p-5 border rounded-lg bg-card shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{toolT.query_params_heading}</h3>
                        <Button variant="outline" size="sm" onClick={addParam}>
                            <Plus className="mr-1 h-3.5 w-3.5" />{toolT.add_param_action}
                        </Button>
                    </div>

                    {params.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic py-4 text-center">{toolT.no_query_params}</p>
                    ) : (
                        <div className="space-y-2">
                            {params.map((p) => (
                                <div key={p.id} className="flex items-center gap-2">
                                    <Input
                                        className="flex-1 font-mono text-sm"
                                        aria-label={toolT.query_key_label}
                                        placeholder={toolT.query_key_placeholder}
                                        value={p.key}
                                        onChange={(e) => updateParam(p.id, "key", e.target.value)}
                                    />
                                    <span className="text-muted-foreground">=</span>
                                    <Input
                                        className="flex-1 font-mono text-sm"
                                        aria-label={toolT.query_value_label}
                                        placeholder={toolT.query_value_placeholder}
                                        value={p.value}
                                        onChange={(e) => updateParam(p.id, "value", e.target.value)}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 shrink-0"
                                        onClick={() => removeParam(p.id)}
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
            </div>

            {/* Reconstructed URL */}
            <TextOutputPanel
                title={toolT.reconstructed_heading}
                value={reconstructedUrl}
                ariaLabel={toolT.reconstructed_heading}
                defaultMode="scroll"
                minHeightClassName="min-h-28"
                actions={(
                    <Button variant="outline" size="sm" onClick={() => void handleCopyReconstructed()} disabled={!reconstructedUrl}>
                        <Copy className="mr-2 h-4 w-4" />{t.common.copy}
                    </Button>
                )}
            />

            <RelatedTools toolKey="url_parser" />
        </div>
    )
}
