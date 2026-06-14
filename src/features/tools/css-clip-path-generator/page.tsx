"use client"

import * as React from "react"
import { Copy, Crop, Download, Eraser, TestTube2 } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { buildClipPathCss, buildClipPathValue, type ClipPathPreset } from "@/core/utils/css-generator-utils"

const DEFAULT_PRESET: ClipPathPreset = "hexagon"
const DEFAULT_INSET = 8

export function CssClipPathGeneratorPage() {
    const { t } = useLang()
    const toolT = t.tools["css_clip_path_generator"] as Record<string, string>
    const presetLabels: Record<ClipPathPreset, string> = {
        triangle: toolT.preset_triangle,
        hexagon: toolT.preset_hexagon,
        diamond: toolT.preset_diamond,
        chevron: toolT.preset_chevron,
    }

    const [mode, setMode] = React.useState<"preset" | "custom">("preset")
    const [preset, setPreset] = React.useState<ClipPathPreset>(DEFAULT_PRESET)
    const [inset, setInset] = React.useState(DEFAULT_INSET)
    const [customPath, setCustomPath] = React.useState("polygon(50% 0%, 100% 100%, 0% 100%)")

    const clipPathValue = React.useMemo(
        () => (mode === "custom" ? customPath.trim() : buildClipPathValue(preset, inset)),
        [mode, preset, inset, customPath],
    )

    const cssOutput = React.useMemo(() => buildClipPathCss(clipPathValue || "none"), [clipPathValue])

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
        const blob = new Blob([`.clipped {\n  ${cssOutput}\n}\n`], { type: "text/css;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = "clip-path.css"
        anchor.click()
        URL.revokeObjectURL(url)
    }

    const handleReset = () => {
        setMode("preset")
        setPreset(DEFAULT_PRESET)
        setInset(DEFAULT_INSET)
        setCustomPath("polygon(50% 0%, 100% 100%, 0% 100%)")
    }

    const handleSample = () => {
        setMode("custom")
        setCustomPath("polygon(10% 8%, 90% 8%, 100% 45%, 80% 92%, 20% 92%, 0% 45%)")
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
                        <Crop className="h-6 w-6 text-primary" />
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
                            onClick={() => setMode("preset")}
                            className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${mode === "preset" ? "border-primary/40 bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            {toolT.preset_mode}
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("custom")}
                            className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${mode === "custom" ? "border-primary/40 bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            {toolT.custom_mode}
                        </button>
                    </div>

                    {mode === "preset" ? (
                        <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                                {(["triangle", "hexagon", "diamond", "chevron"] as ClipPathPreset[]).map((item) => (
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
                            <div className="space-y-1.5 rounded-lg border bg-background/60 p-3">
                                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    <span>{toolT.inset_label}</span>
                                    <span>{inset}%</span>
                                </div>
                                <Input
                                    type="range"
                                    min={0}
                                    max={40}
                                    step={1}
                                    value={inset}
                                    onChange={(event) => setInset(Number(event.target.value))}
                                    className="cursor-pointer"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.custom_polygon_label}</label>
                            <Textarea
                                value={customPath}
                                onChange={(event) => setCustomPath(event.target.value)}
                                className="min-h-[120px] font-mono text-sm"
                                spellCheck={false}
                            />
                        </div>
                    )}

                    <div className="overflow-hidden rounded-xl border">
                        <div className="tool-pane-header tool-pane-header-between">
                            <span>{t.common.preview}</span>
                            <span className="text-xs font-normal text-muted-foreground">clip-path</span>
                        </div>
                        <div className="grid min-h-[260px] place-items-center bg-gradient-to-br from-sky-500/15 to-amber-400/15 p-8">
                            <div
                                className="h-52 w-64 border border-border/70 bg-cyan-500/75 transition-[clip-path,border-color,background-color]"
                                style={{ clipPath: clipPathValue || "none" }}
                            />
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
