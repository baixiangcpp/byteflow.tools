"use client"

import * as React from "react"
import { Copy, Crop, Download, Eraser, TestTube2, Upload } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { ToolPreviewArea } from "@/features/tool-shell/tool-preview-area"
import { FileUploadStatus, type FileUploadStatusState } from "@/features/tool-shell/file-upload-status"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { FILE_INPUT_POLICIES, validateFileAgainstPolicy } from "@/core/files/file-input-policy"
import { createDemoImageDataUrl, fileToDataUrl, loadPolicyCheckedImage } from "@/core/utils/image-canvas-utils"
import { normalizeCropPercent, percentCropToPixels } from "@/core/utils/image-edit-utils"
import { runImageEditTask } from "@/features/tool-processing/image-edit-task"

const IMAGE_FILE_POLICY = FILE_INPUT_POLICIES["image-standard"]

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
    const fileAbortControllerRef = React.useRef<AbortController | null>(null)
    const renderAbortControllerRef = React.useRef<AbortController | null>(null)
    const renderRequestIdRef = React.useRef(0)

    const [imageSrc, setImageSrc] = React.useState("")
    const [fileName, setFileName] = React.useState("")
    const [crop, setCrop] = React.useState(DEFAULT_CROP)
    const [outputDataUrl, setOutputDataUrl] = React.useState("")
    const [cropPixelsText, setCropPixelsText] = React.useState("")
    const [uploadStatus, setUploadStatus] = React.useState<FileUploadStatusState>("idle")
    const [uploadMessage, setUploadMessage] = React.useState("")
    const [uploadProgress, setUploadProgress] = React.useState<number | undefined>(undefined)
    const [isProcessing, setIsProcessing] = React.useState(false)
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

            const requestId = renderRequestIdRef.current + 1
            renderRequestIdRef.current = requestId
            renderAbortControllerRef.current?.abort()
            const controller = new AbortController()
            renderAbortControllerRef.current = controller
            setIsProcessing(true)
            setUploadStatus("processing")
            setUploadMessage(t.common.processing_file_locally)
            setUploadProgress(65)

            const image = await loadPolicyCheckedImage(source, IMAGE_FILE_POLICY)
            const safeCrop = normalizeCropPercent(crop)
            const pixelRect = percentCropToPixels(image.width, image.height, safeCrop)
            if (renderRequestIdRef.current !== requestId) return
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

            const result = await runImageEditTask({ operation: "crop", source, crop: safeCrop }, { signal: controller.signal })
            if (renderRequestIdRef.current !== requestId) return
            setOutputDataUrl(result.dataUrl)
            setUploadStatus("complete")
            setUploadMessage(t.common.file_ready_locally)
            setUploadProgress(100)
            setIsProcessing(false)
        }

        void render().catch((error) => {
            if (error instanceof Error && (error.message === "FILE_READ_ABORTED" || error.message === "WORKER_ABORTED")) return
            setOutputDataUrl("")
            setUploadStatus("error")
            setUploadMessage(error instanceof Error ? error.message : t.common.image_process_failed)
            setUploadProgress(undefined)
            setIsProcessing(false)
        })

        return () => {
            renderAbortControllerRef.current?.abort()
        }
    }, [crop, formatCropRectText, imageSrc, t.common.file_ready_locally, t.common.image_process_failed, t.common.processing_file_locally])

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
        const validation = validateFileAgainstPolicy(file, IMAGE_FILE_POLICY)
        if (!validation.ok) {
            setUploadStatus("error")
            setUploadMessage(validation.message)
            setUploadProgress(undefined)
            toast.error(validation.reason === "unsupported_type" ? t.common.image_file_required : validation.message)
            return
        }
        fileAbortControllerRef.current?.abort()
        const controller = new AbortController()
        fileAbortControllerRef.current = controller
        setUploadStatus("loading")
        setUploadMessage(t.common.loading_file_locally)
        setUploadProgress(25)
        try {
            const src = await fileToDataUrl(file, IMAGE_FILE_POLICY, { signal: controller.signal })
            await loadPolicyCheckedImage(src, IMAGE_FILE_POLICY)
            if (controller.signal.aborted) return
            setImageSrc(src)
            setFileName(file.name)
            setUploadStatus("processing")
            setUploadMessage(t.common.processing_file_locally)
            setUploadProgress(50)
        } catch {
            if (controller.signal.aborted) return
            setUploadStatus("error")
            setUploadMessage(t.common.image_file_read_failed)
            setUploadProgress(undefined)
            toast.error(t.common.image_file_read_failed)
        }
    }

    const cancelProcessing = () => {
        fileAbortControllerRef.current?.abort()
        renderAbortControllerRef.current?.abort()
        renderRequestIdRef.current += 1
        setIsProcessing(false)
        setUploadStatus("cancelled")
        setUploadMessage(t.common.file_processing_cancelled)
        setUploadProgress(undefined)
    }

    const handleSample = () => {
        setImageSrc(demoSrcRef.current)
        setFileName("")
        setCrop({ x: 18, y: 14, width: 62, height: 60 })
        setUploadStatus("complete")
        setUploadMessage(t.common.file_ready_locally)
        setUploadProgress(100)
    }

    const handleReset = () => {
        cancelProcessing()
        setImageSrc("")
        setFileName("")
        setCrop(DEFAULT_CROP)
        setUploadStatus("idle")
        setUploadMessage("")
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
        { id: "copy", label: t.common.copy, icon: Copy, onClick: handleCopy, disabled: isProcessing },
        { id: "download", label: t.common.download, icon: Download, onClick: handleDownload, disabled: isProcessing || !outputDataUrl },
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
                            accept={IMAGE_FILE_POLICY.accept}
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

                    <FileUploadStatus
                        policy={IMAGE_FILE_POLICY}
                        status={uploadStatus}
                        message={uploadMessage}
                        progress={uploadProgress}
                        onCancel={isProcessing || uploadStatus === "loading" ? cancelProcessing : undefined}
                    />

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
