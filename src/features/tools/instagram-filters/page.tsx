"use client"

import * as React from "react"
import { Camera, Copy, Download, Eraser, TestTube2, Upload } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { ToolPreviewArea } from "@/features/tool-shell/tool-preview-area"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { createDemoImageDataUrl, fileToDataUrl, loadImageElement } from "@/core/utils/image-canvas-utils"
import { buildCssFilterString, type ImageFilterConfig } from "@/core/utils/image-edit-utils"
import {
    getInstagramFilterPreset,
    INSTAGRAM_FILTER_PRESETS,
    type InstagramFilterPreset,
} from "@/core/utils/instagram-tool-utils"

const MAX_FILE_SIZE = 12 * 1024 * 1024
const DEFAULT_PRESET_ID = "clarendon"

function toHexAlphaColor(hexColor: string, alpha: number): string {
    const safeAlpha = Math.max(0, Math.min(1, alpha))
    const cleanHex = hexColor.replace("#", "")
    if (cleanHex.length !== 6) return `rgba(0,0,0,${safeAlpha})`
    const r = parseInt(cleanHex.slice(0, 2), 16)
    const g = parseInt(cleanHex.slice(2, 4), 16)
    const b = parseInt(cleanHex.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`
}

function cloneConfig(config: ImageFilterConfig): ImageFilterConfig {
    return {
        brightness: config.brightness,
        contrast: config.contrast,
        saturation: config.saturation,
        grayscale: config.grayscale,
        blur: config.blur,
    }
}

export function InstagramFiltersPage() {
    const { t } = useLang()
    const toolT = t.tools["instagram_filters"] as Record<string, string>
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const demoSrcRef = React.useRef("")

    const initialPreset = React.useMemo(() => getInstagramFilterPreset(DEFAULT_PRESET_ID), [])

    const [sourceImage, setSourceImage] = React.useState("")
    const [fileName, setFileName] = React.useState("")
    const [presetId, setPresetId] = React.useState(initialPreset.id)
    const [filterConfig, setFilterConfig] = React.useState<ImageFilterConfig>(cloneConfig(initialPreset.config))
    const [overlayAlpha, setOverlayAlpha] = React.useState(initialPreset.overlayAlpha)
    const [outputDataUrl, setOutputDataUrl] = React.useState("")

    React.useEffect(() => {
        if (!demoSrcRef.current) demoSrcRef.current = createDemoImageDataUrl(1280, 720)
    }, [])

    const preset: InstagramFilterPreset = React.useMemo(
        () => getInstagramFilterPreset(presetId),
        [presetId],
    )
    const cssFilter = React.useMemo(() => buildCssFilterString(filterConfig), [filterConfig])

    React.useEffect(() => {
        const render = async () => {
            const source = sourceImage || demoSrcRef.current
            if (!source || !canvasRef.current) return

            const image = await loadImageElement(source)
            const canvas = canvasRef.current
            const context = canvas.getContext("2d")
            if (!context) return

            const maxWidth = 980
            const ratio = Math.min(1, maxWidth / image.width)
            const width = Math.max(1, Math.round(image.width * ratio))
            const height = Math.max(1, Math.round(image.height * ratio))

            canvas.width = width
            canvas.height = height
            context.clearRect(0, 0, width, height)
            context.filter = cssFilter
            context.drawImage(image, 0, 0, width, height)
            context.filter = "none"

            if (overlayAlpha > 0) {
                context.save()
                context.fillStyle = toHexAlphaColor(preset.overlayColor, overlayAlpha)
                context.fillRect(0, 0, width, height)
                context.restore()
            }

            setOutputDataUrl(canvas.toDataURL("image/png"))
        }

        void render()
    }, [cssFilter, overlayAlpha, preset.overlayColor, sourceImage])

    const output = React.useMemo(
        () =>
            [
                `Preset: ${preset.label}`,
                `CSS Filter: ${cssFilter}`,
                `Overlay: ${toHexAlphaColor(preset.overlayColor, overlayAlpha)}`,
                "",
                ".instagram-filter-preview {",
                `  filter: ${cssFilter};`,
                "}",
            ].join("\n"),
        [cssFilter, overlayAlpha, preset.label, preset.overlayColor],
    )

    const applyPreset = (nextPreset: InstagramFilterPreset) => {
        setPresetId(nextPreset.id)
        setFilterConfig(cloneConfig(nextPreset.config))
        setOverlayAlpha(nextPreset.overlayAlpha)
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
            const src = await fileToDataUrl(file)
            setSourceImage(src)
            setFileName(file.name)
        } catch {
            toast.error(t.common.image_file_read_failed)
        }
    }

    const handleSample = () => {
        setSourceImage("")
        setFileName(t.common.sample_image)
        applyPreset(getInstagramFilterPreset(DEFAULT_PRESET_ID))
    }

    const handleReset = () => {
        setSourceImage("")
        setFileName("")
        applyPreset(getInstagramFilterPreset("normal"))
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
        anchor.download = `instagram-filter-${preset.id}.png`
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
                        <Camera className="h-6 w-6 text-primary" />
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
                    <div className="rounded-lg border bg-background/60">
                        <div className="tool-pane-header">{t.common.input_image}</div>
                        <div
                            className="grid min-h-[280px] cursor-pointer place-items-center border-t border-dashed bg-muted/15 p-4"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => {
                                event.preventDefault()
                                const file = event.dataTransfer.files?.[0]
                                if (file) void handleFile(file)
                            }}
                        >
                            <canvas ref={canvasRef} className="max-h-[240px] max-w-full rounded-lg border object-contain" />
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
                    </div>

                    <div className="rounded-lg border bg-background/60">
                        <div className="tool-pane-header">{t.common.preset_controls}</div>
                        <div className="space-y-3 border-t p-3">
                            <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
                                {INSTAGRAM_FILTER_PRESETS.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => applyPreset(item)}
                                        className={`min-h-11 rounded-md border px-2 text-xs uppercase tracking-wide ${
                                            presetId === item.id
                                                ? "border-primary/40 bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <RangeField
                                    label={t.common.brightness}
                                    value={filterConfig.brightness}
                                    min={0}
                                    max={250}
                                    step={1}
                                    suffix="%"
                                    onChange={(value) => setFilterConfig((prev) => ({ ...prev, brightness: value }))}
                                />
                                <RangeField
                                    label={t.common.contrast}
                                    value={filterConfig.contrast}
                                    min={0}
                                    max={250}
                                    step={1}
                                    suffix="%"
                                    onChange={(value) => setFilterConfig((prev) => ({ ...prev, contrast: value }))}
                                />
                                <RangeField
                                    label={t.common.saturation}
                                    value={filterConfig.saturation}
                                    min={0}
                                    max={300}
                                    step={1}
                                    suffix="%"
                                    onChange={(value) => setFilterConfig((prev) => ({ ...prev, saturation: value }))}
                                />
                                <RangeField
                                    label={t.common.grayscale}
                                    value={filterConfig.grayscale}
                                    min={0}
                                    max={100}
                                    step={1}
                                    suffix="%"
                                    onChange={(value) => setFilterConfig((prev) => ({ ...prev, grayscale: value }))}
                                />
                                <RangeField
                                    label={t.common.blur}
                                    value={filterConfig.blur}
                                    min={0}
                                    max={20}
                                    step={0.1}
                                    suffix="px"
                                    onChange={(value) => setFilterConfig((prev) => ({ ...prev, blur: value }))}
                                />
                                <RangeField
                                    label={t.common.overlay}
                                    value={Math.round(overlayAlpha * 100)}
                                    min={0}
                                    max={40}
                                    step={1}
                                    suffix="%"
                                    onChange={(value) => setOverlayAlpha(value / 100)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.output}</span>
                        <span className="text-xs font-normal text-muted-foreground">{t.common.preview_css_recipe}</span>
                    </div>
                    <ToolPreviewArea
                        title={t.common.preview}
                        metadata={outputDataUrl ? cssFilter : undefined}
                        className="rounded-none border-0 border-b"
                    >
                        {outputDataUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={outputDataUrl}
                                alt={`${toolT.title} ${t.common.preview}`}
                                className="max-h-[400px] w-auto rounded object-contain drop-shadow-md"
                            />
                        ) : (
                            <div className="text-xs text-muted-foreground">
                                {t.common.preview_will_appear_here}
                            </div>
                        )}
                    </ToolPreviewArea>
                    <div className="flex-1 p-0">
                        <Textarea
                            readOnly
                            value={output}
                            className="h-full min-h-[260px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
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
                <span>
                    {value.toFixed(step < 1 ? 1 : 0)}
                    {suffix}
                </span>
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
