"use client"

import * as React from "react"
import { Copy, Download, Eraser, FileImage, TestTube2, Upload } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { ToolPreviewArea } from "@/features/tool-shell/tool-preview-area"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { FILE_INPUT_POLICIES, describeFilePolicy, readTextFileWithPolicy, validateFileAgainstPolicy } from "@/core/files/file-input-policy"
import { extractSvgDimensions, rasterizeSvgToPngDataUrl } from "@/features/tools/svg-to-png-converter/utils"
import { ToolPageContainer } from "@/components/layout/page-container"

const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700" width="1200" height="700">
  <defs>
    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#22d3ee" />
      <stop offset="100%" stop-color="#2563eb" />
    </linearGradient>
  </defs>
  <rect width="1200" height="700" fill="#020617" />
  <circle cx="260" cy="220" r="150" fill="url(#g1)" opacity="0.95" />
  <rect x="470" y="120" width="500" height="250" rx="42" fill="#1d4ed8" opacity="0.8" />
  <path d="M 180 560 C 320 430 540 610 680 500 C 800 410 980 550 1110 470" stroke="#38bdf8" stroke-width="28" fill="none" stroke-linecap="round" />
  <text x="120" y="630" font-size="86" font-family="ui-sans-serif, system-ui" fill="#e0f2fe" font-weight="700">svc_42</text>
