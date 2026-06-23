"use client"

import * as React from "react"
import { Copy, Download, Eraser, Image as ImageIcon, Lock, LockOpen, TestTube2, Upload } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { ToolPreviewArea } from "@/features/tool-shell/tool-preview-area"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { createDemoImageDataUrl, loadImageElement } from "@/core/utils/image-canvas-utils"
import { runImageResizeTask } from "@/features/tools/image-resizer/image-resize-task"
import { loadResizeImageFile, replaceObjectUrl } from "@/features/tools/image-resizer/browser-actions"
import {
    buildResizeOutputSummary,
    normalizeResizeDimension,
    type ResizeFitMode,
    type ResizeFormat,
} from "@/features/tools/image-resizer/utils"

const MAX_FILE_SIZE = 12 * 1024 * 1024

const DEFAULT_STATE = {
    width: 1280,
    height: 720,
    format: "png" as ResizeFormat,
    quality: 0.92,
    fitMode: "contain" as ResizeFitMode,
    lockAspect: true,
}

const EXT_BY_FORMAT: Record<ResizeFormat, string> = {
    png: "png",
    jpeg: "jpg",
    webp: "webp",
}

export function ImageResizerPage() {
    const { t } = useLang()
    const toolT = t.tools["image_resizer"] as Record<string, string>
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const renderRequestIdRef = React.useRef(0)
    const renderAbortControllerRef = React.useRef<AbortController | null>(null)
    const imageObjectUrlRef = React.useRef<string | null>(null)
    const [demoSrc, setDemoSrc] = React.useState("")

    const [imageSrc, setImageSrc] = React.useState("")
    const [imageBytes, setImageBytes] = React.useState<ArrayBuffer | null>(null)
    const [imageMime, setImageMime] = React.useState("")
    const [fileName, setFileName] = React.useState("")
    const [sourceWidth, setSourceWidth] = React.useState(0)
    const [sourceHeight, setSourceHeight] = React.useState(0)
    const [targetWidth, setTargetWidth] = React.useState(DEFAULT_STATE.width)
    const [targetHeight, setTargetHeight] = React.useState(DEFAULT_STATE.height)
    const [fitMode, setFitMode] = React.useState<ResizeFitMode>(DEFAULT_STATE.fitMode)
    const [format, setFormat] = React.useState<ResizeFormat>(DEFAULT_STATE.format)
    const [quality, setQuality] = React.useState(DEFAULT_STATE.quality)
    const [lockAspect, setLockAspect] = React.useState(DEFAULT_STATE.lockAspect)
    const [outputDataUrl, setOutputDataUrl] = React.useState("")
    const fitModeLabels: Record<ResizeFitMode, string> = {
        contain: toolT.output_fit_mode_contain,
        cover: toolT.output_fit_mode_cover,
        stretch: toolT.output_fit_mode_stretch,
    }
    const activeFileLabel = fileName || (imageSrc ? t.common.sample_image : t.common.drop_image_or_click_upload)

    const aspectRatio = React.useMemo(() => {
        if (sourceWidth <= 0 || sourceHeight <= 0) return 16 / 9
        return sourceWidth / sourceHeight
    }, [sourceHeight, sourceWidth])

    React.useEffect(() => {
        setDemoSrc((prev) => prev || createDemoImageDataUrl(1280, 720))
    }, [])

    React.useEffect(() => {
        return () => replaceObjectUrl(imageObjectUrlRef, null)
    }, [])

    React.useEffect(() => {
        const requestId = renderRequestIdRef.current + 1
        renderRequestIdRef.current = requestId
        renderAbortControllerRef.current?.abort()
        const controller = new AbortController()
        renderAbortControllerRef.current = controller

        const render = async () => {
            const source = imageSrc || demoSrc
            if (!source) {
                setOutputDataUrl("")
                return
            }

            try {
                const result = await runImageResizeTask({
                    source,
                    sourceBytes: imageBytes?.slice(0),
                    sourceMime: imageMime || undefined,
                    targetWidth,
                    targetHeight,
                    fitMode,
                    format,
                    quality,
                }, { signal: controller.signal })
                if (renderRequestIdRef.current !== requestId) return
                setSourceWidth((current) => current === result.sourceWidth ? current : result.sourceWidth)
                setSourceHeight((current) => current === result.sourceHeight ? current : result.sourceHeight)
                setOutputDataUrl(result.dataUrl)
            } catch {
                if (renderRequestIdRef.current === requestId) {
                    setOutputDataUrl("")
                }
            }
        }

        void render()

        return () => {
            controller.abort()
        }
    }, [demoSrc, fitMode, format, imageBytes, imageMime, imageSrc, quality, targetHeight, targetWidth])

    const output = React.useMemo(() => buildResizeOutputSummary({
        fitMode,
        format,
        labels: {
            aspectLock: toolT.output_aspect_lock_label,
            fitMode: toolT.output_fit_mode_label,
            format: toolT.output_format_label,
            lossless: toolT.output_lossless,
            off: toolT.output_off,
            on: toolT.output_on,
            quality: toolT.output_quality_label,
            source: toolT.output_source_label,
            target: toolT.output_target_label,
        },
        lockAspect,
        quality,
        sourceHeight,
        sourceWidth,
        targetHeight,
        targetWidth,
    }), [fitMode, format, lockAspect, quality, sourceHeight, sourceWidth, targetHeight, targetWidth, toolT])

    const setWidthAndKeepRatio = (nextWidth: number) => {
        const safeWidth = normalizeResizeDimension(nextWidth, 1)
        setTargetWidth(safeWidth)
        if (lockAspect) {
            setTargetHeight(normalizeResizeDimension(Math.round(safeWidth / aspectRatio), 1))
        }
    }

    const setHeightAndKeepRatio = (nextHeight: number) => {
        const safeHeight = normalizeResizeDimension(nextHeight, 1)
        setTargetHeight(safeHeight)
        if (lockAspect) {
            setTargetWidth(normalizeResizeDimension(Math.round(safeHeight * aspectRatio), 1))
        }
    }

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
            const loaded = await loadResizeImageFile(file)
            replaceObjectUrl(imageObjectUrlRef, loaded.objectUrl)
            setImageSrc(loaded.objectUrl)
            setImageBytes(loaded.bytes)
            setImageMime(loaded.mime)
            setFileName(loaded.name)
            setSourceWidth(loaded.width)
            setSourceHeight(loaded.height)
            setTargetWidth(loaded.width)
            setTargetHeight(loaded.height)
        } catch {
            toast.error(t.common.image_file_read_failed)
        }
    }

    const handleSample = async () => {
        const sample = demoSrc || createDemoImageDataUrl(1280, 720)
        const image = await loadImageElement(sample)
        replaceObjectUrl(imageObjectUrlRef, null)
        setImageSrc(sample)
        setImageBytes(null)
        setImageMime("")
        setFileName("")
        setSourceWidth(image.width)
        setSourceHeight(image.height)
        setTargetWidth(1200)
        setTargetHeight(675)
        setFitMode("contain")
        setFormat("webp")
        setQuality(0.9)
        setLockAspect(true)
    }

    const handleReset = () => {
        replaceObjectUrl(imageObjectUrlRef, null)
        setImageSrc("")
        setImageBytes(null)
        setImageMime("")
        setFileName("")
        setSourceWidth(0)
        setSourceHeight(0)
        setTargetWidth(DEFAULT_STATE.width)
        setTargetHeight(DEFAULT_STATE.height)
        setFitMode(DEFAULT_STATE.fitMode)
        setFormat(DEFAULT_STATE.format)
        setQuality(DEFAULT_STATE.quality)
        setLockAspect(DEFAULT_STATE.lockAspect)
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
        const extension = EXT_BY_FORMAT[format]
        const anchor = document.createElement("a")
        anchor.href = outputDataUrl
        anchor.download = `resized-image.${extension}`
        anchor.click()
    }

    const actions: ToolAction[] = [
        { id: "sample", label: t.common.sample, icon: TestTube2, onClick: () => void handleSample() },
        { id: "reset", label: t.common.reset, icon: Eraser, onClick: handleReset },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: () => void handleCopy() },
        { id: "download", label: t.common.download, icon: Download, onClick: handleDownload },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col space-y-6">
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

            <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <div className="space-y-4 rounded-xl border bg-card p-4">
                    <div
                        className="grid min-h-[300px] cursor-pointer place-items-center rounded-xl border border-dashed bg-muted/15 p-4"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                            event.preventDefault()
                            const file = event.dataTransfer.files?.[0]
                            if (file) void handleFile(file)
                        }}
                    >
                        {imageSrc || demoSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={imageSrc || demoSrc} alt={toolT.source_preview_alt} className="max-h-[280px] max-w-full rounded-lg border object-contain" />
                        ) : null}
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

                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="space-y-1.5 rounded-lg border bg-background/60 p-3">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.common.width}</span>
                            <Input
                                type="number"
                                min={1}
                                max={4096}
                                value={targetWidth}
                                onChange={(event) => setWidthAndKeepRatio(Number(event.target.value))}
                            />
                        </label>
                        <label className="space-y-1.5 rounded-lg border bg-background/60 p-3">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.common.height}</span>
                            <Input
                                type="number"
                                min={1}
                                max={4096}
                                value={targetHeight}
                                onChange={(event) => setHeightAndKeepRatio(Number(event.target.value))}
                            />
                        </label>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5 rounded-lg border bg-background/60 p-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.output_aspect_lock_label}</div>
                            <button
                                type="button"
                                onClick={() => setLockAspect((prev) => !prev)}
                                className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border px-3 text-sm ${
                                    lockAspect
                                        ? "border-primary/40 bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {lockAspect ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
                                {lockAspect ? toolT.control_locked : toolT.control_unlocked}
                            </button>
                        </div>

                        <div className="space-y-1.5 rounded-lg border bg-background/60 p-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.output_fit_mode_label}</div>
                            <div className="grid grid-cols-3 gap-1">
                                {(["contain", "cover", "stretch"] as ResizeFitMode[]).map((mode) => (
                                    <button
                                        key={mode}
                                        type="button"
                                        onClick={() => setFitMode(mode)}
                                        className={`min-h-11 rounded-md border px-2 text-xs uppercase tracking-wide ${
                                            fitMode === mode
                                                ? "border-primary/40 bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {fitModeLabels[mode]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5 rounded-lg border bg-background/60 p-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.output_format_label}</div>
                            <div className="grid grid-cols-3 gap-1">
                                {(["png", "jpeg", "webp"] as ResizeFormat[]).map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => setFormat(item)}
                                        className={`min-h-11 rounded-md border px-2 text-xs uppercase tracking-wide ${
                                            format === item
                                                ? "border-primary/40 bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1.5 rounded-lg border bg-background/60 p-3">
                            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                <span>{toolT.output_quality_label}</span>
                                <span>{format === "png" ? toolT.output_lossless : quality.toFixed(2)}</span>
                            </div>
                            <Input
                                type="range"
                                min={0.4}
                                max={1}
                                step={0.01}
                                value={quality}
                                disabled={format === "png"}
                                onChange={(event) => setQuality(Number(event.target.value))}
                                className="cursor-pointer disabled:cursor-not-allowed"
                            />
                        </div>
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
                            metadata={outputDataUrl ? `${targetWidth} × ${targetHeight} (${format.toUpperCase()})` : undefined}
                        >
                            {outputDataUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={outputDataUrl}
                                    alt={toolT.output_preview_alt}
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
