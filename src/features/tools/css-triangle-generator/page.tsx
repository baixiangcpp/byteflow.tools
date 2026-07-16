"use client"

import * as React from "react"
import { Copy, Download, Eraser, Play, TestTube2 } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { buildTriangleCss, type TriangleDirection } from "@/core/utils/css-generator-utils"
import { ToolPageContainer } from "@/components/layout/page-container"

const DEFAULT_STATE = {
    direction: "up" as TriangleDirection,
    width: 60,
    height: 34,
    color: "#22d3ee",
}

export function CssTriangleGeneratorPage() {
    const { t } = useLang()
    const toolT = t.tools["css_triangle_generator"] as Record<string, string>

    const [direction, setDirection] = React.useState<TriangleDirection>(DEFAULT_STATE.direction)
    const [width, setWidth] = React.useState(DEFAULT_STATE.width)
    const [height, setHeight] = React.useState(DEFAULT_STATE.height)
    const [color, setColor] = React.useState(DEFAULT_STATE.color)

    const cssOutput = React.useMemo(() => buildTriangleCss({ direction, width, height, color }), [direction, width, height, color])

    const handleCopy = async () => {
        const result = await safeClipboardWrite(cssOutput)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, {
            description: t.common.copied_desc,
        })
    }

    const handleDownload = () => {
        const blob = new Blob([`.triangle {\n${cssOutput.split("\n").map((line) => `  ${line}`).join("\n")}\n}\n`], {
            type: "text/css;charset=utf-8",
        })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = "triangle.css"
        anchor.click()
        URL.revokeObjectURL(url)
    }

    const handleReset = () => {
        setDirection(DEFAULT_STATE.direction)
        setWidth(DEFAULT_STATE.width)
        setHeight(DEFAULT_STATE.height)
        setColor(DEFAULT_STATE.color)
    }

    const handleSample = () => {
        setDirection("right")
        setWidth(70)
        setHeight(40)
        setColor("#38bdf8")
    }

    const actions: ToolAction[] = [
        { id: "sample", label: t.common.sample, icon: TestTube2, onClick: handleSample },
        { id: "reset", label: t.common.reset, icon: Eraser, onClick: handleReset },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: handleCopy },
        { id: "download", label: t.common.download, icon: Download, onClick: handleDownload },
    ]

    const triangleStyle = React.useMemo(() => {
        const halfWidth = Math.max(2, Math.round(width / 2))
        const edge = Math.max(4, Math.round(height))

        if (direction === "up") {
            return {
                width: 0,
                height: 0,
                borderLeft: `${halfWidth}px solid transparent`,
                borderRight: `${halfWidth}px solid transparent`,
                borderBottom: `${edge}px solid ${color}`,
            }
        }

        if (direction === "down") {
            return {
                width: 0,
                height: 0,
                borderLeft: `${halfWidth}px solid transparent`,
                borderRight: `${halfWidth}px solid transparent`,
                borderTop: `${edge}px solid ${color}`,
            }
        }

        if (direction === "left") {
            return {
                width: 0,
                height: 0,
                borderTop: `${halfWidth}px solid transparent`,
                borderBottom: `${halfWidth}px solid transparent`,
                borderRight: `${edge}px solid ${color}`,
            }
        }

        return {
            width: 0,
            height: 0,
            borderTop: `${halfWidth}px solid transparent`,
            borderBottom: `${halfWidth}px solid transparent`,
            borderLeft: `${edge}px solid ${color}`,
        }
    }, [direction, width, height, color])

    return (
        <ToolPageContainer className="flex h-full flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <Play className="h-6 w-6 text-primary" />
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
                        {(["up", "down", "left", "right"] as TriangleDirection[]).map((item) => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => setDirection(item)}
                                className={`rounded-md border px-3 py-1.5 text-sm capitalize transition-colors ${direction === item ? "border-primary/40 bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                {toolT[`direction_${item}`]}
                            </button>
                        ))}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <RangeField label={toolT.base_width_label} value={width} min={12} max={120} step={1} suffix="px" onChange={setWidth} />
                        <RangeField label={toolT.height_label} value={height} min={8} max={80} step={1} suffix="px" onChange={setHeight} />
                        <ColorField label={toolT.color_label} value={color} onChange={setColor} />
                    </div>

                    <div className="overflow-hidden rounded-xl border">
                        <div className="tool-pane-header tool-pane-header-between">
                            <span>{t.common.preview}</span>
                            <span className="text-xs font-normal text-muted-foreground">{toolT[`direction_${direction}`]}</span>
                        </div>
                        <div className="grid min-h-[260px] place-items-center bg-gradient-to-br from-cyan-500/10 to-slate-700/20 p-8">
                            <div style={triangleStyle} />
                        </div>
                    </div>
                </div>

                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.output}</span>
                        <span className="text-xs font-normal text-muted-foreground">CSS</span>
                    </div>
                    <div className="flex-1 p-0">
                        <Textarea
                            readOnly
                            value={cssOutput}
                            className="h-full min-h-[360px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
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

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
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
