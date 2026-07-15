"use client"

import { Field } from "./components"
import * as React from "react"
import { Copy, Download, Eraser, ImageIcon, TestTube2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { useLang } from "@/core/i18n/lang-provider"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { ToolPreviewArea } from "@/features/tool-shell/tool-preview-area"
import { FILE_INPUT_POLICIES, validateFileAgainstPolicy } from "@/core/files/file-input-policy"
import { fileToDataUrl, loadImageElement, validateImageDimensions } from "@/core/utils/image-canvas-utils"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { resolveSocialThemeColors, wrapLines, type SocialTheme } from "@/core/utils/social-media-utils"
import { FileUploadStatus, type FileUploadStatusState } from "@/features/tool-shell/file-upload-status"
import { ToolPageContainer } from "@/components/layout/page-container"

type CanvasPreset = "landscape" | "square" | "portrait"

const PRESET_SIZE: Record<CanvasPreset, { width: number; height: number; label: string }> = {
    landscape: { width: 1200, height: 675, label: "1200x675" },
    square: { width: 1080, height: 1080, label: "1080x1080" },
    portrait: { width: 1080, height: 1350, label: "1080x1350" },
}

const DEFAULT_STATE = {
    displayName: "S42 Lab",
    handle: "@s42lab",
    text: "",
    verified: true,
    theme: "dark" as SocialTheme,
    accentColor: "#38bdf8",
    preset: "landscape" as CanvasPreset,
    fontSize: 44,
}

function drawAvatar(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    accentColor: string,
    avatarImage: HTMLImageElement | null,
    initials: string,
) {
    context.save()
    context.beginPath()
    context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
    context.closePath()
    context.clip()

    if (avatarImage) {
        const ratio = Math.max(size / avatarImage.width, size / avatarImage.height)
        const drawW = avatarImage.width * ratio
        const drawH = avatarImage.height * ratio
        const dx = x + (size - drawW) / 2
        const dy = y + (size - drawH) / 2
        context.drawImage(avatarImage, dx, dy, drawW, drawH)
    } else {
        context.fillStyle = accentColor
        context.fillRect(x, y, size, size)
        context.fillStyle = "#ffffff"
        context.font = `700 ${Math.round(size * 0.38)}px ui-sans-serif, system-ui`
        context.fillText(initials, x + size * 0.2, y + size * 0.62)
    }
    context.restore()
}

export function TweetToImageConverterPage() {
    const { t } = useLang()
    const toolT = t.tools["tweet_to_image_converter"] as Record<string, string>
    const pageTitle = toolT.title
    const defaultText = toolT.sample_text
    const noneLabel = t.common.none
    const outputDisplayNameLabel = toolT.output_display_name_label
    const outputHandleLabel = toolT.output_handle_label
    const outputThemeLabel = toolT.output_theme_label
    const outputVerifiedLabel = toolT.output_verified_label
    const outputPresetLabel = toolT.output_preset_label
    const outputFontSizeLabel = toolT.output_font_size_label
    const outputAccentLabel = toolT.output_accent_label
    const outputAvatarLabel = toolT.output_avatar_label
    const outputCanvasLabel = toolT.output_canvas_label
    const outputFormatLabel = toolT.output_format_label
    const outputFormatValue = toolT.output_format_png
    const outputYes = toolT.output_yes
    const outputNo = toolT.output_no
    const themeLabels = React.useMemo<Record<SocialTheme, string>>(
        () => ({
            light: toolT.theme_light,
            dark: toolT.theme_dark,
        }),
        [toolT.theme_dark, toolT.theme_light],
    )
    const avatarInputRef = React.useRef<HTMLInputElement>(null)
    const avatarReadAbortControllerRef = React.useRef<AbortController | null>(null)
    const avatarPolicy = FILE_INPUT_POLICIES["image-logo"]

    const [displayName, setDisplayName] = React.useState(DEFAULT_STATE.displayName)
    const [handle, setHandle] = React.useState(DEFAULT_STATE.handle)
    const [text, setText] = React.useState(() => defaultText)
    const [verified, setVerified] = React.useState(DEFAULT_STATE.verified)
    const [theme, setTheme] = React.useState<SocialTheme>(DEFAULT_STATE.theme)
    const [accentColor, setAccentColor] = React.useState(DEFAULT_STATE.accentColor)
    const [preset, setPreset] = React.useState<CanvasPreset>(DEFAULT_STATE.preset)
    const [fontSize, setFontSize] = React.useState(DEFAULT_STATE.fontSize)
    const [avatarDataUrl, setAvatarDataUrl] = React.useState("")
    const [avatarName, setAvatarName] = React.useState("")
    const [outputDataUrl, setOutputDataUrl] = React.useState("")
    const [avatarUploadStatus, setAvatarUploadStatus] = React.useState<FileUploadStatusState>("idle")
    const [avatarUploadMessage, setAvatarUploadMessage] = React.useState("")

    React.useEffect(() => () => {
        avatarReadAbortControllerRef.current?.abort()
    }, [])

    React.useEffect(() => {
        const render = async () => {
            const palette = resolveSocialThemeColors(theme)
            const size = PRESET_SIZE[preset]
            const avatarImage = avatarDataUrl ? await loadImageElement(avatarDataUrl) : null

            const canvas = document.createElement("canvas")
            canvas.width = size.width
            canvas.height = size.height
            const context = canvas.getContext("2d")
            if (!context) return

            const gradient = context.createLinearGradient(0, 0, size.width, size.height)
            gradient.addColorStop(0, theme === "dark" ? "#0f172a" : "#f8fafc")
            gradient.addColorStop(1, theme === "dark" ? "#1e293b" : "#e2e8f0")
            context.fillStyle = gradient
            context.fillRect(0, 0, size.width, size.height)

            const cardX = Math.round(size.width * 0.06)
            const cardY = Math.round(size.height * 0.08)
            const cardW = Math.round(size.width * 0.88)
            const cardH = Math.round(size.height * 0.84)

            context.fillStyle = palette.surface
            context.strokeStyle = palette.border
            context.lineWidth = 2
            context.beginPath()
            context.roundRect(cardX, cardY, cardW, cardH, 24)
            context.fill()
            context.stroke()

            const avatarSize = Math.round(cardW * 0.1)
            const avatarX = cardX + 36
            const avatarY = cardY + 30
            const initials = (displayName.trim().slice(0, 2) || "BF").toUpperCase()
            drawAvatar(context, avatarX, avatarY, avatarSize, accentColor, avatarImage, initials)

            const nameX = avatarX + avatarSize + 20
            context.fillStyle = palette.textPrimary
            context.font = `700 ${Math.round(cardW * 0.041)}px ui-sans-serif, system-ui`
            context.fillText(displayName || outputDisplayNameLabel, nameX, avatarY + 40)

            if (verified) {
                context.fillStyle = accentColor
                context.beginPath()
                context.arc(nameX + 270, avatarY + 29, 11, 0, Math.PI * 2)
                context.fill()
            }

            context.fillStyle = palette.textMuted
            context.font = `500 ${Math.round(cardW * 0.031)}px ui-sans-serif, system-ui`
            context.fillText(handle || DEFAULT_STATE.handle, nameX, avatarY + 76)

            const maxChars = preset === "portrait" ? 34 : preset === "square" ? 41 : 54
            const maxLines = preset === "portrait" ? 10 : preset === "square" ? 8 : 6
            const lines = wrapLines(text, maxChars, maxLines)

            context.fillStyle = palette.textPrimary
            context.font = `500 ${fontSize}px ui-sans-serif, system-ui`
            lines.forEach((line, index) => {
                context.fillText(line, avatarX, avatarY + avatarSize + 72 + index * Math.round(fontSize * 1.35))
            })

            const footerY = cardY + cardH - 38
            context.strokeStyle = palette.border
            context.beginPath()
            context.moveTo(cardX + 32, footerY - 38)
            context.lineTo(cardX + cardW - 32, footerY - 38)
            context.stroke()

            context.fillStyle = palette.textMuted
            context.font = `500 ${Math.round(cardW * 0.024)}px ui-sans-serif, system-ui`
            context.fillText(pageTitle, cardX + 32, footerY)

            setOutputDataUrl(canvas.toDataURL("image/png"))
        }

        void render()
    }, [accentColor, avatarDataUrl, displayName, fontSize, handle, outputDisplayNameLabel, pageTitle, preset, text, theme, verified])

    const output = React.useMemo(
        () =>
            [
                `${outputDisplayNameLabel}: ${displayName}`,
                `${outputHandleLabel}: ${handle}`,
                `${outputThemeLabel}: ${themeLabels[theme]}`,
                `${outputVerifiedLabel}: ${verified ? outputYes : outputNo}`,
                `${outputPresetLabel}: ${PRESET_SIZE[preset].label}`,
                `${outputFontSizeLabel}: ${fontSize}px`,
                `${outputAccentLabel}: ${accentColor.toUpperCase()}`,
                `${outputAvatarLabel}: ${avatarName || noneLabel}`,
                "",
                `${outputCanvasLabel}: ${PRESET_SIZE[preset].label}`,
                `${outputFormatLabel}: ${outputFormatValue}`,
            ].join("\n"),
        [
            accentColor,
            avatarName,
            displayName,
            fontSize,
            handle,
            noneLabel,
            outputAccentLabel,
            outputAvatarLabel,
            outputCanvasLabel,
            outputDisplayNameLabel,
            outputFontSizeLabel,
            outputFormatLabel,
            outputFormatValue,
            outputHandleLabel,
            outputNo,
            outputPresetLabel,
            outputThemeLabel,
            outputVerifiedLabel,
            outputYes,
            preset,
            theme,
            themeLabels,
            verified,
        ],
    )

    const handleAvatarFile = async (file: File) => {
        const validation = validateFileAgainstPolicy(file, avatarPolicy)
        if (!validation.ok) {
            setAvatarUploadStatus("error")
            setAvatarUploadMessage(validation.message)
            toast.error(validation.message)
            return
        }

        avatarReadAbortControllerRef.current?.abort()
        const controller = new AbortController()
        avatarReadAbortControllerRef.current = controller
        setAvatarUploadStatus("loading")
        setAvatarUploadMessage(t.common.loading_file_locally)

        try {
            const dataUrl = await fileToDataUrl(file, avatarPolicy, { signal: controller.signal })
            if (controller.signal.aborted) return
            const image = await loadImageElement(dataUrl)
            validateImageDimensions(image.width, image.height, avatarPolicy)
            setAvatarDataUrl(dataUrl)
            setAvatarName(file.name)
            setAvatarUploadStatus("complete")
            setAvatarUploadMessage(t.common.file_ready_locally)
        } catch (error) {
            const isCancelled = error instanceof Error && error.message === "FILE_READ_ABORTED"
            setAvatarUploadStatus(isCancelled ? "cancelled" : "error")
            setAvatarUploadMessage(isCancelled ? t.common.file_processing_cancelled : t.common.avatar_file_read_failed)
            if (!isCancelled) toast.error(t.common.avatar_file_read_failed)
        } finally {
            if (avatarReadAbortControllerRef.current === controller) {
                avatarReadAbortControllerRef.current = null
            }
        }
    }

    const handleCancelAvatarUpload = () => {
        avatarReadAbortControllerRef.current?.abort()
        avatarReadAbortControllerRef.current = null
        setAvatarUploadStatus("cancelled")
        setAvatarUploadMessage(t.common.file_processing_cancelled)
    }

    const handleSample = () => {
        avatarReadAbortControllerRef.current?.abort()
        setDisplayName(DEFAULT_STATE.displayName)
        setHandle(DEFAULT_STATE.handle)
        setText(defaultText)
        setVerified(true)
        setTheme("dark")
        setAccentColor("#22d3ee")
        setPreset("landscape")
        setFontSize(42)
        setAvatarDataUrl("")
        setAvatarName("")
        setAvatarUploadStatus("idle")
        setAvatarUploadMessage("")
    }

    const handleReset = () => {
        avatarReadAbortControllerRef.current?.abort()
        setDisplayName(DEFAULT_STATE.displayName)
        setHandle(DEFAULT_STATE.handle)
        setText(defaultText)
        setVerified(DEFAULT_STATE.verified)
        setTheme(DEFAULT_STATE.theme)
        setAccentColor(DEFAULT_STATE.accentColor)
        setPreset(DEFAULT_STATE.preset)
        setFontSize(DEFAULT_STATE.fontSize)
        setAvatarDataUrl("")
        setAvatarName("")
        setAvatarUploadStatus("idle")
        setAvatarUploadMessage("")
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
        anchor.download = "tweet-image.png"
        anchor.click()
    }

    const actions: ToolAction[] = [
        { id: "sample", label: t.common.sample, icon: TestTube2, onClick: handleSample },
        { id: "reset", label: t.common.reset, icon: Eraser, onClick: handleReset },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: handleCopy },
        { id: "download", label: t.common.download, icon: Download, onClick: handleDownload },
    ]

    return (
        <ToolPageContainer className="flex h-full flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <ImageIcon className="h-6 w-6 text-primary" />
                        {pageTitle}
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
                        <div className="tool-pane-header">{t.common.tweet_input}</div>
                        <div className="grid gap-3 border-t p-3 sm:grid-cols-2">
                            <Field label={outputDisplayNameLabel} value={displayName} onChange={setDisplayName} />
                            <Field label={outputHandleLabel} value={handle} onChange={setHandle} />
                            <label className="space-y-1.5 rounded-lg border bg-background/70 p-3 sm:col-span-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.common.tweet_text}</span>
                                <Textarea value={text} onChange={(event) => setText(event.target.value)} className="min-h-[96px] text-sm" />
                            </label>

                            <label className="flex min-h-11 items-center gap-2 rounded-lg border bg-background/70 px-3 text-sm sm:col-span-2">
                                <input type="checkbox" checked={verified} onChange={(event) => setVerified(event.target.checked)} className="h-4 w-4" />
                                {t.common.verified_badge}
                            </label>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="space-y-1.5 rounded-lg border bg-background/60 p-3">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.common.canvas_preset}</span>
                            <div className="grid grid-cols-3 gap-1">
                                {(Object.keys(PRESET_SIZE) as CanvasPreset[]).map((value) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setPreset(value)}
                                        className={`min-h-11 rounded-md border px-2 text-xs uppercase tracking-wide ${
                                            preset === value
                                                ? "border-primary/40 bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {PRESET_SIZE[value].label}
                                    </button>
                                ))}
                            </div>
                        </label>

                        <label className="space-y-1.5 rounded-lg border bg-background/60 p-3">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{outputThemeLabel}</span>
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
                                        {themeLabels[value]}
                                    </button>
                                ))}
                            </div>
                        </label>

                        <label className="space-y-1.5 rounded-lg border bg-background/60 p-3">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{outputFontSizeLabel}</span>
                            <Input type="range" min={28} max={60} value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} className="cursor-pointer" />
                            <div className="text-xs text-muted-foreground">{fontSize}px</div>
                        </label>

                        <label className="space-y-1.5 rounded-lg border bg-background/60 p-3">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.common.accent_color}</span>
                            <div className="flex items-center gap-2">
                                <Input type="color" value={accentColor} onChange={(event) => setAccentColor(event.target.value)} className="h-10 w-14 cursor-pointer p-1" />
                                <Input value={accentColor} onChange={(event) => setAccentColor(event.target.value)} className="font-mono text-xs" spellCheck={false} />
                            </div>
                        </label>

                        <div className="rounded-lg border bg-background/60 p-3 sm:col-span-2">
                            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.common.upload_avatar}</div>
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => avatarInputRef.current?.click()}
                                    className="inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm text-muted-foreground hover:text-foreground"
                                >
                                    <Upload className="h-4 w-4" />
                                    {t.common.upload_avatar}
                                </button>
                                <input
                                    ref={avatarInputRef}
                                    type="file"
                                    accept={avatarPolicy.accept}
                                    className="hidden"
                                    onChange={(event) => {
                                        const file = event.target.files?.[0]
                                        if (file) void handleAvatarFile(file)
                                    }}
                                />
                                {avatarName ? <span className="text-xs text-muted-foreground">{avatarName}</span> : null}
                            </div>
                            <div className="mt-3">
                                <FileUploadStatus
                                    policy={avatarPolicy}
                                    status={avatarUploadStatus}
                                    message={avatarUploadMessage}
                                    progress={avatarUploadStatus === "loading" ? 50 : avatarUploadStatus === "complete" ? 100 : undefined}
                                    onCancel={avatarUploadStatus === "loading" ? handleCancelAvatarUpload : undefined}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card">
                    <ToolPreviewArea
                        title={t.common.output}
                        metadata={PRESET_SIZE[preset].label}
                        className="mb-3"
                    >
                        {outputDataUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={outputDataUrl}
                                alt={pageTitle}
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
        </ToolPageContainer>
    )
}
