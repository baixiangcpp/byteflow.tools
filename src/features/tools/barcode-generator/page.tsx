"use client"

import * as React from "react"
import JsBarcode from "jsbarcode"
import { Barcode, Copy, Download, Eraser, Play, RotateCcw, TestTube2 } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { ToolPreviewArea } from "@/features/tool-shell/tool-preview-area"
import { ToolEmptyState } from "@/features/tool-shell/tool-empty-state"
import { normalizeBarcodeValue, type BarcodeFormat } from "@/features/tools/barcode-generator/utils"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { ToolPageContainer } from "@/components/layout/page-container"

const SAMPLE_BY_FORMAT: Record<BarcodeFormat, string> = {
    CODE128: "BYTEFLOW-2026",
    EAN13: "590123412345",
}

function getSvgDimensions(svgMarkup: string): { width: number; height: number } {
    const widthMatch = svgMarkup.match(/width="(\d+(?:\.\d+)?)"/)
    const heightMatch = svgMarkup.match(/height="(\d+(?:\.\d+)?)"/)
    return {
        width: Math.max(1, Math.round(Number(widthMatch?.[1] || 640))),
        height: Math.max(1, Math.round(Number(heightMatch?.[1] || 240))),
    }
}

export function BarcodeGeneratorPage() {
    const { t } = useLang()
    const toolT = t.tools["barcode_generator"] as Record<string, string>
    const text = React.useCallback((key: string) => toolT[key], [toolT])
    const emptyLabel = t.common.empty
    const noneLabel = t.common.none
    const statusReady = text("status_ready")
    const statusProvideValue = text("status_provide_value")
    const statusGeneratedTemplate = text("status_generated")
    const statusFailed = text("status_failed")
    const outputStatusLabel = text("output_status_label")
    const barcodeErrors = React.useMemo(
        () => ({
            input_required: t.common.input_required,
            ean13_invalid_checksum: text("error_ean13_invalid_checksum"),
            ean13_length: text("error_ean13_length"),
            code128_ascii_only: text("error_code128_ascii_only"),
            code128_too_long: text("error_code128_too_long"),
        }),
        [t.common.input_required, text],
    )

    const [format, setFormat] = React.useState<BarcodeFormat>("CODE128")
    const [input, setInput] = React.useState("")
    const [barWidth, setBarWidth] = React.useState(2)
    const [barHeight, setBarHeight] = React.useState(120)
    const [lineColor, setLineColor] = React.useState("#111827")
    const [background, setBackground] = React.useState("#ffffff")
    const [displayValue, setDisplayValue] = React.useState(true)
    const [status, setStatus] = React.useState(statusReady)
    const [svgMarkup, setSvgMarkup] = React.useState("")

    const svgRef = React.useRef<SVGSVGElement | null>(null)

    const normalized = React.useMemo(() => normalizeBarcodeValue(input, format), [format, input])
    const normalizedError = normalized.errorKey ? barcodeErrors[normalized.errorKey] : null

    React.useEffect(() => {
        const svgElement = svgRef.current
        if (!svgElement) return
        if (!normalized.normalized || normalizedError) {
            svgElement.innerHTML = ""
            setSvgMarkup("")
            setStatus(normalizedError || statusProvideValue)
            return
        }

        try {
            JsBarcode(svgElement, normalized.normalized, {
                format,
                width: barWidth,
                height: barHeight,
                displayValue,
                lineColor,
                background,
                margin: 16,
                fontOptions: "bold",
                fontSize: 16,
            })
            setSvgMarkup(svgElement.outerHTML)
            setStatus(statusGeneratedTemplate.replace("{format}", format))
        } catch {
            svgElement.innerHTML = ""
            setSvgMarkup("")
            setStatus(statusFailed)
        }
    }, [
        background,
        barHeight,
        barWidth,
        displayValue,
        format,
        lineColor,
        normalizedError,
        normalized.normalized,
        statusFailed,
        statusGeneratedTemplate,
        statusProvideValue,
    ])

    const output = React.useMemo(
        () =>
            [
                `${toolT.output_format_label}: ${format}`,
                `${toolT.output_input_label}: ${input || emptyLabel}`,
                `${toolT.output_normalized_label}: ${normalized.normalized || noneLabel}`,
                `${toolT.output_bar_width_label}: ${barWidth}`,
                `${toolT.output_bar_height_label}: ${barHeight}`,
                `${toolT.output_line_color_label}: ${lineColor.toUpperCase()}`,
                `${toolT.output_background_label}: ${background.toUpperCase()}`,
                `${toolT.output_display_label_label}: ${displayValue ? toolT.yes_label : toolT.no_label}`,
                "",
                `${outputStatusLabel}: ${normalizedError || status}`,
            ].join("\n"),
        [background, barHeight, barWidth, displayValue, emptyLabel, format, input, lineColor, noneLabel, normalized.normalized, normalizedError, outputStatusLabel, status, toolT],
    )

    const canExport = Boolean(svgMarkup) && !normalizedError

    const handleSample = () => setInput(SAMPLE_BY_FORMAT[format])

    const handleClear = () => setInput("")

    const handleGenerate = () => {
        if (normalizedError) {
            toast.error(normalizedError)
            return
        }
        if (!normalized.normalized) {
            toast.error(t.common.input_required)
            return
        }
        setStatus(statusGeneratedTemplate.replace("{format}", format))
        toast.success(t.common.barcode_generated)
    }

    const handleReset = () => {
        setFormat("CODE128")
        setInput("")
        setBarWidth(2)
        setBarHeight(120)
        setLineColor("#111827")
        setBackground("#ffffff")
        setDisplayValue(true)
    }

    const handleCopy = async () => {
        const result = await safeClipboardWrite(output)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }

    const handleDownloadSvg = () => {
        if (!canExport) return
        const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = "barcode.svg"
        anchor.click()
        URL.revokeObjectURL(url)
    }

    const handleDownloadPng = async () => {
        if (!canExport) return
        const { width, height } = getSvgDimensions(svgMarkup)
        const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`
        const image = new Image()
        await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve()
            image.onerror = () => reject(new Error("Failed to load SVG"))
            image.src = dataUrl
        })

        const canvas = document.createElement("canvas")
        canvas.width = Math.max(width, image.width || width)
        canvas.height = Math.max(height, image.height || height)
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        ctx.drawImage(image, 0, 0)
        const pngUrl = canvas.toDataURL("image/png")
        const anchor = document.createElement("a")
        anchor.href = pngUrl
        anchor.download = "barcode.png"
        anchor.click()
    }

    const actions: ToolAction[] = [
        { id: "sample", label: t.common.sample, icon: TestTube2, onClick: handleSample },
        { id: "clear", label: t.common.clear, icon: Eraser, onClick: handleClear, disabled: !input },
        { id: "generate", label: toolT.generate_action, icon: Play, onClick: handleGenerate },
        { id: "reset", label: t.common.reset, icon: RotateCcw, onClick: handleReset },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: handleCopy },
        { id: "svg", label: "SVG", icon: Download, onClick: handleDownloadSvg, disabled: !canExport },
        { id: "png", label: "PNG", icon: Download, onClick: handleDownloadPng, disabled: !canExport },
    ]

    return (
        <ToolPageContainer className="flex h-full flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <Barcode className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {toolT.description}
                    </p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-4 rounded-xl border bg-card p-4">
                    <div className="rounded-lg border bg-background/60">
                        <div className="tool-pane-header">{toolT.input_pane_title}</div>
                        <div className="space-y-3 border-t p-3">
                            <div className="grid grid-cols-2 gap-2">
                                {(["CODE128", "EAN13"] as BarcodeFormat[]).map((value) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => {
                                            setFormat(value)
                                        }}
                                        className={`min-h-11 rounded-md border px-3 text-xs font-semibold uppercase tracking-wide ${
                                            format === value
                                                ? "border-primary/40 bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {value}
                                    </button>
                                ))}
                            </div>
                            <Input
                                aria-label={toolT.input_pane_title}
                                value={input}
                                onChange={(event) => setInput(event.target.value)}
                                placeholder={
                                    format === "EAN13"
                                        ? toolT.input_placeholder_ean13
                                        : toolT.input_placeholder_code128
                                }
                                spellCheck={false}
                            />
                            <div className={`rounded-md border p-3 text-xs ${normalizedError ? "text-red-600 dark:text-red-300" : "text-muted-foreground"}`}>
                                {normalizedError
                                    ? normalizedError
                                    : `${toolT.normalized_value_label}: ${normalized.normalized || "-"}`}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border bg-background/60">
                        <div className="tool-pane-header">{t.common.style}</div>
                        <div className="grid gap-3 border-t p-3 sm:grid-cols-2">
                            <label className="space-y-1.5 rounded-md border bg-background/80 p-3">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {toolT.bar_width_label}
                                </span>
                                <Input type="number" min={1} max={5} value={barWidth} onChange={(event) => setBarWidth(Number(event.target.value) || 2)} />
                            </label>
                            <label className="space-y-1.5 rounded-md border bg-background/80 p-3">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {toolT.bar_height_label}
                                </span>
                                <Input type="number" min={48} max={320} value={barHeight} onChange={(event) => setBarHeight(Number(event.target.value) || 120)} />
                            </label>
                            <label className="space-y-1.5 rounded-md border bg-background/80 p-3">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {toolT.line_color_label}
                                </span>
                                <div className="flex items-center gap-2">
                                    <Input type="color" value={lineColor} onChange={(event) => setLineColor(event.target.value)} className="h-10 w-14 p-1" />
                                    <Input value={lineColor} onChange={(event) => setLineColor(event.target.value)} className="font-mono text-xs" spellCheck={false} />
                                </div>
                            </label>
                            <label className="space-y-1.5 rounded-md border bg-background/80 p-3">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {toolT.background_label}
                                </span>
                                <div className="flex items-center gap-2">
                                    <Input type="color" value={background} onChange={(event) => setBackground(event.target.value)} className="h-10 w-14 p-1" />
                                    <Input value={background} onChange={(event) => setBackground(event.target.value)} className="font-mono text-xs" spellCheck={false} />
                                </div>
                            </label>
                            <label className="flex min-h-11 items-center gap-2 rounded-md border bg-background/80 px-3 text-sm sm:col-span-2">
                                <input type="checkbox" checked={displayValue} onChange={(event) => setDisplayValue(event.target.checked)} className="h-4 w-4" />
                                {toolT.show_human_readable_label}
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.output}</span>
                    </div>
                    <div className="flex-1 space-y-3 p-3">
                        <ToolPreviewArea
                            title={t.common.preview_metadata}
                            metadata={`${format}`}
                        >
                            {canExport ? (
                                <svg ref={svgRef} className="h-auto max-w-full drop-shadow-md" aria-label={toolT.preview_alt} />
                            ) : (
                                <ToolEmptyState
                                    icon={Barcode}
                                    title={t.common.preview_will_appear_here}
                                    compact
                                />
                            )}
                        </ToolPreviewArea>

                        <div className="rounded-lg border bg-background p-2 text-xs text-muted-foreground">{normalizedError || status}</div>

                        <Textarea
                            readOnly
                            value={output}
                            className="h-full min-h-[200px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>

            <RelatedTools toolKey="barcode_generator" />
        </ToolPageContainer>
    )
}
