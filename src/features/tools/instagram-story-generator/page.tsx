"use client"

import { Field, RangeField, ColorField } from "./components"
import * as React from "react"
import { Copy, Download, Eraser, Instagram, TestTube2, Upload } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { FILE_INPUT_POLICIES, formatFilePolicyLimit, validateFileAgainstPolicy } from "@/core/files/file-input-policy"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { ToolPreviewArea } from "@/features/tool-shell/tool-preview-area"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { createDemoImageDataUrl, fileToDataUrl, loadImageElement } from "@/core/utils/image-canvas-utils"
import {
    normalizeProgress,
    resolveSocialThemeColors,
    wrapLines,
    type SocialTheme,
} from "@/core/utils/social-media-utils"

const IMAGE_FILE_POLICY = FILE_INPUT_POLICIES["image-standard"]

const DEFAULT_STATE = {
    username: "s42.lab",
    theme: "dark" as SocialTheme,
    accentColor: "#22d3ee",
    gradientStart: "#0f172a",
    gradientEnd: "#1d4ed8",
    progress: 0.45,
}

function drawCoverImage(
    context: CanvasRenderingContext2D,
    image: HTMLImageElement,
    dx: number,
    dy: number,
    dWidth: number,
    dHeight: number,
) {
    const sourceRatio = image.width / image.height
    const targetRatio = dWidth / dHeight

    let sWidth = image.width
    let sHeight = image.height
    let sx = 0
    let sy = 0

    if (sourceRatio > targetRatio) {
        sWidth = image.height * targetRatio
        sx = Math.floor((image.width - sWidth) / 2)
    } else {
        sHeight = image.width / targetRatio
        sy = Math.floor((image.height - sHeight) / 2)
    }

    context.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
}

