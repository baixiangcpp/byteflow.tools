"use client"

import * as React from "react"
import { Copy, Download, Eraser, Palette, TestTube2 } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { generateColorShades, shadesToCssVars } from "@/core/utils/color-generator-utils"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"

const DEFAULT_STATE = {
    baseColor: "#3b82f6",
    steps: 10,
}

export function ColorShadesGeneratorPage() {
    const { t } = useLang()
    const toolT = t.tools["color_shades_generator"] as Record<string, string>

    const [baseColor, setBaseColor] = React.useState(DEFAULT_STATE.baseColor)
    const [steps, setSteps] = React.useState(DEFAULT_STATE.steps)

    const shades = React.useMemo(() => generateColorShades(baseColor, steps), [baseColor, steps])
    const cssOutput = React.useMemo(
        () => `:root {\n${shadesToCssVars(shades).split("\n").map((line) => `  ${line}`).join("\n")}\n}`,
        [shades],
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

    const handleCopyShade = async (color: string) => {
        const result = await safeClipboardWrite(color)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }

    const handleDownload = () => {
        const blob = new Blob([cssOutput], { type: "text/css;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = "color-shades.css"
        anchor.click()
        URL.revokeObjectURL(url)
    }

    const handleReset = () => {
        setBaseColor(DEFAULT_STATE.baseColor)
        setSteps(DEFAULT_STATE.steps)
    }

    const handleSample = () => {
        setBaseColor("#14b8a6")
        setSteps(12)
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
                        <Palette className="h-6 w-6 text-primary" />
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
                        <label className="space-y-1.5 rounded-lg border bg-background/60 p-3">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.base_color_label}</span>
                            <div className="flex items-center gap-2">
                                <Input type="color" value={baseColor} onChange={(event) => setBaseColor(event.target.value)} className="h-10 w-14 cursor-pointer p-1" />
                                <Input value={baseColor} onChange={(event) => setBaseColor(event.target.value)} className="font-mono text-xs" spellCheck={false} />
                            </div>
                        </label>

                        <div className="space-y-1.5 rounded-lg border bg-background/60 p-3">
                            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                <span>{toolT.steps_label}</span>
                                <span>{steps}</span>
                            </div>
                            <Input
                                type="range"
                                min={10}
                                max={12}
                                step={1}
                                value={steps}
                                onChange={(event) => setSteps(Number(event.target.value))}
                                className="cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border">
                        <div className="tool-pane-header tool-pane-header-between">
                            <span>{t.common.preview}</span>
                            <span className="text-xs font-normal text-muted-foreground">{toolT.shades_badge}</span>
                        </div>
                        <div className="space-y-1 p-3">
                            {shades.map((shade) => (
                                <button
                                    key={shade.label}
                                    type="button"
                                    onClick={() => void handleCopyShade(shade.color)}
                                    className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-xs"
                                    style={{ background: shade.color }}
                                >
                                    <span className="font-semibold text-slate-900/85">{shade.label}</span>
                                    <span className="font-mono text-slate-900/85">{shade.color}</span>
                                </button>
                            ))}
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
