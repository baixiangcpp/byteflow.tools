"use client"

import * as React from "react"
import { Copy, Eraser, Link, TestTube2, Workflow } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useLang } from "@/core/i18n/lang-provider"
import { Textarea } from "@/components/ui/textarea"
import { encodeUrlByMode, decodeUrlByMode, type UrlEncodingMode } from "@/core/utils/url-codec-utils"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { readStorageString, writeStorageString } from "@/core/storage/tool-persistence"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { buildToolHandoffLink } from "@/core/routing/tool-handoff"

type UrlExample = {
    id: string
    labelKey: string
    value: string
}

const EXAMPLES: UrlExample[] = [
    {
        id: "query",
        labelKey: "example_query",
        value: "id=42&v=7/8",
    },
    {
        id: "full",
        labelKey: "example_full",
        value: "https://example.com/r?a=42 55&b=a/b#1",
    },
    {
        id: "reserved",
        labelKey: "example_reserved",
        value: "x:/r?id=42&v=7/8",
    },
]
const STRATEGY_STORAGE_KEY = "byteflow:url-encode-decode:strategy"
const OPERATION_STORAGE_KEY = "byteflow:url-encode-decode:operation"

export function UrlEncodeDecodePage() {
    const { t, lang } = useLang()
    const toolT = t.tools["url_encode_decode"] as Record<string, string>

    const text = React.useCallback((key: string) => toolT[key] || key, [toolT])

    const [strategy, setStrategy] = React.useState<UrlEncodingMode>("component")
    const [operation, setOperation] = React.useState<"encode" | "decode">("encode")
    const [input, setInput] = React.useState("")
    const [error, setError] = React.useState<string | null>(null)

    React.useEffect(() => {
        const savedStrategy = readStorageString(STRATEGY_STORAGE_KEY)
        if (savedStrategy === "component" || savedStrategy === "full" || savedStrategy === "reserved") {
            setStrategy(savedStrategy)
        }
        const savedOperation = readStorageString(OPERATION_STORAGE_KEY)
        if (savedOperation === "encode" || savedOperation === "decode") {
            setOperation(savedOperation)
        }
    }, [])

    React.useEffect(() => {
        writeStorageString(STRATEGY_STORAGE_KEY, strategy)
    }, [strategy])

    React.useEffect(() => {
        writeStorageString(OPERATION_STORAGE_KEY, operation)
    }, [operation])

    const computed = React.useMemo(() => {
        if (!input) {
            return { output: "", error: null }
        }
        try {
            const result = operation === "encode"
                ? encodeUrlByMode(input, strategy)
                : decodeUrlByMode(input, strategy)
            return { output: result, error: null }
        } catch {
            return {
                output: "",
                error: operation === "encode" ? text("encode_error") : text("decode_error")
            }
        }
    }, [input, operation, strategy, text])

    React.useEffect(() => {
        setError(computed.error)
    }, [computed.error])

    const output = computed.output

    const handleCopy = async () => {
        if (!output) return
        const result = await safeClipboardWrite(output)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, {
            description: t.common.copied_desc,
        })
    }

    const handleClear = () => {
        setInput("")
        setError(null)
    }

    const applyExample = (value: string) => {
        setInput(value)
        setError(null)
    }

    const strategyDescription = (() => {
        if (strategy === "component") return text("mode_component_desc")
        if (strategy === "full") return text("mode_full_desc")
        return text("mode_reserved_desc")
    })()

    const handoffPayload = input
    const pipelineHandoff = React.useMemo(
        () => buildToolHandoffLink(lang, "pipeline-builder", handoffPayload),
        [handoffPayload, lang],
    )

    const actions: ToolAction[] = [
        {
            id: "clear",
            label: t.common.clear,
            icon: Eraser,
            onClick: handleClear,
        },
        {
            id: "to_pipeline_builder",
            label: (t.tools["pipeline_builder"] as Record<string, string> | undefined)?.title ?? "Pipeline Builder",
            icon: Workflow,
            href: pipelineHandoff.href,
            onClick: pipelineHandoff.prime,
            disabled: !handoffPayload.trim(),
        },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col space-y-8">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <Link className="h-6 w-6 text-primary" />
                        {text("title")}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {text("description")}
                    </p>
                </div>
                <ToolActionBar actions={actions} handoffPayload={handoffPayload} />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-lg border bg-card p-3">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t.common.hash_tool?.mode || "Operation"}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <ModeButton
                            active={operation === "encode"}
                            onClick={() => setOperation("encode")}
                            label={text("encode_action")}
                        />
                        <ModeButton
                            active={operation === "decode"}
                            onClick={() => setOperation("decode")}
                            label={text("decode_action")}
                        />
                    </div>
                </div>

                <div className="rounded-lg border bg-card p-3">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {text("strategy_label")}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <ModeButton
                            active={strategy === "component"}
                            onClick={() => setStrategy("component")}
                            label={text("mode_component")}
                        />
                        <ModeButton
                            active={strategy === "full"}
                            onClick={() => setStrategy("full")}
                            label={text("mode_full")}
                        />
                        <ModeButton
                            active={strategy === "reserved"}
                            onClick={() => setStrategy("reserved")}
                            label={text("mode_reserved")}
                        />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{strategyDescription}</p>
                </div>
            </div>

            <div className="rounded-lg border bg-card p-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {text("examples_label")}
                </div>
                <div className="flex flex-wrap gap-2">
                    {EXAMPLES.map((example) => (
                        <Button key={example.id} variant="outline" size="sm" onClick={() => applyExample(example.value)}>
                            <TestTube2 className="mr-1 h-3.5 w-3.5" />
                            {text(example.labelKey)}
                        </Button>
                    ))}
                </div>
            </div>

            {error ? (
                <div className="rounded-md bg-destructive/90 p-3 text-sm font-medium text-destructive-foreground">
                    {error}
                </div>
            ) : null}

            <div className="grid min-h-[500px] flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.input}</span>
                    </div>
                    <div className="flex-1 p-0">
                        <Textarea
                            className="h-full min-h-[400px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                            placeholder={text("input_placeholder")}
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            spellCheck={false}
                        />
                    </div>
                </div>

                <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <div className="flex items-center gap-3">
                            <span>{t.common.output}</span>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                </span>
                                <span className="text-[10px] font-bold tracking-wider text-emerald-600/90 dark:text-emerald-400/90 uppercase">
                                    {t.common.hash_tool?.live || "LIVE"}
                                </span>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy} disabled={!output}>
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">{t.common.copy_output}</span>
                        </Button>
                    </div>
                    <div className="relative flex-1 p-0">
                        <Textarea
                            className="h-full min-h-[400px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                            placeholder={t.common.result_placeholder}
                            value={output}
                            readOnly
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

function ModeButton({
    active,
    onClick,
    label,
}: {
    active: boolean
    onClick: () => void
    label: string
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded px-3 py-1.5 text-sm transition-colors ${
                active ? "bg-primary text-primary-foreground" : "border bg-background text-muted-foreground hover:text-foreground"
            }`}
        >
            {label}
        </button>
    )
}
