"use client"

import * as React from "react"
import { Activity, Copy, Download, Eraser, TestTube2 } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { buildLoaderCss, colorWithAlpha, type LoaderPreset } from "@/core/utils/css-generator-utils"

const DEFAULT_STATE = {
    preset: "spinner" as LoaderPreset,
    size: 46,
    color: "#22d3ee",
    duration: 900,
    thickness: 4,
}

export function CssLoaderGeneratorPage() {
    const { t } = useLang()
    const toolT = t.tools["css_loader_generator"] as Record<string, string>

    const [preset, setPreset] = React.useState<LoaderPreset>(DEFAULT_STATE.preset)
    const [size, setSize] = React.useState(DEFAULT_STATE.size)
    const [color, setColor] = React.useState(DEFAULT_STATE.color)
    const [duration, setDuration] = React.useState(DEFAULT_STATE.duration)
    const [thickness, setThickness] = React.useState(DEFAULT_STATE.thickness)

    const presetLabels: Record<LoaderPreset, string> = {
        spinner: toolT.preset_spinner,
        dots: toolT.preset_dots,
        bars: toolT.preset_bars,
    }

    const cssOutput = React.useMemo(() => buildLoaderCss({ preset, size, color, duration, thickness }), [preset, size, color, duration, thickness])

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
        anchor.download = "loader.css"
        anchor.click()
        URL.revokeObjectURL(url)
    }

    const handleReset = () => {
        setPreset(DEFAULT_STATE.preset)
        setSize(DEFAULT_STATE.size)
        setColor(DEFAULT_STATE.color)
        setDuration(DEFAULT_STATE.duration)
        setThickness(DEFAULT_STATE.thickness)
    }

    const handleSample = () => {
        setPreset("bars")
        setSize(56)
        setColor("#38bdf8")
        setDuration(760)
        setThickness(5)
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
                        <Activity className="h-6 w-6 text-primary" />
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
                        {(["spinner", "dots", "bars"] as LoaderPreset[]).map((item) => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => setPreset(item)}
                                className={`rounded-md border px-3 py-1.5 text-sm capitalize transition-colors ${preset === item ? "border-primary/40 bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                {presetLabels[item]}
                            </button>
                        ))}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <RangeField label={toolT.size_label} value={size} min={20} max={90} step={1} suffix="px" onChange={setSize} />
                        <RangeField label={toolT.duration_label} value={duration} min={250} max={1600} step={10} suffix="ms" onChange={setDuration} />
                        <RangeField label={toolT.thickness_label} value={thickness} min={2} max={10} step={1} suffix="px" onChange={setThickness} />
                        <ColorField label={toolT.color_label} value={color} onChange={setColor} />
                    </div>

                    <div className="overflow-hidden rounded-xl border">
                        <div className="tool-pane-header tool-pane-header-between">
                            <span>{t.common.preview}</span>
                            <span className="text-xs font-normal text-muted-foreground">{presetLabels[preset]}</span>
                        </div>
                        <div className="grid min-h-[260px] place-items-center bg-gradient-to-br from-cyan-500/8 to-blue-500/8 p-8">
                            <LoaderPreview preset={preset} size={size} color={color} duration={duration} thickness={thickness} />
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

            <style jsx global>{`
                @keyframes bf-preview-spin {
                    to {
                        transform: rotate(360deg);
                    }
                }
                @keyframes bf-preview-dots {
                    0%,
                    80%,
                    100% {
                        transform: scale(0.6);
                        opacity: 0.35;
                    }
                    40% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                @keyframes bf-preview-bars {
                    0%,
                    100% {
                        transform: scaleY(0.35);
                        opacity: 0.35;
                    }
                    50% {
                        transform: scaleY(1);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    )
}

function LoaderPreview({
    preset,
    size,
    color,
    duration,
    thickness,
}: {
    preset: LoaderPreset
    size: number
    color: string
    duration: number
    thickness: number
}) {
    if (preset === "dots") {
        const dot = Math.max(4, Math.round(size * 0.2))
        const gap = Math.max(4, Math.round(size * 0.12))
        return (
            <div className="inline-flex items-center" style={{ gap: `${gap}px` }}>
                {[0, 1, 2].map((index) => (
                    <span
                        key={index}
                        style={{
                            width: `${dot}px`,
                            height: `${dot}px`,
                            borderRadius: "999px",
                            background: color,
                            animation: `bf-preview-dots ${duration}ms ease-in-out infinite`,
                            animationDelay: `${Math.round(duration * index * 0.15)}ms`,
                        }}
                    />
                ))}
            </div>
        )
    }

    if (preset === "bars") {
        const barWidth = Math.max(3, Math.round(size * 0.12))
        const barHeight = Math.max(20, Math.round(size * 0.9))
        const gap = Math.max(3, Math.round(size * 0.09))
        return (
            <div className="inline-flex items-end" style={{ gap: `${gap}px` }}>
                {[0, 1, 2, 3, 4].map((index) => (
                    <span
                        key={index}
                        style={{
                            width: `${barWidth}px`,
                            height: `${barHeight}px`,
                            borderRadius: "999px",
                            background: color,
                            transformOrigin: "center bottom",
                            animation: `bf-preview-bars ${duration}ms ease-in-out infinite`,
                            animationDelay: `${Math.round(duration * index * 0.12)}ms`,
                        }}
                    />
                ))}
            </div>
        )
    }

    return (
        <div
            style={{
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: "999px",
                border: `${thickness}px solid ${colorWithAlpha(color, 0.24)}`,
                borderTopColor: color,
                animation: `bf-preview-spin ${duration}ms linear infinite`,
            }}
        />
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
