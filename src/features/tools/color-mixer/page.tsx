"use client"

import * as React from "react"
import { ArrowLeftRight, Blend, Copy, Download, Eraser, TestTube2 } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { mixColorsHsl, mixColorsRgb } from "@/core/utils/color-generator-utils"

const DEFAULT_STATE = {
    colorA: "#22d3ee",
    colorB: "#8b5cf6",
    ratio: 0.5,
    mode: "rgb" as "rgb" | "hsl",
}

export function ColorMixerPage() {
    const { t } = useLang()
    const toolT = t.tools["color_mixer"] as Record<string, string>

    const [colorA, setColorA] = React.useState(DEFAULT_STATE.colorA)
    const [colorB, setColorB] = React.useState(DEFAULT_STATE.colorB)
    const [ratio, setRatio] = React.useState(DEFAULT_STATE.ratio)
    const [mode, setMode] = React.useState<"rgb" | "hsl">(DEFAULT_STATE.mode)

    const mixed = React.useMemo(
        () => (mode === "hsl" ? mixColorsHsl(colorA, colorB, ratio) : mixColorsRgb(colorA, colorB, ratio)),
        [colorA, colorB, mode, ratio],
    )

    const percent = Math.round(ratio * 100)
    const cssOutput = React.useMemo(
        () => [
            `/* ${mode.toUpperCase()} mix at ${percent}% */`,
            `--color-a: ${colorA.toUpperCase()};`,
            `--color-b: ${colorB.toUpperCase()};`,
            `--mixed-color: ${mixed};`,
            `background: linear-gradient(90deg, ${colorA.toUpperCase()} 0%, ${mixed} 50%, ${colorB.toUpperCase()} 100%);`,
        ].join("\n"),
        [colorA, colorB, mixed, mode, percent],
    )

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
        const blob = new Blob([cssOutput], { type: "text/css;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = "color-mix.css"
        anchor.click()
        URL.revokeObjectURL(url)
    }

    const handleReset = () => {
        setColorA(DEFAULT_STATE.colorA)
        setColorB(DEFAULT_STATE.colorB)
        setRatio(DEFAULT_STATE.ratio)
        setMode(DEFAULT_STATE.mode)
    }

    const handleSample = () => {
        setColorA("#fb7185")
        setColorB("#22d3ee")
        setRatio(0.36)
        setMode("hsl")
    }

    const handleSwap = () => {
        setColorA(colorB)
        setColorB(colorA)
    }

    const actions: ToolAction[] = [
        { id: "sample", label: t.common.sample, icon: TestTube2, onClick: handleSample },
        { id: "reset", label: t.common.reset, icon: Eraser, onClick: handleReset },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: handleCopy },
        { id: "download", label: t.common.download, icon: Download, onClick: handleDownload },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <Blend className="h-6 w-6 text-primary" />
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
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
                        <ColorField label={toolT.color_a_label} value={colorA} onChange={setColorA} />
                        <button
                            type="button"
                            onClick={handleSwap}
                            className="inline-flex h-10 items-center justify-center rounded-md border px-3 text-sm text-muted-foreground hover:text-foreground"
                            aria-label={toolT.swap_colors}
                        >
                            <ArrowLeftRight className="h-4 w-4" />
                        </button>
                        <ColorField label={toolT.color_b_label} value={colorB} onChange={setColorB} />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5 rounded-lg border bg-background/60 p-3">
                            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                <span>{toolT.ratio_label}</span>
                                <span>{percent}%</span>
                            </div>
                            <Input
                                type="range"
                                min={0}
                                max={1}
                                step={0.01}
                                value={ratio}
                                onChange={(event) => setRatio(Number(event.target.value))}
                                className="cursor-pointer"
                            />
                        </div>

                        <div className="space-y-1.5 rounded-lg border bg-background/60 p-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.mix_space_label}</div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setMode("rgb")}
                                    className={`rounded-md border px-3 py-1.5 text-sm ${mode === "rgb" ? "border-primary/40 bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                    {toolT.mode_rgb}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode("hsl")}
                                    className={`rounded-md border px-3 py-1.5 text-sm ${mode === "hsl" ? "border-primary/40 bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                    {toolT.mode_hsl}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border">
                        <div className="tool-pane-header tool-pane-header-between">
                            <span>{t.common.preview}</span>
                            <span className="text-xs font-normal text-muted-foreground">{mixed}</span>
                        </div>
                        <div className="space-y-4 p-5">
                            <div className="relative h-12 overflow-hidden rounded-lg border" style={{ background: `linear-gradient(90deg, ${colorA} 0%, ${mixed} 50%, ${colorB} 100%)` }}>
                                <span className="absolute -top-1 h-14 w-[2px] bg-white/90" style={{ left: `${percent}%` }} />
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                                <div className="rounded border p-2">{toolT.color_a_short}: {colorA.toUpperCase()}</div>
                                <div className="rounded border p-2">{toolT.mix_short}: {mixed}</div>
                                <div className="rounded border p-2">{toolT.color_b_short}: {colorB.toUpperCase()}</div>
                            </div>
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
