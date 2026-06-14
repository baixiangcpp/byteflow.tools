"use client"

import * as React from "react"
import { Copy, Download, Eraser, Image as ImageIcon, TestTube2, Upload } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { ToolPreviewArea } from "@/features/tool-shell/tool-preview-area"
import { averageHexFromPixels, averageRgbFromPixels, rgbToString } from "@/core/utils/image-color-utils"
import { createDemoImageDataUrl, fileToDataUrl, getImageDataForAnalysis } from "@/core/utils/image-canvas-utils"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"

const MAX_FILE_SIZE = 10 * 1024 * 1024

export function ImageAverageColorFinderPage() {
    const { t } = useLang()
    const toolT = t.tools["image_average_color_finder"] as Record<string, string>
    const outputAverageHexLabel = toolT.output_average_hex_label
    const outputAverageRgbLabel = toolT.output_average_rgb_label
    const outputAverageLabel = toolT.output_average_label
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const [imageSrc, setImageSrc] = React.useState("")
    const [fileName, setFileName] = React.useState("")
    const [averageHex, setAverageHex] = React.useState("#000000")
    const [averageRgb, setAverageRgb] = React.useState("rgb(0, 0, 0)")

    const output = React.useMemo(
        () => [
            `${outputAverageHexLabel}: ${averageHex}`,
            `${outputAverageRgbLabel}: ${averageRgb}`,
            "",
            ":root {",
            `  --image-average-color: ${averageHex};`,
            "}",
        ].join("\n"),
        [averageHex, averageRgb, outputAverageHexLabel, outputAverageRgbLabel],
    )

    const analyzeFromSource = async (src: string) => {
        const imageData = await getImageDataForAnalysis(src, 260)
        const hex = averageHexFromPixels(imageData.data)
        const rgb = rgbToString(averageRgbFromPixels(imageData.data))
        setAverageHex(hex)
        setAverageRgb(rgb)
    }

    const handleFile = async (file: File) => {
        if (!file.type.startsWith("image/")) {
            toast.error(t.common.image_file_required)
            return
        }
        if (file.size > MAX_FILE_SIZE) {
            toast.error((t.common.image_file_too_large).replace("{size}", "10MB"))
            return
        }

        try {
            const dataUrl = await fileToDataUrl(file)
            setImageSrc(dataUrl)
            setFileName(file.name)
            await analyzeFromSource(dataUrl)
        } catch {
            toast.error(t.common.image_process_failed)
        }
    }

    const handleSample = async () => {
        try {
            const dataUrl = createDemoImageDataUrl(960, 540)
            setImageSrc(dataUrl)
            setFileName(`${t.common.sample_image}.png`)
            await analyzeFromSource(dataUrl)
        } catch {
            toast.error(t.common.sample_image_generate_failed)
        }
    }

    const handleReset = () => {
        setImageSrc("")
        setFileName("")
        setAverageHex("#000000")
        setAverageRgb("rgb(0, 0, 0)")
    }

    const handleCopy = async () => {
        const result = await safeClipboardWrite(output)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }

    const handleDownload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = 900
        canvas.height = 420
        const context = canvas.getContext("2d")
        if (!context) return

        context.fillStyle = averageHex
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.fillStyle = "rgba(15, 23, 42, 0.8)"
        context.fillRect(40, 280, 540, 96)
        context.fillStyle = "#F8FAFC"
        context.font = "600 28px ui-sans-serif, system-ui"
        context.fillText(`${outputAverageLabel}: ${averageHex}`, 68, 326)
        context.font = "400 22px ui-sans-serif, system-ui"
        context.fillText(averageRgb, 68, 358)

        const anchor = document.createElement("a")
        anchor.href = canvas.toDataURL("image/png")
        anchor.download = "average-color.png"
        anchor.click()
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
                        <ImageIcon className="h-6 w-6 text-primary" />
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
                    <div
                        className="grid min-h-[340px] cursor-pointer place-items-center rounded-xl border border-dashed bg-muted/15 p-6"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                            event.preventDefault()
                            const file = event.dataTransfer.files?.[0]
                            if (file) void handleFile(file)
                        }}
                    >
                        {imageSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={imageSrc} alt={toolT.title} className="max-h-[300px] max-w-full rounded-lg border object-contain" />
                        ) : (
                            <div className="text-center text-muted-foreground">
                                <Upload className="mx-auto mb-3 h-10 w-10 opacity-60" />
                                <p className="text-sm font-medium">{t.common.drop_image_or_click_upload}</p>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => {
                                const file = event.target.files?.[0]
                                if (file) void handleFile(file)
                            }}
                        />
                    </div>

                    <div className="rounded-lg border bg-background/60 p-3 text-xs text-muted-foreground">
                        {t.common.file}: <span className="font-medium text-foreground">{fileName || t.common.not_selected}</span>
                    </div>

                    <div className="rounded-lg border p-3">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{outputAverageLabel}</div>
                        <div className="flex items-center gap-3">
                            <div className="h-14 w-14 rounded-md border" style={{ background: averageHex }} />
                            <div className="space-y-1 text-sm">
                                <div className="font-mono">{averageHex}</div>
                                <div className="font-mono text-muted-foreground">{averageRgb}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.output}</span>
                        <span className="text-xs font-normal text-muted-foreground">{outputAverageLabel}</span>
                    </div>
                    <div className="border-b">
                        <ToolPreviewArea
                            title={t.common.preview}
                            metadata={imageSrc ? averageHex : undefined}
                        >
                            {imageSrc ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={imageSrc}
                                    alt={toolT.title}
                                    className="max-h-[400px] w-auto rounded object-contain drop-shadow-md"
                                />
                            ) : (
                                <div className="text-xs text-muted-foreground">
                                    {t.common.preview_will_appear_here}
                                </div>
                            )}
                        </ToolPreviewArea>
                    </div>
                    <div className="flex-1 p-0">
                        <Textarea
                            readOnly
                            value={output}
                            className="h-full min-h-[360px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
