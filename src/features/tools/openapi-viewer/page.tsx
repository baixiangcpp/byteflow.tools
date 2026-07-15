"use client"

import * as React from "react"
import { Copy, FileJson, Trash2, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import * as YAML from "yaml"
import { useLang } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { MonacoEditor } from "@/features/tool-shell/monaco-editors"
import { cn } from "@/core/utils/utils"
import { buildInputTooLargeMessage, isOverUtf8Budget, TOOL_RUNTIME_BUDGETS } from "@/core/performance/tool-runtime-budgets"
import { WideToolPageContainer } from "@/components/layout/page-container"

interface OpenAPIInfo {
    title?: string
    version?: string
    description?: string
}

interface OpenAPIPath {
    [method: string]: {
        summary?: string
        description?: string
        tags?: string[]
        parameters?: { name: string; in: string; required?: boolean; schema?: { type?: string } }[]
        responses?: Record<string, { description?: string }>
    }
}

interface OpenAPISpec {
    openapi?: string
    swagger?: string
    info?: OpenAPIInfo
    paths?: Record<string, OpenAPIPath>
    servers?: { url: string; description?: string }[]
}

const METHOD_COLORS: Record<string, string> = {
    get: "bg-green-500/15 text-green-400 border-green-500/30",
    post: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    put: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    patch: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    delete: "bg-red-500/15 text-red-400 border-red-500/30",
}

function buildSampleSpec(toolT: Record<string, string>) {
    return JSON.stringify(
        {
            openapi: "3.0.3",
            info: {
                title: toolT.sample_api_title,
                version: "1.0.0",
                description: toolT.sample_api_description,
            },
            servers: [{ url: "https://api.petstore.io/v1", description: toolT.sample_server_description }],
            paths: {
                "/pets": {
                    get: {
                        summary: toolT.sample_list_summary,
                        tags: [toolT.sample_tag_pets],
                        parameters: [{ name: "limit", in: "query", required: false, schema: { type: "integer" } }],
                        responses: { "200": { description: toolT.sample_list_response } },
                    },
                    post: {
                        summary: toolT.sample_create_summary,
                        tags: [toolT.sample_tag_pets],
                        responses: { "201": { description: toolT.sample_create_response } },
                    },
                },
                "/pets/{petId}": {
                    get: {
                        summary: toolT.sample_get_by_id_summary,
                        tags: [toolT.sample_tag_pets],
                        parameters: [{ name: "petId", in: "path", required: true, schema: { type: "string" } }],
                        responses: {
                            "200": { description: toolT.sample_get_response },
                            "404": { description: toolT.sample_not_found_response },
                        },
                    },
                    delete: {
                        summary: toolT.sample_delete_summary,
                        tags: [toolT.sample_tag_pets],
                        responses: { "204": { description: toolT.sample_delete_response } },
                    },
                },
            },
        },
        null,
        2,
    )
}

export function OpenApiViewerPage() {
    const { t } = useLang()
    const toolT = t.tools["openapi_viewer"] as Record<string, string>
    const sampleSpec = React.useMemo(() => buildSampleSpec(toolT), [toolT])
    const [input, setInput] = React.useState(sampleSpec)
    const [spec, setSpec] = React.useState<OpenAPISpec | null>(null)
    const [error, setError] = React.useState<string | null>(null)
    const [expanded, setExpanded] = React.useState<Set<string>>(new Set())
    const [language, setLanguage] = React.useState<"json" | "yaml">("yaml")

    React.useEffect(() => {
        const trimmedInput = input.trim()
        if (!trimmedInput) {
            setSpec(null)
            setError(null)
            return
        }

        const isJson = trimmedInput.startsWith("{") || trimmedInput.startsWith("[")
        setLanguage(isJson ? "json" : "yaml")

        if (isOverUtf8Budget(trimmedInput, TOOL_RUNTIME_BUDGETS.maxOpenApiSpecBytes)) {
            setError(buildInputTooLargeMessage(t.common.local_input_too_large, TOOL_RUNTIME_BUDGETS.maxOpenApiSpecBytes))
            setSpec(null)
            return
        }

        try {
            let parsed: OpenAPISpec
            if (isJson) {
                parsed = JSON.parse(trimmedInput)
            } else {
                parsed = YAML.parse(trimmedInput) as OpenAPISpec
            }
            setSpec(parsed)
            setError(null)
        } catch (e: unknown) {
            void e
            setError(isJson ? toolT.invalid_json : (toolT.invalid_yaml || "Invalid YAML/JSON"))
            setSpec(null)
        }
    }, [input, t.common.local_input_too_large, toolT.invalid_json, toolT.invalid_yaml])

    const toggle = (key: string) => {
        setExpanded(prev => {
            const next = new Set(prev)
            if (next.has(key)) {
                next.delete(key)
            } else {
                next.add(key)
            }
            return next
        })
    }

    const allEndpoints = spec?.paths ? Object.entries(spec.paths).flatMap(([path, methods]) =>
        Object.entries(methods).filter(([m]) => ["get", "post", "put", "patch", "delete"].includes(m)).map(([method, detail]) => ({ path, method, ...detail }))
    ) : []
    const endpointsTruncated = allEndpoints.length > TOOL_RUNTIME_BUDGETS.maxOpenApiEndpoints
    const endpoints = endpointsTruncated ? allEndpoints.slice(0, TOOL_RUNTIME_BUDGETS.maxOpenApiEndpoints) : allEndpoints

    const handleCopyInput = async () => {
        if (!input) return
        const result = await safeClipboardWrite(input)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }

    const actions: ToolAction[] = [
        {
            id: "copy",
            label: t.common.copy,
            icon: Copy,
            onClick: handleCopyInput,
            disabled: !input,
        },
        {
            id: "clear",
            label: t.common.clear || "Clear",
            icon: Trash2,
            onClick: () => setInput(""),
            variant: "outline",
        },
    ]

    return (
        <WideToolPageContainer className="flex h-full flex-col space-y-8">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-3">
                        <FileJson className="h-8 w-8 text-primary" />
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{toolT.title}</h1>
                            <p className="text-sm text-muted-foreground">{toolT.description}</p>
                        </div>
                    </div>
                    <ToolActionBar actions={actions} />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
                <div className="flex flex-col rounded-xl border bg-card shadow-xs overflow-hidden h-[600px]">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span className="font-semibold">{toolT.json_input}</span>
                        <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase border border-primary/20">
                                {language}
                            </span>
                        </div>
                    </div>
                    <MonacoEditor
                        value={input}
                        onChange={(val) => setInput(val || "")}
                        language={language}
                        height="100%"
                        options={{
                            minimap: { enabled: false },
                            lineNumbers: "on",
                            scrollBeyondLastLine: false,
                            wordWrap: "on",
                            fontSize: 12,
                        }}
                    />
                </div>

                <div className="flex flex-col rounded-xl border bg-card shadow-xs overflow-hidden h-[600px]">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span className="font-semibold">{toolT.api_explorer}</span>
                        {endpoints.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-medium tabular-nums">
                                {endpoints.length} {toolT.endpoints_count}
                            </span>
                        )}
                    </div>
                    
                    <div className="flex-1 overflow-auto bg-background/50">
                        {error && <div className="p-6 text-sm text-destructive bg-destructive/5 border-b border-destructive/10">{error}</div>}
                        {endpointsTruncated && (
                            <div className="p-3 text-sm text-amber-700 bg-amber-500/10 border-b border-amber-500/20 dark:text-amber-300">
                                {t.common.local_results_truncated.replace("{count}", String(TOOL_RUNTIME_BUDGETS.maxOpenApiEndpoints))}
                            </div>
                        )}
                        {!spec && !error && (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 p-8 text-center">
                                <FileJson className="h-12 w-12 opacity-10" />
                                <p className="text-sm">{toolT.input_placeholder}</p>
                            </div>
                        )}
                        {spec && (
                            <div className="p-6 space-y-6">
                                {/* Info */}
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold tracking-tight">{spec.info?.title || toolT.untitled_api}</h2>
                                    <div className="flex items-center gap-2 text-xs">
                                        {spec.openapi && <span className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full font-medium">OAS {spec.openapi}</span>}
                                        {spec.swagger && <span className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full font-medium">Swagger {spec.swagger}</span>}
                                        {spec.info?.version && <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-full font-medium">v{spec.info.version}</span>}
                                    </div>
                                    {spec.info?.description && <p className="text-sm text-muted-foreground leading-relaxed mt-3">{spec.info.description}</p>}
                                </div>

                                {/* Servers */}
                                {spec.servers && spec.servers.length > 0 && (
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{toolT.servers}</h3>
                                        <div className="grid gap-2">
                                            {spec.servers.map((s, i) => (
                                                <div key={i} className="group p-2 rounded-md bg-muted/30 border border-transparent hover:border-border transition-colors">
                                                    <div className="text-xs font-mono text-primary truncate">{s.url}</div>
                                                    {s.description && <div className="text-[10px] text-muted-foreground mt-0.5">{s.description}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Endpoints */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{toolT.endpoints}</h3>
                                    <div className="grid gap-2">
                                        {endpoints.map((ep, i) => {
                                            const key = `${ep.method}-${ep.path}-${i}`
                                            const isOpen = expanded.has(key)
                                            return (
                                                <div key={key} className={cn(
                                                    "group border rounded-lg transition-all",
                                                    isOpen ? "border-primary/20 bg-primary/[0.02]" : "border-border hover:border-primary/20 hover:bg-muted/30"
                                                )}>
                                                    <button onClick={() => toggle(key)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                                                        <ChevronRight className={cn(
                                                            "h-4 w-4 text-muted-foreground transition-transform duration-200",
                                                            isOpen && "rotate-90 text-primary"
                                                        )} />
                                                        <span className={cn(
                                                            "min-w-[56px] px-2 py-0.5 rounded text-[10px] font-black uppercase text-center border",
                                                            METHOD_COLORS[ep.method] || "bg-muted text-muted-foreground"
                                                        )}>{ep.method}</span>
                                                        <span className="font-mono text-sm font-medium flex-1 truncate">{ep.path}</span>
                                                        {ep.summary && <span className="text-xs text-muted-foreground truncate max-w-[200px] hidden sm:block">{ep.summary}</span>}
                                                    </button>
                                                    {isOpen && (
                                                        <div className="px-4 pb-4 pt-1 border-t bg-background/50 space-y-4">
                                                            {ep.summary && <p className="text-sm font-semibold">{ep.summary}</p>}
                                                            {ep.description && <p className="text-xs text-muted-foreground leading-relaxed">{ep.description}</p>}
                                                            {ep.tags && (
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {ep.tags.map(t => <span key={t} className="px-2 py-0.5 bg-muted rounded text-[10px] font-medium text-muted-foreground">{t}</span>)}
                                                                </div>
                                                            )}
                                                            {ep.parameters && ep.parameters.length > 0 && (
                                                                <div className="space-y-2">
                                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{toolT.parameters}</span>
                                                                    <div className="grid gap-1.5">
                                                                        {ep.parameters.map((p, j) => (
                                                                            <div key={j} className="flex items-center gap-2 text-xs font-mono p-1.5 rounded bg-muted/30 border border-border/50">
                                                                                <span className="text-primary font-bold">{p.name}</span>
                                                                                <span className="text-muted-foreground text-[10px]">({p.in}{p.required ? `, ${toolT.required}` : ""})</span>
                                                                                {p.schema?.type && <span className="text-amber-500/80 text-[10px] ml-auto">{p.schema.type}</span>}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {ep.responses && (
                                                                <div className="space-y-2">
                                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{toolT.responses}</span>
                                                                    <div className="grid gap-1.5">
                                                                        {Object.entries(ep.responses).map(([code, resp]) => (
                                                                            <div key={code} className="flex items-start gap-3 p-2 rounded bg-muted/30 border border-border/50">
                                                                                <span className={cn(
                                                                                    "font-mono font-black text-xs min-w-[32px]",
                                                                                    code.startsWith("2") ? "text-green-500" : code.startsWith("4") ? "text-red-500" : "text-muted-foreground"
                                                                                )}>{code}</span>
                                                                                <span className="text-xs text-muted-foreground leading-relaxed">{resp.description}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </WideToolPageContainer>
    )
}
