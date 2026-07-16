"use client"

import * as React from "react"
import { GitCompare, Trash2, Copy, FileJson, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { MonacoDiffEditor } from "@/features/tool-shell/monaco-editors"
import { OutputWrapModeControl, type OutputWrapMode } from "@/features/tool-shell/text-output-panel"
import { ensureByteflowMonacoThemes, getByteflowMonacoThemeName } from "@/core/utils/monaco-theme"
import { useThemePreference } from "@/hooks/use-theme-preference"
import { buildInputTooLargeMessage, isOverUtf8Budget, TOOL_RUNTIME_BUDGETS } from "@/core/performance/tool-runtime-budgets"
import { WideToolPageContainer } from "@/components/layout/page-container"

function flattenJson(obj: unknown, prefix = "", context = { nodes: 0, truncated: false }): Record<string, string> {
    const result: Record<string, string> = {}
    if (context.nodes >= TOOL_RUNTIME_BUDGETS.maxJsonDiffFlattenedNodes) {
        context.truncated = true
        return result
    }
    context.nodes += 1
    if (typeof obj !== "object" || obj === null) {
        result[prefix] = JSON.stringify(obj)
        return result
    }
    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i += 1) {
            if (context.truncated) break
            Object.assign(result, flattenJson(obj[i], `${prefix}[${i}]`, context))
        }
    } else {
        for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
            if (context.truncated) break
            const newPre = prefix ? `${prefix}.${key}` : key
            Object.assign(result, flattenJson(val, newPre, context))
        }
    }
    return result
}

const SAMPLE_A = `{
  "name": "svc_42",
  "version": 1,
  "features": ["json-formatter", "base64", "regex"],
  "config": {
    "theme": "dark",
    "port": 3000
  }
}`

const SAMPLE_B = `{
  "name": "svc_42",
  "version": 2,
  "features": ["json-formatter", "base64", "regex", "qr-code"],
  "config": {
    "theme": "dark",
    "port": 3001,
    "analytics": false
  }
}`

