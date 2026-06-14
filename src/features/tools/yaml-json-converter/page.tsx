"use client"

import * as React from "react"
import { Copy, Eraser, RefreshCw, ArrowRightLeft, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useLang } from "@/core/i18n/lang-provider"
import { useThemePreference } from "@/hooks/use-theme-preference"
import { ensureByteflowMonacoThemes, getByteflowMonacoThemeName } from "@/core/utils/monaco-theme"
import { MonacoEditor } from "@/features/tool-shell/monaco-editors"
import YAML from "yaml"
import { readStorageString, removeStorageKey, writeStorageString } from "@/core/storage/tool-persistence"
import { buildToolHandoffLink } from "@/core/routing/tool-handoff"
import { importTextFile, TEXT_FILE_IMPORT_ACCEPT } from "@/core/files/text-file-import"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"

const INPUT_STORAGE_KEY = "byteflow:yaml-json-converter:input"
const MODE_STORAGE_KEY = "byteflow:yaml-json-converter:mode"

export function YamlJsonConverterPage() {
    const { t, lang } = useLang()
    const toolT = t.tools["yaml_json_converter"] as Record<string, string>
    const text = React.useCallback((key: string) => toolT[key], [toolT])
    const [input, setInput] = React.useState("")
    const [output, setOutput] = React.useState("")
    const [mode, setMode] = React.useState<"yaml-to-json" | "json-to-yaml">("yaml-to-json")
    const [error, setError] = React.useState<string | null>(null)
    const [importError, setImportError] = React.useState<string | null>(null)
    const [isImportDragActive, setIsImportDragActive] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const { resolvedTheme } = useThemePreference()
    const monacoTheme = getByteflowMonacoThemeName(resolvedTheme)
    React.useEffect(() => {
        const savedInput = readStorageString(INPUT_STORAGE_KEY)
        if (savedInput) {
            setInput(savedInput)
        }

        const savedMode = readStorageString(MODE_STORAGE_KEY)
        if (savedMode === "yaml-to-json" || savedMode === "json-to-yaml") {
            setMode(savedMode)
        }
    }, [])

    React.useEffect(() => {
        if (!input.trim()) return
        writeStorageString(INPUT_STORAGE_KEY, input)
    }, [input])

    React.useEffect(() => {
        writeStorageString(MODE_STORAGE_KEY, mode)
    }, [mode])

    const toggleMode = () => {
        setMode(prev => prev === "yaml-to-json" ? "json-to-yaml" : "yaml-to-json")
        // Optionally swap input/output contents
        const temp = input
        setInput(output)
        setOutput(temp)
        setError(null)
        setImportError(null)
    }

    const doConvert = React.useCallback(() => {
        if (!input.trim()) {
            setOutput("")
            setError(null)
            return
        }

        try {
            if (mode === "yaml-to-json") {
                const parsed = YAML.parse(input)
                setOutput(JSON.stringify(parsed, null, 2))
            } else {
                const parsed = JSON.parse(input)
                setOutput(YAML.stringify(parsed))
            }
            setError(null)
        } catch {
            setError(mode === "yaml-to-json" ? text("error_yaml_to_json") : text("error_json_to_yaml"))
        }
    }, [input, mode, text])

    const openImportPicker = () => {
        fileInputRef.current?.click()
    }

    const handleImportFile = async (file: File) => {
        try {
            const content = await importTextFile(file)
            setInput(content)
            setOutput("")
            setError(null)
            setImportError(null)
        } catch {
            setImportError(text("import_failed"))
        }
    }

    const handleCopy = React.useCallback(async () => {
        if (!output) return
        const result = await safeClipboardWrite(output)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, {
            description: text("copied_desc"),
        })
    }, [output, t.common, text])

    const handleClear = () => {
        setInput("")
        setOutput("")
        setError(null)
        setImportError(null)
        removeStorageKey(INPUT_STORAGE_KEY)
    }

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const withModifier = event.metaKey || event.ctrlKey
            if (!withModifier) return

            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                doConvert()
                return
            }

            if ((event.key === "c" || event.key === "C") && event.shiftKey && output) {
                event.preventDefault()
                void handleCopy()
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [output, handleCopy, doConvert])

    const inputLang = mode === "yaml-to-json" ? "yaml" : "json"
    const outputLang = mode === "yaml-to-json" ? "json" : "yaml"
    const jsonFormatterHandoffPayload = mode === "yaml-to-json" ? output : ""
    const jsonFormatterHandoff = React.useMemo(
        () => buildToolHandoffLink(lang, "json-formatter", jsonFormatterHandoffPayload),
        [jsonFormatterHandoffPayload, lang],
    )
    const jsonFormatterLabel = `${t.common.open} ${t.tools["json_formatter"].title}`

    const openJsonFormatter = () => {
        if (!jsonFormatterHandoffPayload.trim()) return
        jsonFormatterHandoff.prime()
        window.location.assign(jsonFormatterHandoff.href)
    }

    return (
        <div className="flex flex-col h-full space-y-8 max-w-[1400px] mx-auto w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <RefreshCw className="h-6 w-6 text-primary" />
                        {toolT.title}</h1>
                    <p className="text-muted-foreground mt-1">
                        {toolT.description}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={toggleMode} className="gap-2">
                        <span className="font-mono">{inputLang.toUpperCase()}</span>
                        <ArrowRightLeft className="h-4 w-4" />
                        <span className="font-mono">{outputLang.toUpperCase()}</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleClear}>
                        <Eraser className="mr-2 h-4 w-4" />{t.common.clear}</Button>
                    <Button variant="outline" size="sm" onClick={openImportPicker}>
                        <Upload className="mr-2 h-4 w-4" />
                        {text("import_file")}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={openJsonFormatter}
                        disabled={mode !== "yaml-to-json" || !jsonFormatterHandoffPayload.trim()}
                    >
                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                        {jsonFormatterLabel}
                    </Button>
                    <Button size="sm" onClick={doConvert}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {text("convert_action")}
                    </Button>
                </div>
            </div>

            <div
                className={`rounded-xl border border-dashed px-4 py-3 transition-colors ${isImportDragActive ? "border-primary bg-primary/10" : "border-border/70 bg-card/40"}`}
                onDragOver={(event) => {
                    event.preventDefault()
                    setIsImportDragActive(true)
                }}
                onDragLeave={(event) => {
                    event.preventDefault()
                    setIsImportDragActive(false)
                }}
                onDrop={(event) => {
                    event.preventDefault()
                    setIsImportDragActive(false)
                    const file = event.dataTransfer.files?.[0]
                    if (!file) return
                    void handleImportFile(file)
                }}
            >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                        {text("drag_drop_import_hint")}
                    </p>
                    <Button variant="outline" size="sm" onClick={openImportPicker}>
                        <Upload className="mr-2 h-4 w-4" />
                        {text("import_file")}
                    </Button>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={TEXT_FILE_IMPORT_ACCEPT}
                    className="hidden"
                    onChange={(event) => {
                        const file = event.target.files?.[0]
                        event.currentTarget.value = ""
                        if (!file) return
                        void handleImportFile(file)
                    }}
                />
            </div>

            {error && (
                <div className="p-3 text-sm font-medium text-destructive-foreground bg-destructive/90 rounded-md">
                    {error}
                </div>
            )}
            {importError && (
                <div className="p-3 text-sm font-medium text-destructive-foreground bg-destructive/90 rounded-md">
                    {importError}
                </div>
            )}

            {/* Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[600px] border rounded-lg bg-card overflow-hidden">

                {/* Input Pane */}
                <div className="flex flex-col h-full border-b lg:border-b-0 lg:border-r">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.input} ({inputLang.toUpperCase()})</span>
                    </div>
                    <div className="flex-1 min-h-[300px]">
                        <MonacoEditor
                            height="100%"
                            language={inputLang}
                            theme={monacoTheme}
                            beforeMount={(monaco) => ensureByteflowMonacoThemes(monaco)}
                            value={input}
                            onChange={(val) => setInput(val || "")}
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
                        <span>{t.common.output} ({outputLang.toUpperCase()})</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => void handleCopy()} disabled={!output}>
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">{t.common.copy_output}</span>
                        </Button>
                    </div>
                    <div className="flex-1 min-h-[300px]">
                        <MonacoEditor
                            height="100%"
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
        </div>
    )
}
