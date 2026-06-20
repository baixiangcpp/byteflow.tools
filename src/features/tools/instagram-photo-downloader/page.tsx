"use client"

import * as React from "react"
import { AlertTriangle, CheckCircle2, Copy, Download, Eraser, ImageDown, TestTube2 } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { ToolPreviewArea } from "@/features/tool-shell/tool-preview-area"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { openExternalUrl } from "@/core/security/external-url"
import {
    canDownloadAuthorizedInstagramMedia,
    getInstagramMediaFilename,
    parseInstagramMediaInput,
} from "@/core/utils/instagram-tool-utils"

const SAMPLE_URL = "https://www.instagram.com/p/C5M0YfJt5gX/"

export function InstagramPhotoDownloaderPage() {
    const { t } = useLang()
    const toolT = t.tools["instagram_photo_downloader"] as Record<string, string>
    const text = React.useCallback((key: string) => toolT[key], [toolT])

    const [inputUrl, setInputUrl] = React.useState("")
    const [rightsConfirmed, setRightsConfirmed] = React.useState(false)
    const [statusNote, setStatusNote] = React.useState("")
    const [previewApproved, setPreviewApproved] = React.useState(false)

    const statusReadyLine = text("status_ready_line")
    const statusPendingLine = text("status_pending_line")
    const statusInvalidUrl = text("status_invalid_url")
    const statusHttpsOnly = text("status_https_only")
    const statusPostReelUnsupported = text("status_post_reel_unsupported")
    const statusDirectImageOnly = text("status_direct_image_only")
    const statusConfirmRights = text("status_confirm_rights")
    const statusReadyAuthorized = text("status_ready_authorized")
    const guidanceNeedInput = text("guidance_need_input")
    const guidancePassed = text("guidance_passed")
    const outputComplianceMode = text("output_compliance_mode")
    const outputUrlLabel = text("output_url_label")
    const outputHostLabel = text("output_host_label")
    const outputKindLabel = text("output_kind_label")
    const outputHttpsLabel = text("output_https_label")
    const outputRightsConfirmedLabel = text("output_rights_confirmed_label")
    const outputYes = text("output_yes")
    const outputNo = text("output_no")

    const parsed = React.useMemo(() => parseInstagramMediaInput(inputUrl), [inputUrl])
    const canDownload = React.useMemo(
        () => canDownloadAuthorizedInstagramMedia(parsed, rightsConfirmed),
        [parsed, rightsConfirmed],
    )

    const output = React.useMemo(
        () =>
            [
                outputComplianceMode,
                `${outputUrlLabel}: ${parsed?.normalizedUrl || "-"}`,
                `${outputHostLabel}: ${parsed?.hostname || "-"}`,
                `${outputKindLabel}: ${parsed?.kind || "invalid"}`,
                `${outputHttpsLabel}: ${parsed?.isHttps ? outputYes : outputNo}`,
                `${outputRightsConfirmedLabel}: ${rightsConfirmed ? outputYes : outputNo}`,
                "",
                canDownload
                    ? statusReadyLine
                    : statusNote || statusPendingLine,
            ].join("\n"),
        [
            canDownload,
            outputComplianceMode,
            outputHostLabel,
            outputHttpsLabel,
            outputKindLabel,
            outputNo,
            outputRightsConfirmedLabel,
            outputUrlLabel,
            outputYes,
            parsed,
            rightsConfirmed,
            statusNote,
            statusPendingLine,
            statusReadyLine,
        ],
    )

    React.useEffect(() => {
        if (!inputUrl.trim()) {
            setStatusNote("")
            return
        }
        if (!parsed) {
            setStatusNote(statusInvalidUrl)
            return
        }
        if (!parsed.isHttps) {
            setStatusNote(statusHttpsOnly)
            return
        }
        if (parsed.kind === "instagram_post") {
            setStatusNote(statusPostReelUnsupported)
            return
        }
        if (parsed.kind === "unsupported") {
            setStatusNote(statusDirectImageOnly)
            return
        }
        if (!rightsConfirmed) {
            setStatusNote(statusConfirmRights)
            return
        }
        setStatusNote(statusReadyAuthorized)
    }, [
        inputUrl,
        parsed,
        rightsConfirmed,
        statusConfirmRights,
        statusDirectImageOnly,
        statusHttpsOnly,
        statusInvalidUrl,
        statusPostReelUnsupported,
        statusReadyAuthorized,
    ])

    const handleSample = () => {
        setInputUrl(SAMPLE_URL)
        setRightsConfirmed(false)
        setPreviewApproved(false)
    }

    const handleReset = () => {
        setInputUrl("")
        setRightsConfirmed(false)
        setStatusNote("")
        setPreviewApproved(false)
    }

    const handleLoadPreview = () => {
        if (!canDownload) {
            toast.error(t.common.download_blocked_until_checks_pass)
            return
        }
        setPreviewApproved(true)
    }

    const handleCopy = async () => {
        const result = await safeClipboardWrite(output)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }

    const handleDownload = async () => {
        if (!parsed || !canDownload) {
            toast.error(t.common.download_blocked_until_checks_pass)
            return
        }

        const filename = getInstagramMediaFilename(parsed.normalizedUrl)

        try {
            const response = await fetch(parsed.normalizedUrl)
            if (!response.ok) throw new Error("FETCH_FAILED")
            const blob = await response.blob()
            const objectUrl = URL.createObjectURL(blob)

            const anchor = document.createElement("a")
            anchor.href = objectUrl
            anchor.download = filename
            anchor.click()
            URL.revokeObjectURL(objectUrl)
            toast.success((t.common.downloaded_file).replace("{filename}", filename))
        } catch {
            openExternalUrl(parsed.normalizedUrl)
            toast.info(
                t.common.direct_download_blocked_opened_new_tab,
            )
        }
    }

    const actions: ToolAction[] = [
        { id: "sample", label: t.common.sample, icon: TestTube2, onClick: handleSample },
        { id: "reset", label: t.common.reset, icon: Eraser, onClick: handleReset },
        { id: "preview", label: t.common.preview, icon: ImageDown, onClick: handleLoadPreview, disabled: !canDownload },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: () => void handleCopy() },
        { id: "download", label: t.common.download, icon: Download, onClick: () => void handleDownload(), disabled: !canDownload },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <ImageDown className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {toolT.description}
                    </p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-4 rounded-xl border bg-card p-4">
                    <div className="rounded-lg border bg-background/60">
                        <div className="tool-pane-header">{t.common.input_url}</div>
                        <div className="space-y-3 border-t p-3">
                            <Input
                                value={inputUrl}
                                onChange={(event) => {
                                    setInputUrl(event.target.value)
                                    setPreviewApproved(false)
                                }}
                                placeholder="https://…"
                                spellCheck={false}
                            />
                            <label className="flex items-start gap-2 rounded-lg border bg-background/80 p-3 text-sm leading-relaxed">
                                <input
                                    type="checkbox"
                                    checked={rightsConfirmed}
                                    onChange={(event) => {
                                        setRightsConfirmed(event.target.checked)
                                        setPreviewApproved(false)
                                    }}
                                    className="mt-0.5 h-4 w-4"
                                />
                                <span>
                                    {text("rights_confirm_label")}
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="rounded-lg border bg-background/60">
                        <div className="tool-pane-header">{t.common.compliance_guidance}</div>
                        <div className="space-y-2 border-t p-3 text-sm text-muted-foreground">
                            <div className="rounded-md border bg-background/80 p-3">
                                {text("compliance_notice")}
                            </div>
                            {canDownload ? (
                                <div className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-700 dark:text-emerald-300">
                                    <CheckCircle2 className="mt-0.5 h-4 w-4" />
                                    <span>{guidancePassed}</span>
                                </div>
                            ) : (
                                <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-amber-700 dark:text-amber-300">
                                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                                    <span>{statusNote || guidanceNeedInput}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.output}</span>
                        <span className="text-xs font-normal text-muted-foreground">{t.common.status_preview}</span>
                    </div>
                    <div className="p-3 border-b">
                        <ToolPreviewArea
                            title={t.common.preview}
                            metadata={parsed?.kind}
                        >
                            {canDownload && parsed && previewApproved ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={parsed.normalizedUrl}
                                    alt={`${toolT.title} ${t.common.preview}`}
                                    className="max-h-[400px] w-auto rounded object-contain drop-shadow-md"
                                />
                            ) : (
                                <div className="grid h-[180px] place-items-center text-xs text-muted-foreground">
                                    {text("preview_pending")}
                                </div>
                            )}
                        </ToolPreviewArea>
                    </div>
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
