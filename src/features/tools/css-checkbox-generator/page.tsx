"use client"

import * as React from "react"
import { Check, CheckSquare, Copy, Download, Eraser, TestTube2 } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { buildCheckboxCss } from "@/core/utils/css-generator-utils"

const DEFAULT_STATE = {
    size: 26,
    borderWidth: 2,
    borderRadius: 6,
    checkThickness: 2,
    borderColor: "#334155",
    backgroundColor: "#ffffff",
    checkedColor: "#0ea5e9",
    checkColor: "#ffffff",
}

export function CssCheckboxGeneratorPage() {
    const { t } = useLang()
    const toolT = t.tools["css_checkbox_generator"] as Record<string, string>

    const [size, setSize] = React.useState(DEFAULT_STATE.size)
    const [borderWidth, setBorderWidth] = React.useState(DEFAULT_STATE.borderWidth)
    const [borderRadius, setBorderRadius] = React.useState(DEFAULT_STATE.borderRadius)
    const [checkThickness, setCheckThickness] = React.useState(DEFAULT_STATE.checkThickness)
    const [borderColor, setBorderColor] = React.useState(DEFAULT_STATE.borderColor)
    const [backgroundColor, setBackgroundColor] = React.useState(DEFAULT_STATE.backgroundColor)
    const [checkedColor, setCheckedColor] = React.useState(DEFAULT_STATE.checkedColor)
    const [checkColor, setCheckColor] = React.useState(DEFAULT_STATE.checkColor)
    const [checked, setChecked] = React.useState(true)

    const cssOutput = React.useMemo(
        () => buildCheckboxCss({
            size,
            borderWidth,
            borderRadius,
            checkThickness,
            borderColor,
            backgroundColor,
            checkedColor,
            checkColor,
        }),
        [size, borderWidth, borderRadius, checkThickness, borderColor, backgroundColor, checkedColor, checkColor],
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
        anchor.download = "checkbox.css"
        anchor.click()
        URL.revokeObjectURL(url)
    }

    const handleReset = () => {
        setSize(DEFAULT_STATE.size)
        setBorderWidth(DEFAULT_STATE.borderWidth)
        setBorderRadius(DEFAULT_STATE.borderRadius)
        setCheckThickness(DEFAULT_STATE.checkThickness)
        setBorderColor(DEFAULT_STATE.borderColor)
        setBackgroundColor(DEFAULT_STATE.backgroundColor)
        setCheckedColor(DEFAULT_STATE.checkedColor)
        setCheckColor(DEFAULT_STATE.checkColor)
        setChecked(true)
    }

    const handleSample = () => {
        setSize(30)
        setBorderWidth(1)
        setBorderRadius(10)
        setCheckThickness(3)
        setBorderColor("#1e293b")
        setBackgroundColor("#f8fafc")
        setCheckedColor("#16a34a")
        setCheckColor("#ffffff")
        setChecked(true)
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
                        <CheckSquare className="h-6 w-6 text-primary" />
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
                    <div className="grid gap-3 sm:grid-cols-2">
                        <RangeField label={toolT.size_label} value={size} min={16} max={48} onChange={setSize} suffix="px" />
                        <RangeField label={toolT.border_width_label} value={borderWidth} min={1} max={4} onChange={setBorderWidth} suffix="px" />
                        <RangeField label={toolT.radius_label} value={borderRadius} min={0} max={16} onChange={setBorderRadius} suffix="px" />
                        <RangeField label={toolT.check_thickness_label} value={checkThickness} min={1} max={4} onChange={setCheckThickness} suffix="px" />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <ColorField label={toolT.border_color_label} value={borderColor} onChange={setBorderColor} />
                        <ColorField label={toolT.background_color_label} value={backgroundColor} onChange={setBackgroundColor} />
                        <ColorField label={toolT.checked_color_label} value={checkedColor} onChange={setCheckedColor} />
                        <ColorField label={toolT.check_mark_color_label} value={checkColor} onChange={setCheckColor} />
                    </div>

                    <div className="overflow-hidden rounded-xl border">
                        <div className="tool-pane-header tool-pane-header-between">
                            <span>{t.common.preview}</span>
                            <Button variant="outline" size="sm" onClick={() => setChecked((v) => !v)}>
                                {toolT.toggle_action}
                            </Button>
                        </div>
                        <div className="grid min-h-[220px] place-items-center bg-gradient-to-br from-cyan-500/10 to-amber-400/10 p-8">
                            <button
                                type="button"
                                aria-pressed={checked}
                                onClick={() => setChecked((v) => !v)}
                                className="grid place-items-center transition-[transform,border-color,background-color] duration-200"
                                style={{
                                    width: `${size}px`,
                                    height: `${size}px`,
                                    borderWidth: `${borderWidth}px`,
                                    borderStyle: "solid",
                                    borderColor: checked ? checkedColor : borderColor,
                                    borderRadius: `${borderRadius}px`,
                                    background: checked ? checkedColor : backgroundColor,
                                }}
                            >
                                <Check
                                    className="transition-transform duration-150"
                                    style={{
                                        color: checkColor,
                                        width: `${Math.max(10, Math.round(size * 0.58))}px`,
                                        height: `${Math.max(10, Math.round(size * 0.58))}px`,
                                        strokeWidth: checkThickness + 0.4,
                                        transform: checked ? "scale(1)" : "scale(0)",
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
        </div>
    )
}

function RangeField({
    label,
    value,
    min,
    max,
    suffix,
    onChange,
}: {
    label: string
    value: number
    min: number
    max: number
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
                step={1}
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

