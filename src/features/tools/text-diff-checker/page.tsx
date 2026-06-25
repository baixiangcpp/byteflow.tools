"use client"

import * as React from "react"
import { Eraser, SplitSquareHorizontal } from "lucide-react"
import { useLang } from "@/core/i18n/lang-provider"
import { useThemePreference } from "@/hooks/use-theme-preference"
import { ensureByteflowMonacoThemes, getByteflowMonacoThemeName } from "@/core/utils/monaco-theme"
import { MonacoDiffEditor } from "@/features/tool-shell/monaco-editors"
import { buildInputTooLargeMessage, isOverUtf8Budget, TOOL_RUNTIME_BUDGETS } from "@/core/performance/tool-runtime-budgets"

const ACTION_BUTTON_CLASS =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 sm:h-9 sm:min-h-9 sm:py-0 dark:bg-input/30 dark:border-input dark:hover:bg-input/50"

export function TextDiffCheckerPage() {
    const { t } = useLang()
    const [original, setOriginal] = React.useState("")
    const [modified, setModified] = React.useState("")
    const [error, setError] = React.useState<string | null>(null)

    const { resolvedTheme } = useThemePreference()
    const monacoTheme = getByteflowMonacoThemeName(resolvedTheme)

    const handleClear = () => {
        setOriginal("")
        setModified("")
        setError(null)
    }

    const updateSide = (side: "original" | "modified", value: string) => {
        if (isOverUtf8Budget(value, TOOL_RUNTIME_BUDGETS.maxDiffInputBytes)) {
            setError(buildInputTooLargeMessage(t.common.local_input_too_large, TOOL_RUNTIME_BUDGETS.maxDiffInputBytes))
            return
        }
        setError(null)
        if (side === "original") setOriginal(value)
        else setModified(value)
    }

    return (
        <div className="flex flex-col h-full max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <SplitSquareHorizontal className="h-6 w-6 text-primary" />
                        {t.tools['text_diff_checker'].title}</h1>
                    <p className="text-muted-foreground mt-1">
                        {t.tools['text_diff_checker'].description}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button type="button" className={ACTION_BUTTON_CLASS} onClick={handleClear}>
                        <Eraser className="mr-2 h-4 w-4" />
                        {t.common.clear}
                    </button>
                </div>
            </div>

            {error ? (
                <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                </div>
            ) : null}

            {/* Workspace Grid using DiffEditor */}
            <div className="flex min-h-[600px] min-w-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card">
                {/* Editor Headers inside the card */}
                <div className="grid grid-cols-2 border-b bg-muted/50">
                    <div className="px-4 py-2 text-sm font-medium text-muted-foreground border-r">
                        {t.tools["text_diff_checker"].original}
                    </div>
                    <div className="px-4 py-2 text-sm font-medium text-muted-foreground">
                        {t.tools["text_diff_checker"].modified}
                    </div>
                </div>
                <div className="flex-1">
                    <MonacoDiffEditor
                        height="100%"
                        language="text"
                        theme={monacoTheme}
                        beforeMount={(monaco) => ensureByteflowMonacoThemes(monaco)}
                        original={original}
                        modified={modified}
                        onOriginalChange={(value) => updateSide("original", value)}
                        onModifiedChange={(value) => updateSide("modified", value)}
                        options={{
                            renderSideBySide: true,
                            minimap: { enabled: false },
                            fontSize: 14,
                            fontFamily: "var(--font-mono)",
                            lineHeight: 24,
                            padding: { top: 12 },
                            scrollBeyondLastLine: false,
                            wordWrap: "on",
                            readOnly: false,
                            originalEditable: true,
                            ariaLabel: t.tools['text_diff_checker'].title,
                            originalAriaLabel: t.tools["text_diff_checker"].original,
                            modifiedAriaLabel: t.tools["text_diff_checker"].modified,
                        }}
                        onMount={(editor) => {
                            editor.getOriginalEditor().onDidChangeModelContent(() => {
                                updateSide("original", editor.getOriginalEditor().getValue())
                            })
                            editor.getModifiedEditor().onDidChangeModelContent(() => {
                                updateSide("modified", editor.getModifiedEditor().getValue())
                            })
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
