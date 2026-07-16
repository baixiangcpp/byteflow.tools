"use client"

import * as React from "react"
import { Copy, Download, Eraser, Layers, Plus, TestTube2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { buildBoxShadowCss, type BoxShadowLayer } from "@/core/utils/css-generator-utils"
import { ToolPageContainer } from "@/components/layout/page-container"

const DEFAULT_LAYERS: BoxShadowLayer[] = [
    { x: 0, y: 18, blur: 42, spread: -18, alpha: 0.32, color: "#0f172a", inset: false },
    { x: 0, y: 4, blur: 10, spread: -4, alpha: 0.16, color: "#22d3ee", inset: false },
]

export function CssBoxShadowGeneratorPage() {
    const { t } = useLang()
    const toolT = t.tools["css_box_shadow_generator"] as Record<string, string>
    const [layers, setLayers] = React.useState<BoxShadowLayer[]>(DEFAULT_LAYERS)

    const shadowCss = React.useMemo(() => buildBoxShadowCss(layers), [layers])
    const shadowValue = React.useMemo(
        () => shadowCss.replace(/^box-shadow:\s*/i, "").replace(/;$/, ""),
        [shadowCss],
    )

    const patchLayer = (index: number, patch: Partial<BoxShadowLayer>) => {
        setLayers((prev) => prev.map((layer, i) => (i === index ? { ...layer, ...patch } : layer)))
    }

    const addLayer = () => {
        setLayers((prev) => [
            ...prev,
            { x: 0, y: 8, blur: 18, spread: -8, alpha: 0.2, color: "#0f172a", inset: false },
        ])
    }

    const removeLayer = (index: number) => {
        setLayers((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
    }

    const handleCopy = async () => {
        const result = await safeClipboardWrite(shadowCss)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, {
            description: t.common.copied_desc,
        })
    }

    const handleDownload = () => {
        const content = `.shadow-card {\n  ${shadowCss}\n}\n`
        const blob = new Blob([content], { type: "text/css;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = "box-shadow.css"
        anchor.click()
        URL.revokeObjectURL(url)
    }

    const handleSample = () => {
        setLayers([
            { x: 0, y: 28, blur: 50, spread: -24, alpha: 0.42, color: "#0f172a", inset: false },
            { x: 0, y: 1, blur: 1, spread: 0, alpha: 0.35, color: "#67e8f9", inset: true },
        ])
    }

    const handleReset = () => setLayers(DEFAULT_LAYERS)

    const actions: ToolAction[] = [
        {
            id: "sample",
            label: t.common.sample,
            icon: TestTube2,
            onClick: handleSample,
        },
        {
            id: "reset",
            label: t.common.reset,
            icon: Eraser,
            onClick: handleReset,
        },
        {
            id: "copy",
            label: t.common.copy,
            icon: Copy,
            onClick: handleCopy,
        },
        {
            id: "download",
            label: t.common.download,
            icon: Download,
            onClick: handleDownload,
        },
    ]

    return (
        <ToolPageContainer className="flex h-full flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <Layers className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {toolT.description}
                    </p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-4 rounded-xl border bg-card p-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{toolT.shadow_layers}</h2>
                        <Button variant="outline" size="sm" onClick={addLayer}>
                            <Plus className="mr-1 h-3.5 w-3.5" />
                            {toolT.add_layer}
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {layers.map((layer, index) => (
                            <div key={`${index}-${layer.color}`} className="rounded-lg border bg-background/60 p-3">
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.layer_label} {index + 1}</span>
                                    <div className="flex items-center gap-2">
                                        <label className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                            <input
                                                type="checkbox"
                                                checked={Boolean(layer.inset)}
                                                onChange={(event) => patchLayer(index, { inset: event.target.checked })}
                                            />
                                            {toolT.inset_label}
                                        </label>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            disabled={layers.length <= 1}
                                            onClick={() => removeLayer(index)}
                                            aria-label={`${toolT.remove_layer} ${index + 1}`}
                                            title={`${toolT.remove_layer} ${index + 1}`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">{`${toolT.remove_layer} ${index + 1}`}</span>
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    <NumberField label={toolT.x_offset_label} value={layer.x} min={-120} max={120} onChange={(value) => patchLayer(index, { x: value })} />
                                    <NumberField label={toolT.y_offset_label} value={layer.y} min={-120} max={120} onChange={(value) => patchLayer(index, { y: value })} />
                                    <NumberField label={toolT.blur_label} value={layer.blur} min={0} max={140} onChange={(value) => patchLayer(index, { blur: value })} />
                                    <NumberField label={toolT.spread_label} value={layer.spread} min={-80} max={80} onChange={(value) => patchLayer(index, { spread: value })} />
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.color_label}</label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="color"
                                                value={layer.color}
                                                onChange={(event) => patchLayer(index, { color: event.target.value })}
                                                className="h-10 w-14 cursor-pointer p-1"
                                            />
                                            <Input
                                                value={layer.color}
                                                onChange={(event) => patchLayer(index, { color: event.target.value })}
                                                className="font-mono text-xs"
                                                spellCheck={false}
                                            />
                                        </div>
                                    </div>
                                    <NumberField
                                        label={toolT.opacity_label}
                                        value={Number(layer.alpha.toFixed(2))}
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        onChange={(value) => patchLayer(index, { alpha: Math.max(0, Math.min(1, value)) })}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="overflow-hidden rounded-xl border">
                        <div className="tool-pane-header tool-pane-header-between">
                            <span>{t.common.preview}</span>
                            <span className="text-xs font-normal text-muted-foreground">{toolT.live_label}</span>
                        </div>
                        <div className="grid min-h-[260px] place-items-center bg-gradient-to-br from-slate-100/70 to-cyan-100/40 p-10 dark:from-slate-900/40 dark:to-cyan-950/30">
                            <div
                                className="h-44 w-72 border border-border/70 bg-card/95"
                                style={{ boxShadow: shadowValue }}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.output}</span>
                        <span className="text-xs font-normal text-muted-foreground">{toolT.output_format_label}</span>
                    </div>
                    <div className="flex-1 p-0">
                        <Textarea
                            readOnly
                            value={shadowCss}
                            className="h-full min-h-[360px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>
        </ToolPageContainer>
    )
}

function NumberField({
    label,
    value,
    min,
    max,
    step = 1,
    onChange,
}: {
    label: string
    value: number
    min: number
    max: number
    step?: number
    onChange: (value: number) => void
}) {
    return (
        <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
            <Input
                type="number"
                value={value}
                min={min}
                max={max}
                step={step}
                onChange={(event) => {
                    const next = Number(event.target.value)
                    if (Number.isNaN(next)) return
                    onChange(next)
                }}
            />
        </label>
    )
}
