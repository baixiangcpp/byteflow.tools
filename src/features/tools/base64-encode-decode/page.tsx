"use client"

import * as React from "react"
import { ArrowLeft, ArrowRight, Binary, Download, FileUp, Share2, TestTube2, RotateCcw, Workflow } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { useLang } from "@/core/i18n/lang-provider"
import { Textarea } from "@/components/ui/textarea"
import { decodeBase64ToBytes, decodeBase64ToText, encodeBytesToBase64, encodeTextToBase64 } from "@/core/utils/base64-utils"
import { readStorageString, writeStorageString } from "@/core/storage/tool-persistence"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { buildToolHandoffLink } from "@/core/routing/tool-handoff"
import { downloadBlob, downloadTextFile } from "./browser-actions"
import { MAX_FILE_SIZE, MODE_STORAGE_KEY, OPERATION_STORAGE_KEY, OUTPUT_PREVIEW_LIMIT } from "./constants"
import { BINARY_SAMPLE_BASE64, TEXT_SAMPLE_BASE64, TEXT_SAMPLE_INPUT, URL_SAFE_SAMPLE_BASE64, URL_SAFE_SAMPLE_INPUT } from "./samples"
import type { Mode, Operation } from "./types"

export function Base64Page() {
    const { t, lang } = useLang()
    const toolT = t.tools["base64_encode_decode"] as Record<string, string>
    const text = (key: string) => toolT[key]
    const [mode, setMode] = React.useState<Mode>("text")
    const [operation, setOperation] = React.useState<Operation>("encode")
    const [input, setInput] = React.useState("")
    const [output, setOutput] = React.useState("")
    const [error, setError] = React.useState<string | null>(null)
    const [sourceFile, setSourceFile] = React.useState<File | null>(null)
    const [decodedBlob, setDecodedBlob] = React.useState<Blob | null>(null)
    const [decodedFileName, setDecodedFileName] = React.useState("decoded.bin")
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const outputBytes = React.useMemo(() => new Blob([output]).size, [output])
    const canDownload = output.length > 0 || decodedBlob !== null
    const outputPreviewTruncatedLabel = toolT.output_preview_truncated
    const isOutputPreviewTruncated = output.length > OUTPUT_PREVIEW_LIMIT
    const outputPreview = React.useMemo(() => {
        if (!isOutputPreviewTruncated) return output
        const hiddenChars = output.length - OUTPUT_PREVIEW_LIMIT
        return `${output.slice(0, OUTPUT_PREVIEW_LIMIT)}\n\n[${outputPreviewTruncatedLabel.replace("{hidden}", String(hiddenChars))}]`
    }, [isOutputPreviewTruncated, output, outputPreviewTruncatedLabel])

    React.useEffect(() => {
        const savedMode = readStorageString(MODE_STORAGE_KEY)
        if (savedMode === "text" || savedMode === "file" || savedMode === "url-safe") {
            setMode(savedMode)
        }
        const savedOperation = readStorageString(OPERATION_STORAGE_KEY)
        if (savedOperation === "encode" || savedOperation === "decode") {
            setOperation(savedOperation)
        }
    }, [])

    React.useEffect(() => {
        writeStorageString(MODE_STORAGE_KEY, mode)
    }, [mode])

    React.useEffect(() => {
        writeStorageString(OPERATION_STORAGE_KEY, operation)
    }, [operation])

    const resetTransientState = React.useCallback(() => {
        setError(null)
        setDecodedBlob(null)
        setDecodedFileName("decoded.bin")
    }, [])

    const handleModeChange = (nextMode: Mode) => {
        setMode(nextMode)
        setInput("")
        setOutput("")
        setSourceFile(null)
        resetTransientState()
    }

    const handleOperationChange = (nextOperation: Operation) => {
        setOperation(nextOperation)
        setOutput("")
        resetTransientState()
    }

    const handleUseSample = () => {
        resetTransientState()
        setOutput("")
        setSourceFile(null)

        if (mode === "text") {
            setInput(operation === "encode" ? TEXT_SAMPLE_INPUT : TEXT_SAMPLE_BASE64)
            return
        }

        if (mode === "url-safe") {
            setInput(operation === "encode" ? URL_SAFE_SAMPLE_INPUT : URL_SAFE_SAMPLE_BASE64)
            return
        }

        if (mode === "file") {
            if (operation === "decode") {
                setInput(BINARY_SAMPLE_BASE64)
                return
            }

            setInput("")
            setError(text("error_file_sample_unavailable"))
        }
    }

    const handleClear = () => {
        setInput("")
        setOutput("")
        setSourceFile(null)
        resetTransientState()
    }

    const handleFilePick = async (file: File) => {
        if (file.size > MAX_FILE_SIZE) {
            setError(text("error_file_too_large"))
            return
        }
        setError(null)
        setSourceFile(file)
    }

    const handleShare = async () => {
        const link = `${window.location.origin}${window.location.pathname}?mode=${mode}&op=${operation}`
        if (navigator.share) {
            try {
                await navigator.share({ title: text("share_title"), url: link })
                return
            } catch {
                // fall through to clipboard
            }
        }
        const result = await safeClipboardWrite(link)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(text("link_copied"), {
            description: text("link_copied_desc"),
        })
    }

    const handleCopyOutput = async () => {
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

    const handleDownload = () => {
        if (decodedBlob) {
            downloadBlob(decodedBlob, decodedFileName)
            toast.success(text("downloaded"), {
                description: text("downloaded_saved_file").replace("{filename}", decodedFileName),
            })
            return
        }
        if (!output) return
        downloadTextFile(output, mode === "url-safe" ? "base64url.txt" : "base64-output.txt")
        toast.success(text("downloaded"), {
            description: text("downloaded_output_file_saved"),
        })
    }

    const encodeBase64 = async () => {
        if (mode === "file") {
            if (!sourceFile) {
                setError(text("error_file_required"))
                setOutput("")
                return
            }
            const buffer = await sourceFile.arrayBuffer()
            const encoded = encodeBytesToBase64(new Uint8Array(buffer))
            setOutput(encoded)
            setError(null)
            setDecodedBlob(null)
            return
        }

        if (!input) {
            setOutput("")
            setError(null)
            return
        }

        try {
            const encoded = encodeTextToBase64(input, mode === "url-safe")
            setOutput(encoded)
            setError(null)
            setDecodedBlob(null)
        } catch {
            setError(text("error_encode_failed"))
        }
    }

    const decodeBase64 = () => {
        if (!input.trim()) {
            setOutput("")
            setError(null)
            return
        }
        try {
            if (mode === "file") {
                const bytes = decodeBase64ToBytes(input.trim())
                const safeBuffer = Uint8Array.from(bytes).buffer as ArrayBuffer
                const blob = new Blob([safeBuffer], { type: sourceFile?.type || "application/octet-stream" })
                const baseName = sourceFile?.name ? sourceFile.name.replace(/\.[^.]+$/, "") : "decoded"
                setDecodedFileName(`${baseName}.bin`)
                setDecodedBlob(blob)
                setOutput(
                    text("decode_binary_success")
                        .replace("{bytes}", String(bytes.length)),
                )
                setError(null)
                return
            }

            const decoded = decodeBase64ToText(input.trim(), mode === "url-safe")
            setOutput(decoded)
            setError(null)
            setDecodedBlob(null)
        } catch {
            setError(
                mode === "url-safe"
                    ? text("error_invalid_base64url")
                    : text("error_invalid_base64"),
            )
            setDecodedBlob(null)
        }
    }

    const handleExecute = () => {
        if (operation === "encode") {
            void encodeBase64()
        } else {
            decodeBase64()
        }
    }

    const handoffPayload = output || input
    const pipelineHandoff = React.useMemo(
        () => buildToolHandoffLink(lang, "pipeline-builder", handoffPayload),
        [handoffPayload, lang],
    )

    const standardActions: ToolAction[] = [
        {
            id: "sample",
            label: t.common.sample,
            icon: TestTube2,
            onClick: handleUseSample,
        },
        {
            id: "reset",
            label: t.common.reset,
            icon: RotateCcw,
            onClick: handleClear,
        },
        {
            id: "copy",
            label: t.common.copy,
            onClick: handleCopyOutput,
            disabled: !output,
        },
        {
            id: "download",
            label: t.common.download,
            icon: Download,
            onClick: handleDownload,
            disabled: !canDownload,
        },
        {
            id: "share",
            label: text("share_action"),
            icon: Share2,
            onClick: handleShare,
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
        <div className="flex h-full w-full max-w-[1400px] flex-col space-y-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <Binary className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {toolT.description}
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="grid gap-3 rounded-lg border border-border/70 bg-card/40 p-4 sm:grid-cols-[1.2fr_1fr]">
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                        <label className="mb-2 block text-sm font-bold text-foreground">{text("operation_label")}</label>
                        <div className="inline-flex w-full rounded-lg border border-primary/30 bg-background/60 p-1 sm:w-auto">
                            <button
                                type="button"
                                onClick={() => handleOperationChange("encode")}
                                className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${
                                    operation === "encode"
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {text("operation_encode")}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleOperationChange("decode")}
                                className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${
                                    operation === "decode"
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {text("operation_decode")}
                            </button>
                        </div>
                    </div>

                    <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                        <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">{text("input_type_label")}</label>
                        <div className="inline-flex w-full rounded-lg border border-border/70 bg-background/60 p-1 sm:w-auto">
                            {(["text", "file", "url-safe"] as Mode[]).map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => handleModeChange(item)}
                                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:flex-none ${
                                        mode === item
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {item === "text"
                                        ? text("mode_text")
                                        : item === "file"
                                            ? text("mode_file")
                                            : text("mode_url_safe")}
                                </button>
                            ))}
                        </div>
                        {mode === "url-safe" && (
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                {text("url_safe_hint")}
                            </p>
                        )}
                    </div>
                </div>

                <ToolActionBar actions={standardActions} handoffPayload={handoffPayload} />

                <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" onClick={handleExecute}>
                        {operation === "encode" ? (
                            <>
                                {text("encode_action")}
                                <ArrowRight className="h-4 w-4" />
                            </>
                        ) : (
                            <>
                                <ArrowLeft className="h-4 w-4" />
                                {t.common.decode_base64}
                            </>
                        )}
                    </Button>
                    {mode === "file" ? (
                        <>
                            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                <FileUp className="h-4 w-4" />
                                {text("select_file")}
                            </Button>
                            {sourceFile ? (
                                <span className="text-xs text-muted-foreground">
                                    {sourceFile.name} ({(sourceFile.size / 1024).toFixed(1)} KB)
                                </span>
                            ) : null}
                        </>
                    ) : null}
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) void handleFilePick(file)
                    }}
                />
            </div>

            {error ? (
                <div className="rounded-md bg-destructive/90 p-3 text-sm font-medium text-destructive-foreground">
                    {error}
                </div>
            ) : null}

            <div className="grid flex-1 min-h-[500px] grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.input}</span>
                    </div>
                    <div className="flex-1 p-0">
                        <Textarea
                            className="h-full min-h-[400px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                            placeholder={mode === "file" ? text("input_placeholder_file") : text("input_placeholder_text")}
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            spellCheck={false}
                        />
                    </div>
                </div>

                <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.output}</span>
                        <span className="text-xs font-normal text-muted-foreground">
                            {output.length} chars / {outputBytes} bytes
                        </span>
                    </div>
                    <div className="relative flex-1 p-0">
                        <Textarea
                            className="h-full min-h-[400px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                            placeholder={t.common.result_placeholder}
                            value={outputPreview}
                            readOnly
                            spellCheck={false}
                        />
                        {isOutputPreviewTruncated ? (
                            <p className="absolute bottom-3 right-3 rounded-md border border-border/70 bg-background/90 px-2 py-1 text-[11px] text-muted-foreground">
                                Preview truncated
                            </p>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    )
}
