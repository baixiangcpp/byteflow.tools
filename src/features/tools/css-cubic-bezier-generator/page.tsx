"use client"

import * as React from "react"
import { Copy, Download, Eraser, Gauge, Play, TestTube2 } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { buildCubicBezierCss, formatCubicBezier } from "@/core/utils/css-generator-utils"

const DEFAULT_CURVE = { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1, duration: 320 }

export function CssCubicBezierGeneratorPage() {
    const { t } = useLang()
    const toolT = t.tools["css_cubic_bezier_generator"] as Record<string, string>

    const [x1, setX1] = React.useState(DEFAULT_CURVE.x1)
    const [y1, setY1] = React.useState(DEFAULT_CURVE.y1)
    const [x2, setX2] = React.useState(DEFAULT_CURVE.x2)
    const [y2, setY2] = React.useState(DEFAULT_CURVE.y2)
    const [duration, setDuration] = React.useState(DEFAULT_CURVE.duration)
    const [run, setRun] = React.useState(false)

    const bezier = React.useMemo(() => formatCubicBezier({ x1, y1, x2, y2 }), [x1, y1, x2, y2])
    const cssOutput = React.useMemo(() => buildCubicBezierCss({ x1, y1, x2, y2 }, duration), [x1, y1, x2, y2, duration])
    const transitionValue = React.useMemo(() => `transform ${Math.max(60, Math.round(duration))}ms ${bezier}`, [duration, bezier])

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
        const blob = new Blob([`.animated {\n  ${cssOutput}\n}\n`], { type: "text/css;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = "cubic-bezier.css"
        anchor.click()
        URL.revokeObjectURL(url)
    }

    const handleReset = () => {
        setX1(DEFAULT_CURVE.x1)
        setY1(DEFAULT_CURVE.y1)
        setX2(DEFAULT_CURVE.x2)
        setY2(DEFAULT_CURVE.y2)
        setDuration(DEFAULT_CURVE.duration)
        setRun(false)
    }

    const handleSample = () => {
        setX1(0.68)
        setY1(-0.55)
        setX2(0.27)
        setY2(1.55)
        setDuration(420)
        setRun(false)
    }

    const actions: ToolAction[] = [
        { id: "sample", label: t.common.sample, icon: TestTube2, onClick: handleSample },
        { id: "run", label: toolT.run_action, icon: Play, onClick: () => setRun((v) => !v) },
        { id: "reset", label: t.common.reset, icon: Eraser, onClick: handleReset },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: handleCopy },
        { id: "download", label: t.common.download, icon: Download, onClick: handleDownload },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <Gauge className="h-6 w-6 text-primary" />
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
                        <NumberField label="x1" value={x1} onChange={setX1} />
                        <NumberField label="y1" value={y1} onChange={setY1} />
                        <NumberField label="x2" value={x2} onChange={setX2} />
                        <NumberField label="y2" value={y2} onChange={setY2} />
                    </div>

                    <div className="space-y-1.5 rounded-lg border bg-background/60 p-3">
                        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            <span>{toolT.duration_label}</span>
                            <span>{duration}ms</span>
                        </div>
                        <Input
                            type="range"
                            min={100}
                            max={1200}
                            step={10}
                            value={duration}
                            onChange={(event) => setDuration(Number(event.target.value))}
                            className="cursor-pointer"
                        />
                    </div>

                    <div className="overflow-hidden rounded-xl border">
                        <div className="tool-pane-header tool-pane-header-between">
                            <span>{t.common.preview}</span>
                            <span className="text-xs font-normal text-muted-foreground">{bezier}</span>
                        </div>
                        <div className="space-y-5 bg-gradient-to-br from-slate-100/70 to-cyan-100/35 p-6 dark:from-slate-900/30 dark:to-cyan-950/25">
                            <div className="relative h-2 rounded bg-muted">
                                <div
                                    className="absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-primary shadow-lg"
                                    style={{
                                        transform: `translate(${run ? "260px" : "0px"}, -50%)`,
                                        transition: transitionValue,
                                    }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {toolT.preview_hint_prefix} <code className="font-mono">{toolT.run_action}</code> {toolT.preview_hint_suffix}
                            </p>
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
        </div>
    )
}

function NumberField({
    label,
    value,
    onChange,
}: {
    label: string
    value: number
    onChange: (value: number) => void
}) {
    return (
        <label className="space-y-1.5 rounded-lg border bg-background/60 p-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
            <Input
                type="number"
                step={0.01}
                min={-1}
                max={2}
                value={value}
                onChange={(event) => {
                    const next = Number(event.target.value)
                    if (Number.isNaN(next)) return
                    onChange(next)
                }}
            />
        </label>
    )
}