</svg>`

function estimateDataUrlBytes(dataUrl: string): number {
    const payload = dataUrl.split(",")[1] || ""
    return Math.floor((payload.length * 3) / 4)
}

export function SvgToPngConverterPage() {
    const { t } = useLang()
    const toolT = t.tools["svg_to_png_converter"] as Record<string, string>
    const outputWidthLabel = toolT.output_width_label
    const outputHeightLabel = toolT.output_height_label
    const outputTransparentLabel = toolT.output_transparent_label
    const outputBackgroundLabel = toolT.output_background_label
    const outputPngSizeLabel = toolT.output_png_size_label
    const outputPngSizeUnit = toolT.output_png_size_unit
    const outputDataUrlPlaceholder =
        toolT.output_data_url_placeholder
    const outputYes = toolT.output_yes
    const outputNo = toolT.output_no
    const errorConvertFailed = toolT.error_convert_failed
    const outputBackgroundTransparent = toolT.output_background_transparent
    const controlAspectLockLabel = toolT.control_aspect_lock_label
    const controlOn = toolT.control_on
    const controlOff = toolT.control_off
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const filePolicy = FILE_INPUT_POLICIES.svg

    const initialDims = React.useMemo(() => extractSvgDimensions(SAMPLE_SVG), [])

    const [svgInput, setSvgInput] = React.useState(SAMPLE_SVG)
    const [width, setWidth] = React.useState(initialDims.width)
    const [height, setHeight] = React.useState(initialDims.height)
    const [lockAspect, setLockAspect] = React.useState(true)
    const [backgroundEnabled, setBackgroundEnabled] = React.useState(false)
    const [background, setBackground] = React.useState("#ffffff")
    const [previewPng, setPreviewPng] = React.useState("")
    const [error, setError] = React.useState("")

    const aspectRatio = React.useMemo(() => {
        const dims = extractSvgDimensions(svgInput)
        return dims.width / dims.height
    }, [svgInput])

    React.useEffect(() => {
        let cancelled = false

        const run = async () => {
            try {
                const dataUrl = await rasterizeSvgToPngDataUrl({
                    svg: svgInput,
                    width,
                    height,
                    background: backgroundEnabled ? background : null,
                })
                if (!cancelled) {
                    setPreviewPng(dataUrl)
                    setError("")
                }
            } catch (err) {
                if (!cancelled) {
                    void err
                    const message = errorConvertFailed
                    setPreviewPng("")
                    setError(message)
                }
            }
        }

        void run()
        return () => {
            cancelled = true
        }
    }, [background, backgroundEnabled, errorConvertFailed, height, svgInput, width])

    const pngBytes = React.useMemo(() => (previewPng ? estimateDataUrlBytes(previewPng) : 0), [previewPng])

    const output = React.useMemo(
        () =>
            [
                `${outputWidthLabel}: ${width}px`,
                `${outputHeightLabel}: ${height}px`,
                `${outputTransparentLabel}: ${backgroundEnabled ? outputNo : outputYes}`,
                `${outputBackgroundLabel}: ${backgroundEnabled ? background : outputBackgroundTransparent}`,
                `${outputPngSizeLabel}: ${pngBytes} ${outputPngSizeUnit}`,
                "",
                previewPng || outputDataUrlPlaceholder,
            ].join("\n"),
        [
            background,
            backgroundEnabled,
            height,
            outputBackgroundLabel,
            outputBackgroundTransparent,
            outputDataUrlPlaceholder,
            outputHeightLabel,
            outputNo,
            outputPngSizeLabel,
            outputPngSizeUnit,
            outputTransparentLabel,
            outputWidthLabel,
            outputYes,
            pngBytes,
            previewPng,
            width,
        ],
    )

    const syncDimensionsFromSvg = () => {
        const dims = extractSvgDimensions(svgInput)
        setWidth(dims.width)
        setHeight(dims.height)
    }

    const setWidthWithAspect = (next: number) => {
        const safe = Math.max(32, Math.min(4096, Math.round(next || 32)))
        setWidth(safe)
        if (lockAspect) {
            setHeight(Math.max(32, Math.min(4096, Math.round(safe / aspectRatio))))
        }
    }

    const setHeightWithAspect = (next: number) => {
        const safe = Math.max(32, Math.min(4096, Math.round(next || 32)))
        setHeight(safe)
        if (lockAspect) {
            setWidth(Math.max(32, Math.min(4096, Math.round(safe * aspectRatio))))
        }
    }

    const handleFileUpload = async (file: File) => {
        const validation = validateFileAgainstPolicy(file, filePolicy)
        if (!validation.ok) {
            toast.error(t.common.svg_file_required)
            return
        }
        const text = await readTextFileWithPolicy(file, filePolicy)
        setSvgInput(text)
        const dims = extractSvgDimensions(text)
        setWidth(dims.width)
        setHeight(dims.height)
    }

    const handleSample = () => {
        setSvgInput(SAMPLE_SVG)
        const dims = extractSvgDimensions(SAMPLE_SVG)
        setWidth(dims.width)
        setHeight(dims.height)
        setLockAspect(true)
        setBackgroundEnabled(false)
        setBackground("#ffffff")
    }

    const handleReset = () => {
        setSvgInput("")
        setWidth(512)
        setHeight(512)
        setLockAspect(true)
        setBackgroundEnabled(false)
        setBackground("#ffffff")
        setPreviewPng("")
        setError("")
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
        if (!previewPng) return
        const anchor = document.createElement("a")
        anchor.href = previewPng
        anchor.download = "converted.png"
        anchor.click()
    }

    const actions: ToolAction[] = [
        { id: "sample", label: t.common.sample, icon: TestTube2, onClick: handleSample },
        { id: "reset", label: t.common.reset, icon: Eraser, onClick: handleReset },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: handleCopy },
        { id: "download", label: t.common.download, icon: Download, onClick: handleDownload, disabled: !previewPng },
    ]

    return (
        <ToolPageContainer className="flex h-full flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <FileImage className="h-6 w-6 text-primary" />
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
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <Upload className="h-4 w-4" />
                            {t.common.upload_svg}
                        </button>
                        <button
                            type="button"
                            onClick={syncDimensionsFromSvg}
                            className="inline-flex min-h-11 items-center rounded-md border px-3 text-sm text-muted-foreground hover:text-foreground"
                        >
                            {t.common.use_svg_size}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={filePolicy.accept}
                            className="hidden"
                            onChange={(event) => {
                                const file = event.target.files?.[0]
                                if (file) void handleFileUpload(file)
                            }}
                        />
                        <span className="text-xs text-muted-foreground">{describeFilePolicy(filePolicy)}</span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="space-y-1.5 rounded-lg border bg-background/60 p-3">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{outputWidthLabel}</span>
                            <Input type="number" min={32} max={4096} value={width} onChange={(event) => setWidthWithAspect(Number(event.target.value))} />
                        </label>
                        <label className="space-y-1.5 rounded-lg border bg-background/60 p-3">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{outputHeightLabel}</span>
                            <Input type="number" min={32} max={4096} value={height} onChange={(event) => setHeightWithAspect(Number(event.target.value))} />
                        </label>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <button
                            type="button"
                            onClick={() => setLockAspect((prev) => !prev)}
                            className={`min-h-11 rounded-md border px-3 text-sm ${
                                lockAspect
                                    ? "border-primary/40 bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {controlAspectLockLabel}: {lockAspect ? controlOn : controlOff}
                        </button>

                        <div className="flex min-h-11 items-center gap-2 rounded-lg border bg-background/60 px-3">
                            <button
                                type="button"
                                onClick={() => setBackgroundEnabled((prev) => !prev)}
                                className={`rounded border px-2 py-1 text-xs ${
                                    backgroundEnabled ? "border-primary/40 bg-primary/10 text-primary" : "text-muted-foreground"
                                }`}
                            >
                                {backgroundEnabled ? t.common.solid_background : t.common.transparent}
                            </button>
                            <Input
                                type="color"
                                value={background}
                                onChange={(event) => setBackground(event.target.value)}
                                className="h-8 w-12 cursor-pointer p-1"
                                disabled={!backgroundEnabled}
                            />
                            <Input
                                value={background}
                                onChange={(event) => setBackground(event.target.value)}
                                className="h-8 font-mono text-xs"
                                spellCheck={false}
                                disabled={!backgroundEnabled}
                            />
                        </div>
                    </div>

                    <div className="rounded-lg border bg-background/60">
                        <div className="tool-pane-header">{t.common.input_svg}</div>
                        <Textarea
                            value={svgInput}
                            onChange={(event) => setSvgInput(event.target.value)}
                            className="min-h-[260px] resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                            spellCheck={false}
                        />
                    </div>
                </div>

                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card">
                    <ToolPreviewArea
                        title={t.common.preview_png_data_url || t.common.preview}
                        metadata={width && height ? `${width} × ${height} px` : undefined}
                        className="rounded-none border-0 border-b"
                    >
                        {previewPng ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={previewPng}
                                alt={`${toolT.title} ${t.common.preview}`}
                                className="max-h-[300px] w-auto rounded object-contain drop-shadow-md"
                            />
                        ) : (
                            <div className="text-xs text-muted-foreground">
                                {error || t.common.preview_will_appear_here}
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
        </ToolPageContainer>
    )
}
