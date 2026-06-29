"use client"

import * as React from "react"
import { Copy, Download, Eraser, MessageCircle, TestTube2, Upload } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { ToolPreviewArea } from "@/features/tool-shell/tool-preview-area"
import { fileToDataUrl, loadImageElement } from "@/core/utils/image-canvas-utils"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import {
    formatCompactNumber,
    resolveSocialThemeColors,
    wrapLines,
    type SocialTheme,
} from "@/core/utils/social-media-utils"

const MAX_FILE_SIZE = 5 * 1024 * 1024

const DEFAULT_STATE = {
    displayName: "S42 Lab",
    handle: "@s42lab",
    content: "",
    replies: 28,
    reposts: 124,
    likes: 980,
    verified: true,
    theme: "dark" as SocialTheme,
    accentColor: "#38bdf8",
}

function drawAvatar(context: CanvasRenderingContext2D, x: number, y: number, size: number, accentColor: string, avatarImage: HTMLImageElement | null, initials: string) {
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
        context.font = "700 34px ui-sans-serif, system-ui"
        context.fillText(initials, x + 17, y + 49)
    }
    context.restore()
}

export function TweetGeneratorPage() {
    const { t } = useLang()
    const toolT = t.tools["tweet_generator"] as Record<string, string>
    const pageTitle = toolT.title
    const defaultContent = toolT.sample_content
    const outputDisplayNameLabel = toolT.output_display_name_label
    const outputHandleLabel = toolT.output_handle_label
    const outputVerifiedLabel = toolT.output_verified_label
    const outputRepliesLabel = toolT.output_replies_label
    const outputRepostsLabel = toolT.output_reposts_label
    const outputLikesLabel = toolT.output_likes_label
    const outputThemeLabel = toolT.output_theme_label
    const outputAccentLabel = toolT.output_accent_label
    const outputCanvasLabel = toolT.output_canvas_label
    const outputCanvasValue = toolT.output_canvas_value
    const outputFormatLabel = toolT.output_format_label
    const outputFormatPng = toolT.output_format_png
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

    const [displayName, setDisplayName] = React.useState(DEFAULT_STATE.displayName)
    const [handle, setHandle] = React.useState(DEFAULT_STATE.handle)
    const [content, setContent] = React.useState(() => defaultContent)
    const [replies, setReplies] = React.useState(DEFAULT_STATE.replies)
    const [reposts, setReposts] = React.useState(DEFAULT_STATE.reposts)
    const [likes, setLikes] = React.useState(DEFAULT_STATE.likes)
    const [verified, setVerified] = React.useState(DEFAULT_STATE.verified)
    const [theme, setTheme] = React.useState<SocialTheme>(DEFAULT_STATE.theme)
    const [accentColor, setAccentColor] = React.useState(DEFAULT_STATE.accentColor)
    const [avatarDataUrl, setAvatarDataUrl] = React.useState("")
    const [avatarName, setAvatarName] = React.useState("")
    const [outputDataUrl, setOutputDataUrl] = React.useState("")

    React.useEffect(() => {
        const render = async () => {
            const palette = resolveSocialThemeColors(theme)
            const avatarImage = avatarDataUrl ? await loadImageElement(avatarDataUrl) : null

            const canvas = document.createElement("canvas")
            canvas.width = 1200
            canvas.height = 680
            const context = canvas.getContext("2d")
            if (!context) return

            context.fillStyle = palette.surface
            context.fillRect(0, 0, canvas.width, canvas.height)

            context.strokeStyle = palette.border
            context.lineWidth = 2
            context.strokeRect(32, 32, canvas.width - 64, canvas.height - 64)

            const initials = (displayName.trim().slice(0, 2) || "BF").toUpperCase()
            drawAvatar(context, 88, 90, 84, accentColor, avatarImage, initials)

            context.fillStyle = palette.textPrimary
            context.font = "700 38px ui-sans-serif, system-ui"
            context.fillText(displayName || outputDisplayNameLabel, 192, 132)

            if (verified) {
                context.fillStyle = accentColor
                context.beginPath()
                context.arc(480, 118, 14, 0, Math.PI * 2)
                context.fill()
            }

            context.fillStyle = palette.textMuted
            context.font = "500 30px ui-sans-serif, system-ui"
            context.fillText(handle || DEFAULT_STATE.handle, 192, 170)

            const lines = wrapLines(content, 66, 6)
            context.fillStyle = palette.textPrimary
            context.font = "500 42px ui-sans-serif, system-ui"
            lines.forEach((line, index) => {
                context.fillText(line, 92, 260 + index * 62)
            })

            context.strokeStyle = palette.border
            context.beginPath()
            context.moveTo(84, 530)
            context.lineTo(1116, 530)
            context.stroke()

            context.fillStyle = palette.textMuted
            context.font = "500 28px ui-sans-serif, system-ui"
            context.fillText("2026-02-26 20:45 UTC", 92, 578)

            context.fillStyle = palette.textPrimary
            context.font = "700 28px ui-sans-serif, system-ui"
            context.fillText(formatCompactNumber(replies), 92, 628)
            context.fillStyle = palette.textMuted
            context.font = "500 26px ui-sans-serif, system-ui"
            context.fillText(outputRepliesLabel, 160, 628)

            context.fillStyle = palette.textPrimary
            context.font = "700 28px ui-sans-serif, system-ui"
            context.fillText(formatCompactNumber(reposts), 350, 628)
            context.fillStyle = palette.textMuted
            context.font = "500 26px ui-sans-serif, system-ui"
            context.fillText(outputRepostsLabel, 432, 628)

            context.fillStyle = palette.textPrimary
            context.font = "700 28px ui-sans-serif, system-ui"
            context.fillText(formatCompactNumber(likes), 650, 628)
            context.fillStyle = palette.textMuted
            context.font = "500 26px ui-sans-serif, system-ui"
            context.fillText(outputLikesLabel, 730, 628)

            setOutputDataUrl(canvas.toDataURL("image/png"))
        }

        void render()
    }, [
        accentColor,
        avatarDataUrl,
        content,
        displayName,
        handle,
        likes,
        outputDisplayNameLabel,
        outputLikesLabel,
        outputRepliesLabel,
        outputRepostsLabel,
        replies,
        reposts,
        theme,
        verified,
    ])

    const output = React.useMemo(
        () =>
            [
                `${outputDisplayNameLabel}: ${displayName}`,
                `${outputHandleLabel}: ${handle}`,
                `${outputVerifiedLabel}: ${verified ? outputYes : outputNo}`,
                `${outputRepliesLabel}: ${replies}`,
                `${outputRepostsLabel}: ${reposts}`,
                `${outputLikesLabel}: ${likes}`,
                `${outputThemeLabel}: ${themeLabels[theme]}`,
                `${outputAccentLabel}: ${accentColor.toUpperCase()}`,
                "",
                `${outputCanvasLabel}: ${outputCanvasValue}`,
                `${outputFormatLabel}: ${outputFormatPng}`,
            ].join("\n"),
        [
            accentColor,
            displayName,
            handle,
            likes,
            outputAccentLabel,
            outputCanvasLabel,
            outputCanvasValue,
            outputDisplayNameLabel,
            outputFormatLabel,
            outputFormatPng,
            outputHandleLabel,
            outputLikesLabel,
            outputNo,
            outputRepliesLabel,
            outputRepostsLabel,
            outputThemeLabel,
            outputVerifiedLabel,
            outputYes,
            replies,
            reposts,
            theme,
            themeLabels,
            verified,
        ],
    )

    const handleAvatarFile = async (file: File) => {
        if (!file.type.startsWith("image/")) {
            toast.error(t.common.image_file_required)
            return
        }
        if (file.size > MAX_FILE_SIZE) {
            toast.error((t.common.image_file_too_large).replace("{size}", "5MB"))
            return
        }
        try {
            const dataUrl = await fileToDataUrl(file)
            setAvatarDataUrl(dataUrl)
            setAvatarName(file.name)
        } catch {
            toast.error(t.common.avatar_file_read_failed)
        }
    }

    const handleSample = () => {
        setDisplayName(DEFAULT_STATE.displayName)
        setHandle(DEFAULT_STATE.handle)
        setContent(defaultContent)
        setReplies(52)
        setReposts(248)
        setLikes(1320)
        setVerified(true)
        setTheme("dark")
        setAccentColor("#22d3ee")
    }

    const handleReset = () => {
        setDisplayName(DEFAULT_STATE.displayName)
        setHandle(DEFAULT_STATE.handle)
        setContent(defaultContent)
        setReplies(DEFAULT_STATE.replies)
        setReposts(DEFAULT_STATE.reposts)
        setLikes(DEFAULT_STATE.likes)
        setVerified(DEFAULT_STATE.verified)
        setTheme(DEFAULT_STATE.theme)
        setAccentColor(DEFAULT_STATE.accentColor)
        setAvatarDataUrl("")
        setAvatarName("")
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
        anchor.download = "tweet-card.png"
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
                        <MessageCircle className="h-6 w-6 text-primary" />
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
                        <div className="tool-pane-header">{t.common.tweet_content}</div>
                        <div className="grid gap-3 border-t p-3 sm:grid-cols-2">
                            <Field label={outputDisplayNameLabel} value={displayName} onChange={setDisplayName} />
                            <Field label={outputHandleLabel} value={handle} onChange={setHandle} />

                            <label className="space-y-1.5 rounded-lg border bg-background/70 p-3 sm:col-span-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.common.content}</span>
                                <Textarea value={content} onChange={(event) => setContent(event.target.value)} className="min-h-[90px] text-sm" />
                            </label>

                            <Field label={outputRepliesLabel} value={String(replies)} onChange={(v) => setReplies(Math.max(0, Number(v) || 0))} />
                            <Field label={outputRepostsLabel} value={String(reposts)} onChange={(v) => setReposts(Math.max(0, Number(v) || 0))} />
                            <Field label={outputLikesLabel} value={String(likes)} onChange={(v) => setLikes(Math.max(0, Number(v) || 0))} />

                            <label className="flex min-h-11 items-center gap-2 rounded-lg border bg-background/70 px-3 text-sm sm:col-span-2">
                                <input type="checkbox" checked={verified} onChange={(event) => setVerified(event.target.checked)} className="h-4 w-4" />
                                {t.common.verified_badge}
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
                                        {themeLabels[value]}
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

                        <div className="rounded-lg border bg-background/60 p-3 sm:col-span-2">
                            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.common.avatar}</div>
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
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(event) => {
                                        const file = event.target.files?.[0]
                                        if (file) void handleAvatarFile(file)
                                    }}
                                />
                                {avatarName ? <span className="text-xs text-muted-foreground">{avatarName}</span> : null}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card">
                    <ToolPreviewArea
                        title={t.common.output}
                        metadata="1200x680"
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
