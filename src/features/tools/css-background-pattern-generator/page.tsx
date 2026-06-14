"use client"

import * as React from "react"
import { Copy, Download, Eraser, Palette, Sparkles, TestTube2 } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { buildBackgroundPatternCss, type BackgroundPatternKind } from "@/core/utils/css-generator-utils"

const DEFAULT_STATE = {
    kind: "dots" as BackgroundPatternKind,
    primaryColor: "#0ea5e9",
    secondaryColor: "#020617",
    size: 22,
}

export function CssBackgroundPatternGeneratorPage() {
    const { t } = useLang()
    const toolT = t.tools["css_background_pattern_generator"] as Record<string, string>
    const [kind, setKind] = React.useState<BackgroundPatternKind>(DEFAULT_STATE.kind)
    const [primaryColor, setPrimaryColor] = React.useState(DEFAULT_STATE.primaryColor)
    const [secondaryColor, setSecondaryColor] = React.useState(DEFAULT_STATE.secondaryColor)
    const [size, setSize] = React.useState(DEFAULT_STATE.size)

    const cssOutput = React.useMemo(
        () => buildBackgroundPatternCss({ kind, primaryColor, secondaryColor, size }),
        [kind, primaryColor, secondaryColor, size],
    )

    const previewStyle = React.useMemo<React.CSSProperties>(() => {
        if (kind === "dots") {
            return {
                backgroundColor: secondaryColor,
                backgroundImage: `radial-gradient(${primaryColor} 1.8px, transparent 1.8px)`,
                backgroundSize: `${size}px ${size}px`,
            }
        }
        if (kind === "grid") {
            return {
                backgroundColor: secondaryColor,
                backgroundImage: `linear-gradient(${primaryColor} 1px, transparent 1px), linear-gradient(90deg, ${primaryColor} 1px, transparent 1px)`,
                backgroundSize: `${size}px ${size}px`,
            }
        }
        return {
            backgroundColor: secondaryColor,
            backgroundImage: `repeating-linear-gradient(45deg, ${primaryColor}, ${primaryColor} 2px, transparent 2px, transparent ${size}px)`,
        }
    }, [kind, primaryColor, secondaryColor, size])

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
        const content = `.pattern {\n${cssOutput.split("\n").map((line) => `  ${line}`).join("\n")}\n}\n`
        const blob = new Blob([content], { type: "text/css;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = "background-pattern.css"
        anchor.click()
        URL.revokeObjectURL(url)
    }

    const handleReset = () => {
        setKind(DEFAULT_STATE.kind)
        setPrimaryColor(DEFAULT_STATE.primaryColor)
        setSecondaryColor(DEFAULT_STATE.secondaryColor)
        setSize(DEFAULT_STATE.size)
    }

    const handleSample = () => {
        setKind("diagonal")
        setPrimaryColor("#22d3ee")
        setSecondaryColor("#0f172a")
        setSize(26)
    }

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
            onClick: () => void handleCopy(),
        },
        {
            id: "download",
            label: t.common.download,
            icon: Download,
            onClick: handleDownload,
        },
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
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.pattern_label}</label>
                            <div className="flex flex-wrap gap-2">
                                {([
                                    { key: "dots", label: toolT.pattern_dots },
                                    { key: "grid", label: toolT.pattern_grid },
                                    { key: "diagonal", label: toolT.pattern_diagonal },
                                ] as const).map((option) => (
                                    <button
                                        key={option.key}
                                        type="button"
                                        onClick={() => setKind(option.key)}
                                        className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                                            kind === option.key
                                                ? "border-primary/40 bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.pattern_size}: {size}px</label>
                            <Input
                                type="range"
                                min={8}
                                max={64}
                                step={1}
                                value={size}
                                onChange={(event) => setSize(Number(event.target.value))}
                                className="cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="space-y-2 text-sm">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.primary_color_label}</span>
                            <div className="flex items-center gap-2">
                                <Input type="color" value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} className="h-10 w-14 cursor-pointer p-1" />
                                <Input value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} spellCheck={false} className="font-mono text-xs" />
                            </div>
                        </label>

                        <label className="space-y-2 text-sm">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.background_color_label}</span>
                            <div className="flex items-center gap-2">
                                <Input type="color" value={secondaryColor} onChange={(event) => setSecondaryColor(event.target.value)} className="h-10 w-14 cursor-pointer p-1" />
                                <Input value={secondaryColor} onChange={(event) => setSecondaryColor(event.target.value)} spellCheck={false} className="font-mono text-xs" />
                            </div>
                        </label>
                    </div>

                    <div className="overflow-hidden rounded-xl border">
                        <div className="tool-pane-header tool-pane-header-between">
                            <span>{t.common.preview}</span>
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Sparkles className="h-3.5 w-3.5" />
                                {toolT.live_label}
                            </span>
                        </div>
                        <div className="h-64" style={previewStyle} />
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
