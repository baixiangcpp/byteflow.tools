"use client"

import * as React from "react"
import { Copy, Download, Eraser, Image as ImageIcon, TestTube2, Upload } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { ToolPreviewArea } from "@/features/tool-shell/tool-preview-area"
import { FILE_INPUT_POLICIES, validateFileAgainstPolicy } from "@/core/files/file-input-policy"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { createDemoImageDataUrl, fileToDataUrl, loadImageElement, validateImageDimensions } from "@/core/utils/image-canvas-utils"
import { FileUploadStatus, type FileUploadStatusState } from "@/features/tool-shell/file-upload-status"
import { ToolPageContainer } from "@/components/layout/page-container"

type CaptionPosition = "top" | "bottom"

const DEFAULT_STATE = {
    caption: "",
    position: "bottom" as CaptionPosition,
    fontSize: 52,
    textColor: "#FFFFFF",
    strokeColor: "#0F172A",
    strokeWidth: 4,
    overlayAlpha: 0.34,
}

export function ImageCaptionGeneratorPage() {
    const { t } = useLang()
    const toolT = t.tools["image_caption_generator"] as Record<string, string>
    const emptyLabel = t.common.empty
    const outputCaptionLabel = toolT.output_caption_label
    const outputPositionLabel = toolT.output_position_label
    const outputFontSizeLabel = toolT.output_font_size_label
    const outputTextColorLabel = toolT.output_text_color_label
    const outputStrokeColorLabel = toolT.output_stroke_color_label
    const outputStrokeWidthLabel = toolT.output_stroke_width_label
    const outputOverlayAlphaLabel = toolT.output_overlay_alpha_label
    const outputPositionTop = toolT.output_position_top
    const outputPositionBottom = toolT.output_position_bottom
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const demoSrcRef = React.useRef<string>("")
    const fileReadAbortControllerRef = React.useRef<AbortController | null>(null)
    const uploadPolicy = FILE_INPUT_POLICIES["image-standard"]

    const [imageSrc, setImageSrc] = React.useState("")
    const [fileName, setFileName] = React.useState("")
    const [caption, setCaption] = React.useState(toolT.default_caption)
    const [position, setPosition] = React.useState<CaptionPosition>(DEFAULT_STATE.position)
    const [fontSize, setFontSize] = React.useState(DEFAULT_STATE.fontSize)
    const [textColor, setTextColor] = React.useState(DEFAULT_STATE.textColor)
    const [strokeColor, setStrokeColor] = React.useState(DEFAULT_STATE.strokeColor)
    const [strokeWidth, setStrokeWidth] = React.useState(DEFAULT_STATE.strokeWidth)
    const [overlayAlpha, setOverlayAlpha] = React.useState(DEFAULT_STATE.overlayAlpha)
    const [outputDataUrl, setOutputDataUrl] = React.useState("")
    const [uploadStatus, setUploadStatus] = React.useState<FileUploadStatusState>("idle")
    const [uploadMessage, setUploadMessage] = React.useState("")

    const output = React.useMemo(
        () => [
            `${outputCaptionLabel}: ${caption || emptyLabel}`,
            `${outputPositionLabel}: ${position === "top" ? outputPositionTop : outputPositionBottom}`,
            `${outputFontSizeLabel}: ${fontSize}px`,
            `${outputTextColorLabel}: ${textColor.toUpperCase()}`,
            `${outputStrokeColorLabel}: ${strokeColor.toUpperCase()}`,
            `${outputStrokeWidthLabel}: ${strokeWidth}px`,
            `${outputOverlayAlphaLabel}: ${overlayAlpha.toFixed(2)}`,
            "",
            ".caption-layer {",
            `  color: ${textColor.toUpperCase()};`,
            `  -webkit-text-stroke: ${strokeWidth}px ${strokeColor.toUpperCase()};`,
            `  font-size: ${fontSize}px;`,
            "}",
        ].join("\n"),
        [
            caption,
            emptyLabel,
            fontSize,
            outputCaptionLabel,
            outputFontSizeLabel,
            outputOverlayAlphaLabel,
            outputPositionLabel,
            outputPositionBottom,
            outputPositionTop,
            outputStrokeColorLabel,
            outputStrokeWidthLabel,
            outputTextColorLabel,
            overlayAlpha,
            position,
            strokeColor,
            strokeWidth,
            textColor,
        ],
    )

    React.useEffect(() => {
        if (!demoSrcRef.current) {
            demoSrcRef.current = createDemoImageDataUrl(1280, 720)
        }
    }, [])

    React.useEffect(() => () => {
        fileReadAbortControllerRef.current?.abort()
    }, [])

    React.useEffect(() => {
        const render = async () => {
            const src = imageSrc || demoSrcRef.current
            if (!src) return

            const image = await loadImageElement(src)
            const canvas = canvasRef.current
            if (!canvas) return
            const context = canvas.getContext("2d")
            if (!context) return

            const maxWidth = 1100
            const ratio = Math.min(1, maxWidth / image.width)
            const width = Math.max(1, Math.round(image.width * ratio))
            const height = Math.max(1, Math.round(image.height * ratio))

            canvas.width = width
            canvas.height = height

            context.clearRect(0, 0, width, height)
            context.drawImage(image, 0, 0, width, height)

            const overlayHeight = Math.max(80, Math.round(fontSize * 1.7))
            const overlayTop = position === "top" ? 0 : height - overlayHeight

            context.fillStyle = `rgba(2, 6, 23, ${Math.max(0, Math.min(0.85, overlayAlpha))})`
            context.fillRect(0, overlayTop, width, overlayHeight)

            context.textAlign = "center"
            context.textBaseline = "middle"
            context.font = `700 ${Math.max(18, Math.round(fontSize * ratio))}px ui-sans-serif, system-ui`

            if (strokeWidth > 0) {
                context.lineJoin = "round"
                context.lineWidth = Math.max(0, Math.round(strokeWidth * ratio))
                context.strokeStyle = strokeColor
                context.strokeText(caption, width / 2, overlayTop + overlayHeight / 2)
            }

            context.fillStyle = textColor
            context.fillText(caption, width / 2, overlayTop + overlayHeight / 2)

            setOutputDataUrl(canvas.toDataURL("image/png"))
        }

        void render()
    }, [caption, fontSize, imageSrc, overlayAlpha, position, strokeColor, strokeWidth, textColor])

    const handleFile = async (file: File) => {
        const validation = validateFileAgainstPolicy(file, uploadPolicy)
        if (!validation.ok) {
            setUploadStatus("error")
            setUploadMessage(validation.message)
            toast.error(validation.message)
            return
        }

        fileReadAbortControllerRef.current?.abort()
        const controller = new AbortController()
        fileReadAbortControllerRef.current = controller
        setUploadStatus("loading")
        setUploadMessage(t.common.loading_file_locally)

        try {
            const dataUrl = await fileToDataUrl(file, uploadPolicy, { signal: controller.signal })
            if (controller.signal.aborted) return
            const image = await loadImageElement(dataUrl)
            validateImageDimensions(image.width, image.height, uploadPolicy)
            setImageSrc(dataUrl)
            setFileName(file.name)
            setUploadStatus("complete")
            setUploadMessage(t.common.file_ready_locally)
        } catch (error) {
            const isCancelled = error instanceof Error && error.message === "FILE_READ_ABORTED"
            setUploadStatus(isCancelled ? "cancelled" : "error")
            setUploadMessage(isCancelled ? t.common.file_processing_cancelled : t.common.image_file_read_failed)
            if (!isCancelled) toast.error(t.common.image_file_read_failed)
        } finally {
            if (fileReadAbortControllerRef.current === controller) {
                fileReadAbortControllerRef.current = null
            }
        }
    }

    const handleCancelUpload = () => {
        fileReadAbortControllerRef.current?.abort()
        fileReadAbortControllerRef.current = null
        setUploadStatus("cancelled")
        setUploadMessage(t.common.file_processing_cancelled)
    }

    const handleSample = () => {
        fileReadAbortControllerRef.current?.abort()
        setImageSrc("")
        setFileName(t.common.sample_image)
        setUploadStatus("idle")
        setUploadMessage("")
        setCaption(toolT.sample_caption)
        setPosition("top")
        setFontSize(56)
        setTextColor("#F8FAFC")
        setStrokeColor("#111827")
        setStrokeWidth(5)
        setOverlayAlpha(0.4)
    }

    const handleReset = () => {
        fileReadAbortControllerRef.current?.abort()
        setImageSrc("")
        setFileName("")
        setUploadStatus("idle")
        setUploadMessage("")
        setCaption(toolT.default_caption)
        setPosition(DEFAULT_STATE.position)
        setFontSize(DEFAULT_STATE.fontSize)
        setTextColor(DEFAULT_STATE.textColor)
        setStrokeColor(DEFAULT_STATE.strokeColor)
        setStrokeWidth(DEFAULT_STATE.strokeWidth)
        setOverlayAlpha(DEFAULT_STATE.overlayAlpha)
    }

    const handleCopy = async () => {
        const result = await safeClipboardWrite(output)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }

    const handleDownload = () => {
        if (!outputDataUrl) return
        const anchor = document.createElement("a")
        anchor.href = outputDataUrl
        anchor.download = "captioned-image.png"
        anchor.click()
    }

    const actions: ToolAction[] = [
        { id: "sample", label: t.common.sample, icon: TestTube2, onClick: handleSample },
        { id: "reset", label: t.common.reset, icon: Eraser, onClick: handleReset },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: handleCopy },
        { id: "download", label: t.common.download, icon: Download, onClick: handleDownload },
    ]

    return (
        <ToolPageContainer className="flex h-full flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <ImageIcon className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {toolT.description}
                    </p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4 rounded-xl border bg-card p-4">
                    <div
                        className="grid min-h-[300px] cursor-pointer place-items-center rounded-xl border border-dashed bg-muted/15 p-4"
                        role="button"
                        tabIndex={0}
                        aria-label={toolT.replace_sample_hint}
                        onClick={() => fileInputRef.current?.click()}
                        onKeyDown={(event) => {
                            if (event.key !== "Enter" && event.key !== " ") return
                            event.preventDefault()
                            fileInputRef.current?.click()
                        }}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                            event.preventDefault()
                            const file = event.dataTransfer.files?.[0]
                            if (file) void handleFile(file)
                        }}
                    >
                        <canvas ref={canvasRef} className="max-h-[280px] max-w-full rounded-lg border object-contain" />
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={uploadPolicy.accept}
                            className="hidden"
                            onChange={(event) => {
                                const file = event.target.files?.[0]
                                if (file) void handleFile(file)
                            }}
                        />
                        {!fileName ? (
                            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                                <Upload className="h-3.5 w-3.5" />
                                <span>{toolT.replace_sample_hint}</span>
                            </div>
                        ) : null}
                    </div>

                    <FileUploadStatus
                        policy={uploadPolicy}
                        status={uploadStatus}
                        message={uploadMessage}
                        progress={uploadStatus === "loading" ? 50 : uploadStatus === "complete" ? 100 : undefined}
                        onCancel={uploadStatus === "loading" ? handleCancelUpload : undefined}
                    />

                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="space-y-1.5 rounded-lg border bg-background/60 p-3 sm:col-span-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.output_caption_label}</span>
                            <Input value={caption} onChange={(event) => setCaption(event.target.value)} spellCheck={false} />
                        </label>

                        <div className="space-y-1.5 rounded-lg border bg-background/60 p-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.output_position_label}</div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPosition("top")}
                                    className={`rounded-md border px-3 py-1.5 text-sm ${position === "top" ? "border-primary/40 bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                    {toolT.output_position_top}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPosition("bottom")}
                                    className={`rounded-md border px-3 py-1.5 text-sm ${position === "bottom" ? "border-primary/40 bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                    {toolT.output_position_bottom}
                                </button>
                            </div>
                        </div>

                        <RangeField label={toolT.output_font_size_label} value={fontSize} min={18} max={96} step={1} suffix="px" onChange={setFontSize} />
                        <RangeField label={toolT.output_stroke_width_label} value={strokeWidth} min={0} max={12} step={1} suffix="px" onChange={setStrokeWidth} />
                        <RangeField label={toolT.output_overlay_alpha_label} value={overlayAlpha} min={0} max={0.85} step={0.01} suffix="" onChange={setOverlayAlpha} />

                        <ColorField label={toolT.output_text_color_label} value={textColor} onChange={setTextColor} />
                        <ColorField label={toolT.output_stroke_color_label} value={strokeColor} onChange={setStrokeColor} />
                    </div>

                    <div className="rounded-lg border bg-background/60 p-3 text-xs text-muted-foreground">
                        {t.common.file}: <span className="font-medium text-foreground">{fileName || (t.common.sample_image)}</span>
                    </div>
                </div>

                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.output}</span>
                    </div>
                    <div className="flex-1 space-y-3 p-3">
                        <ToolPreviewArea
                            title={t.common.preview}
                            metadata={toolT.output_format_label}
                        >
                            {outputDataUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={outputDataUrl} alt={toolT.preview_alt} className="max-h-[400px] w-auto rounded object-contain drop-shadow-md" />
                            ) : null}
                        </ToolPreviewArea>

                        <Textarea
                            readOnly
                            value={output}
                            className="h-full min-h-[360px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>
        </ToolPageContainer>
    )
}

function RangeField({
    label,
    value,
    min,
    max,
    step,
    suffix,
    onChange,
}: {
    label: string
    value: number
    min: number
    max: number
    step: number
    suffix: string
    onChange: (value: number) => void
}) {
    return (
        <div className="space-y-1.5 rounded-lg border bg-background/60 p-3">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span>{label}</span>
                <span>{value.toFixed(step < 1 ? 2 : 0)}{suffix}</span>
            </div>
            <Input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(event) => onChange(Number(event.target.value))}
                className="cursor-pointer"
            />
        </div>
    )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return (
        <label className="space-y-1.5 rounded-lg border bg-background/60 p-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
            <div className="flex items-center gap-2">
                <Input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-14 cursor-pointer p-1" />
                <Input value={value} onChange={(event) => onChange(event.target.value)} className="font-mono text-xs" spellCheck={false} />
            </div>
        </label>
    )
}
