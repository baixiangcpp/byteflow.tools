"use client"

import * as React from "react"
import { Copy, Eraser, Layers, TestTube2 } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"

function clamp(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) return min
    return Math.max(min, Math.min(max, value))
}

export function ReactNativeShadowGeneratorPage() {
    const { t } = useLang()
    const toolT = t.tools["react_native_shadow_generator"] as Record<string, string>

    const [shadowColor, setShadowColor] = React.useState("#0f172a")
    const [offsetX, setOffsetX] = React.useState(0)
    const [offsetY, setOffsetY] = React.useState(10)
    const [opacity, setOpacity] = React.useState(0.2)
    const [radius, setRadius] = React.useState(16)
    const [elevation, setElevation] = React.useState(12)
    const [borderRadius, setBorderRadius] = React.useState(16)
    const [cardColor, setCardColor] = React.useState("#ffffff")
    const [backgroundColor, setBackgroundColor] = React.useState("#e2e8f0")

    const iosSnippet = React.useMemo(
        () =>
            [
                "shadowColor: '" + shadowColor + "',",
                `shadowOffset: { width: ${Math.round(offsetX)}, height: ${Math.round(offsetY)} },`,
                `shadowOpacity: ${clamp(opacity, 0, 1).toFixed(2)},`,
                `shadowRadius: ${clamp(radius, 0, 64).toFixed(1)},`,
            ].join("\n"),
        [offsetX, offsetY, opacity, radius, shadowColor],
    )

    const androidSnippet = React.useMemo(
        () => `elevation: ${Math.round(clamp(elevation, 0, 64))},`,
        [elevation],
    )

    const fullSnippet = React.useMemo(
        () =>
            [
                "const styles = StyleSheet.create({",
                "  card: {",
                `    backgroundColor: '${cardColor}',`,
                `    borderRadius: ${Math.round(clamp(borderRadius, 0, 64))},`,
                `    ${iosSnippet.replaceAll("\n", "\n    ")}`,
                `    ${androidSnippet}`,
                "  },",
                "});",
            ].join("\n"),
        [androidSnippet, borderRadius, cardColor, iosSnippet],
    )

    const cssPreviewShadow = React.useMemo(
        () => `${offsetX}px ${offsetY}px ${radius}px rgba(15, 23, 42, ${clamp(opacity, 0, 1).toFixed(2)})`,
        [offsetX, offsetY, opacity, radius],
    )

    const handleSample = () => {
        setShadowColor("#0f172a")
        setOffsetX(0)
        setOffsetY(10)
        setOpacity(0.2)
        setRadius(16)
        setElevation(12)
        setBorderRadius(16)
        setCardColor("#ffffff")
        setBackgroundColor("#e2e8f0")
    }

    const handleReset = () => {
        setShadowColor("#111827")
        setOffsetX(0)
        setOffsetY(4)
        setOpacity(0.15)
        setRadius(8)
        setElevation(4)
        setBorderRadius(12)
        setCardColor("#ffffff")
        setBackgroundColor("#f1f5f9")
    }

    const handleCopy = async () => {
        const result = await safeClipboardWrite(fullSnippet)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }

    const actions: ToolAction[] = [
        { id: "sample", label: t.common.sample, icon: TestTube2, onClick: handleSample },
        { id: "reset", label: t.common.reset, icon: Eraser, onClick: handleReset },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: handleCopy },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col space-y-6">
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

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-4 rounded-xl border bg-card p-4">
                    <div className="rounded-lg border bg-background/60">
                        <div className="tool-pane-header">{t.common.shadow_controls}</div>
                        <div className="grid gap-3 border-t p-3 sm:grid-cols-2">
                            <label className="space-y-1.5 rounded-md border bg-background/80 p-3">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.shadow_color_label}</span>
                                <div className="flex items-center gap-2">
                                    <Input type="color" value={shadowColor} onChange={(event) => setShadowColor(event.target.value)} className="h-10 w-14 p-1" />
                                    <Input value={shadowColor} onChange={(event) => setShadowColor(event.target.value)} className="font-mono text-xs" spellCheck={false} />
                                </div>
                            </label>
                            <label className="space-y-1.5 rounded-md border bg-background/80 p-3">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.card_color_label}</span>
                                <div className="flex items-center gap-2">
                                    <Input type="color" value={cardColor} onChange={(event) => setCardColor(event.target.value)} className="h-10 w-14 p-1" />
                                    <Input value={cardColor} onChange={(event) => setCardColor(event.target.value)} className="font-mono text-xs" spellCheck={false} />
                                </div>
                            </label>
                            <label className="space-y-1.5 rounded-md border bg-background/80 p-3">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.offset_x_label}</span>
                                <Input type="number" min={-64} max={64} value={offsetX} onChange={(event) => setOffsetX(clamp(Number(event.target.value), -64, 64))} />
                            </label>
                            <label className="space-y-1.5 rounded-md border bg-background/80 p-3">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.offset_y_label}</span>
                                <Input type="number" min={-64} max={64} value={offsetY} onChange={(event) => setOffsetY(clamp(Number(event.target.value), -64, 64))} />
                            </label>
                            <label className="space-y-1.5 rounded-md border bg-background/80 p-3">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.opacity_label}</span>
                                <Input type="number" step={0.01} min={0} max={1} value={opacity} onChange={(event) => setOpacity(clamp(Number(event.target.value), 0, 1))} />
                            </label>
                            <label className="space-y-1.5 rounded-md border bg-background/80 p-3">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.radius_label}</span>
                                <Input type="number" min={0} max={64} value={radius} onChange={(event) => setRadius(clamp(Number(event.target.value), 0, 64))} />
                            </label>
                            <label className="space-y-1.5 rounded-md border bg-background/80 p-3">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.elevation_label}</span>
                                <Input type="number" min={0} max={64} value={elevation} onChange={(event) => setElevation(clamp(Number(event.target.value), 0, 64))} />
                            </label>
                            <label className="space-y-1.5 rounded-md border bg-background/80 p-3">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.border_radius_label}</span>
                                <Input type="number" min={0} max={64} value={borderRadius} onChange={(event) => setBorderRadius(clamp(Number(event.target.value), 0, 64))} />
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.output}</span>
                        <span className="text-xs font-normal text-muted-foreground">{toolT.output_preview_label}</span>
                    </div>
                    <div className="space-y-3 border-b bg-background/30 p-3">
                        <div
                            className="grid min-h-[240px] place-items-center rounded-lg border p-4"
                            style={{ backgroundColor }}
                        >
                            <div
                                className="grid h-36 w-64 place-items-center text-sm font-medium text-slate-700"
                                style={{
                                    backgroundColor: cardColor,
                                    borderRadius,
                                    boxShadow: cssPreviewShadow,
                                }}
                            >
                                {toolT.preview_card_label}
                            </div>
                        </div>
                        <div className="rounded-md border bg-background p-3 text-xs text-muted-foreground">
                            {toolT.css_preview_shadow_label}: {cssPreviewShadow}
                        </div>
                    </div>
                    <div className="flex-1 p-0">
                        <Textarea
                            readOnly
                            value={fullSnippet}
                            className="h-full min-h-[220px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>

            <RelatedTools toolKey="react_native_shadow_generator" />
        </div>
    )
}
