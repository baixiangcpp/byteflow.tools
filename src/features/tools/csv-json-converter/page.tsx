"use client"

import * as React from "react"
import { ArrowLeftRight, Copy, Eraser, Play, Settings2, Download, Upload, TriangleAlert } from "lucide-react"
import { useLang } from "@/core/i18n/lang-provider"
import { useThemePreference } from "@/hooks/use-theme-preference"
import { ensureByteflowMonacoThemes, getByteflowMonacoThemeName } from "@/core/utils/monaco-theme"
import { MonacoEditor } from "@/features/tool-shell/monaco-editors"
import { copyTextWithLazyToolFeedback } from "@/features/tool-shell/lazy-tool-action-feedback"
import { InlineToolActionFeedback, useInlineToolActionFeedback } from "@/features/tool-shell/inline-tool-action-feedback"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { buildToolHandoffLink } from "@/core/routing/tool-handoff"
import { buildInputTooLargeMessage, countNonEmptyLines, isOverUtf8Budget, TOOL_RUNTIME_BUDGETS } from "@/core/performance/tool-runtime-budgets"
import { FILE_INPUT_POLICIES, readTextFileWithPolicy, validateFileAgainstPolicy } from "@/core/files/file-input-policy"
import { readStorageString, removeStorageKey, writeStorageString } from "@/core/storage/tool-persistence"
import {
    DIRECTION_STORAGE_KEY,
    DELIMITER_STORAGE_KEY,
    HAS_HEADER_STORAGE_KEY,
    INPUT_STORAGE_KEY,
    JSON_ARRAY_REQUIRED_ERROR,
    TYPE_INFERENCE_STORAGE_KEY,
} from "./constants"
import { runCsvJsonTask } from "./csv-json-task"
import { InlineButton } from "./components"
import { CsvSettingsPanel } from "./settings-panel"
import type { CsvJsonDiagnostic, Direction } from "./types"
import { WideToolPageContainer } from "@/components/layout/page-container"

// ─── Component ──────────────────────────────────────────────────────────────

