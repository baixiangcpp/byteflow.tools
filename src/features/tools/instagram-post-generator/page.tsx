"use client"

import * as React from "react"
import { Copy, Download, Eraser, Instagram, TestTube2, Upload } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { ToolPreviewArea } from "@/features/tool-shell/tool-preview-area"
import { createDemoImageDataUrl, fileToDataUrl, loadImageElement } from "@/core/utils/image-canvas-utils"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import {
    formatCompactNumber,
    resolveSocialThemeColors,
    wrapLines,
    type SocialTheme,
} from "@/core/utils/social-media-utils"

const MAX_FILE_SIZE = 12 * 1024 * 1024

const DEFAULT_STATE = {
    username: "s42.lab",
    likes: 1432,
    comments: 86,
    theme: "dark" as SocialTheme,
    accentColor: "#22d3ee",
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

export function InstagramPostGeneratorPage() {
    const { t } = useLang()
    const toolT = t.tools["instagram_post_generator"] as Record<string, string>
    const outputUsernameLabel = toolT.output_username_label
    const outputLocationLabel = toolT.output_location_label
    const outputLikesLabel = toolT.output_likes_label
    const outputCommentsLabel = toolT.output_comments_label
    const outputThemeLabel = toolT.output_theme_label
    const outputAccentLabel = toolT.output_accent_label
    const outputCanvasLabel = toolT.output_canvas_label
    const outputCanvasValue = toolT.output_canvas_value
    const outputFormatLabel = toolT.output_format_label
    const outputFormatPng = toolT.output_format_png

    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const demoSrcRef = React.useRef("")

    const [imageSrc, setImageSrc] = React.useState("")
    const [fileName, setFileName] = React.useState("")
    const [username, setUsername] = React.useState(DEFAULT_STATE.username)
    const [location, setLocation] = React.useState(() => toolT.default_location)
    const [caption, setCaption] = React.useState(() => toolT.default_caption)
    const [likes, setLikes] = React.useState(DEFAULT_STATE.likes)
    const [comments, setComments] = React.useState(DEFAULT_STATE.comments)
    const [theme, setTheme] = React.useState<SocialTheme>(DEFAULT_STATE.theme)
    const [accentColor, setAccentColor] = React.useState(DEFAULT_STATE.accentColor)
    const [outputDataUrl, setOutputDataUrl] = React.useState("")
    const activeFileLabel = fileName || (imageSrc ? t.common.sample_image : t.common.drop_image_or_click_upload)

    React.useEffect(() => {
        if (!demoSrcRef.current) demoSrcRef.current = createDemoImageDataUrl(1080, 1080)
    }, [])

    React.useEffect(() => {
        const render = async () => {
            const src = imageSrc || demoSrcRef.current
            if (!src) return

            const image = await loadImageElement(src)
            const palette = resolveSocialThemeColors(theme)

            const canvas = document.createElement("canvas")
            canvas.width = 1080
            canvas.height = 1380
            const context = canvas.getContext("2d")
            if (!context) return

            context.fillStyle = palette.surface
            context.fillRect(0, 0, canvas.width, canvas.height)

            context.fillStyle = palette.subtle
            context.fillRect(0, 0, canvas.width, 140)
            context.fillStyle = palette.border
            context.fillRect(0, 138, canvas.width, 2)

            context.beginPath()
            context.arc(74, 70, 28, 0, Math.PI * 2)
            context.fillStyle = accentColor
            context.fill()

            context.fillStyle = palette.textPrimary
            context.font = "700 34px ui-sans-serif, system-ui"
            context.fillText(username, 118, 64)
            context.fillStyle = palette.textMuted
            context.font = "500 24px ui-sans-serif, system-ui"
            context.fillText(location || outputLocationLabel, 118, 96)

            drawCoverImage(context, image, 0, 140, 1080, 1080)

            context.fillStyle = palette.subtle
            context.fillRect(0, 1220, canvas.width, 160)
            context.fillStyle = palette.border
            context.fillRect(0, 1218, canvas.width, 2)

            context.fillStyle = accentColor
            context.beginPath()
            context.arc(64, 1268, 14, 0, Math.PI * 2)
            context.fill()
            context.beginPath()
            context.arc(112, 1268, 14, 0, Math.PI * 2)
            context.fill()
            context.beginPath()
            context.arc(160, 1268, 14, 0, Math.PI * 2)
            context.fill()

            context.fillStyle = palette.textPrimary
            context.font = "700 24px ui-sans-serif, system-ui"
            context.fillText(`${formatCompactNumber(likes)} ${toolT.likes_stat_suffix}`, 48, 1318)

            context.fillStyle = palette.textPrimary
            context.font = "700 23px ui-sans-serif, system-ui"
            context.fillText(username, 48, 1352)

            const captionLines = wrapLines(caption, 66, 2)
            context.font = "500 23px ui-sans-serif, system-ui"
            context.fillStyle = palette.textMuted
            if (captionLines[0]) context.fillText(captionLines[0], 220, 1352)
            if (captionLines[1]) context.fillText(captionLines[1], 48, 1378)

            setOutputDataUrl(canvas.toDataURL("image/png"))
        }

        void render()
    }, [accentColor, caption, comments, imageSrc, likes, location, outputLocationLabel, theme, toolT.likes_stat_suffix, username])

    const output = React.useMemo(
        () =>
            [
                `${outputUsernameLabel}: ${username}`,
                `${outputLocationLabel}: ${location}`,
                `${outputLikesLabel}: ${likes}`,
                `${outputCommentsLabel}: ${comments}`,
                `${outputThemeLabel}: ${theme}`,
                `${outputAccentLabel}: ${accentColor.toUpperCase()}`,
                "",
                `${outputCanvasLabel}: ${outputCanvasValue}`,
                `${outputFormatLabel}: ${outputFormatPng}`,
            ].join("\n"),
        [
            accentColor,
            comments,
            likes,
            location,
            outputAccentLabel,
            outputCanvasLabel,
            outputCanvasValue,
            outputCommentsLabel,
            outputFormatLabel,
            outputFormatPng,
            outputLikesLabel,
            outputLocationLabel,
            outputThemeLabel,
            outputUsernameLabel,
            theme,
            username,
        ],
    )

    const handleFile = async (file: File) => {
        if (!file.type.startsWith("image/")) {
            toast.error(t.common.image_file_required)
            return
        }
        if (file.size > MAX_FILE_SIZE) {
            toast.error((t.common.image_file_too_large).replace("{size}", "12MB"))
            return
        }
        try {
            const dataUrl = await fileToDataUrl(file)
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
        setLocation(toolT.sample_location)
        setCaption(toolT.sample_caption)
        setLikes(5821)
        setComments(214)
        setTheme("dark")
        setAccentColor("#38bdf8")
    }

    const handleReset = () => {
        setImageSrc("")
        setFileName("")
        setUsername(DEFAULT_STATE.username)
        setLocation(toolT.default_location)
        setCaption(toolT.default_caption)
        setLikes(DEFAULT_STATE.likes)
        setComments(DEFAULT_STATE.comments)
        setTheme(DEFAULT_STATE.theme)
        setAccentColor(DEFAULT_STATE.accentColor)
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
        anchor.download = "instagram-post.png"
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
                        <div className="tool-pane-header">{t.common.input_media}</div>
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
                                <img src={outputDataUrl} alt={toolT.preview_alt} className="max-h-[220px] max-w-full rounded-lg border object-contain" />
                            ) : null}
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
                            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                                <Upload className="h-3.5 w-3.5" />
                                <span>{activeFileLabel}</span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border bg-background/60">
                        <div className="tool-pane-header">{t.common.post_content}</div>
                        <div className="grid gap-3 border-t p-3 sm:grid-cols-2">
                            <Field label={outputUsernameLabel} value={username} onChange={setUsername} />
                            <Field label={outputLocationLabel} value={location} onChange={setLocation} />
                            <Field label={outputLikesLabel} value={String(likes)} onChange={(v) => setLikes(Math.max(0, Number(v) || 0))} />
                            <Field label={outputCommentsLabel} value={String(comments)} onChange={(v) => setComments(Math.max(0, Number(v) || 0))} />

                            <label className="space-y-1.5 rounded-lg border bg-background/70 p-3 sm:col-span-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.common.caption}</span>
                                <Textarea value={caption} onChange={(event) => setCaption(event.target.value)} className="min-h-[92px] text-sm" />
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

                        <label className="space-y-1.5 rounded-lg border bg-background/60 p-3">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.common.accent_color}</span>
                            <div className="flex items-center gap-2">
                                <Input type="color" value={accentColor} onChange={(event) => setAccentColor(event.target.value)} className="h-10 w-14 cursor-pointer p-1" />
                                <Input value={accentColor} onChange={(event) => setAccentColor(event.target.value)} className="font-mono text-xs" spellCheck={false} />
                            </div>
                        </label>
                    </div>
                </div>

                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card">
                    <ToolPreviewArea
                        title={t.common.output}
                        metadata="1080x1380"
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

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return (
        <label className="space-y-1.5 rounded-lg border bg-background/70 p-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
            <Input value={value} onChange={(event) => onChange(event.target.value)} spellCheck={false} />
        </label>
    )
}