export function JsonDiffViewerPage() {
    const { t } = useLang()
    const { resolvedTheme } = useThemePreference()
    const [left, setLeft] = React.useState(SAMPLE_A)
    const [right, setRight] = React.useState(SAMPLE_B)
    const [error, setError] = React.useState<string | null>(null)
    const [wrapMode, setWrapMode] = React.useState<OutputWrapMode>("wrap")
    const toolT = t.tools["json_diff_viewer"] as Record<string, string>

    const monacoTheme = getByteflowMonacoThemeName(resolvedTheme)

    const formattedLeft = React.useMemo(() => {
        if (isOverUtf8Budget(left, TOOL_RUNTIME_BUDGETS.maxDiffInputBytes)) return left
        try {
            return JSON.stringify(JSON.parse(left), null, 2)
        } catch {
            return left
        }
    }, [left])

    const formattedRight = React.useMemo(() => {
        if (isOverUtf8Budget(right, TOOL_RUNTIME_BUDGETS.maxDiffInputBytes)) return right
        try {
            return JSON.stringify(JSON.parse(right), null, 2)
        } catch {
            return right
        }
    }, [right])

    const keyDiff = React.useMemo(() => {
        if (isOverUtf8Budget(left, TOOL_RUNTIME_BUDGETS.maxDiffInputBytes) || isOverUtf8Budget(right, TOOL_RUNTIME_BUDGETS.maxDiffInputBytes)) {
            return []
        }
        try {
            const context = { nodes: 0, truncated: false }
            const a = flattenJson(JSON.parse(left), "", context)
            const b = flattenJson(JSON.parse(right), "", context)
            if (context.truncated) return []
            const allKeys = new Set([...Object.keys(a), ...Object.keys(b)])
            return [...allKeys].sort().map(key => ({
                key,
                left: a[key],
                right: b[key],
                status: (a[key] === undefined ? "added" : b[key] === undefined ? "removed" : a[key] !== b[key] ? "changed" : "same") as "added" | "removed" | "changed" | "same"
            }))
        } catch {
            return []
        }
    }, [left, right])

    const handleCopyKey = async (key: string) => {
        const result = await safeClipboardWrite(key)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, { description: key })
    }

    const actions: ToolAction[] = [
        {
            id: "format",
            label: t.common.format || "Format",
            icon: FileJson,
            onClick: () => {
                if (isOverUtf8Budget(left, TOOL_RUNTIME_BUDGETS.maxDiffInputBytes) || isOverUtf8Budget(right, TOOL_RUNTIME_BUDGETS.maxDiffInputBytes)) {
                    setError(buildInputTooLargeMessage(t.common.local_input_too_large, TOOL_RUNTIME_BUDGETS.maxDiffInputBytes))
                    return
                }
                try {
                    setLeft(JSON.stringify(JSON.parse(left), null, 2))
                    setRight(JSON.stringify(JSON.parse(right), null, 2))
                    setError(null)
                    toast.success("Formatted JSON")
                } catch {
                    toast.error("Invalid JSON")
                }
            }
        },
        {
            id: "sample",
            label: t.common.sample || "Sample",
            icon: RotateCcw,
            variant: "outline",
            onClick: () => {
                setLeft(SAMPLE_A)
                setRight(SAMPLE_B)
                setError(null)
            }
        },
        {
            id: "clear",
            label: t.common.clear || "Clear",
            icon: Trash2,
            variant: "outline",
            onClick: () => {
                setLeft("")
                setRight("")
                setError(null)
            }
        }
    ]

    const overBudget = isOverUtf8Budget(left, TOOL_RUNTIME_BUDGETS.maxDiffInputBytes) || isOverUtf8Budget(right, TOOL_RUNTIME_BUDGETS.maxDiffInputBytes)
    const budgetMessage = overBudget
        ? buildInputTooLargeMessage(t.common.local_input_too_large, TOOL_RUNTIME_BUDGETS.maxDiffInputBytes)
        : error

    return (
        <WideToolPageContainer className="flex h-full flex-col space-y-8 py-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <GitCompare className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{toolT.title}</h1>
                        <p className="text-muted-foreground">{toolT.description}</p>
                    </div>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            {budgetMessage ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    {budgetMessage}
                </div>
            ) : null}

            <div className="grid min-w-0 grid-cols-1 gap-6">
                <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2">
                        <div className="flex items-center gap-4 text-sm font-medium">
                            <span className="text-muted-foreground">{toolT.original}</span>
                            <span className="text-muted-foreground">vs</span>
                            <span className="text-muted-foreground">{toolT.modified}</span>
                        </div>
                        <OutputWrapModeControl value={wrapMode} onChange={setWrapMode} />
                    </div>
                    <div className="min-h-[600px]">
                        <MonacoDiffEditor
                            original={formattedLeft}
                            modified={formattedRight}
                            onOriginalChange={(value) => { setLeft(value); setError(null) }}
                            onModifiedChange={(value) => { setRight(value); setError(null) }}
                            language="json"
                            theme={monacoTheme}
                            beforeMount={(monaco) => ensureByteflowMonacoThemes(monaco)}
                            options={{
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                fontSize: 13,
                                lineNumbers: "on",
                                renderSideBySide: true,
                                wordWrap: wrapMode === "wrap" ? "on" : "off",
                                originalEditable: true,
                                readOnly: false,
                            }}
                        />
                    </div>
                </div>

                {/* Key Diff Section */}
                <div className="flex flex-col space-y-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold">{toolT.key_diff || "Structural Changes"}</h2>
                        <div className="h-px flex-1 bg-border" />
                    </div>
                    
                    <div className="rounded-lg border bg-card shadow-sm">
                        <div className="max-h-[400px] overflow-auto p-4">
                            <div className="space-y-2">
                                {keyDiff.filter(k => k.status !== "same").map((k, i) => (
                                    <div
                                        key={i}
                                        className="group relative flex flex-col gap-1 rounded-md border border-transparent bg-muted/30 p-3 transition-colors hover:border-border hover:bg-muted/50"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <span className={`h-2 w-2 rounded-full shrink-0 ${
                                                    k.status === "added" ? "bg-green-500" :
                                                    k.status === "removed" ? "bg-red-500" :
                                                    "bg-amber-500"
                                                }`} />
                                                <code className="truncate text-xs font-bold text-foreground">
                                                    {k.key}
                                                </code>
                                            </div>
                                            <button
                                                onClick={() => void handleCopyKey(k.key)}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-background rounded transition-all"
                                                title={t.common.copy}
                                            >
                                                <Copy className="h-3 w-3 text-muted-foreground" />
                                            </button>
                                        </div>
                                        
                                        <div className="mt-1 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
                                            {(k.status === "removed" || k.status === "changed") && (
                                                <div className="space-y-1">
                                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                                                        {toolT.original}
                                                    </span>
                                                    <div className="rounded bg-red-500/10 px-2 py-1 text-xs font-mono text-red-600 dark:text-red-400 break-all">
                                                        {k.left}
                                                    </div>
                                                </div>
                                            )}
                                            {(k.status === "added" || k.status === "changed") && (
                                                <div className="space-y-1">
                                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                                                        {toolT.modified}
                                                    </span>
                                                    <div className="rounded bg-green-500/10 px-2 py-1 text-xs font-mono text-green-600 dark:text-green-400 break-all">
                                                        {k.right}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {keyDiff.filter(k => k.status !== "same").length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="mb-4 rounded-full bg-muted p-3">
                                            <GitCompare className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {toolT.no_diff || "No structural differences found between the JSON objects."}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </WideToolPageContainer>
    )
}
