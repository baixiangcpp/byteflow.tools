"use client"

import * as React from "react"
import { FileCode2, Copy, Eraser } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { extractEndpoints } from "@/features/tools/openapi-mock/utils"
import { buildInputTooLargeMessage, isOverUtf8Budget, TOOL_RUNTIME_BUDGETS } from "@/core/performance/tool-runtime-budgets"

function buildSampleSpec(toolT: Record<string, string>) {
    return JSON.stringify(
        {
            openapi: "3.0.0",
            info: { title: toolT.sample_title, version: "1.0.0" },
            paths: {
                "/pets": {
                    get: {
                        summary: toolT.sample_list_summary,
                        responses: {
                            "200": {
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    id: { type: "integer", example: 1 },
                                                    name: { type: "string", example: toolT.sample_pet_name },
                                                    tag: { type: "string", example: toolT.sample_pet_tag },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    post: {
                        summary: toolT.sample_create_summary,
                        responses: {
                            "201": {
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object",
                                            properties: {
                                                id: { type: "integer" },
                                                name: { type: "string" },
                                                created: { type: "string", format: "date-time" },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        null,
        2,
    )
}

export function OpenApiMockPage() {
    const { t } = useLang()
    const toolT = t.tools["openapi_mock"] as Record<string, string>
    const sampleSpec = React.useMemo(() => buildSampleSpec(toolT), [toolT])
    const [spec, setSpec] = React.useState(sampleSpec)
    const [selected, setSelected] = React.useState<number | null>(null)

    const { endpoints, error } = React.useMemo(() => {
        if (isOverUtf8Budget(spec, TOOL_RUNTIME_BUDGETS.maxOpenApiSpecBytes)) {
            return {
                endpoints: [],
                error: buildInputTooLargeMessage(t.common.local_input_too_large, TOOL_RUNTIME_BUDGETS.maxOpenApiSpecBytes),
            }
        }
        try {
            const parsed = JSON.parse(spec)
            return {
                endpoints: extractEndpoints(parsed, toolT.sample_string_value, {
                    maxEndpoints: TOOL_RUNTIME_BUDGETS.maxOpenApiMockEndpoints,
                    maxSchemaProperties: TOOL_RUNTIME_BUDGETS.maxOpenApiMockSchemaProperties,
                }),
                error: "",
            }
        } catch (e) {
            void e
            return {
                endpoints: [],
                error: toolT.invalid_json,
            }
        }
    }, [spec, t.common.local_input_too_large, toolT.invalid_json, toolT.sample_string_value])

    React.useEffect(() => {
        if (endpoints.length === 0) {
            if (selected !== null) setSelected(null)
            return
        }

        if (selected === null || selected >= endpoints.length) {
            setSelected(0)
        }
    }, [endpoints, selected])

    const methodColors: Record<string, string> = { GET: "bg-emerald-500", POST: "bg-blue-500", PUT: "bg-amber-500", DELETE: "bg-red-500", PATCH: "bg-purple-500" }

    const handleCopyResponse = async () => {
        if (selected === null || !endpoints[selected]) return
        const copyText = JSON.stringify(endpoints[selected].response, null, 2)
        const result = await safeClipboardWrite(copyText)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }

    return (
        <div className="flex flex-col h-full space-y-6 max-w-[1400px] mx-auto w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <FileCode2 className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="text-muted-foreground mt-1">{toolT.description}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setSpec(""); setSelected(null) }}>
                    <Eraser className="mr-2 h-4 w-4" />{t.common.clear}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[500px]">
                <div className="flex flex-col border rounded-lg bg-card overflow-hidden shadow-sm">
                    <div className="tool-pane-header">{toolT.spec_label}</div>
                    <Textarea className="flex-1 min-h-[400px] resize-none border-0 focus-visible:ring-1 focus-visible:ring-ring/50 font-mono text-xs leading-5 p-4" value={spec} onChange={(e) => setSpec(e.target.value)} spellCheck={false} />
                </div>

                <div className="flex flex-col border rounded-lg bg-card overflow-hidden shadow-sm">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{toolT.endpoints} ({endpoints.length})</span>
                        {selected !== null && endpoints[selected] && (
                            <Button variant="ghost" size="sm" className="h-7" onClick={() => void handleCopyResponse()}>
                                <Copy className="mr-1 h-3.5 w-3.5" />{t.common.copy}
                            </Button>
                        )}
                    </div>
                    <div className="flex-1 overflow-auto p-4 space-y-2">
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        {endpoints.map((ep, i) => (
                            <button key={i} onClick={() => setSelected(i)}
                                className={`w-full text-left p-3 border rounded-lg transition-colors ${selected === i ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-white ${methodColors[ep.method] || "bg-gray-500"}`}>{ep.method}</span>
                                    <span className="font-mono text-sm">{ep.path}</span>
                                </div>
                                {ep.summary && <p className="text-xs text-muted-foreground mt-1">{ep.summary}</p>}
                            </button>
                        ))}
                        {selected !== null && endpoints[selected] && (
                            <div className="mt-4 pt-4 border-t">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{toolT.mock_response}</h4>
                                <pre className="font-mono text-xs bg-muted/50 rounded p-3 overflow-auto whitespace-pre-wrap">
                                    {JSON.stringify(endpoints[selected].response, null, 2) || "null"}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <RelatedTools toolKey="openapi_mock" />
        </div>
    )
}