export function CsvJsonConverterPage() {
    const { t, lang } = useLang()
    const toolT = t.tools["csv_json_converter"] as Record<string, string>
    const [input, setInput] = React.useState("")
    const [output, setOutput] = React.useState("")
    const [error, setError] = React.useState<string | null>(null)
    const [diagnostics, setDiagnostics] = React.useState<CsvJsonDiagnostic[]>([])
    const [direction, setDirection] = React.useState<Direction>("csv-to-json")
    const [delimiter, setDelimiter] = React.useState("auto")
    const [hasHeader, setHasHeader] = React.useState(true)
    const [typeInference, setTypeInference] = React.useState(true)
    const [showSettings, setShowSettings] = React.useState(false)
    const [isConverting, setIsConverting] = React.useState(false)
    const { feedback: copyFeedback, run: runCopyAction } = useInlineToolActionFeedback()
    const convertRequestIdRef = React.useRef(0)
    const convertAbortControllerRef = React.useRef<AbortController | null>(null)
    const { resolvedTheme } = useThemePreference()
    const monacoTheme = getByteflowMonacoThemeName(resolvedTheme)
    React.useEffect(() => {
        removeStorageKey(INPUT_STORAGE_KEY)

        const savedDirection = readStorageString(DIRECTION_STORAGE_KEY)
        if (savedDirection === "csv-to-json" || savedDirection === "json-to-csv") {
            setDirection(savedDirection)
        }

        const savedDelimiter = readStorageString(DELIMITER_STORAGE_KEY)
        if (savedDelimiter !== null) {
            setDelimiter(savedDelimiter)
        }

        const savedHasHeader = readStorageString(HAS_HEADER_STORAGE_KEY)
        if (savedHasHeader === "1" || savedHasHeader === "0") {
            setHasHeader(savedHasHeader === "1")
        }

        const savedTypeInference = readStorageString(TYPE_INFERENCE_STORAGE_KEY)
        if (savedTypeInference === "1" || savedTypeInference === "0") {
            setTypeInference(savedTypeInference === "1")
        }
    }, [])

    React.useEffect(() => {
        writeStorageString(DIRECTION_STORAGE_KEY, direction)
    }, [direction])

    React.useEffect(() => {
        writeStorageString(DELIMITER_STORAGE_KEY, delimiter)
    }, [delimiter])

    React.useEffect(() => {
        writeStorageString(HAS_HEADER_STORAGE_KEY, hasHeader ? "1" : "0")
    }, [hasHeader])

    React.useEffect(() => {
        writeStorageString(TYPE_INFERENCE_STORAGE_KEY, typeInference ? "1" : "0")
    }, [typeInference])

    const cancelPendingConversion = React.useCallback(() => {
        convertRequestIdRef.current += 1
        convertAbortControllerRef.current?.abort()
        convertAbortControllerRef.current = null
        setIsConverting(false)
    }, [])

    const convert = () => {
        const requestId = convertRequestIdRef.current + 1
        convertRequestIdRef.current = requestId
        convertAbortControllerRef.current?.abort()

        if (!input.trim()) {
            setOutput("")
            setError(null)
            setDiagnostics([])
            setIsConverting(false)
            return
        }

        if (isOverUtf8Budget(input, TOOL_RUNTIME_BUDGETS.maxCsvJsonInputBytes)) {
            setOutput("")
            setError(buildInputTooLargeMessage(t.common.local_input_too_large, TOOL_RUNTIME_BUDGETS.maxCsvJsonInputBytes))
            setDiagnostics([])
            setIsConverting(false)
            return
        }

        if (direction === "csv-to-json" && countNonEmptyLines(input, TOOL_RUNTIME_BUDGETS.maxCsvJsonRows).exceeded) {
            setOutput("")
            setError(t.common.local_row_limit_exceeded.replace("{count}", String(TOOL_RUNTIME_BUDGETS.maxCsvJsonRows)))
            setDiagnostics([])
            setIsConverting(false)
            return
        }

        const controller = new AbortController()
        convertAbortControllerRef.current = controller
        setOutput("")
        setError(null)
        setDiagnostics([])
        setIsConverting(true)
        void runCsvJsonTask({ input, direction, delimiter, hasHeader, typeInference }, { signal: controller.signal })
            .then((result) => {
                if (convertRequestIdRef.current !== requestId) return
                setOutput(result.output)
                setDiagnostics(result.diagnostics)
                setError(null)
            })
            .catch((e: unknown) => {
                if (convertRequestIdRef.current !== requestId) return
                const message = e instanceof Error ? e.message : String(e)
                setOutput("")
                setDiagnostics([])
                setError(message === JSON_ARRAY_REQUIRED_ERROR ? toolT.error_json_array_required : message)
            })
            .finally(() => {
                if (convertRequestIdRef.current === requestId) {
                    convertAbortControllerRef.current = null
                    setIsConverting(false)
                }
            })
    }

    const handleCopy = () => {
        if (!output) return
        return runCopyAction(() => copyTextWithLazyToolFeedback(t, output, t.common.output, t.common.copied_desc))
    }

    const handleClear = () => {
        cancelPendingConversion()
        setInput("")
        setOutput("")
        setError(null)
        setDiagnostics([])
        removeStorageKey(INPUT_STORAGE_KEY)
    }

    const toggleDirection = () => {
        cancelPendingConversion()
        setDirection((d) => (d === "csv-to-json" ? "json-to-csv" : "csv-to-json"))
        // Swap input/output for convenience
        setInput(output)
        setOutput("")
        setError(null)
        setDiagnostics([])
    }

    const handleDownload = () => {
        if (!output) return
        const ext = direction === "csv-to-json" ? "json" : "csv"
        const mime = direction === "csv-to-json" ? "application/json" : "text/csv"
        const blob = new Blob([output], { type: `${mime};charset=utf-8` })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `converted.${ext}`
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const policy = FILE_INPUT_POLICIES["csv-json"]
        const validation = validateFileAgainstPolicy(file, policy)
        if (!validation.ok) {
            setOutput("")
            setDiagnostics([])
            setError(validation.reason === "too_large" ? buildInputTooLargeMessage(t.common.local_input_too_large, TOOL_RUNTIME_BUDGETS.maxCsvJsonInputBytes) : validation.message)
            e.target.value = ""
            return
        }
        void readTextFileWithPolicy(file, policy)
            .then((text) => {
                cancelPendingConversion()
                setInput(text)
                setOutput("")
                setDiagnostics([])
                setError(null)
            })
            .catch((error) => setError(error instanceof Error ? error.message : t.common.image_file_read_failed))
        // reset input so re-selecting the same file works
        e.target.value = ""
    }

    const inputLang = direction === "csv-to-json" ? "plaintext" : "json"
    const outputLang = direction === "csv-to-json" ? "json" : "plaintext"
    const jsonHandoffPayload = direction === "csv-to-json" ? output : ""
    const jsonFormatterHandoff = React.useMemo(
        () => buildToolHandoffLink(lang, "json-formatter", jsonHandoffPayload),
        [jsonHandoffPayload, lang],
    )
    const jsonToTypescriptHandoff = React.useMemo(
        () => buildToolHandoffLink(lang, "json-to-typescript", jsonHandoffPayload),
        [jsonHandoffPayload, lang],
    )
    const openHandoff = React.useCallback((handoff: { href: string; prime: () => void }) => {
        if (!jsonHandoffPayload.trim()) return
        handoff.prime()
        window.location.assign(handoff.href)
    }, [jsonHandoffPayload])
    const jsonFormatterLabel = `${t.common.open} ${t.tools["json_formatter"].title}`
    const jsonToTypescriptLabel = `${t.common.open} ${t.tools["json_to_typescript"].title}`
    const inputFormatLabel = direction === "csv-to-json" ? "CSV" : "JSON"
    const outputFormatLabel = direction === "csv-to-json" ? "JSON" : "CSV"

    return (
        <WideToolPageContainer className="flex flex-col h-full space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <ArrowLeftRight className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {toolT.description}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <InlineButton onClick={() => setShowSettings(!showSettings)}>
                        <Settings2 className="mr-2 h-4 w-4" />
                        {showSettings ? toolT.hide_settings_action : toolT.show_settings_action}
                    </InlineButton>
                    <InlineButton onClick={handleClear}>
                        <Eraser className="mr-2 h-4 w-4" />{t.common.clear}
                    </InlineButton>
                    <InlineButton onClick={toggleDirection}>
                        <ArrowLeftRight className="mr-2 h-4 w-4" />
                        {direction === "csv-to-json"
                            ? toolT.switch_to_json_to_csv_action
                            : toolT.switch_to_csv_to_json_action}
                    </InlineButton>
                    <InlineButton
                        onClick={() => openHandoff(jsonFormatterHandoff)}
                        disabled={direction !== "csv-to-json" || !jsonHandoffPayload.trim()}
                    >
                        {jsonFormatterLabel}
                    </InlineButton>
                    <InlineButton
                        onClick={() => openHandoff(jsonToTypescriptHandoff)}
                        disabled={direction !== "csv-to-json" || !jsonHandoffPayload.trim()}
                    >
                        {jsonToTypescriptLabel}
                    </InlineButton>
                    <InlineButton variant="default" onClick={convert} disabled={isConverting}>
                        <Play className="mr-2 h-4 w-4" />
                        {toolT.convert_action}
                    </InlineButton>
                </div>
            </div>

            <InlineToolActionFeedback feedback={copyFeedback} />

            {/* Direction indicator */}
            <div className="flex items-center gap-3 text-sm">
                <span className={`px-3 py-1 rounded-full font-medium ${direction === "csv-to-json" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    CSV
                </span>
                <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                <span className={`px-3 py-1 rounded-full font-medium ${direction === "json-to-csv" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    JSON
                </span>
            </div>

            {/* Settings Panel */}
            {showSettings ? (
                <CsvSettingsPanel
                    delimiter={delimiter}
                    direction={direction}
                    hasHeader={hasHeader}
                    setDelimiter={setDelimiter}
                    setHasHeader={setHasHeader}
                    setTypeInference={setTypeInference}
                    toolT={toolT}
                    typeInference={typeInference}
                />
            ) : null}

            {/* Error */}
            {error && (
                <div className="p-3 text-sm font-medium text-destructive-foreground bg-destructive/90 rounded-md">
                    {error}
                </div>
            )}

            {diagnostics.length > 0 && (
                <section
                    aria-label={toolT.diagnostics_label}
                    aria-live="polite"
                    className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm"
                >
                    <div className="flex items-center gap-2 font-medium text-foreground">
                        <TriangleAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                        <h2>{toolT.diagnostics_label}</h2>
                    </div>
                    <ul className="mt-2 space-y-1 text-muted-foreground">
                        {diagnostics.map((diagnostic, index) => (
                            <li key={`${diagnostic.code}-${diagnostic.row ?? 0}-${diagnostic.column ?? 0}-${index}`}>
                                {diagnostic.message}
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Workspace Grid */}
            <div data-input-intent="workbench" className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[600px] border rounded-lg bg-card overflow-hidden">
                {/* Input Pane */}
                <div className="flex flex-col h-full border-b lg:border-b-0 lg:border-r">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.input} ({inputFormatLabel})</span>
                        <label className="cursor-pointer">
                            <input type="file" data-input-intent="payload" className="hidden" accept={FILE_INPUT_POLICIES["csv-json"].accept} onChange={handleFileUpload} />
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                <Upload className="h-3.5 w-3.5" />
                                {toolT.input_upload_action}
                            </span>
                        </label>
                    </div>
                    <div className="flex-1 min-h-[300px]">
                        <MonacoEditor
                            intent="payload"
                            height="100%"
                            defaultLanguage={inputLang}
                            language={inputLang}
                            theme={monacoTheme}
                            beforeMount={(monaco) => ensureByteflowMonacoThemes(monaco)}
                            value={input}
                            onChange={(val) => {
                                cancelPendingConversion()
                                setInput(val || "")
                                setOutput("")
                                setDiagnostics([])
                                setError(null)
                            }}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                fontFamily: "var(--font-mono)",
                                lineHeight: 24,
                                padding: { top: 16 },
                                scrollBeyondLastLine: false,
                                wordWrap: "on",
                            }}
                        />
                    </div>
                </div>

                {/* Output Pane */}
                <div className="flex flex-col h-full">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.output} ({outputFormatLabel})</span>
                        <div className="flex items-center gap-1">
                            <InlineButton variant="ghost" size="icon" className="lg:h-7 lg:w-7" onClick={handleDownload} disabled={!output} title={t.common.download}>
                                <Download className="h-4 w-4" />
                            </InlineButton>
                            <InlineButton variant="ghost" size="icon" className="lg:h-7 lg:w-7" onClick={() => void handleCopy()} disabled={!output} title={t.common.copy}>
                                <Copy className="h-4 w-4" />
                            </InlineButton>
                        </div>
                    </div>
                    {direction === "json-to-csv" && (
                        <p className="border-b border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                            {toolT.spreadsheet_safe_note}
                        </p>
                    )}
                    <div className="flex-1 min-h-[300px]">
                        <MonacoEditor
                            intent="generatedOutput"
                            height="100%"
                            defaultLanguage={outputLang}
                            language={outputLang}
                            theme={monacoTheme}
                            beforeMount={(monaco) => ensureByteflowMonacoThemes(monaco)}
                            value={output}
                            options={{
                                readOnly: true,
                                minimap: { enabled: false },
                                fontSize: 14,
                                fontFamily: "var(--font-mono)",
                                lineHeight: 24,
                                padding: { top: 16 },
                                scrollBeyondLastLine: false,
                                wordWrap: "on",
                            }}
                        />
                    </div>
                </div>
            </div>

            <RelatedTools toolKey="csv_json_converter" />
        </WideToolPageContainer>
    )
}