export function InstagramStoryGeneratorPage() {
    const { t } = useLang()
    const toolT = t.tools["instagram_story_generator"] as Record<string, string>
    const outputUsernameLabel = toolT.output_username_label
    const outputThemeLabel = toolT.output_theme_label
    const outputProgressLabel = toolT.output_progress_label
    const outputAccentLabel = toolT.output_accent_label
    const outputGradientStartLabel = toolT.output_gradient_start_label
    const outputGradientEndLabel = toolT.output_gradient_end_label
    const outputCanvasLabel = toolT.output_canvas_label
    const outputCanvasValue = toolT.output_canvas_value
    const outputFormatLabel = toolT.output_format_label
    const outputFormatPng = toolT.output_format_png

    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const demoSrcRef = React.useRef("")

    const [imageSrc, setImageSrc] = React.useState("")
    const [fileName, setFileName] = React.useState("")
    const [username, setUsername] = React.useState(DEFAULT_STATE.username)
    const [headline, setHeadline] = React.useState(() => toolT.default_headline)
    const [subline, setSubline] = React.useState(() => toolT.default_subline)
    const [cta, setCta] = React.useState(() => toolT.default_cta)
    const [theme, setTheme] = React.useState<SocialTheme>(DEFAULT_STATE.theme)
    const [accentColor, setAccentColor] = React.useState(DEFAULT_STATE.accentColor)
    const [gradientStart, setGradientStart] = React.useState(DEFAULT_STATE.gradientStart)
    const [gradientEnd, setGradientEnd] = React.useState(DEFAULT_STATE.gradientEnd)
    const [progress, setProgress] = React.useState(DEFAULT_STATE.progress)
    const [outputDataUrl, setOutputDataUrl] = React.useState("")
    const activeFileLabel = fileName || (imageSrc ? t.common.sample_image : t.common.drop_image_or_click_upload)

    React.useEffect(() => {
        if (!demoSrcRef.current) demoSrcRef.current = createDemoImageDataUrl(1080, 1920)
    }, [])

    React.useEffect(() => {
        const render = async () => {
            const src = imageSrc || demoSrcRef.current
            if (!src) return

            const image = await loadImageElement(src)
            const palette = resolveSocialThemeColors(theme)

            const canvas = document.createElement("canvas")
            canvas.width = 1080
            canvas.height = 1920
            const context = canvas.getContext("2d")
            if (!context) return

            const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height)
            gradient.addColorStop(0, gradientStart)
            gradient.addColorStop(1, gradientEnd)
            context.fillStyle = gradient
            context.fillRect(0, 0, canvas.width, canvas.height)

            context.save()
            context.globalAlpha = theme === "dark" ? 0.32 : 0.24
            drawCoverImage(context, image, 0, 0, canvas.width, canvas.height)
            context.restore()

            const overlay = context.createLinearGradient(0, 0, 0, canvas.height)
            overlay.addColorStop(0, "rgba(2,6,23,0.2)")
            overlay.addColorStop(1, "rgba(2,6,23,0.62)")
            context.fillStyle = overlay
            context.fillRect(0, 0, canvas.width, canvas.height)

            const storyProgress = normalizeProgress(progress, 1)
            const segmentCount = 4
            const barGap = 12
            const barWidth = (canvas.width - 120 - barGap * (segmentCount - 1)) / segmentCount

            for (let i = 0; i < segmentCount; i += 1) {
                const x = 60 + i * (barWidth + barGap)
                const y = 54
                context.fillStyle = "rgba(255,255,255,0.28)"
                context.fillRect(x, y, barWidth, 8)
                const fill = Math.max(0, Math.min(1, storyProgress * segmentCount - i))
                if (fill > 0) {
                    context.fillStyle = "rgba(255,255,255,0.98)"
                    context.fillRect(x, y, barWidth * fill, 8)
                }
            }

            context.beginPath()
            context.arc(96, 114, 32, 0, Math.PI * 2)
            context.fillStyle = accentColor
            context.fill()

            context.fillStyle = "#ffffff"
            context.font = "700 34px ui-sans-serif, system-ui"
            context.fillText(username, 146, 106)
            context.fillStyle = "rgba(255,255,255,0.82)"
            context.font = "500 24px ui-sans-serif, system-ui"
            context.fillText(toolT.sponsored_label, 146, 138)

            const titleLines = wrapLines(headline, 23, 3)
            context.fillStyle = "#ffffff"
            context.font = "800 84px ui-sans-serif, system-ui"
            titleLines.forEach((line, index) => {
                context.fillText(line, 72, 820 + index * 102)
            })

            const bodyLines = wrapLines(subline, 44, 3)
            context.fillStyle = "rgba(255,255,255,0.92)"
            context.font = "600 36px ui-sans-serif, system-ui"
            bodyLines.forEach((line, index) => {
                context.fillText(line, 72, 1196 + index * 52)
            })

            const buttonY = 1540
            context.fillStyle = palette.surface
            context.strokeStyle = "rgba(255,255,255,0.22)"
            context.lineWidth = 2
            context.beginPath()
            context.roundRect(72, buttonY, 420, 106, 28)
            context.fill()
            context.stroke()
            context.fillStyle = theme === "dark" ? "#ffffff" : "#0f172a"
            context.font = "700 42px ui-sans-serif, system-ui"
            context.fillText(cta, 108, buttonY + 67)

            setOutputDataUrl(canvas.toDataURL("image/png"))
        }

        void render()
    }, [accentColor, cta, gradientEnd, gradientStart, headline, imageSrc, progress, subline, theme, toolT.sponsored_label, username])

    const output = React.useMemo(
        () =>
            [
                `${outputUsernameLabel}: ${username}`,
                `${outputThemeLabel}: ${theme}`,
                `${outputProgressLabel}: ${Math.round(progress * 100)}%`,
                `${outputAccentLabel}: ${accentColor.toUpperCase()}`,
                `${outputGradientStartLabel}: ${gradientStart.toUpperCase()}`,
                `${outputGradientEndLabel}: ${gradientEnd.toUpperCase()}`,
                "",
                `${outputCanvasLabel}: ${outputCanvasValue}`,
                `${outputFormatLabel}: ${outputFormatPng}`,
            ].join("\n"),
        [
            accentColor,
            gradientEnd,
            gradientStart,
            outputAccentLabel,
            outputCanvasLabel,
            outputCanvasValue,
            outputFormatLabel,
            outputFormatPng,
            outputGradientEndLabel,
            outputGradientStartLabel,
            outputProgressLabel,
            outputThemeLabel,
            outputUsernameLabel,
            progress,
            theme,
            username,
        ],
    )

    const handleFile = async (file: File) => {
        const validation = validateFileAgainstPolicy(file, IMAGE_FILE_POLICY)
        if (!validation.ok) {
            toast.error(validation.reason === "too_large"
                ? t.common.image_file_too_large.replace("{size}", formatFilePolicyLimit(IMAGE_FILE_POLICY))
                : t.common.image_file_required)
            return
        }
        try {
            const dataUrl = await fileToDataUrl(file, IMAGE_FILE_POLICY)
            setImageSrc(dataUrl)
            setFileName(file.name)
        } catch {
            toast.error(t.common.image_file_read_failed)
        }
    }

    const handleSample = () => {
        setImageSrc(demoSrcRef.current)
        setFileName("")
        setUsername(DEFAULT_STATE.username)
        setHeadline(toolT.sample_headline)
        setSubline(toolT.sample_subline)
        setCta(toolT.sample_cta)
        setTheme("dark")
        setAccentColor("#f59e0b")
        setGradientStart("#111827")
        setGradientEnd("#0ea5e9")
        setProgress(0.72)
    }

    const handleReset = () => {
        setImageSrc("")
        setFileName("")
        setUsername(DEFAULT_STATE.username)
        setHeadline(toolT.default_headline)
        setSubline(toolT.default_subline)
        setCta(toolT.default_cta)
        setTheme(DEFAULT_STATE.theme)
        setAccentColor(DEFAULT_STATE.accentColor)
        setGradientStart(DEFAULT_STATE.gradientStart)
        setGradientEnd(DEFAULT_STATE.gradientEnd)
        setProgress(DEFAULT_STATE.progress)
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
        if (!outputDataUrl) return
        const anchor = document.createElement("a")
        anchor.href = outputDataUrl
        anchor.download = "instagram-story.png"
        anchor.click()
    }

    const actions: ToolAction[] = [
        { id: "sample", label: t.common.sample, icon: TestTube2, onClick: handleSample },
        { id: "reset", label: t.common.reset, icon: Eraser, onClick: handleReset },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: handleCopy },
        { id: "download", label: t.common.download, icon: Download, onClick: handleDownload },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <Instagram className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {toolT.description}
                    </p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.08fr_0.92fr]">
                <div className="space-y-4 rounded-xl border bg-card p-4">
                    <div className="rounded-lg border bg-background/60">
                        <div className="tool-pane-header">{t.common.story_media}</div>
                        <div
                            className="grid min-h-[250px] cursor-pointer place-items-center border-t border-dashed bg-muted/15 p-4"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => {
                                event.preventDefault()
                                const file = event.dataTransfer.files?.[0]
                                if (file) void handleFile(file)
                            }}
                        >
                            {outputDataUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={outputDataUrl} alt={toolT.preview_alt} className="max-h-[230px] max-w-full rounded-lg border object-contain" />
                            ) : null}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={IMAGE_FILE_POLICY.accept}
                                className="hidden"
                                onChange={(event) => {
                                    const file = event.currentTarget.files?.[0]
                                    event.currentTarget.value = ""
                                    if (file) void handleFile(file)
                                }}
                            />
                            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                                <Upload className="h-3.5 w-3.5" />
                                <span>{activeFileLabel}</span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border bg-background/60">
                        <div className="tool-pane-header">{t.common.story_content}</div>
                        <div className="grid gap-3 border-t p-3 sm:grid-cols-2">
                            <Field label={outputUsernameLabel} value={username} onChange={setUsername} />
                            <Field label={t.common.cta_label} value={cta} onChange={setCta} />
                            <label className="space-y-1.5 rounded-lg border bg-background/70 p-3 sm:col-span-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.common.headline}</span>
                                <Textarea value={headline} onChange={(event) => setHeadline(event.target.value)} className="min-h-[86px] text-sm" />
                            </label>
                            <label className="space-y-1.5 rounded-lg border bg-background/70 p-3 sm:col-span-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.common.subline}</span>
                                <Textarea value={subline} onChange={(event) => setSubline(event.target.value)} className="min-h-[86px] text-sm" />
                            </label>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5 rounded-lg border bg-background/60 p-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{outputThemeLabel}</div>
                            <div className="grid grid-cols-2 gap-1">
                                {(["light", "dark"] as SocialTheme[]).map((value) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setTheme(value)}
                                    className={`min-h-11 rounded-md border px-2 text-xs uppercase tracking-wide ${
                                            theme === value
                                                ? "border-primary/40 bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {value === "light" ? toolT.theme_light : toolT.theme_dark}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <RangeField
                            label={outputProgressLabel}
                            value={Math.round(progress * 100)}
                            min={0}
                            max={100}
                            onChange={(value) => setProgress(value / 100)}
                            suffix="%"
                        />

                        <ColorField label={t.common.accent_color} value={accentColor} onChange={setAccentColor} />
                        <ColorField label={outputGradientStartLabel} value={gradientStart} onChange={setGradientStart} />
                        <ColorField label={outputGradientEndLabel} value={gradientEnd} onChange={setGradientEnd} />
                    </div>
                </div>

                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card">
                    <ToolPreviewArea
                        title={t.common.output}
                        metadata="1080x1920"
                        className="mb-3"
                    >
                        {outputDataUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={outputDataUrl}
                                alt={toolT.preview_alt}
                                className="max-h-[400px] w-auto rounded object-contain drop-shadow-md"
                            />
                        ) : (
                            <div className="grid h-[180px] place-items-center text-xs text-muted-foreground">
                                {t.common.preview_will_appear_here}
                            </div>
                        )}
                    </ToolPreviewArea>
                    <div className="flex-1 p-0">
                        <Textarea
                            readOnly
                            value={output}
                            className="h-full min-h-[260px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
