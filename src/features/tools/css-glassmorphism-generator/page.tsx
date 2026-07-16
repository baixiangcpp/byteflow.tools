"use client"

import * as React from "react"
import { Copy, Download, Droplets, Eraser, TestTube2 } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { buildGlassmorphismCss, colorWithAlpha } from "@/core/utils/css-generator-utils"
import { ToolPageContainer } from "@/components/layout/page-container"

const DEFAULT_STATE = {
    blur: 18,
    opacity: 0.24,
    borderAlpha: 0.48,
    shadowAlpha: 0.3,
    radius: 20,
    saturation: 145,
    tintColor: "#93c5fd",
    borderColor: "#dbeafe",
}

export function CssGlassmorphismGeneratorPage() {
    const { t } = useLang()
    const toolT = t.tools["css_glassmorphism_generator"] as Record<string, string>

    const [blur, setBlur] = React.useState(DEFAULT_STATE.blur)
    const [opacity, setOpacity] = React.useState(DEFAULT_STATE.opacity)
    const [borderAlpha, setBorderAlpha] = React.useState(DEFAULT_STATE.borderAlpha)
    const [shadowAlpha, setShadowAlpha] = React.useState(DEFAULT_STATE.shadowAlpha)
    const [radius, setRadius] = React.useState(DEFAULT_STATE.radius)
    const [saturation, setSaturation] = React.useState(DEFAULT_STATE.saturation)
    const [tintColor, setTintColor] = React.useState(DEFAULT_STATE.tintColor)
    const [borderColor, setBorderColor] = React.useState(DEFAULT_STATE.borderColor)

    const cssOutput = React.useMemo(
        () =>
            buildGlassmorphismCss({
                blur,
                opacity,
                borderAlpha,
                shadowAlpha,
                radius,
                saturation,
                tintColor,
                borderColor,
            }),
        [blur, opacity, borderAlpha, shadowAlpha, radius, saturation, tintColor, borderColor],
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
        const blob = new Blob([`.glass-card {\n${cssOutput.split("\n").map((line) => `  ${line}`).join("\n")}\n}\n`], {
            type: "text/css;charset=utf-8",
        })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = "glassmorphism.css"
        anchor.click()
        URL.revokeObjectURL(url)
    }

    const handleReset = () => {
        setBlur(DEFAULT_STATE.blur)
        setOpacity(DEFAULT_STATE.opacity)
        setBorderAlpha(DEFAULT_STATE.borderAlpha)
        setShadowAlpha(DEFAULT_STATE.shadowAlpha)
        setRadius(DEFAULT_STATE.radius)
        setSaturation(DEFAULT_STATE.saturation)
        setTintColor(DEFAULT_STATE.tintColor)
        setBorderColor(DEFAULT_STATE.borderColor)
    }

    const handleSample = () => {
        setBlur(28)
        setOpacity(0.32)
        setBorderAlpha(0.58)
        setShadowAlpha(0.38)
        setRadius(28)
        setSaturation(170)
        setTintColor("#67e8f9")
        setBorderColor("#e0f2fe")
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
                        <Droplets className="h-6 w-6 text-primary" />
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
                        <RangeField label={toolT.blur_label} value={blur} min={0} max={40} step={1} suffix="px" onChange={setBlur} />
                        <RangeField label={toolT.radius_label} value={radius} min={4} max={36} step={1} suffix="px" onChange={setRadius} />
                        <RangeField label={toolT.opacity_label} value={opacity} min={0.08} max={0.65} step={0.01} suffix="" onChange={setOpacity} />
                        <RangeField label={toolT.border_alpha_label} value={borderAlpha} min={0.08} max={0.8} step={0.01} suffix="" onChange={setBorderAlpha} />
                        <RangeField label={toolT.shadow_alpha_label} value={shadowAlpha} min={0.08} max={0.55} step={0.01} suffix="" onChange={setShadowAlpha} />
                        <RangeField label={toolT.saturation_label} value={saturation} min={80} max={210} step={1} suffix="%" onChange={setSaturation} />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <ColorField label={toolT.tint_color_label} value={tintColor} onChange={setTintColor} />
                        <ColorField label={toolT.border_color_label} value={borderColor} onChange={setBorderColor} />
                    </div>

                    <div className="overflow-hidden rounded-xl border">
                        <div className="tool-pane-header tool-pane-header-between">
                            <span>{t.common.preview}</span>
                            <span className="text-xs font-normal text-muted-foreground">{toolT.preview_badge}</span>
                        </div>
                        <div className="grid min-h-[260px] place-items-center bg-[radial-gradient(circle_at_20%_20%,rgba(103,232,249,0.38),transparent_42%),radial-gradient(circle_at_84%_8%,rgba(99,102,241,0.42),transparent_40%),radial-gradient(circle_at_70%_84%,rgba(251,191,36,0.34),transparent_38%),linear-gradient(135deg,#0f172a,#111827_55%,#0b1120)] p-8">
                            <div
                                className="w-full max-w-sm p-5 text-slate-50"
                                style={{
                                    background: colorWithAlpha(tintColor, opacity),
                                    border: `1px solid ${colorWithAlpha(borderColor, borderAlpha)}`,
                                    borderRadius: `${radius}px`,
                                    backdropFilter: `blur(${blur}px) saturate(${saturation}%)`,
                                    WebkitBackdropFilter: `blur(${blur}px) saturate(${saturation}%)`,
                                    boxShadow: `0 18px 45px -26px ${colorWithAlpha("#0f172a", shadowAlpha)}`,
                                }}
                            >
                                <p className="text-sm font-semibold tracking-wide text-slate-100/95">{toolT.sample_card_title}</p>
                                <p className="mt-2 text-sm text-slate-200/90">
                                    {toolT.sample_card_description}
                                </p>
                                <div className="mt-4 flex items-center justify-between text-xs text-slate-100/80">
                                    <span>{toolT.blur_metric.replace("{value}", String(blur))}</span>
                                    <span>{toolT.alpha_metric.replace("{value}", opacity.toFixed(2))}</span>
                                </div>
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
                <span>{value.toFixed(step < 1 ? 2 : 0)}{suffix}</span>
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
