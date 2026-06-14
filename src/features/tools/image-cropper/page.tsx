"use client"

import * as React from "react"
import { Copy, Crop, Download, Eraser, TestTube2, Upload } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { ToolPreviewArea } from "@/features/tool-shell/tool-preview-area"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { createDemoImageDataUrl, fileToDataUrl, loadImageElement } from "@/core/utils/image-canvas-utils"
import { normalizeCropPercent, percentCropToPixels } from "@/core/utils/image-edit-utils"

const MAX_FILE_SIZE = 12 * 1024 * 1024

const DEFAULT_CROP = {
    x: 12,
    y: 12,
    width: 70,
    height: 68,
}

export function ImageCropperPage() {
    const { t } = useLang()
    const toolT = t.tools["image_cropper"] as Record<string, string>
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const previewCanvasRef = React.useRef<HTMLCanvasElement>(null)
    const demoSrcRef = React.useRef<string>("")

    const [imageSrc, setImageSrc] = React.useState("")
    const [fileName, setFileName] = React.useState("")
    const [crop, setCrop] = React.useState(DEFAULT_CROP)
    const [outputDataUrl, setOutputDataUrl] = React.useState("")
    const [cropPixelsText, setCropPixelsText] = React.useState("")
    const activeFileLabel = fileName || (imageSrc ? t.common.sample_image : t.common.drop_image_or_click_upload)

    const formatCropRectText = React.useCallback(
        (rect: { x: number; y: number; width: number; height: number }) =>
            `X=${rect.x}, Y=${rect.y}, ${t.common.width}=${rect.width}, ${t.common.height}=${rect.height}`,
        [t.common.height, t.common.width],
    )

    React.useEffect(() => {
        if (!demoSrcRef.current) demoSrcRef.current = createDemoImageDataUrl(1280, 720)
    }, [])

    React.useEffect(() => {
        const render = async () => {
            const source = imageSrc || demoSrcRef.current
            if (!source) return

            const image = await loadImageElement(source)
            const safeCrop = normalizeCropPercent(crop)
            const pixelRect = percentCropToPixels(image.width, image.height, safeCrop)
            setCropPixelsText(formatCropRectText(pixelRect))

            const previewCanvas = previewCanvasRef.current
            if (previewCanvas) {
                const maxWidth = 980
                const ratio = Math.min(1, maxWidth / image.width)
                const previewWidth = Math.max(1, Math.round(image.width * ratio))
                const previewHeight = Math.max(1, Math.round(image.height * ratio))
                previewCanvas.width = previewWidth
                previewCanvas.height = previewHeight

                const previewContext = previewCanvas.getContext("2d")
                if (previewContext) {
                    previewContext.clearRect(0, 0, previewWidth, previewHeight)
                    previewContext.drawImage(image, 0, 0, previewWidth, previewHeight)
                    const x = Math.round((safeCrop.x / 100) * previewWidth)
                    const y = Math.round((safeCrop.y / 100) * previewHeight)
                    const width = Math.round((safeCrop.width / 100) * previewWidth)
                    const height = Math.round((safeCrop.height / 100) * previewHeight)

                    previewContext.fillStyle = "rgba(15, 23, 42, 0.4)"
                    previewContext.fillRect(0, 0, previewWidth, previewHeight)
                    previewContext.clearRect(x, y, width, height)
                    previewContext.strokeStyle = "#22d3ee"
                    previewContext.lineWidth = 2
                    previewContext.strokeRect(x + 1, y + 1, Math.max(0, width - 2), Math.max(0, height - 2))
                }
            }

            const outputCanvas = document.createElement("canvas")
            outputCanvas.width = pixelRect.width
            outputCanvas.height = pixelRect.height
            const outputContext = outputCanvas.getContext("2d")
            if (!outputContext) return
            outputContext.drawImage(
                image,
                pixelRect.x,
                pixelRect.y,
                pixelRect.width,
                pixelRect.height,
                0,
                0,
                pixelRect.width,
                pixelRect.height,
            )
            setOutputDataUrl(outputCanvas.toDataURL("image/png"))
        }

        void render()
    }, [crop, formatCropRectText, imageSrc])

    const output = React.useMemo(
        () =>
            [
                `${toolT.output_crop_percent_label}: ${formatCropRectText(crop)}`,
                `${toolT.output_crop_pixels_label}: ${cropPixelsText}`,
                "",
                toolT.output_download_hint,
            ].join("\n"),
        [crop, cropPixelsText, formatCropRectText, toolT.output_crop_percent_label, toolT.output_crop_pixels_label, toolT.output_download_hint],
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
        setImageSrc(demoSrcRef.current)
        setFileName("")
        setCrop({ x: 18, y: 14, width: 62, height: 60 })
    }

    const handleReset = () => {
        setImageSrc("")
        setFileName("")
        setCrop(DEFAULT_CROP)
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
        anchor.download = "cropped-image.png"
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
                        <Crop className="h-6 w-6 text-primary" />
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
                            <span>{activeFileLabel}</span>
                        </div>
                    </div>

                    <div className="rounded-lg border bg-background/60 p-3 text-xs text-muted-foreground">
                        {t.common.file}: <span className="font-medium text-foreground">{fileName || (t.common.sample_image)}</span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <RangeField
                            label="X"
                            value={crop.x}
                            min={0}
                            max={90}
                            step={1}
                            suffix="%"
                            onChange={(value) => setCrop((prev) => ({ ...prev, x: value }))}
                        />
                        <RangeField
                            label="Y"
                            value={crop.y}
                            min={0}
                            max={90}
                            step={1}
                            suffix="%"
                            onChange={(value) => setCrop((prev) => ({ ...prev, y: value }))}
                        />
                        <RangeField
                            label={t.common.width}
                            value={crop.width}
                            min={10}
                            max={100}
                            step={1}
                            suffix="%"
                            onChange={(value) => setCrop((prev) => ({ ...prev, width: value }))}
                        />
                        <RangeField
                            label={t.common.height}
                            value={crop.height}
                            min={10}
                            max={100}
                            step={1}
                            suffix="%"
                            onChange={(value) => setCrop((prev) => ({ ...prev, height: value }))}
                        />
                    </div>

                    <div className="rounded-lg border bg-background/60 p-3 text-xs font-mono text-muted-foreground">{cropPixelsText}</div>
                </div>

                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.output}</span>
                        <span className="text-xs font-normal text-muted-foreground">{t.common.preview_text}</span>
                    </div>
                    <div className="border-b">
                        <ToolPreviewArea
                            title={t.common.preview}
                            metadata={outputDataUrl ? cropPixelsText : undefined}
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
                            className="h-full min-h-[360px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
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
