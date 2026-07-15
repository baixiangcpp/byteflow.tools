"use client"

import * as React from "react"
import { Copy, Download, Eraser, Sparkles, TestTube2 } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { buildTextGlitchCss } from "@/core/utils/css-generator-utils"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { ToolPageContainer } from "@/components/layout/page-container"

const DEFAULT_STATE = {
    text: "BYTEFLOW",
    textColor: "#e2e8f0",
    accentA: "#22d3ee",
    accentB: "#f43f5e",
    intensity: 14,
    duration: 1200,
    skew: 7,
}

export function CssTextGlitchEffectGeneratorPage() {
    const { t } = useLang()
    const toolT = t.tools["css_text_glitch_effect_generator"] as Record<string, string>

    const [text, setText] = React.useState(DEFAULT_STATE.text)
    const [textColor, setTextColor] = React.useState(DEFAULT_STATE.textColor)
    const [accentA, setAccentA] = React.useState(DEFAULT_STATE.accentA)
    const [accentB, setAccentB] = React.useState(DEFAULT_STATE.accentB)
    const [intensity, setIntensity] = React.useState(DEFAULT_STATE.intensity)
    const [duration, setDuration] = React.useState(DEFAULT_STATE.duration)
    const [skew, setSkew] = React.useState(DEFAULT_STATE.skew)

    const cssOutput = React.useMemo(
        () =>
            buildTextGlitchCss({
                textColor,
                accentA,
                accentB,
                intensity,
                duration,
                skew,
            }),
        [textColor, accentA, accentB, intensity, duration, skew],
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
        anchor.download = "text-glitch.css"
        anchor.click()
        URL.revokeObjectURL(url)
    }

    const handleReset = () => {
        setText(DEFAULT_STATE.text)
        setTextColor(DEFAULT_STATE.textColor)
        setAccentA(DEFAULT_STATE.accentA)
        setAccentB(DEFAULT_STATE.accentB)
        setIntensity(DEFAULT_STATE.intensity)
        setDuration(DEFAULT_STATE.duration)
        setSkew(DEFAULT_STATE.skew)
    }

    const handleSample = () => {
        setText(toolT.sample_text)
        setTextColor("#f8fafc")
        setAccentA("#67e8f9")
        setAccentB("#fb7185")
        setIntensity(20)
        setDuration(980)
        setSkew(11)
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
                        <Sparkles className="h-6 w-6 text-primary" />
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
                    <label className="space-y-1.5 rounded-lg border bg-background/60 p-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.preview_text_label}</span>
                        <Input value={text} onChange={(event) => setText(event.target.value)} className="font-semibold" spellCheck={false} />
                    </label>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <ColorField label={toolT.text_color_label} value={textColor} onChange={setTextColor} />
                        <ColorField label={toolT.accent_a_label} value={accentA} onChange={setAccentA} />
                        <ColorField label={toolT.accent_b_label} value={accentB} onChange={setAccentB} />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <RangeField label={toolT.intensity_label} value={intensity} min={0} max={28} step={1} suffix="" onChange={setIntensity} />
                        <RangeField label={toolT.duration_label} value={duration} min={300} max={2400} step={20} suffix="ms" onChange={setDuration} />
                        <RangeField label={toolT.skew_label} value={skew} min={0} max={20} step={1} suffix="deg" onChange={setSkew} />
                    </div>

                    <div className="overflow-hidden rounded-xl border">
                        <div className="tool-pane-header tool-pane-header-between">
                            <span>{t.common.preview}</span>
                            <span className="text-xs font-normal text-muted-foreground">{toolT.preview_badge}</span>
                        </div>
                        <div className="grid min-h-[260px] place-items-center overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.22),transparent_46%),radial-gradient(circle_at_88%_16%,rgba(244,63,94,0.18),transparent_44%),linear-gradient(160deg,#020617,#0f172a_56%,#111827)] p-8">
                            <span
                                data-text={text || toolT.fallback_text}
                                className="relative inline-block text-4xl font-black uppercase tracking-[0.12em] sm:text-5xl"
                                style={{
                                    color: textColor,
                                    textShadow: `${Math.max(1, Math.round(intensity * 0.12))}px 0 ${accentA}, -${Math.max(1, Math.round(intensity * 0.12))}px 0 ${accentB}`,
                                    animation: `bf-live-glitch-skew ${duration}ms infinite steps(2, end)`,
                                }}
                            >
                                {text || toolT.fallback_text}
                                <span
                                    aria-hidden
                                    className="pointer-events-none absolute inset-0"
                                    style={{
                                        color: accentA,
                                        clipPath: "inset(0 0 52% 0)",
                                        transform: `translate(${Math.max(1, Math.round(intensity * 0.2))}px, 0)`,
                                        animation: `bf-live-glitch-a ${duration}ms infinite linear`,
                                    }}
                                >
                                    {text || toolT.fallback_text}
                                </span>
                                <span
                                    aria-hidden
                                    className="pointer-events-none absolute inset-0"
                                    style={{
                                        color: accentB,
                                        clipPath: "inset(48% 0 0 0)",
                                        transform: `translate(-${Math.max(1, Math.round(intensity * 0.2))}px, 0)`,
                                        animation: `bf-live-glitch-b ${duration}ms infinite linear`,
                                    }}
                                >
                                    {text || toolT.fallback_text}
                                </span>
                            </span>
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
                @keyframes bf-live-glitch-a {
                    0%,
                    100% {
                        transform: translate(0, 0) skew(${Math.max(1, Math.round(skew * 0.6))}deg);
                        opacity: 0.78;
                    }
                    20% {
                        transform: translate(${Math.max(1, Math.round(intensity * 0.36))}px, -1px) skew(-${Math.max(1, Math.round(skew * 0.7))}deg);
                    }
                    40% {
                        transform: translate(-${Math.max(1, Math.round(intensity * 0.34))}px, 1px) skew(${Math.max(1, Math.round(skew * 0.8))}deg);
                    }
                    60% {
                        transform: translate(1px, 0) skew(0deg);
                    }
                    80% {
                        transform: translate(-1px, 0) skew(0deg);
                    }
                }
                @keyframes bf-live-glitch-b {
                    0%,
                    100% {
                        transform: translate(0, 0) skew(-${Math.max(1, Math.round(skew * 0.7))}deg);
                        opacity: 0.75;
                    }
                    25% {
                        transform: translate(-${Math.max(1, Math.round(intensity * 0.38))}px, 1px);
                    }
                    50% {
                        transform: translate(${Math.max(1, Math.round(intensity * 0.3))}px, -1px);
                    }
                    75% {
                        transform: translate(-1px, 0);
                    }
                }
                @keyframes bf-live-glitch-skew {
                    0%,
                    100% {
                        transform: skew(0deg);
                    }
                    35% {
                        transform: skew(${Math.max(1, Math.round(skew * 0.6))}deg);
                    }
                    70% {
                        transform: skew(-${Math.max(1, Math.round(skew * 0.6))}deg);
                    }
                }
            `}</style>
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
