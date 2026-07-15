"use client"

import * as React from "react"
import { Copy, Download, Eraser, Shapes, Sparkles, TestTube2 } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { ToolPreviewArea } from "@/features/tool-shell/tool-preview-area"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { buildBlobPath, buildBlobSvg } from "@/features/tools/svg-blob-generator/utils"
import { ToolPageContainer } from "@/components/layout/page-container"

const DEFAULT_STATE = {
    size: 420,
    points: 8,
    randomness: 42,
    seed: 73,
    fill: "#22d3ee",
    stroke: "#0f172a",
}

export function SvgBlobGeneratorPage() {
    const { t } = useLang()
    const toolT = t.tools["svg_blob_generator"] as Record<string, string>

    const [size, setSize] = React.useState(DEFAULT_STATE.size)
    const [points, setPoints] = React.useState(DEFAULT_STATE.points)
    const [randomness, setRandomness] = React.useState(DEFAULT_STATE.randomness)
    const [seed, setSeed] = React.useState(DEFAULT_STATE.seed)
    const [fill, setFill] = React.useState(DEFAULT_STATE.fill)
    const [stroke, setStroke] = React.useState(DEFAULT_STATE.stroke)

    const path = React.useMemo(
        () => buildBlobPath({ size, points, randomness, seed }),
        [points, randomness, seed, size],
    )
    const svg = React.useMemo(() => buildBlobSvg(path, size, fill, stroke), [fill, path, size, stroke])
    const dataUri = React.useMemo(() => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`, [svg])

    const output = React.useMemo(
        () =>
            [
                svg,
                "",
                toolT.css_clip_path_preview_comment,
                `.blob { clip-path: path("${path}"); }`,
            ].join("\n"),
        [path, svg, toolT.css_clip_path_preview_comment],
    )

    const handleSample = () => {
        setSize(480)
        setPoints(9)
        setRandomness(55)
        setSeed(108)
        setFill("#60a5fa")
        setStroke("#1e3a8a")
    }

    const handleReset = () => {
        setSize(DEFAULT_STATE.size)
        setPoints(DEFAULT_STATE.points)
        setRandomness(DEFAULT_STATE.randomness)
        setSeed(DEFAULT_STATE.seed)
        setFill(DEFAULT_STATE.fill)
        setStroke(DEFAULT_STATE.stroke)
    }

    const handleRandomize = () => {
        setSeed(Math.floor(Math.random() * 100000) + 1)
        setPoints(5 + Math.floor(Math.random() * 8))
        setRandomness(20 + Math.floor(Math.random() * 61))
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
        anchor.download = "blob.svg"
        anchor.click()
        URL.revokeObjectURL(url)
    }

    const actions: ToolAction[] = [
        { id: "sample", label: t.common.sample, icon: TestTube2, onClick: handleSample },
        { id: "random", label: toolT.random_action, icon: Sparkles, onClick: handleRandomize },
        { id: "reset", label: t.common.reset, icon: Eraser, onClick: handleReset },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: handleCopy },
        { id: "download", label: t.common.download, icon: Download, onClick: handleDownload },
    ]

    return (
        <ToolPageContainer className="flex h-full flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <Shapes className="h-6 w-6 text-primary" />
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
                        <RangeField label={toolT.size_label} value={size} min={160} max={700} step={1} suffix="px" onChange={setSize} />
                        <RangeField label={toolT.points_label} value={points} min={3} max={20} step={1} suffix="" onChange={setPoints} />
                        <RangeField label={toolT.randomness_label} value={randomness} min={0} max={100} step={1} suffix="%" onChange={setRandomness} />
                        <label className="space-y-1.5 rounded-lg border bg-background/60 p-3">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.seed_label}</span>
                            <Input
                                type="number"
                                min={1}
                                max={999999}
                                value={seed}
                                onChange={(event) => setSeed(Math.max(1, Number(event.target.value) || 1))}
                            />
                        </label>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <ColorField label={toolT.fill_color_label} value={fill} onChange={setFill} />
                        <ColorField label={toolT.stroke_color_label} value={stroke} onChange={setStroke} />
                    </div>
                </div>

                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.output}</span>
                    </div>
                    <div className="flex-1 space-y-3 p-3">
                        <ToolPreviewArea
                            title={t.common.preview_svg}
                            metadata={`${size} × ${size} px`}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={dataUri} alt={toolT.preview_alt} className="max-h-[300px] w-auto rounded object-contain drop-shadow-md" />
                        </ToolPreviewArea>

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
