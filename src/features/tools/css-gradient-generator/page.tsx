"use client"

import * as React from "react"
import { Blend, Copy, Download, Eraser, TestTube2 } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { buildGradientCss, buildGradientValue, type GradientType } from "@/core/utils/css-generator-utils"

const DEFAULT_STATE = {
    type: "linear" as GradientType,
    angle: 125,
    colorA: "#22d3ee",
    posA: 0,
    colorB: "#3b82f6",
    posB: 52,
    colorC: "#0f172a",
    posC: 100,
}

export function CssGradientGeneratorPage() {
    const { t } = useLang()
    const toolT = t.tools["css_gradient_generator"] as Record<string, string>

    const [type, setType] = React.useState<GradientType>(DEFAULT_STATE.type)
    const [angle, setAngle] = React.useState(DEFAULT_STATE.angle)
    const [colorA, setColorA] = React.useState(DEFAULT_STATE.colorA)
    const [posA, setPosA] = React.useState(DEFAULT_STATE.posA)
    const [colorB, setColorB] = React.useState(DEFAULT_STATE.colorB)
    const [posB, setPosB] = React.useState(DEFAULT_STATE.posB)
    const [colorC, setColorC] = React.useState(DEFAULT_STATE.colorC)
    const [posC, setPosC] = React.useState(DEFAULT_STATE.posC)

    const gradientConfig = React.useMemo(
        () => ({
            type,
            angle,
            stops: [
                { color: colorA, position: posA },
                { color: colorB, position: posB },
                { color: colorC, position: posC },
            ],
        }),
        [type, angle, colorA, posA, colorB, posB, colorC, posC],
    )

    const gradientValue = React.useMemo(() => buildGradientValue(gradientConfig), [gradientConfig])
    const cssOutput = React.useMemo(() => buildGradientCss(gradientConfig), [gradientConfig])

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
        const blob = new Blob([`.gradient-bg {\n  ${cssOutput}\n}\n`], { type: "text/css;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = "gradient.css"
        anchor.click()
        URL.revokeObjectURL(url)
    }

    const handleReset = () => {
        setType(DEFAULT_STATE.type)
        setAngle(DEFAULT_STATE.angle)
        setColorA(DEFAULT_STATE.colorA)
        setPosA(DEFAULT_STATE.posA)
        setColorB(DEFAULT_STATE.colorB)
        setPosB(DEFAULT_STATE.posB)
        setColorC(DEFAULT_STATE.colorC)
        setPosC(DEFAULT_STATE.posC)
    }

    const handleSample = () => {
        setType("radial")
        setAngle(120)
        setColorA("#67e8f9")
        setPosA(0)
        setColorB("#8b5cf6")
        setPosB(54)
        setColorC("#0f172a")
        setPosC(100)
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
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setType("linear")}
                            className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${type === "linear" ? "border-primary/40 bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            {toolT.linear_label}
                        </button>
                        <button
                            type="button"
                            onClick={() => setType("radial")}
                            className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${type === "radial" ? "border-primary/40 bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            {toolT.radial_label}
                        </button>
                    </div>

                    {type === "linear" && (
                        <div className="space-y-1.5 rounded-lg border bg-background/60 p-3">
                            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                <span>{toolT.angle_label}</span>
                                <span>{angle}deg</span>
                            </div>
                            <Input
                                type="range"
                                min={0}
                                max={360}
                                step={1}
                                value={angle}
                                onChange={(event) => setAngle(Number(event.target.value))}
                                className="cursor-pointer"
                            />
                        </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-3">
                        <StopField label={toolT.stop_1_label} positionLabel={toolT.position_label} color={colorA} position={posA} onColorChange={setColorA} onPositionChange={setPosA} />
                        <StopField label={toolT.stop_2_label} positionLabel={toolT.position_label} color={colorB} position={posB} onColorChange={setColorB} onPositionChange={setPosB} />
                        <StopField label={toolT.stop_3_label} positionLabel={toolT.position_label} color={colorC} position={posC} onColorChange={setColorC} onPositionChange={setPosC} />
                    </div>

                    <div className="overflow-hidden rounded-xl border">
                        <div className="tool-pane-header tool-pane-header-between">
                            <span>{t.common.preview}</span>
                            <span className="max-w-[62%] truncate text-xs font-normal text-muted-foreground">{gradientValue}</span>
                        </div>
                        <div className="grid min-h-[260px] place-items-center p-8" style={{ background: gradientValue }}>
                            <div className="rounded-xl border border-white/35 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/90">
                                {type === "linear" ? toolT.preview_badge_linear : toolT.preview_badge_radial}
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

function StopField({
    label,
    positionLabel,
    color,
    position,
    onColorChange,
    onPositionChange,
}: {
    label: string
    positionLabel: string
    color: string
    position: number
    onColorChange: (value: string) => void
    onPositionChange: (value: number) => void
}) {
    return (
        <div className="space-y-2 rounded-lg border bg-background/60 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
            <Input type="color" value={color} onChange={(event) => onColorChange(event.target.value)} className="h-10 cursor-pointer p-1" />
            <Input value={color} onChange={(event) => onColorChange(event.target.value)} className="font-mono text-xs" spellCheck={false} />
            <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{positionLabel}</span>
                    <span>{position}%</span>
                </div>
                <Input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={position}
                    onChange={(event) => onPositionChange(Number(event.target.value))}
                    className="cursor-pointer"
                />
            </div>
        </div>
    )
}
