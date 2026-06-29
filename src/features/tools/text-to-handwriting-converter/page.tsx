"use client"

import * as React from "react"
import { Copy, Download, Eraser, PenTool, RefreshCw, TestTube2 } from "lucide-react"
import { useLang } from "@/core/i18n/lang-provider"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"

type PaperStyle = "plain" | "lined" | "grid"

type PenPreset = {
    id: string
    labelKey: string
    fontFamily: string
}

const PEN_PRESETS: PenPreset[] = [
    { id: "casual", labelKey: "preset_casual_label", fontFamily: '"Segoe Script", "Comic Sans MS", cursive' },
    { id: "neat", labelKey: "preset_neat_label", fontFamily: '"Bradley Hand", "Segoe Print", cursive' },
    { id: "marker", labelKey: "preset_marker_label", fontFamily: '"Comic Neue", "Trebuchet MS", cursive' },
]

const BUTTON_BASE_CLASS =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"

const BUTTON_VARIANT_CLASS = {
    default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
    outline: "border border-border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
} as const

function joinClasses(...values: Array<string | null | undefined | false>) {
    return values.filter(Boolean).join(" ")
}

async function loadToast() {
    const { toast } = await import("sonner")
    return toast
}

function clamp(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) return min
    return Math.max(min, Math.min(max, value))
}

function drawPaperBackground(ctx: CanvasRenderingContext2D, width: number, height: number, style: PaperStyle) {
    ctx.fillStyle = "#fdfcf9"
    ctx.fillRect(0, 0, width, height)

    if (style === "lined") {
        ctx.strokeStyle = "#dbeafe"
        ctx.lineWidth = 1
        for (let y = 44; y < height; y += 38) {
            ctx.beginPath()
            ctx.moveTo(0, y)
            ctx.lineTo(width, y)
            ctx.stroke()
        }
        return
    }

    if (style === "grid") {
        ctx.strokeStyle = "#e2e8f0"
        ctx.lineWidth = 1
        for (let x = 0; x < width; x += 36) {
            ctx.beginPath()
            ctx.moveTo(x, 0)
            ctx.lineTo(x, height)
            ctx.stroke()
        }
        for (let y = 0; y < height; y += 36) {
            ctx.beginPath()
            ctx.moveTo(0, y)
            ctx.lineTo(width, y)
            ctx.stroke()
        }
    }
}

type InlineButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: keyof typeof BUTTON_VARIANT_CLASS
}

function InlineButton({
    className,
    type = "button",
    variant = "outline",
    ...props
}: InlineButtonProps) {
    return (
        <button
            type={type}
            className={joinClasses(BUTTON_BASE_CLASS, "h-9 px-3", BUTTON_VARIANT_CLASS[variant], className)}
            {...props}
        />
    )
}

