"use client"

import * as React from "react"
import { Copy, Download, Eraser, Sparkles, TestTube2 } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { generateAiPalette, paletteToCssVars } from "@/core/utils/color-generator-utils"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"

const DEFAULT_STATE = {
    seedColor: "#3b82f6",
    keyword: "ocean",
    count: 8,
}

export function AiColorPaletteGeneratorPage() {
    const { t } = useLang()
    const toolT = t.tools["ai_color_palette_generator"] as Record<string, string>
    const defaultKeyword = toolT.default_keyword
    const sampleKeyword = toolT.sample_keyword

    const [seedColor, setSeedColor] = React.useState(DEFAULT_STATE.seedColor)
    const [keyword, setKeyword] = React.useState(defaultKeyword || DEFAULT_STATE.keyword)
    const [count, setCount] = React.useState(DEFAULT_STATE.count)

    const palette = React.useMemo(() => generateAiPalette(seedColor, keyword, count), [seedColor, keyword, count])
    const cssOutput = React.useMemo(
        () => `:root {\n${paletteToCssVars(palette).split("\n").map((line) => `  ${line}`).join("\n")}\n}`,
        [palette],
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

    const handleCopyColor = async (color: string) => {
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
        anchor.download = "color-palette.css"
        anchor.click()
        URL.revokeObjectURL(url)
    }

    const handleReset = () => {
        setSeedColor(DEFAULT_STATE.seedColor)
        setKeyword(defaultKeyword || DEFAULT_STATE.keyword)
        setCount(DEFAULT_STATE.count)
    }

    const handleSample = () => {
        setSeedColor("#8b5cf6")
        setKeyword(sampleKeyword || "cyber")
        setCount(10)
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
                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="space-y-1.5 rounded-lg border bg-background/60 p-3">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {toolT.seed_color_label}
                            </span>
                            <div className="flex items-center gap-2">
                                <Input type="color" value={seedColor} onChange={(event) => setSeedColor(event.target.value)} className="h-10 w-14 cursor-pointer p-1" />
                                <Input value={seedColor} onChange={(event) => setSeedColor(event.target.value)} className="font-mono text-xs" spellCheck={false} />
                            </div>
                        </label>

                        <label className="space-y-1.5 rounded-lg border bg-background/60 p-3">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {toolT.keyword_label}
                            </span>
                            <Input
                                value={keyword}
                                onChange={(event) => setKeyword(event.target.value)}
                                placeholder={toolT.keyword_placeholder}
                                spellCheck={false}
                            />
                        </label>
                    </div>

                    <div className="space-y-1.5 rounded-lg border bg-background/60 p-3">
                        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            <span>{toolT.swatches_label}</span>
                            <span>{count}</span>
                        </div>
                        <Input
                            type="range"
                            min={5}
                            max={12}
                            step={1}
                            value={count}
                            onChange={(event) => setCount(Number(event.target.value))}
                            className="cursor-pointer"
                        />
                    </div>

                    <div className="overflow-hidden rounded-xl border">
                        <div className="tool-pane-header tool-pane-header-between">
                            <span>{toolT.preview_pane_title}</span>
                            <span className="text-xs font-normal text-muted-foreground">{toolT.preview_badge}</span>
                        </div>
                        <div className="grid gap-2 bg-gradient-to-br from-slate-100/70 to-cyan-100/35 p-4 dark:from-slate-900/30 dark:to-cyan-950/25" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))" }}>
                            {palette.map((color, index) => (
                                <button
                                    key={`${color}-${index}`}
                                    type="button"
                                    onClick={() => void handleCopyColor(color)}
                                    className="overflow-hidden rounded-lg border text-left"
                                    title={`${t.common.copy} ${color}`}
                                >
                                    <div className="h-16 w-full" style={{ background: color }} />
                                    <div className="px-2 py-1.5 text-xs font-mono text-foreground">{color}</div>
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
