"use client"

import * as React from "react"
import { Copy, Image as ImageIcon, Upload, ArrowLeftRight, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { ToolPreviewArea } from "@/features/tool-shell/tool-preview-area"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { FILE_INPUT_POLICIES, validateFileAgainstPolicy } from "@/core/files/file-input-policy"
import { fileToDataUrl } from "@/core/utils/image-canvas-utils"
import { parseBase64Image, sanitizeBase64 } from "@/features/tools/image-base64/utils"

type OutputFormat =
    | "data_uri"
    | "raw_base64"
    | "html_img"
    | "css_background"
    | "hyperlink"
    | "favicon"

const MAX_FILE_SIZE_BYTES = FILE_INPUT_POLICIES["image-compact"].maxBytes

const OUTPUT_FORMAT_ORDER: OutputFormat[] = [
    "data_uri",
    "raw_base64",
    "html_img",
    "css_background",
    "hyperlink",
    "favicon",
]

const MIME_EXTENSION_MAP: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "image/gif": "gif",
    "image/x-icon": "ico",
}

const EXTENSION_MIME_MAP: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    svg: "image/svg+xml",
    gif: "image/gif",
    ico: "image/x-icon",
}

function getMimeFromFileName(name: string): string | null {
    const segments = name.toLowerCase().split(".")
    const ext = segments.length > 1 ? segments[segments.length - 1] : ""
    return EXTENSION_MIME_MAP[ext] || null
}

