"use client"

import * as React from "react"
import { Copy, Download, Eraser, TestTube2, ToggleRight } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { buildSwitchCss, colorWithAlpha } from "@/core/utils/css-generator-utils"
import { ToolPageContainer } from "@/components/layout/page-container"

const DEFAULT_STATE = {
    width: 56,
    height: 32,
    padding: 3,
    thumbSize: 26,
    radius: 999,
    duration: 220,
    onColor: "#06b6d4",
    offColor: "#334155",
    thumbColor: "#ffffff",
}

export function CssSwitchGeneratorPage() {
    const { t } = useLang()
    const toolT = t.tools["css_switch_generator"] as Record<string, string>

    const [width, setWidth] = React.useState(DEFAULT_STATE.width)
    const [height, setHeight] = React.useState(DEFAULT_STATE.height)
    const [padding, setPadding] = React.useState(DEFAULT_STATE.padding)
    const [thumbSize, setThumbSize] = React.useState(DEFAULT_STATE.thumbSize)
    const [radius, setRadius] = React.useState(DEFAULT_STATE.radius)
    const [duration, setDuration] = React.useState(DEFAULT_STATE.duration)
    const [onColor, setOnColor] = React.useState(DEFAULT_STATE.onColor)
    const [offColor, setOffColor] = React.useState(DEFAULT_STATE.offColor)
    const [thumbColor, setThumbColor] = React.useState(DEFAULT_STATE.thumbColor)
    const [isOn, setIsOn] = React.useState(true)

    const cssOutput = React.useMemo(
        () =>
            buildSwitchCss({
                width,
                height,
                padding,
                thumbSize,
                radius,
                duration,
                onColor,
                offColor,
                thumbColor,
            }),
        [width, height, padding, thumbSize, radius, duration, onColor, offColor, thumbColor],
    )

    const translate = Math.max(0, width - thumbSize - padding * 2)

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
        anchor.download = "switch.css"
        anchor.click()
        URL.revokeObjectURL(url)
    }

    const handleReset = () => {
        setWidth(DEFAULT_STATE.width)
        setHeight(DEFAULT_STATE.height)
        setPadding(DEFAULT_STATE.padding)
        setThumbSize(DEFAULT_STATE.thumbSize)
        setRadius(DEFAULT_STATE.radius)
        setDuration(DEFAULT_STATE.duration)
        setOnColor(DEFAULT_STATE.onColor)
        setOffColor(DEFAULT_STATE.offColor)
        setThumbColor(DEFAULT_STATE.thumbColor)
        setIsOn(true)
    }

    const handleSample = () => {
        setWidth(72)
        setHeight(38)
        setPadding(4)
        setThumbSize(30)
        setRadius(999)
        setDuration(180)
        setOnColor("#22d3ee")
        setOffColor("#1f2937")
        setThumbColor("#f8fafc")
        setIsOn(true)
    }

    const actions: ToolAction[] = [
        { id: "sample", label: t.common.sample, icon: TestTube2, onClick: handleSample },
        { id: "reset", label: t.common.reset, icon: Eraser, onClick: handleReset },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: handleCopy },
        { id: "download", label: t.common.download, icon: Download, onClick: handleDownload },
    ]

    return (
        <ToolPageContainer className="flex h-full flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <ToggleRight className="h-6 w-6 text-primary" />
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
                        <RangeField label={t.common.width} value={width} min={36} max={120} step={1} suffix="px" onChange={setWidth} />
                        <RangeField label={t.common.height} value={height} min={20} max={64} step={1} suffix="px" onChange={setHeight} />
                        <RangeField label={toolT.padding_label} value={padding} min={1} max={8} step={1} suffix="px" onChange={setPadding} />
                        <RangeField label={toolT.thumb_size_label} value={thumbSize} min={10} max={56} step={1} suffix="px" onChange={setThumbSize} />
                        <RangeField label={toolT.radius_label} value={radius} min={0} max={999} step={1} suffix="px" onChange={setRadius} />
                        <RangeField label={toolT.duration_label} value={duration} min={80} max={500} step={10} suffix="ms" onChange={setDuration} />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <ColorField label={toolT.on_color_label} value={onColor} onChange={setOnColor} />
                        <ColorField label={toolT.off_color_label} value={offColor} onChange={setOffColor} />
                        <ColorField label={toolT.thumb_color_label} value={thumbColor} onChange={setThumbColor} />
                    </div>

                    <div className="overflow-hidden rounded-xl border">
                        <div className="tool-pane-header tool-pane-header-between">
                            <span>{t.common.preview}</span>
                            <Button variant="outline" size="sm" onClick={() => setIsOn((v) => !v)}>
                                {toolT.toggle_action}
                            </Button>
                        </div>
                        <div className="grid min-h-[240px] place-items-center bg-gradient-to-br from-cyan-500/10 to-slate-700/15 p-8">
                            <button
                                type="button"
                                aria-pressed={isOn}
                                onClick={() => setIsOn((v) => !v)}
                                className="relative inline-flex items-center"
                                style={{
                                    width: `${width}px`,
                                    height: `${height}px`,
                                    padding: `${padding}px`,
                                    borderRadius: `${radius}px`,
                                    background: isOn ? onColor : offColor,
                                    transition: `background ${duration}ms ease`,
                                    boxShadow: `0 10px 30px -18px ${colorWithAlpha("#0f172a", 0.5)}`,
                                }}
                            >
                                <span
                                    className="block rounded-full"
                                    style={{
                                        width: `${thumbSize}px`,
                                        height: `${thumbSize}px`,
                                        background: thumbColor,
                                        transform: `translateX(${isOn ? translate : 0}px)`,
                                        transition: `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                                        boxShadow: `0 2px 10px ${colorWithAlpha("#0f172a", 0.3)}`,
                                    }}
                                />
                            </button>
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
