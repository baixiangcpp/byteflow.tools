"use client"

import * as React from "react"
import { Copy, Download, Eraser, Radius, TestTube2, Link2, Unlink2 } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { buildBorderRadiusCss } from "@/core/utils/css-generator-utils"

const DEFAULT_RADIUS = { topLeft: 18, topRight: 18, bottomRight: 18, bottomLeft: 18 }

export function CssBorderRadiusGeneratorPage() {
    const { t } = useLang()
    const toolT = t.tools["css_border_radius_generator"] as Record<string, string>
    const [unit, setUnit] = React.useState<"%" | "px">("%")
    const [linked, setLinked] = React.useState(true)
    const [topLeft, setTopLeft] = React.useState(DEFAULT_RADIUS.topLeft)
    const [topRight, setTopRight] = React.useState(DEFAULT_RADIUS.topRight)
    const [bottomRight, setBottomRight] = React.useState(DEFAULT_RADIUS.bottomRight)
    const [bottomLeft, setBottomLeft] = React.useState(DEFAULT_RADIUS.bottomLeft)

    const cssOutput = React.useMemo(
        () => buildBorderRadiusCss({ topLeft, topRight, bottomRight, bottomLeft, unit }),
        [topLeft, topRight, bottomRight, bottomLeft, unit],
    )

    const previewRadiusValue = React.useMemo(
        () => `${topLeft}${unit} ${topRight}${unit} ${bottomRight}${unit} ${bottomLeft}${unit}`,
        [topLeft, topRight, bottomRight, bottomLeft, unit],
    )

    const setCorner = (corner: "topLeft" | "topRight" | "bottomRight" | "bottomLeft", value: number) => {
        const safeValue = Math.max(0, Math.min(unit === "%" ? 50 : 120, Math.round(value)))
        if (linked) {
            setTopLeft(safeValue)
            setTopRight(safeValue)
            setBottomRight(safeValue)
            setBottomLeft(safeValue)
            return
        }
        if (corner === "topLeft") setTopLeft(safeValue)
        if (corner === "topRight") setTopRight(safeValue)
        if (corner === "bottomRight") setBottomRight(safeValue)
        if (corner === "bottomLeft") setBottomLeft(safeValue)
    }

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
        const content = `.shape {\n  width: 220px;\n  height: 220px;\n  ${cssOutput}\n}\n`
        const blob = new Blob([content], { type: "text/css;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = "border-radius.css"
        anchor.click()
        URL.revokeObjectURL(url)
    }

    const handleReset = () => {
        setUnit("%")
        setLinked(true)
        setTopLeft(DEFAULT_RADIUS.topLeft)
        setTopRight(DEFAULT_RADIUS.topRight)
        setBottomRight(DEFAULT_RADIUS.bottomRight)
        setBottomLeft(DEFAULT_RADIUS.bottomLeft)
    }

    const handleSample = () => {
        setUnit("%")
        setLinked(false)
        setTopLeft(42)
        setTopRight(14)
        setBottomRight(38)
        setBottomLeft(8)
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
                        <Radius className="h-6 w-6 text-primary" />
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
                        <Button variant={unit === "%" ? "default" : "outline"} size="sm" onClick={() => setUnit("%")}>%</Button>
                        <Button variant={unit === "px" ? "default" : "outline"} size="sm" onClick={() => setUnit("px")}>px</Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="ml-auto"
                            onClick={() => setLinked((prev) => !prev)}
                        >
                            {linked ? <Link2 className="mr-1 h-3.5 w-3.5" /> : <Unlink2 className="mr-1 h-3.5 w-3.5" />}
                            {linked ? toolT.linked_corners : toolT.independent_corners}
                        </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <CornerSlider
                            label={toolT.top_left}
                            value={topLeft}
                            unit={unit}
                            max={unit === "%" ? 50 : 120}
                            onChange={(value) => setCorner("topLeft", value)}
                        />
                        <CornerSlider
                            label={toolT.top_right}
                            value={topRight}
                            unit={unit}
                            max={unit === "%" ? 50 : 120}
                            onChange={(value) => setCorner("topRight", value)}
                        />
                        <CornerSlider
                            label={toolT.bottom_right}
                            value={bottomRight}
                            unit={unit}
                            max={unit === "%" ? 50 : 120}
                            onChange={(value) => setCorner("bottomRight", value)}
                        />
                        <CornerSlider
                            label={toolT.bottom_left}
                            value={bottomLeft}
                            unit={unit}
                            max={unit === "%" ? 50 : 120}
                            onChange={(value) => setCorner("bottomLeft", value)}
                        />
                    </div>

                    <div className="overflow-hidden rounded-xl border">
                        <div className="tool-pane-header tool-pane-header-between">
                            <span>{t.common.preview}</span>
                            <span className="text-xs font-normal text-muted-foreground">{previewRadiusValue}</span>
                        </div>
                        <div className="grid place-items-center bg-gradient-to-br from-cyan-500/20 via-sky-400/10 to-amber-400/20 p-10">
                            <div
                                className="h-56 w-56 border border-border/70 bg-background/90 shadow-lg transition-[border-radius,border-color,box-shadow]"
                                style={{ borderRadius: previewRadiusValue }}
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

function CornerSlider({
    label,
    value,
    unit,
    max,
    onChange,
}: {
    label: string
    value: number
    unit: "%" | "px"
    max: number
    onChange: (value: number) => void
}) {
    return (
        <div className="space-y-2 rounded-lg border bg-background/60 p-3">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span>{label}</span>
                <span>{value}{unit}</span>
            </div>
            <Input
                type="range"
                min={0}
                max={max}
                step={1}
                value={value}
                onChange={(event) => onChange(Number(event.target.value))}
                className="cursor-pointer"
            />
        </div>
    )
}
