"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatFilePolicyLimit, formatPixelLimit, type FileInputPolicy } from "@/core/files/file-input-policy"
import { useLang } from "@/core/i18n/lang-provider"

export type FileUploadStatusState = "idle" | "loading" | "processing" | "complete" | "error" | "cancelled"

export function FileUploadStatus({
    policy,
    status = "idle",
    message,
    progress,
    onCancel,
}: {
    policy: FileInputPolicy
    status?: FileUploadStatusState
    message?: string
    progress?: number
    onCancel?: () => void
}) {
    const { t } = useLang()
    const normalizedProgress = typeof progress === "number"
        ? Math.max(0, Math.min(100, Math.round(progress)))
        : undefined
    const busy = status === "loading" || status === "processing"

    return (
        <div className="rounded-lg border bg-background/60 p-3 text-xs text-muted-foreground">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                    <p className="font-medium text-foreground">{t.common.file_upload_requirements}</p>
                    <p>
                        {t.common.accepted_input}: {policy.accept}. {t.common.max_file_size}: {formatFilePolicyLimit(policy)}
                        {policy.maxPixels ? `; ${t.common.max_resolution}: ${formatPixelLimit(policy.maxPixels)}` : ""}.
                    </p>
                    {message ? (
                        <p role="status" aria-live="polite" className={status === "error" ? "text-destructive" : undefined}>
                            {message}
                        </p>
                    ) : null}
                </div>
                {busy && onCancel ? (
                    <Button type="button" variant="outline" size="sm" onClick={onCancel} className="min-h-9 shrink-0">
                        <X className="mr-1.5 h-3.5 w-3.5" />
                        {t.common.cancel}
                    </Button>
                ) : null}
            </div>
            {normalizedProgress !== undefined ? (
                <div className="mt-3">
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${normalizedProgress}%` }} />
                    </div>
                    <div className="mt-1 text-[11px] tabular-nums">{normalizedProgress}%</div>
                </div>
            ) : null}
        </div>
    )
}
