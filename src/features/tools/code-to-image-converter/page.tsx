"use client"

import * as React from "react"
import { Image as ImageIcon, Eraser, TestTube2, Download, Play } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { ToolPreviewArea } from "@/features/tool-shell/tool-preview-area"
import { type CodeImageTheme, renderCodeToPngDataUrl } from "@/features/tools/code-to-image-converter/utils"
import { WideToolPageContainer } from "@/components/layout/page-container"

const SAMPLE_CODE = [
    "export function buildPreview(id) {",
    "  const safeId = id.trim() || \"user_001\"",
    "  return { id: safeId, locale: \"zh-CN\", ready: true }",
    "}",
    "",
    "console.log(buildPreview(\"asset_2048\"))",
].join("\n")

export function CodeToImageConverterPage() {
    const { t } = useLang()
    const toolT = t.tools["code_to_image_converter"] as Record<string, string>
    const text = (key: string) => toolT[key]

    const [input, setInput] = React.useState("")
    const [theme, setTheme] = React.useState<CodeImageTheme>("dark")
    const [fontSize, setFontSize] = React.useState(16)
    const [imageDataUrl, setImageDataUrl] = React.useState("")

    const generateImage = () => {
        if (!input.trim()) {
            setImageDataUrl("")
            return
        }

        try {
            const dataUrl = renderCodeToPngDataUrl({
                code: input,
                theme,
                fontSize,
            })
            setImageDataUrl(dataUrl)
        } catch {
            toast.error(t.common.generate_image_failed_retry)
        }
    }

    const handleSample = () => {
        setInput(SAMPLE_CODE)
        setImageDataUrl("")
    }

    const handleClear = () => {
        setInput("")
        setImageDataUrl("")
    }

    const handleDownload = () => {
        if (!imageDataUrl) return
        const anchor = document.createElement("a")
        anchor.href = imageDataUrl
        anchor.download = "code-snippet.png"
        anchor.click()
    }

    const actions: ToolAction[] = [
        {
            id: "sample",
            label: text("sample_action"),
            icon: TestTube2,
            onClick: handleSample,
        },
        {
            id: "clear",
            label: t.common.clear,
            icon: Eraser,
            onClick: handleClear,
        },
        {
            id: "download",
            label: t.common.download,
            icon: Download,
            onClick: handleDownload,
            disabled: !imageDataUrl,
        },
        {
            id: "generate",
            label: text("generate_action"),
            icon: Play,
            onClick: generateImage,
            variant: "default",
        },
    ]

    return (
        <WideToolPageContainer className="flex h-full flex-col space-y-8">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <ImageIcon className="h-6 w-6 text-primary" />
                        {text("title")}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {text("description")}
                    </p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
                <span className="text-sm text-muted-foreground">{text("theme_label")}</span>
                <Button
                    type="button"
                    size="sm"
                    variant={theme === "dark" ? "default" : "outline"}
                    onClick={() => setTheme("dark")}
                >
                    {text("dark_label")}
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant={theme === "light" ? "default" : "outline"}
                    onClick={() => setTheme("light")}
                >
                    {text("light_label")}
                </Button>
                <label className="ml-2 text-sm text-muted-foreground" htmlFor="font-size-slider">
                    {text("font_size_label")}
                </label>
                <input
                    id="font-size-slider"
                    type="range"
                    min={12}
                    max={24}
                    step={1}
                    value={fontSize}
                    onChange={(event) => setFontSize(Number(event.target.value))}
                />
                <span className="text-sm text-muted-foreground">{fontSize}px</span>
            </div>

            <div className="grid min-h-[500px] flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.input}</span>
                    </div>
                    <div className="flex-1 p-0">
                        <Textarea
                            className="h-full min-h-[400px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                            placeholder={text("input_placeholder")}
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            spellCheck={false}
                        />
                    </div>
                </div>

                <ToolPreviewArea
                    title={text("preview")}
                    metadata={imageDataUrl ? "PNG" : undefined}
                >
                    {imageDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={imageDataUrl}
                            alt={text("preview")}
                            className="max-h-[420px] w-auto rounded border object-contain drop-shadow-md"
                        />
                    ) : (
                        <div className="text-sm text-muted-foreground">{text("preview_empty")}</div>
                    )}
                </ToolPreviewArea>
            </div>
        </WideToolPageContainer>
    )
}
