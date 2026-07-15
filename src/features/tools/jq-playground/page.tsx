"use client"

import * as React from "react"
import { Play, Copy, Trash2, FileText, Sparkles, History, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { executeJqFilter, formatJqParsedOutput, validateJSON, formatJSON, type JqOutputMode } from "@/features/tools/jq-playground/browser-actions"
import { JQ_EXAMPLES, type JqExample } from "@/features/tools/jq-playground/samples"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { WideToolPageContainer } from "@/components/layout/page-container"

const AUTO_RUN_KEY = "jq-playground-auto-run"
const MAX_HISTORY_SIZE = 10
const AUTO_RUN_DEBOUNCE_MS = 500
const MAX_INPUT_SIZE_FOR_AUTO_RUN = 1024 * 1024 // 1MB

interface FilterHistoryItem {
    filter: string
    timestamp: number
}

export function JqPlaygroundPage() {
    const { t } = useLang()
    const toolT = t.tools["jq_playground"] as Record<string, string> | undefined
    const text = (key: string) => toolT?.[key] || key

    const [jsonInput, setJsonInput] = React.useState("")
    const [jqFilter, setJqFilter] = React.useState(".")
    const [rawOutput, setRawOutput] = React.useState("")
    const [parsedOutput, setParsedOutput] = React.useState("")
    const [outputMode, setOutputMode] = React.useState<JqOutputMode | null>(null)
    const [error, setError] = React.useState<string | null>(null)
    const [isExecuting, setIsExecuting] = React.useState(false)
    const [autoRun, setAutoRun] = React.useState(false)
    const [filterHistory, setFilterHistory] = React.useState<FilterHistoryItem[]>([])
    const [showHistory, setShowHistory] = React.useState(false)

    React.useEffect(() => {
        const savedAutoRun = localStorage.getItem(AUTO_RUN_KEY)
        if (savedAutoRun === "true") {
            setAutoRun(true)
        }
    }, [])

    // Save auto-run preference
    React.useEffect(() => {
        localStorage.setItem(AUTO_RUN_KEY, autoRun.toString())
    }, [autoRun])

    const saveToHistory = React.useCallback((filter: string) => {
        if (!filter || filter === ".") return

        setFilterHistory((prev) => {
            const newItem: FilterHistoryItem = {
                filter,
                timestamp: Date.now(),
            }

            // Remove duplicates and add to front
            const filtered = prev.filter((item) => item.filter !== filter)
            const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_SIZE)

            return updated
        })
    }, [])

    const handleRun = React.useCallback(async () => {
        setError(null)
        setRawOutput("")
        setParsedOutput("")
        setOutputMode(null)

        // Validate JSON input
        const validation = validateJSON(jsonInput)
        if (!validation.valid) {
            setError(validation.error)
            return
        }

        // Execute jq filter
        setIsExecuting(true)
        try {
            const inputData = JSON.parse(jsonInput)
            const result = await executeJqFilter(inputData, jqFilter)

            if (result.success) {
                setRawOutput(result.stdout)
                setParsedOutput(formatJqParsedOutput(result.parsed, result.mode))
                setOutputMode(result.mode)
                saveToHistory(jqFilter)
            } else {
                const rawDetail = result.rawError && result.rawError !== result.error
                    ? `\n\nRaw error detail:\n${result.rawError}`
                    : ""
                setError(`${result.error}${rawDetail}`)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err))
        } finally {
            setIsExecuting(false)
        }
    }, [jsonInput, jqFilter, saveToHistory])

    const handleLoadExample = React.useCallback((example: JqExample) => {
        setJsonInput(JSON.stringify(example.input, null, 2))
        setJqFilter(example.filter)
        setError(null)
        setRawOutput("")
        setParsedOutput("")
        setOutputMode(null)
        toast.success(`Example loaded: ${example.name}`)
    }, [])

    const handleCopyOutput = React.useCallback(() => {
        const output = parsedOutput || rawOutput
        if (output) {
            safeClipboardWrite(output)
            toast.success(t.common.copied)
        }
    }, [parsedOutput, rawOutput, t.common.copied])

    const handleClear = React.useCallback(() => {
        setJsonInput("")
        setJqFilter(".")
        setRawOutput("")
        setParsedOutput("")
        setOutputMode(null)
        setError(null)
    }, [])

    const handleFormatJSON = React.useCallback(() => {
        if (jsonInput) {
            setJsonInput(formatJSON(jsonInput))
        }
    }, [jsonInput])

    // Auto-run with debounce
    React.useEffect(() => {
        if (!autoRun || !jsonInput || !jqFilter) return

        // Check input size
        const inputSize = new Blob([jsonInput]).size
        if (inputSize > MAX_INPUT_SIZE_FOR_AUTO_RUN) {
            return
        }

        const timeoutId = setTimeout(() => {
            handleRun()
        }, AUTO_RUN_DEBOUNCE_MS)

        return () => clearTimeout(timeoutId)
    }, [jsonInput, jqFilter, autoRun, handleRun])

    // Keyboard shortcut: Ctrl/Cmd+Enter to run
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault()
                handleRun()
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [handleRun])

    return (
        <WideToolPageContainer className="py-8 space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">{text("title")}</h1>
                <p className="text-muted-foreground">{text("description")}</p>
            </div>

            {/* Examples */}
            <div className="space-y-3">
                <Label className="font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {text("examples_label")}
                </Label>
                <div className="flex flex-wrap gap-2">
                    {JQ_EXAMPLES.slice(0, 8).map((example) => (
                        <Button
                            key={example.id}
                            variant="outline"
                            size="sm"
                            onClick={() => handleLoadExample(example)}
                            className="text-xs"
                        >
                            {example.name}
                        </Button>
                    ))}
                </div>
            </div>

            {/* JSON Input */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="font-semibold">{text("input_label")}</Label>
                    <Button variant="ghost" size="sm" onClick={handleFormatJSON}>
                        <FileText className="w-4 h-4 mr-1" />
                        {t.common.format}
                    </Button>
                </div>
                <Textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder={text("input_placeholder")}
                    className="min-h-[250px] font-mono text-sm"
                />
            </div>

            {/* jq Filter Input */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="font-semibold">{text("filter_label")}</Label>
                    <div className="flex items-center gap-4">
                        {/* Auto-run toggle */}
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="auto-run"
                                checked={autoRun}
                                onCheckedChange={(checked) => setAutoRun(checked === true)}
                            />
                            <Label htmlFor="auto-run" className="text-sm cursor-pointer">
                                {text("auto_run")}
                            </Label>
                        </div>
                        {/* Filter history */}
                        {filterHistory.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowHistory(!showHistory)}
                            >
                                <History className="w-4 h-4 mr-1" />
                                {text("history")}
                            </Button>
                        )}
                    </div>
                </div>

                {/* History dropdown */}
                {showHistory && filterHistory.length > 0 && (
                    <div className="border rounded-md p-2 space-y-1 bg-muted/30">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-muted-foreground">
                                {text("recent_filters")}
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setFilterHistory([])
                                    toast.success(text("history_cleared"))
                                }}
                                className="h-6 px-2 text-xs"
                            >
                                <RotateCcw className="w-3 h-3 mr-1" />
                                {t.common.clear}
                            </Button>
                        </div>
                        {filterHistory.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setJqFilter(item.filter)
                                    setShowHistory(false)
                                }}
                                className="w-full text-left px-2 py-1 text-xs font-mono rounded hover:bg-muted transition-colors"
                            >
                                {item.filter}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={jqFilter}
                        onChange={(e) => setJqFilter(e.target.value)}
                        placeholder={text("filter_placeholder")}
                        className="flex-1 px-3 py-2 border rounded-md font-mono text-sm"
                        onKeyDown={(e) => {
                            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                                e.preventDefault()
                                handleRun()
                            }
                        }}
                    />
                    <Button onClick={handleRun} disabled={isExecuting} size="lg">
                        <Play className="w-4 h-4 mr-1" />
                        {isExecuting ? text("running") : text("run_button")}
                    </Button>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{text("keyboard_hint")}</span>
                    {autoRun && (
                        <span className="text-xs text-primary">
                            {text("auto_run_active")}
                        </span>
                    )}
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <Alert variant="destructive">
                    <AlertTitle>{text("error_title")}</AlertTitle>
                    <AlertDescription className="font-mono text-sm whitespace-pre-wrap">
                        {error}
                    </AlertDescription>
                </Alert>
            )}

            {/* Output */}
            {outputMode && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label className="font-semibold">{text("output_label")}</Label>
                            <p className="text-xs text-muted-foreground">
                                {outputMode === "single-json" && text("output_mode_single_json")}
                                {outputMode === "json-stream" && text("output_mode_json_stream")}
                                {outputMode === "raw-text" && text("output_mode_raw_text")}
                                {outputMode === "empty" && text("empty_result")}
                            </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleCopyOutput} disabled={!parsedOutput && !rawOutput}>
                            <Copy className="w-4 h-4 mr-1" />
                            {t.common.copy}
                        </Button>
                    </div>
                    {parsedOutput && (
                        <div className="space-y-2">
                            <Label className="text-sm">{text("parsed_output_label")}</Label>
                            <Textarea
                                value={parsedOutput}
                                readOnly
                                className="min-h-[220px] font-mono text-sm bg-muted/30"
                            />
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label className="text-sm">{text("raw_output_label")}</Label>
                        <Textarea
                            value={rawOutput || text("empty_result")}
                            readOnly
                            className="min-h-[160px] font-mono text-sm bg-muted/30"
                        />
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
                <Button variant="outline" onClick={handleClear}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    {t.common.clear}
                </Button>
            </div>

            {/* Help Section */}
            <div className="space-y-4 border-t pt-6">
                <h2 className="text-lg font-semibold">{text("help_title")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                        <h3 className="font-medium">{text("help_basic")}</h3>
                        <ul className="space-y-1 text-muted-foreground font-mono text-xs">
                            <li><code>.</code> - {text("help_identity")}</li>
                            <li><code>.field</code> - {text("help_field")}</li>
                            <li><code>.[0]</code> - {text("help_array_index")}</li>
                            <li><code>.[]</code> - {text("help_iterate")}</li>
                        </ul>
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-medium">{text("help_operations")}</h3>
                        <ul className="space-y-1 text-muted-foreground font-mono text-xs">
                            <li><code>select(.age &gt; 25)</code> - {text("help_select")}</li>
                            <li><code>map(.name)</code> - {text("help_map")}</li>
                            <li><code>sort_by(.age)</code> - {text("help_sort")}</li>
                            <li><code>group_by(.type)</code> - {text("help_group")}</li>
                        </ul>
                    </div>
                </div>
            </div>
        </WideToolPageContainer>
    )
}