export function ImageBase64Page() {
    const { t } = useLang()
    const [mode, setMode] = React.useState<"encode" | "decode">("encode")
    const toolT = t.tools["image_base64"] as Record<string, string>
    const [outputFormat, setOutputFormat] = React.useState<OutputFormat>("data_uri")
    const [base64, setBase64] = React.useState("")
    const [imageSrc, setImageSrc] = React.useState<string | null>(null)
    const [fileName, setFileName] = React.useState<string | null>(null)
    const [fileSize, setFileSize] = React.useState<number>(0)
    const [decodeError, setDecodeError] = React.useState<string | null>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const text = React.useCallback((key: string) => toolT[key], [toolT])

    const formatLabels: Record<OutputFormat, string> = {
        data_uri: toolT.format_data_uri,
        raw_base64: toolT.format_raw_base64,
        html_img: toolT.format_html_img,
        css_background: toolT.format_css_background,
        hyperlink: toolT.format_hyperlink,
        favicon: toolT.format_favicon,
    }

    const formatOutputs = React.useMemo(() => {
        if (mode !== "encode" || !base64.trim()) {
            return null
        }

        const parsedResult = parseBase64Image(base64)
        if (!parsedResult.ok) {
            return null
        }

        try {
            const parsed = parsedResult.data
            const ext = MIME_EXTENSION_MAP[parsed.mime] || "png"
            const defaultFileName = fileName || `image.${ext}`

            return {
                data_uri: parsed.dataUri,
                raw_base64: parsed.rawBase64,
                html_img: `<img src="${parsed.dataUri}" alt="" />`,
                css_background: `.image {\n  background-image: url("${parsed.dataUri}");\n}`,
                hyperlink: `<a href="${parsed.dataUri}" download="${defaultFileName}">${defaultFileName}</a>`,
                favicon: `<link rel="icon" type="${parsed.mime}" href="${parsed.dataUri}" />`,
            } satisfies Record<OutputFormat, string>
        } catch {
            return null
        }
    }, [mode, base64, fileName])

    const activeOutput = formatOutputs?.[outputFormat] || ""
    const activeOutputSize = activeOutput ? new Blob([activeOutput]).size : 0

    const handleFileSelect = async (file: File) => {
        const validation = validateFileAgainstPolicy(file, FILE_INPUT_POLICIES["image-compact"])
        if (!validation.ok) {
            toast.error(validation.reason === "too_large" ? text("file_too_large_title") : text("invalid_file_title"), {
                description: validation.reason === "too_large" ? text("file_too_large_desc") : text("invalid_file_desc"),
            })
            return
        }
        const mimeFromName = getMimeFromFileName(file.name)
        const effectiveMime = file.type && file.type.startsWith("image/") ? file.type : mimeFromName
        if (!effectiveMime || !effectiveMime.startsWith("image/")) {
            toast.error(text("invalid_file_title"), {
                description: text("invalid_file_desc"),
            })
            return
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
            toast.error(text("file_too_large_title"), {
                description: text("file_too_large_desc"),
            })
            return
        }

        setFileName(file.name)
        setFileSize(file.size)
        setDecodeError(null)

        try {
            const dataUrl = await fileToDataUrl(file, FILE_INPUT_POLICIES["image-compact"])
            const normalizedDataUrl =
                typeof dataUrl === "string" && dataUrl.startsWith("data:image/")
                    ? dataUrl
                    : `data:${effectiveMime};base64,${sanitizeBase64(String(dataUrl).split(",")[1] || "")}`
            setImageSrc(normalizedDataUrl)
            setBase64(normalizedDataUrl)
        } catch {
            toast.error(t.common.image_file_read_failed)
        }
    }

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault()
        const file = event.dataTransfer.files[0]
        if (file) void handleFileSelect(file)
    }

    const handleDecodeBase64 = (value: string) => {
        setBase64(value)

        if (!value.trim()) {
            setImageSrc(null)
            setDecodeError(null)
            return
        }

        const parsed = parseBase64Image(value)
        if (!parsed.ok) {
            setImageSrc(null)
            setDecodeError(toolT.invalid_base64)
            return
        }

        setImageSrc(parsed.data.dataUri)
        setDecodeError(null)
    }

    const handleCopy = async () => {
        const target = mode === "encode" ? activeOutput : base64
        if (!target) return

        const result = await safeClipboardWrite(target)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }

        toast.success(t.common.copied, {
            description:
                mode === "encode"
                    ? text("copied_output_desc").replace("{format}", formatLabels[outputFormat])
                    : text("copied_base64_desc"),
        })
    }

    const handleCopyFormat = async (format: OutputFormat) => {
        const value = formatOutputs?.[format]
        if (!value) return

        const result = await safeClipboardWrite(value)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }

        toast.success(t.common.copied, {
            description: (toolT.copy_format_success).replace(
                "{format}",
                formatLabels[format],
            ),
        })
    }

    const handleClear = () => {
        setBase64("")
        setImageSrc(null)
        setFileName(null)
        setFileSize(0)
        setDecodeError(null)
        toast.success(text("cleared"))
    }

    const actions: ToolAction[] = [
        {
            id: "copy",
            label: t.common.copy,
            icon: Copy,
            onClick: handleCopy,
            disabled: mode === "encode" ? !activeOutput : !base64,
        },
        {
            id: "clear",
            label: t.common.clear,
            icon: Trash2,
            onClick: handleClear,
        },
    ]

    return (
        <div className="flex h-full flex-col">
            <div className="flex flex-col gap-3 border-b px-4 py-3">
                <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">{toolT.title}</h1>
                        <p className="text-xs text-muted-foreground">{toolT.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5 rounded-md border bg-muted p-0.5">
                        <button
                            onClick={() => {
                                setMode("encode")
                                handleClear()
                            }}
                            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${mode === "encode" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <Upload className="mr-1 inline h-3.5 w-3.5" />
                            {toolT.encode_tab}
                        </button>
                        <button
                            onClick={() => {
                                setMode("decode")
                                handleClear()
                            }}
                            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${mode === "decode" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <ArrowLeftRight className="mr-1 inline h-3.5 w-3.5" />
                            {toolT.decode_tab}
                        </button>
                    </div>
                    <ToolActionBar actions={actions} />
                </div>
            </div>

            <div className="flex min-h-0 flex-1">
                {mode === "encode" ? (
                    <>
                        <div className="flex w-1/2 flex-col border-r">
                            <div className="tool-pane-header-compact">
                                {toolT.image_input}
                                {fileName ? <span className="ml-1 text-primary">({fileName} - {(fileSize / 1024).toFixed(1)}KB)</span> : null}
                            </div>
                            <div
                                className="flex flex-1 cursor-pointer items-center justify-center p-6"
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={handleDrop}
                            >
                                {imageSrc ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={imageSrc}
                                        alt={text("image_preview_alt")}
                                        className="max-h-full max-w-full rounded-lg border border-border object-contain"
                                    />
                                ) : (
                                    <div className="text-center text-muted-foreground">
                                        <Upload className="mx-auto mb-3 h-12 w-12 opacity-50" />
                                        <p className="text-sm font-medium">{toolT.drop_text}</p>
                                        <p className="mt-1 text-xs">{toolT.supports}</p>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept={FILE_INPUT_POLICIES["image-compact"].accept}
                                    className="hidden"
                                    onChange={(event) => event.target.files?.[0] && void handleFileSelect(event.target.files[0])}
                                />
                            </div>
                        </div>

                        <div className="flex w-1/2 flex-col">
                            <div className="tool-pane-header-compact flex justify-between">
                                <span>{toolT.base64_output}</span>
                                {activeOutput ? <span className="tabular-nums text-[10px]">{activeOutputSize} bytes</span> : null}
                            </div>

                            <div className="border-b bg-muted/30 px-3 py-2">
                                <div className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                    {toolT.output_format}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {OUTPUT_FORMAT_ORDER.map((format) => (
                                        <button
                                            key={format}
                                            type="button"
                                            onClick={() => setOutputFormat(format)}
                                            className={`rounded px-2 py-1 text-[11px] transition-colors ${
                                                outputFormat === format
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-background text-muted-foreground hover:text-foreground"
                                            }`}
                                        >
                                            {formatLabels[format]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <textarea
                                readOnly
                                value={activeOutput}
                                className="flex-1 resize-none break-all bg-background p-4 font-mono text-[11px] leading-relaxed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
                                placeholder={text("output_placeholder")}
                            />

                            <div className="border-t bg-muted/30 px-3 py-2">
                                <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                    {toolT.quick_copy}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {OUTPUT_FORMAT_ORDER.map((format) => (
                                        <button
                                            key={`copy-${format}`}
                                            type="button"
                                            onClick={() => handleCopyFormat(format)}
                                            disabled={!formatOutputs}
                                            className="rounded border bg-background px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {formatLabels[format]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex w-1/2 flex-col border-r">
                            <div className="tool-pane-header-compact">{toolT.base64_input}</div>
                            <textarea
                                value={base64}
                                onChange={(event) => handleDecodeBase64(event.target.value)}
                                className="flex-1 resize-none break-all bg-background p-4 font-mono text-[11px] leading-relaxed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
                                placeholder="data:image/png;base64,..."
                                spellCheck={false}
                            />
                            {decodeError ? <div className="border-t px-3 py-2 text-xs text-destructive">{decodeError}</div> : null}
                        </div>

                        <div className="flex w-1/2 flex-col">
                            <ToolPreviewArea
                                title={toolT.image_preview}
                                metadata={imageSrc ? "Decoded" : undefined}
                                className="h-full rounded-none border-0"
                            >
                                {imageSrc ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={imageSrc}
                                        alt={text("decoded_image_alt")}
                                        className="max-h-[400px] w-auto rounded object-contain drop-shadow-md"
                                    />
                                ) : (
                                    <p className="text-sm text-muted-foreground">{toolT.paste_prompt}</p>
                                )}
                            </ToolPreviewArea>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
