"use client"

import * as React from "react"
import { Binary, Copy, Download, Eraser, FileUp, Play, Share2, TestTube2, Workflow } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ModeSelector } from "@/features/tool-shell/mode-selector"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { useLang } from "@/core/i18n/lang-provider"
import { Textarea } from "@/components/ui/textarea"
import { readStorageString, writeStorageString } from "@/core/storage/tool-persistence"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { buildToolHandoffLink } from "@/core/routing/tool-handoff"
import { FILE_INPUT_POLICIES, describeFilePolicy, validateFileAgainstPolicy } from "@/core/files/file-input-policy"
import { downloadBlob, downloadTextFile } from "./browser-actions"
import { MODE_STORAGE_KEY, OPERATION_STORAGE_KEY, OUTPUT_PREVIEW_LIMIT } from "./constants"
import { BINARY_SAMPLE_BASE64, TEXT_SAMPLE_BASE64, TEXT_SAMPLE_INPUT, URL_SAFE_SAMPLE_BASE64, URL_SAFE_SAMPLE_INPUT } from "./samples"
import type { Mode, Operation } from "./types"
import { useBase64FileTask } from "./use-base64-file-task"
import { useBase64TextTask } from "./use-base64-text-task"

export function Base64Page() {
    const { t, lang } = useLang()
    const toolT = t.tools["base64_encode_decode"] as Record<string, string>
    const text = React.useCallback((key: string) => toolT[key], [toolT])
    const [mode, setMode] = React.useState<Mode>("text")
    const [operation, setOperation] = React.useState<Operation>("encode")
    const [input, setInput] = React.useState("")
    const [output, setOutput] = React.useState("")
    const [error, setError] = React.useState<string | null>(null)
    const [sourceFile, setSourceFile] = React.useState<File | null>(null)
    const [decodedBlob, setDecodedBlob] = React.useState<Blob | null>(null)
    const [decodedFileName, setDecodedFileName] = React.useState("decoded.bin")
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const { isProcessing, runTextTask } = useBase64TextTask()
    const { abortFileTask, isFileProcessing, runDecodeFileTask, runEncodeFileTask } = useBase64FileTask()

    const outputBytes = React.useMemo(() => new Blob([output]).size, [output])
    const filePolicy = FILE_INPUT_POLICIES["base64-file"]
    const isBusy = isProcessing || isFileProcessing
    const canDownload = output.length > 0 || decodedBlob !== null
    const outputPreviewTruncatedLabel = toolT.output_preview_truncated
    const isOutputPreviewTruncated = output.length > OUTPUT_PREVIEW_LIMIT
    const outputPreview = React.useMemo(() => {
        if (!isOutputPreviewTruncated) return output
        const hiddenChars = output.length - OUTPUT_PREVIEW_LIMIT
        return `${output.slice(0, OUTPUT_PREVIEW_LIMIT)}\n\n[${outputPreviewTruncatedLabel.replace("{hidden}", String(hiddenChars))}]`
    }, [isOutputPreviewTruncated, output, outputPreviewTruncatedLabel])
    const operationOptions = React.useMemo(() => [
        { value: "encode" as const, label: text("operation_encode") },
        { value: "decode" as const, label: text("operation_decode") },
    ], [text])
    const modeOptions = React.useMemo(() => [
        { value: "text" as const, label: text("mode_text") },
        { value: "file" as const, label: text("mode_file") },
        { value: "url-safe" as const, label: text("mode_url_safe") },
    ], [text])

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
        abortFileTask()
        setError(null)
        setDecodedBlob(null)
        setDecodedFileName("decoded.bin")
    }, [abortFileTask])

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
        abortFileTask()
        const validation = validateFileAgainstPolicy(file, filePolicy)
        if (!validation.ok) {
            setError(validation.reason === "too_large" ? text("error_file_too_large") : validation.message)
            setSourceFile(null)
            setOutput("")
            setDecodedBlob(null)
            return
        }
        setError(null)
        setOutput("")
        setDecodedBlob(null)
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
            await runEncodeFileTask({
                file: sourceFile,
                filePolicy,
                onSuccess: (encoded) => {
                    setOutput(encoded)
                    setError(null)
                    setDecodedBlob(null)
                },
                onError: () => {
                    setOutput("")
                    setError(text("error_encode_failed"))
                    setDecodedBlob(null)
                },
            })
            return
        }

        if (!input) {
            setOutput("")
            setError(null)
            return
        }

        await runTextTask({
            input,
            operation: "encode",
            urlSafe: mode === "url-safe",
            onSuccess: (encoded) => {
                setOutput(encoded)
                setError(null)
                setDecodedBlob(null)
            },
            onError: () => setError(text("error_encode_failed")),
        })
    }

    const decodeBase64 = async () => {
        if (!input.trim()) {
            setOutput("")
            setError(null)
            return
        }

        if (mode === "file") {
            await runDecodeFileTask({
                input,
                onSuccess: (bytes) => {
                    const blob = new Blob([bytes], { type: sourceFile?.type || "application/octet-stream" })
                    setDecodedFileName(`${sourceFile?.name ? sourceFile.name.replace(/\.[^.]+$/, "") : "decoded"}.bin`)
                    setDecodedBlob(blob)
                    setOutput(
                        text("decode_binary_success")
                            .replace("{bytes}", String(bytes.byteLength)),
                    )
                    setError(null)
                },
                onError: () => {
                    setError(text("error_invalid_base64"))
                    setDecodedBlob(null)
                },
            })
            return
        }

        await runTextTask({
            input,
            operation: "decode",
            urlSafe: mode === "url-safe",
            onSuccess: (decoded) => {
                setOutput(decoded)
                setError(null)
                setDecodedBlob(null)
            },
            onError: () => {
                setError(mode === "url-safe" ? text("error_invalid_base64url") : text("error_invalid_base64"))
                setDecodedBlob(null)
            },
        })
    }

    const handleExecute = () => {
        if (operation === "encode") {
            void encodeBase64()
        } else {
            void decodeBase64()
        }
    }

    const handoffPayload = mode === "file" ? "" : output || input
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
            id: "clear",
            label: t.common.clear,
            icon: Eraser,
            onClick: handleClear,
            destructive: true,
        },
        {
            id: operation === "encode" ? "encode" : "decode",
            label: operation === "encode" ? text("encode_action") : t.common.decode_base64,
            icon: Play,
            onClick: handleExecute,
            variant: "default",
            disabled: isBusy || (mode === "file" ? operation === "encode" ? !sourceFile : !input.trim() : !input.trim()),
            disabledReason: mode === "file" && operation === "encode" && !sourceFile
                ? text("error_file_required")
                : t.common.action_disabled_input_required,
        },
        {
            id: "copy",
            label: t.common.copy,
            icon: Copy,
            onClick: handleCopyOutput,
            disabled: !output,
            disabledReason: t.common.action_disabled_no_output,
        },
        {
            id: "download",
            label: t.common.download,
            icon: Download,
            onClick: handleDownload,
            disabled: !canDownload || isBusy,
            disabledReason: t.common.action_disabled_no_output,
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
            disabledReason: t.common.action_disabled_no_output,
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
                        <ModeSelector label={text("operation_label")} value={operation} options={operationOptions} onChange={handleOperationChange} />
                    </div>

                    <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                        <ModeSelector label={text("input_type_label")} value={mode} options={modeOptions} onChange={handleModeChange} size="sm" />
                        {mode === "url-safe" && (
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                {text("url_safe_hint")}
                            </p>
                        )}
                    </div>
                </div>

                <ToolActionBar actions={standardActions} handoffPayload={handoffPayload} />

                <div className="flex flex-wrap items-center gap-2">
                    {mode === "file" ? (
                        <>
                            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                <FileUp className="h-4 w-4" />
                                {text("select_file")}
                            </Button>
                            {sourceFile ? (
                                <span className="text-xs text-muted-foreground">
                                    {sourceFile.name} ({(sourceFile.size / 1024 / 1024).toFixed(2)} MB)
                                </span>
                            ) : null}
                            <span className="text-xs text-muted-foreground">
                                {describeFilePolicy(filePolicy)}
                            </span>
                            {isFileProcessing ? <span className="text-xs font-medium text-primary">{text("file_processing")}</span> : null}
                        </>
                    ) : null}
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={filePolicy.accept}
                    className="hidden"
                    onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) void handleFilePick(file)
                    }}
                />
            </div>

            {error ? (
                <div id="base64-error" role="alert" className="rounded-md bg-destructive/90 p-3 text-sm font-medium text-destructive-foreground">
                    {error}
                </div>
            ) : null}

            <div className="grid flex-1 min-h-[500px] grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.input}</span>
                        {mode === "file" ? (
                            <span className="text-xs font-normal text-muted-foreground">
                                {text("file_mode_hint")}
                            </span>
                        ) : null}
                    </div>
                    <div className="flex-1 p-0">
                        <Textarea
                            className="h-full min-h-[400px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                            placeholder={mode === "file" ? text("input_placeholder_file") : text("input_placeholder_text")}
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            aria-label={t.common.input}
                            aria-describedby={error ? "base64-error" : undefined}
                            aria-invalid={error ? "true" : undefined}
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
                            aria-label={t.common.output}
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
