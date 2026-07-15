"use client"

import * as React from "react"
import { AlertTriangle, CheckCircle2, Copy, Download, Eraser, ImageDown, TestTube2 } from "lucide-react"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { copyTextWithToolFeedback, downloadedFileFeedback, notifyToolActionFailure, notifyToolActionSuccess } from "@/features/tool-shell/tool-action-feedback"
import { ExternalRequestConfirmation } from "@/features/tool-shell/external-request-confirmation"
import { isBrowserOffline, useBrowserOnlineStatus } from "@/features/tool-shell/external-request-offline"
import { ExternalRequestStatus, type ExternalRequestStatusKind } from "@/features/tool-shell/external-request-status"
import { TextOutputPanel } from "@/features/tool-shell/text-output-panel"
import { ToolPreviewArea } from "@/features/tool-shell/tool-preview-area"
import { SensitiveInputWarning } from "@/features/tool-shell/sensitive-input-warning"
import { openExternalUrl } from "@/core/security/external-url"
import {
    canDownloadAuthorizedInstagramMedia,
    getInstagramMediaFilename,
    parseInstagramMediaInput,
} from "@/core/utils/instagram-tool-utils"
import { ToolPageContainer } from "@/components/layout/page-container"

const SAMPLE_URL = "https://www.instagram.com/p/C5M0YfJt5gX/"
const EXTERNAL_HOSTS = ["instagram.com"] as const

