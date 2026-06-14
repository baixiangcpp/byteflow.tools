"use client"

import * as React from "react"
import { Copy, Download, Eraser, EyeOff, TestTube2, Upload } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { ToolPreviewArea } from "@/features/tool-shell/tool-preview-area"
import { createDemoImageDataUrl, fileToDataUrl, loadImageElement } from "@/core/utils/image-canvas-utils"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import {
    intensityToBlockSize,
    normalizeCensorRect,
    percentRectToPixels,
    type CensorMode,
    type CensorRectPercent,
} from "@/features/tools/photo-censor/utils"

const MAX_FILE_SIZE = 12 * 1024 * 1024

const DEFAULT_RECT: CensorRectPercent = {
    x: 28,
    y: 28,
    width: 40,
    height: 28,
}

function applyPixelateRegion(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    intensity: number,
) {
    const block = intensityToBlockSize(intensity)
    const sampled = context.getImageData(x, y, width, height)
    const { data } = sampled
    const imageWidth = width

    for (let by = 0; by < height; by += block) {
        for (let bx = 0; bx < width; bx += block) {
            const baseIndex = (by * imageWidth + bx) * 4
            const r = data[baseIndex]
            const g = data[baseIndex + 1]
            const b = data[baseIndex + 2]
            const a = data[baseIndex + 3] / 255
            context.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`
            context.fillRect(x + bx, y + by, block, block)
        }
    }
}

function applyBlurRegion(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    intensity: number,
) {
    const sampleScale = Math.max(0.04, 1 - intensity / 100)
    const tinyWidth = Math.max(1, Math.round(width * sampleScale))
    const tinyHeight = Math.max(1, Math.round(height * sampleScale))

    const temp = document.createElement("canvas")
    temp.width = tinyWidth
    temp.height = tinyHeight
    const tempContext = temp.getContext("2d")
    if (!tempContext) return

    tempContext.imageSmoothingEnabled = true
    tempContext.drawImage(context.canvas, x, y, width, height, 0, 0, tinyWidth, tinyHeight)

    context.imageSmoothingEnabled = true
    context.drawImage(temp, 0, 0, tinyWidth, tinyHeight, x, y, width, height)
}

export function PhotoCensorPage() {
    const { t } = useLang()
    const toolT = t.tools["photo_censor"] as Record<string, string>
    const outputModeLabel = toolT.output_mode_label
    const outputModePixelate = toolT.output_mode_pixelate
    const outputModeBlur = toolT.output_mode_blur
    const outputIntensityLabel = toolT.output_intensity_label
    const outputCensorRectPercentLabel = toolT.output_censor_rect_percent_label
    const outputCensorRectPixelsLabel = toolT.output_censor_rect_pixels_label
    const outputDownloadHint = toolT.output_download_hint
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const previewCanvasRef = React.useRef<HTMLCanvasElement>(null)
    const demoSrcRef = React.useRef<string>("")

    const [imageSrc, setImageSrc] = React.useState("")
    const [fileName, setFileName] = React.useState("")
    const [rect, setRect] = React.useState<CensorRectPercent>(DEFAULT_RECT)
    const [mode, setMode] = React.useState<CensorMode>("pixelate")
    const [intensity, setIntensity] = React.useState(70)
    const [outputDataUrl, setOutputDataUrl] = React.useState("")
    const formatRectSummary = React.useCallback(
        (value: { x: number; y: number; width: number; height: number }) =>
            `x=${value.x}, y=${value.y}, ${t.common.width}=${value.width}, ${t.common.height}=${value.height}`,
        [t.common.height, t.common.width],
    )
    const [rectText, setRectText] = React.useState(() => formatRectSummary({ x: 0, y: 0, width: 0, height: 0 }))

    React.useEffect(() => {
        if (!demoSrcRef.current) demoSrcRef.current = createDemoImageDataUrl(1280, 720)
    }, [])

    React.useEffect(() => {
        const render = async () => {
            const source = imageSrc || demoSrcRef.current
            if (!source) return

            const image = await loadImageElement(source)
            const safeRect = normalizeCensorRect(rect)
            const sourceRect = percentRectToPixels(image.width, image.height, safeRect)
            setRectText(formatRectSummary(sourceRect))

            const outputCanvas = document.createElement("canvas")
            outputCanvas.width = image.width
            outputCanvas.height = image.height
            const outputContext = outputCanvas.getContext("2d")
            if (!outputContext) return
            outputContext.drawImage(image, 0, 0, image.width, image.height)

            if (mode === "pixelate") {
                applyPixelateRegion(outputContext, sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height, intensity)
            } else {
                applyBlurRegion(outputContext, sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height, intensity)
            }

            setOutputDataUrl(outputCanvas.toDataURL("image/png"))

            if (previewCanvasRef.current) {
                const previewCanvas = previewCanvasRef.current
                const maxWidth = 980
                const ratio = Math.min(1, maxWidth / image.width)
                const previewWidth = Math.max(1, Math.round(image.width * ratio))
                const previewHeight = Math.max(1, Math.round(image.height * ratio))
                previewCanvas.width = previewWidth
                previewCanvas.height = previewHeight

                const previewContext = previewCanvas.getContext("2d")
                if (!previewContext) return
                previewContext.clearRect(0, 0, previewWidth, previewHeight)
                previewContext.drawImage(outputCanvas, 0, 0, previewWidth, previewHeight)

                const previewRect = percentRectToPixels(previewWidth, previewHeight, safeRect)
                previewContext.strokeStyle = "#22d3ee"
                previewContext.lineWidth = 2
                previewContext.strokeRect(
                    previewRect.x + 1,
                    previewRect.y + 1,
                    Math.max(0, previewRect.width - 2),
                    Math.max(0, previewRect.height - 2),
                )
            }
        }

        void render()
    }, [formatRectSummary, imageSrc, intensity, mode, rect])

    const output = React.useMemo(
        () =>
            [
                `${outputModeLabel}: ${mode === "pixelate" ? outputModePixelate : outputModeBlur}`,
                `${outputIntensityLabel}: ${intensity}%`,
                `${outputCensorRectPercentLabel}: x=${rect.x}, y=${rect.y}, width=${rect.width}, height=${rect.height}`,
                `${outputCensorRectPixelsLabel}: ${rectText}`,
                "",
                outputDownloadHint,
            ].join("\n"),
        [
            intensity,
            mode,
            outputCensorRectPercentLabel,
            outputCensorRectPixelsLabel,
            outputDownloadHint,
            outputIntensityLabel,
            outputModeBlur,
            outputModeLabel,
            outputModePixelate,
            rect,
            rectText,
        ],
    )

    const handleFile = async (file: File) => {
        if (!file.type.startsWith("image/")) {
            toast.error(t.common.image_file_required)
            return
        }
        if (file.size > MAX_FILE_SIZE) {
            toast.error((t.common.image_file_too_large).replace("{size}", "12MB"))
            return
        }
        try {
            const src = await fileToDataUrl(file)
            setImageSrc(src)
            setFileName(file.name)
        } catch {
            toast.error(t.common.image_file_read_failed)
        }
    }

    const handleSample = () => {
        setImageSrc("")
        setFileName(toolT.sample_file_label)
        setMode("pixelate")
        setIntensity(72)
        setRect({ x: 24, y: 26, width: 44, height: 32 })
    }

    const handleReset = () => {
        setImageSrc("")
        setFileName("")
        setRect(DEFAULT_RECT)
        setMode("pixelate")
        setIntensity(70)
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
        anchor.download = "censored-image.png"
        anchor.click()
    }

    const actions: ToolAction[] = [
        { id: "sample", label: t.common.sample, icon: TestTube2, onClick: handleSample },
        { id: "reset", label: t.common.reset, icon: Eraser, onClick: handleReset },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: () => void handleCopy() },
        { id: "download", label: t.common.download, icon: Download, onClick: handleDownload },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <EyeOff className="h-6 w-6 text-primary" />
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
                        className="grid min-h-[320px] cursor-pointer place-items-center rounded-xl border border-dashed bg-muted/15 p-4"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                            event.preventDefault()
                            const file = event.dataTransfer.files?.[0]
                            if (file) void handleFile(file)
                        }}
                    >
                        <canvas ref={previewCanvasRef} className="max-h-[300px] max-w-full rounded-lg border object-contain" />
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => {
                                const file = event.target.files?.[0]
                                if (file) void handleFile(file)
                            }}
                        />
                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                            <Upload className="h-3.5 w-3.5" />
                            <span>{fileName || (t.common.drop_image_or_click_upload)}</span>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5 rounded-lg border bg-background/60 p-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {toolT.mode_field_label}
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                                {(["pixelate", "blur"] as CensorMode[]).map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => setMode(item)}
                                        className={`min-h-11 rounded-md border px-2 text-xs uppercase tracking-wide ${
                                            mode === item
                                                ? "border-primary/40 bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {item === "pixelate" ? outputModePixelate : outputModeBlur}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <RangeField
                            label={outputIntensityLabel}
                            value={intensity}
                            min={1}
                            max={100}
                            step={1}
                            suffix="%"
                            onChange={setIntensity}
                        />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <RangeField
                            label="X"
                            value={rect.x}
                            min={0}
                            max={95}
                            step={1}
                            suffix="%"
                            onChange={(value) => setRect((prev) => ({ ...prev, x: value }))}
                        />
                        <RangeField
                            label="Y"
                            value={rect.y}
                            min={0}
                            max={95}
                            step={1}
                            suffix="%"
                            onChange={(value) => setRect((prev) => ({ ...prev, y: value }))}
                        />
                        <RangeField
                            label={t.common.width}
                            value={rect.width}
                            min={5}
                            max={100}
                            step={1}
                            suffix="%"
                            onChange={(value) => setRect((prev) => ({ ...prev, width: value }))}
                        />
                        <RangeField
                            label={t.common.height}
                            value={rect.height}
                            min={5}
                            max={100}
                            step={1}
                            suffix="%"
                            onChange={(value) => setRect((prev) => ({ ...prev, height: value }))}
                        />
                    </div>
                </div>

                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.output}</span>
                        <span className="text-xs font-normal text-muted-foreground">{t.common.preview_text}</span>
                    </div>
                    <div className="border-b">
                        <ToolPreviewArea
                            title={t.common.preview}
                            metadata={outputDataUrl ? `${mode.toUpperCase()} - ${rectText}` : undefined}
                        >
                            {outputDataUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={outputDataUrl}
                                    alt={toolT.preview_alt}
                                    className="max-h-[400px] w-auto rounded object-contain drop-shadow-md"
                                />
                            ) : (
                                <div className="text-xs text-muted-foreground">
                                    {t.common.preview_will_appear_here}
                                </div>
                            )}
                        </ToolPreviewArea>
                    </div>
                    <div className="flex-1 p-0">
                        <Textarea
                            readOnly
                            value={output}
                            className="h-full min-h-[280px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>
        </div>
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
                <span>{value}{suffix}</span>
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
