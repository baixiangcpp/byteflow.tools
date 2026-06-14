"use client"

import * as React from "react"
import { Copy, Download, Eraser, Grid3X3, Sparkles, TestTube2 } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { ToolPreviewArea } from "@/features/tool-shell/tool-preview-area"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { buildPatternCss, buildPatternSvg, type PatternKind } from "@/features/tools/svg-pattern-generator/utils"

const DEFAULT_STATE = {
    kind: "dots" as PatternKind,
    tileSize: 36,
    gap: 12,
    strokeWidth: 2.5,
    foreground: "#22d3ee",
    background: "#020617",
    width: 640,
    height: 320,
}

export function SvgPatternGeneratorPage() {
    const { t } = useLang()
    const toolT = t.tools["svg_pattern_generator"] as Record<string, string>
    const kindLabels: Record<PatternKind, string> = {
        dots: toolT.kind_dots,
        grid: toolT.kind_grid,
        diagonal: toolT.kind_diagonal,
    }

    const [kind, setKind] = React.useState<PatternKind>(DEFAULT_STATE.kind)
    const [tileSize, setTileSize] = React.useState(DEFAULT_STATE.tileSize)
    const [gap, setGap] = React.useState(DEFAULT_STATE.gap)
    const [strokeWidth, setStrokeWidth] = React.useState(DEFAULT_STATE.strokeWidth)
    const [foreground, setForeground] = React.useState(DEFAULT_STATE.foreground)
    const [background, setBackground] = React.useState(DEFAULT_STATE.background)
    const [width, setWidth] = React.useState(DEFAULT_STATE.width)
    const [height, setHeight] = React.useState(DEFAULT_STATE.height)

    const svg = React.useMemo(
        () => buildPatternSvg({ kind, tileSize, gap, strokeWidth, foreground, background, width, height }),
        [background, foreground, gap, height, kind, strokeWidth, tileSize, width],
    )

    const dataUri = React.useMemo(() => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`, [svg])
    const css = React.useMemo(() => buildPatternCss(dataUri), [dataUri])
    const output = React.useMemo(() => `${svg}\n\n${css}`, [css, svg])

    const handleSample = () => {
        setKind("diagonal")
        setTileSize(44)
        setGap(8)
        setStrokeWidth(4)
        setForeground("#38bdf8")
        setBackground("#082f49")
        setWidth(720)
        setHeight(360)
    }

    const handleRandomize = () => {
        const kinds: PatternKind[] = ["dots", "grid", "diagonal"]
        setKind(kinds[Math.floor(Math.random() * kinds.length)])
        setTileSize(16 + Math.floor(Math.random() * 80))
        setGap(Math.floor(Math.random() * 20))
        setStrokeWidth(Number((1 + Math.random() * 6).toFixed(1)))
    }

    const handleReset = () => {
        setKind(DEFAULT_STATE.kind)
        setTileSize(DEFAULT_STATE.tileSize)
        setGap(DEFAULT_STATE.gap)
        setStrokeWidth(DEFAULT_STATE.strokeWidth)
        setForeground(DEFAULT_STATE.foreground)
        setBackground(DEFAULT_STATE.background)
        setWidth(DEFAULT_STATE.width)
        setHeight(DEFAULT_STATE.height)
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
        const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = "pattern.svg"
        anchor.click()
        URL.revokeObjectURL(url)
    }

    const actions: ToolAction[] = [
        { id: "sample", label: t.common.sample, icon: TestTube2, onClick: handleSample },
        { id: "random", label: toolT.randomize, icon: Sparkles, onClick: handleRandomize },
        { id: "reset", label: t.common.reset, icon: Eraser, onClick: handleReset },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: () => void handleCopy() },
        { id: "download", label: t.common.download, icon: Download, onClick: handleDownload },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <Grid3X3 className="h-6 w-6 text-primary" />
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
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5 rounded-lg border bg-background/60 p-3 sm:col-span-2">
                            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.pattern_type}</div>
                            <div className="grid grid-cols-3 gap-1">
                                {(["dots", "grid", "diagonal"] as PatternKind[]).map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => setKind(item)}
                                        className={`min-h-11 rounded-md border px-2 text-xs uppercase tracking-wide ${
                                            kind === item
                                                ? "border-primary/40 bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {kindLabels[item]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <RangeField label={toolT.tile_size} value={tileSize} min={8} max={180} step={1} suffix="px" onChange={setTileSize} />
                        <RangeField label={toolT.gap} value={gap} min={0} max={60} step={1} suffix="px" onChange={setGap} />
                        <RangeField label={toolT.stroke} value={strokeWidth} min={0.5} max={16} step={0.5} suffix="px" onChange={setStrokeWidth} />
                        <label className="space-y-1.5 rounded-lg border bg-background/60 p-3">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.canvas}</span>
                            <div className="grid grid-cols-2 gap-2">
                                <Input type="number" min={64} max={1800} value={width} onChange={(event) => setWidth(Math.max(64, Number(event.target.value) || 64))} />
                                <Input type="number" min={64} max={1800} value={height} onChange={(event) => setHeight(Math.max(64, Number(event.target.value) || 64))} />
                            </div>
                        </label>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <ColorField label={toolT.foreground} value={foreground} onChange={setForeground} />
                        <ColorField label={toolT.background} value={background} onChange={setBackground} />
                    </div>
                </div>

                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card">
                    <div className="tool-pane-header">
                        <span>{t.common.output}</span>
                    </div>
                    <ToolPreviewArea
                        title={t.common.preview}
                        metadata={`${width}x${height} px`}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={dataUri} alt={toolT.title} className="max-h-[400px] w-auto rounded object-contain drop-shadow-md" />
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
                <span>{value.toFixed(step < 1 ? 1 : 0)}{suffix}</span>
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

function ColorField({
    label,
    value,
    onChange,
}: {
    label: string
    value: string
    onChange: (value: string) => void
}) {
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