export function InstagramPhotoDownloaderPage() {
    const { t } = useLang()
    const toolT = t.tools["instagram_photo_downloader"] as Record<string, string>
    const text = React.useCallback((key: string) => toolT[key], [toolT])

    const [inputUrl, setInputUrl] = React.useState("")
    const [rightsConfirmed, setRightsConfirmed] = React.useState(false)
    const [statusNote, setStatusNote] = React.useState("")
    const [previewApproved, setPreviewApproved] = React.useState(false)
    const [externalRequestConfirmed, setExternalRequestConfirmed] = React.useState(false)
    const [requestStatus, setRequestStatus] = React.useState<ExternalRequestStatusKind>("idle")
    const [requestNextStep, setRequestNextStep] = React.useState(t.common.external_request_status.next_step_add_input)
    const isOnline = useBrowserOnlineStatus()

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
            setRequestStatus("idle")
            setRequestNextStep(t.common.external_request_status.next_step_add_input)
            return
        }
        if (!parsed) {
            setStatusNote(statusInvalidUrl)
            setRequestStatus("invalid")
            setRequestNextStep(t.common.external_request_status.next_step_fix_input)
            return
        }
        if (!parsed.isHttps) {
            setStatusNote(statusHttpsOnly)
            setRequestStatus("invalid")
            setRequestNextStep(t.common.external_request_status.next_step_fix_input)
            return
        }
        if (parsed.kind === "instagram_post") {
            setStatusNote(statusPostReelUnsupported)
            setRequestStatus("blocked")
            setRequestNextStep(t.common.external_request_status.next_step_try_another)
            return
        }
        if (parsed.kind === "unsupported") {
            setStatusNote(statusDirectImageOnly)
            setRequestStatus("invalid")
            setRequestNextStep(t.common.external_request_status.next_step_fix_input)
            return
        }
        if (!rightsConfirmed) {
            setStatusNote(statusConfirmRights)
            setRequestStatus("permission")
            setRequestNextStep(t.common.external_request_status.next_step_check_permission)
            return
        }
        setStatusNote(statusReadyAuthorized)
        setRequestStatus(!isOnline && externalRequestConfirmed ? "offline" : externalRequestConfirmed ? "ready" : "permission")
        setRequestNextStep(externalRequestConfirmed
            ? !isOnline
                ? t.common.external_request_status.next_step_reconnect
                : t.common.external_request_status.next_step_preview
            : t.common.external_request_status.next_step_confirm)
    }, [
        externalRequestConfirmed,
        inputUrl,
        isOnline,
        parsed,
        rightsConfirmed,
        statusConfirmRights,
        statusDirectImageOnly,
        statusHttpsOnly,
        statusInvalidUrl,
        statusPostReelUnsupported,
        statusReadyAuthorized,
        t.common.external_request_status,
    ])

    const handleSample = () => {
        setInputUrl(SAMPLE_URL)
        setRightsConfirmed(false)
        setPreviewApproved(false)
        setExternalRequestConfirmed(false)
    }

    const handleReset = () => {
        setInputUrl("")
        setRightsConfirmed(false)
        setStatusNote("")
        setPreviewApproved(false)
        setExternalRequestConfirmed(false)
    }

    const handleLoadPreview = () => {
        if (!canDownload) {
            setRequestStatus("blocked")
            setRequestNextStep(t.common.external_request_status.next_step_check_permission)
            return notifyToolActionFailure(t, {
                kind: "share",
                label: t.common.preview,
                title: t.common.download_blocked_until_checks_pass,
                description: t.common.external_request_status.next_step_check_permission,
            })
        }
        if (!externalRequestConfirmed) {
            setRequestStatus("permission")
            setRequestNextStep(t.common.external_request_status.next_step_confirm)
            return notifyToolActionFailure(t, {
                kind: "share",
                label: t.common.preview,
                title: t.common.external_network_notice.confirm_required,
                description: t.common.external_request_status.next_step_confirm,
            })
        }
        if (isBrowserOffline()) {
            setStatusNote(t.common.external_network_notice.offline_required)
            setRequestStatus("offline")
            setRequestNextStep(t.common.external_request_status.next_step_reconnect)
            return notifyToolActionFailure(t, {
                kind: "share",
                label: t.common.preview,
                title: t.common.external_network_notice.offline_required,
                description: t.common.external_request_status.next_step_reconnect,
            })
        }
        setPreviewApproved(true)
        setRequestStatus("success")
        setRequestNextStep(t.common.external_request_status.next_step_download)
        return notifyToolActionSuccess(t, {
            kind: "share",
            label: t.common.preview,
            title: t.common.action_status_success.replace("{action}", t.common.preview),
            description: t.common.external_request_status.next_step_download,
        })
    }

    const handleCopy = async () => {
        return copyTextWithToolFeedback(t, output, t.common.output)
    }

    const handleDownload = async () => {
        if (!parsed || !canDownload) {
            setRequestStatus("blocked")
            setRequestNextStep(t.common.external_request_status.next_step_check_permission)
            return notifyToolActionFailure(t, {
                kind: "download",
                label: t.common.download,
                title: t.common.download_blocked_until_checks_pass,
                description: t.common.external_request_status.next_step_check_permission,
            })
        }
        if (!externalRequestConfirmed) {
            setRequestStatus("permission")
            setRequestNextStep(t.common.external_request_status.next_step_confirm)
            return notifyToolActionFailure(t, {
                kind: "download",
                label: t.common.download,
                title: t.common.external_network_notice.confirm_required,
                description: t.common.external_request_status.next_step_confirm,
            })
        }
        if (isBrowserOffline()) {
            setStatusNote(t.common.external_network_notice.offline_required)
            setRequestStatus("offline")
            setRequestNextStep(t.common.external_request_status.next_step_reconnect)
            return notifyToolActionFailure(t, {
                kind: "download",
                label: t.common.download,
                title: t.common.external_network_notice.offline_required,
                description: t.common.external_request_status.next_step_reconnect,
            })
        }

        const filename = getInstagramMediaFilename(parsed.normalizedUrl)
        setRequestStatus("requesting")
        setRequestNextStep(t.common.external_request_status.next_step_wait)

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
            setRequestStatus("success")
            setRequestNextStep(t.common.external_request_status.next_step_download)
            return downloadedFileFeedback(t, filename, parsed.normalizedUrl)
        } catch {
            openExternalUrl(parsed.normalizedUrl)
            setRequestStatus("blocked")
            setRequestNextStep(t.common.external_request_status.next_step_open_remote)
            return notifyToolActionFailure(t, {
                kind: "download",
                label: t.common.download,
                title: t.common.direct_download_blocked_opened_new_tab,
                description: t.common.external_request_status.next_step_open_remote,
            })
        }
    }

    const actions: ToolAction[] = [
        { id: "sample", label: t.common.sample, icon: TestTube2, onClick: handleSample },
        { id: "reset", label: t.common.reset, icon: Eraser, onClick: handleReset },
        {
            id: "preview",
            label: t.common.preview,
            icon: ImageDown,
            onClick: handleLoadPreview,
            disabled: !canDownload || !externalRequestConfirmed || !isOnline,
            disabledReason: !canDownload
                ? t.common.download_blocked_until_checks_pass
                : !externalRequestConfirmed
                    ? t.common.external_network_notice.confirm_required
                    : t.common.external_network_notice.offline_required,
        },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: handleCopy },
        {
            id: "download",
            label: t.common.download,
            icon: Download,
            onClick: handleDownload,
            disabled: !canDownload || !externalRequestConfirmed || !isOnline,
            disabledReason: !canDownload
                ? t.common.download_blocked_until_checks_pass
                : !externalRequestConfirmed
                    ? t.common.external_network_notice.confirm_required
                    : t.common.external_network_notice.offline_required,
        },
    ]

    return (
        <ToolPageContainer className="flex h-full flex-col space-y-6">
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

            <SensitiveInputWarning variant="request" />

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
                                    setExternalRequestConfirmed(false)
                                }}
                                placeholder="https://…"
                                aria-label={t.common.input_url}
                                aria-describedby="instagram-media-status"
                                spellCheck={false}
                            />
                            <label className="flex items-start gap-2 rounded-lg border bg-background/80 p-3 text-sm leading-relaxed">
                                <input
                                    type="checkbox"
                                    checked={rightsConfirmed}
                                    onChange={(event) => {
                                        setRightsConfirmed(event.target.checked)
                                        setPreviewApproved(false)
                                        setExternalRequestConfirmed(false)
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
                            <ExternalRequestConfirmation
                                hosts={EXTERNAL_HOSTS}
                                purposeKey="authorized_media_download"
                                dataSent="user_provided_url"
                                confirmed={externalRequestConfirmed}
                                onConfirmedChange={(confirmed) => {
                                    setExternalRequestConfirmed(confirmed)
                                    if (!confirmed) setPreviewApproved(false)
                                    if (confirmed) {
                                        setRequestStatus(canDownload ? "ready" : requestStatus)
                                        setRequestNextStep(canDownload
                                            ? t.common.external_request_status.next_step_preview
                                            : requestNextStep)
                                    } else {
                                        setRequestStatus(canDownload ? "permission" : requestStatus)
                                        setRequestNextStep(canDownload
                                            ? t.common.external_request_status.next_step_confirm
                                            : requestNextStep)
                                    }
                                }}
                                rightsGuidance={text("compliance_notice")}
                            />
                            <div className="rounded-md border bg-background/80 p-3">
                                {text("compliance_notice")}
                            </div>
                            {canDownload ? (
                                <div role="status" aria-live="polite" className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-700 dark:text-emerald-300">
                                    <CheckCircle2 className="mt-0.5 h-4 w-4" />
                                    <span>{guidancePassed}</span>
                                </div>
                            ) : (
                                <div role="status" aria-live="polite" className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-amber-700 dark:text-amber-300">
                                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                                    <span>{statusNote || guidanceNeedInput}</span>
                                </div>
                            )}
                            <ExternalRequestStatus
                                id="instagram-media-status"
                                status={requestStatus}
                                message={statusNote || guidanceNeedInput}
                                nextStep={requestNextStep}
                                hosts={EXTERNAL_HOSTS}
                            />
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
                    <TextOutputPanel
                        title={t.common.output}
                        ariaLabel={t.common.output}
                        value={output}
                        className="flex-1 rounded-none border-0"
                    />
                </div>
            </div>
        </ToolPageContainer>
    )
}
