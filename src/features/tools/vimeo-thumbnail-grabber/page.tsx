"use client"

import * as React from "react"
import { Clapperboard, Copy, Download, Eraser, ImageDown, ShieldCheck, TestTube2 } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { ToolPreviewArea } from "@/features/tool-shell/tool-preview-area"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import {
    buildVimeoThumbnailCandidates,
    parseVimeoVideoId,
    probeFirstWorkingThumbnail,
    type ThumbnailCandidate,
} from "@/core/utils/thumbnail-grabber-utils"

const SAMPLE_URL = "https://vimeo.com/76979871"

export function VimeoThumbnailGrabberPage() {
    const { t } = useLang()
    const toolT = t.tools["vimeo_thumbnail_grabber"] as Record<string, string>
    const noneLabel = t.common.none
    const statusIdle = (t.common.thumbnail_status_idle).replace("{platform}", "Vimeo")
    const statusInvalid = (t.common.thumbnail_status_invalid).replace("{platform}", "Vimeo")
    const statusReady = t.common.thumbnail_status_ready
    const statusUnreachable = t.common.thumbnail_status_unreachable
    const statusAutoSelectedTemplate = t.common.thumbnail_status_auto_selected
    const outputVideoIdLabel = t.common.thumbnail_output_video_id
    const outputSelectedUrlLabel = t.common.thumbnail_output_selected_url
    const outputCandidatesLabel = t.common.thumbnail_output_candidates
    const outputStatusLabel = t.common.thumbnail_output_status
    const parsedVideoIdLabel = t.common.parsed_video_id_label
    const noCandidatesYetLabel = t.common.no_candidates_yet

    const [url, setUrl] = React.useState("")
    const [videoId, setVideoId] = React.useState("")
    const [candidates, setCandidates] = React.useState<ThumbnailCandidate[]>([])
    const [selectedUrl, setSelectedUrl] = React.useState("")
    const [status, setStatus] = React.useState(statusIdle)
    const [previewApproved, setPreviewApproved] = React.useState(false)

    React.useEffect(() => {
        const id = parseVimeoVideoId(url)
        if (!id) {
            setVideoId("")
            setCandidates([])
            setSelectedUrl("")
            setPreviewApproved(false)
            setStatus(url.trim() ? statusInvalid : statusIdle)
            return
        }

        const next = buildVimeoThumbnailCandidates(id)
        setVideoId(id)
        setCandidates(next)
        setSelectedUrl(next[0]?.url || "")
        setPreviewApproved(false)
        setStatus(statusReady)
    }, [statusAutoSelectedTemplate, statusIdle, statusInvalid, statusReady, statusUnreachable, url])

    const output = React.useMemo(
        () =>
            [
                `${outputVideoIdLabel}: ${videoId || noneLabel}`,
                `${outputSelectedUrlLabel}: ${selectedUrl || noneLabel}`,
                "",
                `${outputCandidatesLabel}:`,
                ...candidates.map((item) => `- ${item.label}: ${item.url}`),
                "",
                `${outputStatusLabel}: ${status}`,
            ].join("\n"),
        [candidates, noneLabel, outputCandidatesLabel, outputSelectedUrlLabel, outputStatusLabel, outputVideoIdLabel, selectedUrl, status, videoId],
    )

    const handleSample = () => setUrl(SAMPLE_URL)
    const handleReset = () => setUrl("")
    const handleLoadPreview = () => {
        if (candidates.length === 0) return
        setPreviewApproved(true)
        setStatus(statusReady)
        void (async () => {
            const firstWorking = await probeFirstWorkingThumbnail(candidates)
            if (firstWorking) {
                setSelectedUrl(firstWorking.url)
                setStatus(statusAutoSelectedTemplate.replace("{label}", firstWorking.label))
            } else {
                setStatus(statusUnreachable)
            }
        })()
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
        if (!selectedUrl) return
        const anchor = document.createElement("a")
        anchor.href = selectedUrl
        anchor.target = "_blank"
        anchor.rel = "noopener noreferrer"
        anchor.download = `vimeo-thumbnail-${videoId || "image"}.jpg`
        anchor.click()
    }

    const actions: ToolAction[] = [
        { id: "sample", label: t.common.sample, icon: TestTube2, onClick: handleSample },
        { id: "reset", label: t.common.reset, icon: Eraser, onClick: handleReset },
        { id: "preview", label: t.common.preview, icon: ImageDown, onClick: handleLoadPreview, disabled: candidates.length === 0 },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: () => void handleCopy() },
        { id: "download", label: t.common.download, icon: Download, onClick: handleDownload, disabled: !selectedUrl || !previewApproved },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <Clapperboard className="h-6 w-6 text-primary" />
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
                        <div className="tool-pane-header">{t.common.video_url}</div>
                        <div className="space-y-3 border-t p-3">
                            <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://vimeo.com/…" spellCheck={false} />
                            <div className="rounded-md border bg-background/80 p-3 text-xs text-muted-foreground">
                                {parsedVideoIdLabel}: <span className="font-mono text-foreground">{videoId || noneLabel}</span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border bg-background/60">
                        <div className="tool-pane-header">{t.common.compliance_guidance}</div>
                        <div className="space-y-2 border-t p-3 text-sm text-muted-foreground">
                            <div className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-700 dark:text-emerald-300">
                                <ShieldCheck className="mt-0.5 h-4 w-4" />
                                <span>{t.common.thumbnail_public_only_notice}</span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border bg-background/60">
                        <div className="tool-pane-header">{t.common.thumbnail_options}</div>
                        <div className="grid gap-2 border-t p-3 sm:grid-cols-2">
                            {candidates.length === 0 ? (
                                <div className="col-span-2 rounded-md border bg-background/80 p-3 text-xs text-muted-foreground">{noCandidatesYetLabel}</div>
                            ) : (
                                candidates.map((item) => (
                                    <button
                                        key={item.url}
                                        type="button"
                                        onClick={() => setSelectedUrl(item.url)}
                                        className={`min-h-11 rounded-md border px-3 text-left text-xs ${
                                            selectedUrl === item.url
                                                ? "border-primary/40 bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        <div className="font-semibold uppercase tracking-wide">{item.label}</div>
                                        <div className="mt-1 line-clamp-1 font-mono">{item.url}</div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card">
                    <ToolPreviewArea
                        title={t.common.preview_url_list || t.common.preview}
                        metadata={selectedUrl ? "JPG" : undefined}
                        className="rounded-none border-0 border-b"
                    >
                        {selectedUrl && previewApproved ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={selectedUrl}
                                alt={`${toolT.title} ${t.common.preview}`}
                                className="max-h-[300px] w-auto rounded object-contain drop-shadow-md"
                            />
                        ) : (
                            <div className="text-xs text-muted-foreground">{t.common.preview_will_appear_here}</div>
                        )}
                    </ToolPreviewArea>
                    <div className="space-y-3 border-b bg-background/30 p-3">
                        <div className="rounded-lg border bg-background p-2 text-xs text-muted-foreground">
                            <ImageDown className="mr-1 inline h-3.5 w-3.5" />
                            {status}
                        </div>
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
