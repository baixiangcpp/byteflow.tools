"use client"

import * as React from "react"
import { Copy, Eraser, Play, SplitSquareVertical, Merge } from "lucide-react"
import { useLang } from "@/core/i18n/lang-provider"
import { useThemePreference } from "@/hooks/use-theme-preference"
import { ensureByteflowMonacoThemes, getByteflowMonacoThemeName } from "@/core/utils/monaco-theme"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { MonacoEditor } from "@/features/tool-shell/monaco-editors"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { countNdjsonLines, runNdjsonTransform, type NdjsonMessages, type NdjsonMode } from "./utils"
import { WideToolPageContainer } from "@/components/layout/page-container"

const NDJSON_BUTTON_BASE_CLASS =
    "inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"

const NDJSON_BUTTON_VARIANT_CLASS = {
    default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
    outline: "border border-border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
    ghost: "hover:bg-accent hover:text-accent-foreground",
} as const

const NDJSON_BUTTON_SIZE_CLASS = {
    sm: "h-9 px-3",
    icon: "h-7 w-7",
} as const

let toastPromise: Promise<typeof import("sonner")["toast"]> | null = null

async function loadToast() {
    toastPromise ??= import("sonner").then((module) => module.toast)
    return toastPromise
}

function getButtonClassName(
    variant: keyof typeof NDJSON_BUTTON_VARIANT_CLASS,
    size: keyof typeof NDJSON_BUTTON_SIZE_CLASS,
    extra?: string,
) {
    return [NDJSON_BUTTON_BASE_CLASS, NDJSON_BUTTON_VARIANT_CLASS[variant], NDJSON_BUTTON_SIZE_CLASS[size], extra]
        .filter(Boolean)
        .join(" ")
}

export function NdjsonFormatterPage() {
    const { t } = useLang()
    const toolT = t.tools["ndjson_formatter"] as Record<string, string>
    const [input, setInput] = React.useState("")
    const [output, setOutput] = React.useState("")
    const [mode, setMode] = React.useState<NdjsonMode>("format")
    const { resolvedTheme } = useThemePreference()
    const monacoTheme = getByteflowMonacoThemeName(resolvedTheme)
    const messages = React.useMemo<NdjsonMessages>(
        () => ({
            error_label: toolT.error_label,
            invalid_json_line_label: toolT.invalid_json_line_label,
            input_must_be_array_label: toolT.input_must_be_array_label,
            invalid_json_label: toolT.invalid_json_label,
            error_parsing_line_label: toolT.error_parsing_line_label,
        }),
        [toolT],
    )

    const process = React.useCallback(() => {
        if (!input.trim()) { setOutput(""); return }
        setOutput(runNdjsonTransform(input, mode, messages))
    }, [input, messages, mode])

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const withModifier = event.metaKey || event.ctrlKey
            if (!withModifier || event.key !== "Enter" || event.shiftKey) return
            event.preventDefault()
            process()
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [process])

    React.useEffect(() => {
        const timer = setTimeout(() => {
            process()
        }, 180)
        return () => clearTimeout(timer)
    }, [process])

    const handleCopy = async () => {
        if (!output) return
        const result = await safeClipboardWrite(output)
        if (!result.ok) {
            const toast = await loadToast()
            toast.error(t.common.copy_failed)
            return
        }
        const toast = await loadToast()
        toast.success(t.common.copied)
    }

    const lineCount = input ? countNdjsonLines(input) : 0

    return (
        <WideToolPageContainer className="flex flex-col h-full space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <SplitSquareVertical className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {toolT.description}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className={getButtonClassName(mode === "format" ? "default" : "outline", "sm")}
                        onClick={() => setMode("format")}
                    >
                        {toolT.mode_format_action}
                    </button>
                    <button
                        type="button"
                        className={getButtonClassName(mode === "to-ndjson" ? "default" : "outline", "sm")}
                        onClick={() => setMode("to-ndjson")}
                    >
                        <SplitSquareVertical className="mr-1 h-3.5 w-3.5" />
                        {toolT.mode_to_ndjson_action}
                    </button>
                    <button
                        type="button"
                        className={getButtonClassName(mode === "to-array" ? "default" : "outline", "sm")}
                        onClick={() => setMode("to-array")}
                    >
                        <Merge className="mr-1 h-3.5 w-3.5" />
                        {toolT.mode_to_array_action}
                    </button>
                    <button
                        type="button"
                        className={getButtonClassName("outline", "sm")}
                        onClick={() => { setInput(""); setOutput("") }}
                    >
                        <Eraser className="mr-2 h-4 w-4" />{t.common.clear}
                    </button>
                    <button
                        type="button"
                        className={getButtonClassName("default", "sm")}
                        onClick={process}
                    >
                        <Play className="mr-2 h-4 w-4" />
                        {toolT.run_action}
                    </button>
                </div>
            </div>

            {lineCount > 0 && (
                <div className="text-xs text-muted-foreground">
                    {toolT.lines_detected_label.replace("{count}", String(lineCount))}
                </div>
            )}
            <p className="text-xs text-muted-foreground">{toolT.run_action} · Ctrl/Cmd + Enter</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[600px] border rounded-lg bg-card overflow-hidden">
                <div className="flex flex-col h-full border-b lg:border-b-0 lg:border-r">
                    <div className="tool-pane-header">{t.common.input}</div>
                    <div className="flex-1 min-h-[300px]">
                        <MonacoEditor height="100%" language="json" theme={monacoTheme} beforeMount={(monaco) => ensureByteflowMonacoThemes(monaco)} value={input}
                            onChange={(v) => setInput(v || "")}
                            options={{ minimap: { enabled: false }, fontSize: 14, fontFamily: "var(--font-mono)", lineHeight: 24, padding: { top: 16 }, scrollBeyondLastLine: false, wordWrap: "on" }} />
                    </div>
                </div>
                <div className="flex flex-col h-full">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.output}</span>
                        <button
                            type="button"
                            className={getButtonClassName("ghost", "icon")}
                            onClick={() => void handleCopy()}
                            disabled={!output}
                            aria-label={t.common.copy_output}
                        >
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">{t.common.copy_output}</span>
                        </button>
                    </div>
                    <div className="flex-1 min-h-[300px]">
                        <MonacoEditor height="100%" language="json" theme={monacoTheme} beforeMount={(monaco) => ensureByteflowMonacoThemes(monaco)} value={output}
                            options={{ readOnly: true, minimap: { enabled: false }, fontSize: 14, fontFamily: "var(--font-mono)", lineHeight: 24, padding: { top: 16 }, scrollBeyondLastLine: false, wordWrap: "on" }} />
                    </div>
                </div>
            </div>
            <RelatedTools toolKey="ndjson_formatter" />
        </WideToolPageContainer>
    )
}
