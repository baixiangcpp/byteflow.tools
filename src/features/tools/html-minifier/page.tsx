"use client"

import * as React from "react"
import { Minimize2, Play, Eraser, TestTube2, Copy, Download, Upload, ArrowRightLeft } from "lucide-react"
import { useLang } from "@/core/i18n/lang-provider"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { minifyHtml } from "@/features/tools/html-minifier/utils"
import { buildToolHandoffLink, getToolHandoffFromSearchParams } from "@/core/routing/tool-handoff"
import { importTextFile, TEXT_FILE_IMPORT_ACCEPT } from "@/core/files/text-file-import"
import { readStorageString, removeStorageKey, writeStorageString } from "@/core/storage/tool-persistence"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"

const SAMPLE_HTML = [
    "<section data-key=\"sample_001\">",
    "  <h1>sample_001</h1>",
    "  <p data-state=\"active\">v1</p>",
    "  <button type=\"button\">01</button>",
    "</section>",
].join("\n")
const INPUT_STORAGE_KEY = "byteflow:html-minifier:input"
const ACTION_BUTTON_CLASS =
    "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30 dark:border-input dark:hover:bg-input/50"
const OUTPUT_ICON_BUTTON_CLASS =
    "inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"

async function loadToast() {
    const { toast } = await import("sonner")
    return toast
}

export function HtmlMinifierPage() {
    const { t, lang } = useLang()
    const toolT = t.tools["html_minifier"] as Record<string, string>
    const text = React.useCallback((key: string) => toolT[key], [toolT])

    const [input, setInput] = React.useState("")
    const [output, setOutput] = React.useState("")
    const [importError, setImportError] = React.useState<string | null>(null)
    const [isImportDragActive, setIsImportDragActive] = React.useState(false)
    const appliedHandoffRef = React.useRef<string | null>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const notifyError = React.useCallback(async (message: string) => {
        const toast = await loadToast()
        toast.error(message)
    }, [])

    const notifySuccess = React.useCallback(async (message: string, description?: string) => {
        const toast = await loadToast()
        toast.success(message, description ? { description } : undefined)
    }, [])

    React.useEffect(() => {
        const savedInput = readStorageString(INPUT_STORAGE_KEY)
        if (savedInput) {
            setInput(savedInput)
        }
    }, [])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        const handoff = getToolHandoffFromSearchParams(new URLSearchParams(window.location.search))
        if (!handoff || handoff === appliedHandoffRef.current) return
        appliedHandoffRef.current = handoff
        setInput(handoff)
        setOutput("")
        setImportError(null)
    }, [])

    React.useEffect(() => {
        if (!input.trim()) return
        writeStorageString(INPUT_STORAGE_KEY, input)
    }, [input])

    const handoffPayload = output || input
    const htmlFormatterHandoff = React.useMemo(
        () => buildToolHandoffLink(lang, "html-formatter", handoffPayload),
        [handoffPayload, lang],
    )

    const inputSize = new Blob([input]).size
    const outputSize = new Blob([output]).size
    const savedPercent = inputSize > 0 && output
        ? ((1 - outputSize / inputSize) * 100).toFixed(1)
        : "0.0"

    const handleMinify = React.useCallback(() => {
        if (!input.trim()) {
            setOutput("")
            return
        }
        setOutput(minifyHtml(input))
    }, [input])

    const handleSample = () => {
        setInput(SAMPLE_HTML)
        setOutput("")
        setImportError(null)
    }

    const handleClear = () => {
        setInput("")
        setOutput("")
        setImportError(null)
        removeStorageKey(INPUT_STORAGE_KEY)
    }

    const openImportPicker = () => {
        fileInputRef.current?.click()
    }

    const handleImportFile = async (file: File) => {
        try {
            const content = await importTextFile(file)
            setInput(content)
            setOutput("")
            setImportError(null)
        } catch (e: unknown) {
            setImportError(e instanceof Error ? e.message : text("import_failed"))
        }
    }

    const handleCopy = React.useCallback(async () => {
        if (!output) return
        const result = await safeClipboardWrite(output)
        if (!result.ok) {
            await notifyError(t.common.copy_failed)
            return
        }
        await notifySuccess(t.common.copied, t.common.copied_desc)
    }, [notifyError, notifySuccess, output, t.common])

    const handleDownload = () => {
        if (!output) return

        const blob = new Blob([output], { type: "text/html;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = "markup.min.html"
        anchor.click()
        URL.revokeObjectURL(url)
    }

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const withModifier = event.metaKey || event.ctrlKey
            if (!withModifier) return

            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                handleMinify()
                return
            }

            if ((event.key === "c" || event.key === "C") && event.shiftKey && output) {
                event.preventDefault()
                void handleCopy()
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [output, handleCopy, handleMinify])
    const htmlFormatterLabel = `${t.common.open} ${t.tools["html_formatter"].title}`

    const actions: ToolAction[] = [
        {
            id: "sample",
            label: t.common.sample,
            icon: TestTube2,
            onClick: handleSample,
        },
        {
            id: "import_file",
            label: text("import_file"),
            icon: Upload,
            onClick: openImportPicker,
        },
        {
            id: "clear",
            label: t.common.clear,
            icon: Eraser,
            onClick: handleClear,
        },
        {
            id: "download",
            label: t.common.download,
            icon: Download,
            onClick: handleDownload,
            disabled: !output,
        },
        {
            id: "to_html_formatter",
            label: htmlFormatterLabel,
            icon: ArrowRightLeft,
            href: htmlFormatterHandoff.href,
            onClick: htmlFormatterHandoff.prime,
            disabled: !handoffPayload.trim(),
        },
        {
            id: "minify",
            label: t.common.minify,
            icon: Play,
            onClick: handleMinify,
            variant: "default",
        },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col space-y-8">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <Minimize2 className="h-6 w-6 text-primary" />
                        {text("title")}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {text("description")}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {output ? (
                        <div className="rounded-md border px-2 py-1 text-xs text-muted-foreground">
                            {inputSize}B {"->"} {outputSize}B ({savedPercent}%)
                        </div>
                    ) : null}
                    <ToolActionBar actions={actions} />
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
                    <button type="button" className={ACTION_BUTTON_CLASS} onClick={openImportPicker}>
                        <Upload className="mr-2 h-4 w-4" />
                        {text("import_file")}
                    </button>
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
            {importError ? (
                <div className="rounded-md bg-destructive/90 p-3 text-sm font-medium text-destructive-foreground">
                    {importError}
                </div>
            ) : null}

            <div className="grid min-h-[520px] flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.input}</span>
                    </div>
                    <div className="flex-1 p-0">
                        <Textarea
                            className="h-full min-h-[420px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                            placeholder={text("input_placeholder")}
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            spellCheck={false}
                        />
                    </div>
                </div>

                <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.output}</span>
                        <button
                            type="button"
                            className={OUTPUT_ICON_BUTTON_CLASS}
                            onClick={handleCopy}
                            disabled={!output}
                        >
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">{t.common.copy_output}</span>
                        </button>
                    </div>
                    <div className="relative flex-1 p-0">
                        <Textarea
                            className="h-full min-h-[420px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
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