export function TextToHandwritingConverterPage() {
    const { t } = useLang()
    const toolT = t.tools["text_to_handwriting_converter"] as Record<string, string>
    const notifyError = React.useCallback(async (message: string) => {
        const toast = await loadToast()
        toast.error(message)
    }, [])
    const notifySuccess = React.useCallback(async (message: string) => {
        const toast = await loadToast()
        toast.success(message)
    }, [])

    const canvasRef = React.useRef<HTMLCanvasElement | null>(null)

    const [input, setInput] = React.useState(toolT.sample_input)
    const [presetId, setPresetId] = React.useState(PEN_PRESETS[0].id)
    const [fontSize, setFontSize] = React.useState(40)
    const [lineHeight, setLineHeight] = React.useState(1.55)
    const [inkColor, setInkColor] = React.useState("#1d4ed8")
    const [paperStyle, setPaperStyle] = React.useState<PaperStyle>("lined")
    const [tilt, setTilt] = React.useState(-0.4)
    const [dataUrl, setDataUrl] = React.useState("")

    const preset = React.useMemo(
        () => PEN_PRESETS.find((item) => item.id === presetId) ?? PEN_PRESETS[0],
        [presetId],
    )

    const lines = React.useMemo(
        () => (input.trim() ? input.split(/\r?\n/) : [""]),
        [input],
    )

    React.useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const width = 1280
        const effectiveLineHeight = Math.round(clamp(lineHeight, 1.2, 2.2) * clamp(fontSize, 20, 88))
        const height = Math.max(640, 180 + lines.length * effectiveLineHeight)
        canvas.width = width
        canvas.height = height

        drawPaperBackground(ctx, width, height, paperStyle)

        ctx.save()
        const tiltValue = clamp(tilt, -8, 8) * (Math.PI / 180)
        ctx.translate(width / 2, height / 2)
        ctx.rotate(tiltValue)
        ctx.translate(-width / 2, -height / 2)
        ctx.fillStyle = inkColor
        ctx.textBaseline = "top"
        ctx.font = `${clamp(fontSize, 20, 88)}px ${preset.fontFamily}`

        let y = 86
        lines.forEach((line, index) => {
            const offset = Math.sin(index * 1.77) * 1.5
            ctx.globalAlpha = 0.94 + (index % 3) * 0.02
            ctx.fillText(line, 88 + offset, y + offset)
            y += effectiveLineHeight
        })

        ctx.restore()
        setDataUrl(canvas.toDataURL("image/png"))
    }, [fontSize, inkColor, lineHeight, lines, paperStyle, preset.fontFamily, tilt])

    const outputSummary = React.useMemo(
        () =>
            [
                `${toolT.pen_preset_label}: ${toolT[preset.labelKey]}`,
                `${toolT.summary_font_stack_label}: ${preset.fontFamily}`,
                `${toolT.font_size_label}: ${Math.round(clamp(fontSize, 20, 88))}px`,
                `${toolT.line_height_label}: ${clamp(lineHeight, 1.2, 2.2).toFixed(2)}`,
                `${toolT.ink_color_label}: ${inkColor.toUpperCase()}`,
                `${toolT.paper_label}: ${toolT[`paper_${paperStyle}_label`]}`,
                `${toolT.tilt_label}: ${clamp(tilt, -8, 8).toFixed(1)}deg`,
                `${toolT.summary_lines_label}: ${lines.length}`,
            ].join("\n"),
        [fontSize, inkColor, lineHeight, lines.length, paperStyle, preset.fontFamily, preset.labelKey, tilt, toolT],
    )

    const handleSample = () => {
        setInput(toolT.sample_input)
        setPresetId(PEN_PRESETS[0].id)
        setFontSize(40)
        setLineHeight(1.55)
        setInkColor("#1d4ed8")
        setPaperStyle("lined")
        setTilt(-0.4)
    }

    const handleReset = () => {
        setInput("")
        setPresetId(PEN_PRESETS[0].id)
        setFontSize(38)
        setLineHeight(1.5)
        setInkColor("#0f172a")
        setPaperStyle("plain")
        setTilt(0)
    }

    const handleCopy = async () => {
        const result = await safeClipboardWrite(outputSummary)
        if (!result.ok) {
            await notifyError(t.common.copy_failed)
            return
        }
        await notifySuccess(t.common.copied)
    }

    const handleDownload = () => {
        const url = dataUrl
        if (!url) return
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = "handwriting-output.png"
        anchor.click()
    }

    const actions: ToolAction[] = [
        { id: "sample", label: t.common.sample, icon: TestTube2, onClick: handleSample },
        { id: "rerender", label: toolT.render_action, icon: RefreshCw, onClick: () => setInput((value) => value) },
        { id: "reset", label: t.common.reset, icon: Eraser, onClick: handleReset },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: handleCopy },
        { id: "download", label: toolT.download_png_action, icon: Download, onClick: handleDownload, disabled: !dataUrl },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <PenTool className="h-6 w-6 text-primary" />
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
                        <div className="tool-pane-header">{t.common.input}</div>
                        <div className="space-y-3 border-t p-3">
                            <Textarea
                                value={input}
                                onChange={(event) => setInput(event.target.value)}
                                className="min-h-[180px] text-sm leading-relaxed"
                                spellCheck={false}
                                placeholder={toolT.input_placeholder}
                            />
                        </div>
                    </div>

                    <div className="rounded-lg border bg-background/60">
                        <div className="tool-pane-header">{t.common.style_controls}</div>
                        <div className="grid gap-3 border-t p-3 sm:grid-cols-2">
                            <label className="space-y-1.5 rounded-md border bg-background/80 p-3">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.pen_preset_label}</span>
                                <div className="grid grid-cols-3 gap-2">
                                    {PEN_PRESETS.map((item) => (
                                        <InlineButton key={item.id} variant={presetId === item.id ? "default" : "outline"} onClick={() => setPresetId(item.id)}>
                                            {toolT[item.labelKey]}
                                        </InlineButton>
                                    ))}
                                </div>
                            </label>

                            <label className="space-y-1.5 rounded-md border bg-background/80 p-3">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.paper_label}</span>
                                <div className="grid grid-cols-3 gap-2">
                                    {(["plain", "lined", "grid"] as PaperStyle[]).map((item) => (
                                        <InlineButton key={item} variant={paperStyle === item ? "default" : "outline"} onClick={() => setPaperStyle(item)} className="capitalize">
                                            {toolT[`paper_${item}_label`]}
                                        </InlineButton>
                                    ))}
                                </div>
                            </label>

                            <label className="space-y-1.5 rounded-md border bg-background/80 p-3">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.font_size_label}</span>
                                <Input
                                    type="number"
                                    min={20}
                                    max={88}
                                    value={fontSize}
                                    onChange={(event) => setFontSize(clamp(Number(event.target.value), 20, 88))}
                                />
                            </label>

                            <label className="space-y-1.5 rounded-md border bg-background/80 p-3">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.line_height_label}</span>
                                <Input
                                    type="number"
                                    step={0.05}
                                    min={1.2}
                                    max={2.2}
                                    value={lineHeight}
                                    onChange={(event) => setLineHeight(clamp(Number(event.target.value), 1.2, 2.2))}
                                />
                            </label>

                            <label className="space-y-1.5 rounded-md border bg-background/80 p-3">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.ink_color_label}</span>
                                <div className="flex items-center gap-2">
                                    <Input type="color" value={inkColor} onChange={(event) => setInkColor(event.target.value)} className="h-10 w-14 p-1" />
                                    <Input value={inkColor} onChange={(event) => setInkColor(event.target.value)} className="font-mono text-xs" spellCheck={false} />
                                </div>
                            </label>

                            <label className="space-y-1.5 rounded-md border bg-background/80 p-3">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.tilt_label}</span>
                                <Input
                                    type="number"
                                    step={0.1}
                                    min={-8}
                                    max={8}
                                    value={tilt}
                                    onChange={(event) => setTilt(clamp(Number(event.target.value), -8, 8))}
                                />
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.output}</span>
                        <span className="text-xs font-normal text-muted-foreground">{toolT.preview_export_label}</span>
                    </div>
                    <div className="space-y-3 border-b bg-background/30 p-3">
                        <div className="grid min-h-[280px] place-items-center overflow-auto rounded-lg border bg-background p-3">
                            <canvas ref={canvasRef} className="h-auto max-w-full rounded-md border bg-white" />
                        </div>
                    </div>
                    <div className="flex-1 p-0">
                        <Textarea
                            readOnly
                            value={outputSummary}
                            className="h-full min-h-[180px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>

            <RelatedTools toolKey="text_to_handwriting_converter" />
        </div>
    )
}
