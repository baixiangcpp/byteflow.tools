"use client"

import * as React from "react"
import { Search, Copy, Braces, Trash2, TestTube2 } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { useThemePreference } from "@/hooks/use-theme-preference"
import { getByteflowMonacoThemeName } from "@/core/utils/monaco-theme"
import { MonacoEditor } from "@/features/tool-shell/monaco-editors"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { WideToolPageContainer } from "@/components/layout/page-container"

function queryJsonPath(obj: unknown, path: string): unknown[] {
    const results: unknown[] = []
    const parts = path.replace(/^\$\.?/, "").split(/\.|\[|\]/).filter(Boolean)

    function traverse(current: unknown, remaining: string[]) {
        if (remaining.length === 0) {
            results.push(current)
            return
        }
        const [head, ...tail] = remaining
        if (head === "*") {
            if (Array.isArray(current)) {
                current.forEach(item => traverse(item, tail))
            } else if (typeof current === "object" && current !== null) {
                Object.values(current).forEach(val => traverse(val, tail))
            }
        } else if (Array.isArray(current)) {
            const idx = parseInt(head, 10)
            if (!isNaN(idx) && idx >= 0 && idx < current.length) {
                traverse(current[idx], tail)
            }
        } else if (typeof current === "object" && current !== null) {
            const record = current as Record<string, unknown>
            if (head in record) {
                traverse(record[head], tail)
            }
        }
    }

    traverse(obj, parts)
    return results
}

const SAMPLE_JSON = `{
  "data": {
    "rows": [
      { "id": "bk_001", "sku": "A-100", "amt": 10.99 },
      { "id": "bk_002", "sku": "B-200", "amt": 8.99 },
      { "id": "bk_003", "sku": "C-300", "amt": 12.5 }
    ],
    "meta": {
      "loc": "cn-sh",
      "ts": "2026-03-07T09:00:00Z"
    }
  }
}`
const SAMPLE_PATH = "$.data.rows.*.id"

export function JsonPathPlaygroundPage() {
    const { t } = useLang()
    const toolT = t.tools["jsonpath_playground"] as Record<string, string>
    const errorLabel = toolT.error_label
    const [json, setJson] = React.useState(SAMPLE_JSON)
    const [path, setPath] = React.useState(SAMPLE_PATH)
    const [result, setResult] = React.useState("")
    const [matchCount, setMatchCount] = React.useState<number | null>(null)
    const [error, setError] = React.useState<string | null>(null)

    const { resolvedTheme } = useThemePreference()
    const monacoTheme = getByteflowMonacoThemeName(resolvedTheme)

    const handleSample = () => {
        setJson(SAMPLE_JSON)
        setPath(SAMPLE_PATH)
    }

    const handleCopyResult = async () => {
        if (!result) return
        const copyResult = await safeClipboardWrite(result)
        if (!copyResult.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }

    const actions: ToolAction[] = [
        { id: "sample", label: t.common.sample, icon: TestTube2, onClick: handleSample },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: handleCopyResult, disabled: !result },
        { id: "clear", label: t.common.clear, icon: Trash2, onClick: () => { setJson(""); setPath(""); } },
    ]

    React.useEffect(() => {
        if (!json.trim() || !path.trim()) {
            setResult("")
            setError(null)
            return
        }
        try {
            const parsed = JSON.parse(json)
            const matches = queryJsonPath(parsed, path)
            setResult(JSON.stringify(matches, null, 2))
            setMatchCount(matches.length)
            setError(null)
        } catch {
            setError(errorLabel)
            setResult("")
            setMatchCount(null)
        }
    }, [errorLabel, json, path])

    return (
        <WideToolPageContainer className="flex h-full flex-col space-y-8">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <Braces className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="text-muted-foreground">
                        {toolT.description}
                    </p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            {/* Query bar */}
            <div className="flex flex-col gap-2 rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <span>{toolT.path_label || "JSONPath Query"}</span>
                </div>
                <div className="relative">
                    <input
                        value={path}
                        onChange={(e) => setPath(e.target.value)}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
                        placeholder={toolT.path_placeholder}
                    />
                    {error && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-destructive">{error}</span>}
                </div>
            </div>

            <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-sm font-medium text-foreground">{toolT.json_input}</span>
                    </div>
                    <div className="flex-1 overflow-hidden rounded-xl border bg-card">
                        <MonacoEditor
                            language="json"
                            value={json}
                            onChange={(val) => setJson(val || "")}
                            height="100%"
                            theme={monacoTheme}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                lineNumbers: "on",
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                            }}
                        />
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-sm font-medium text-foreground">{toolT.query_results}</span>
                        {matchCount !== null && (
                            <span className="text-xs text-muted-foreground">
                                {matchCount} {toolT.matches}
                            </span>
                        )}
                    </div>
                    <div className="flex-1 overflow-hidden rounded-xl border bg-card">
                        <MonacoEditor
                            language="json"
                            value={result}
                            height="100%"
                            theme={monacoTheme}
                            options={{
                                readOnly: true,
                                minimap: { enabled: false },
                                fontSize: 14,
                                lineNumbers: "on",
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                            }}
                        />
                    </div>
                </div>
            </div>
        </WideToolPageContainer>
    )
}
