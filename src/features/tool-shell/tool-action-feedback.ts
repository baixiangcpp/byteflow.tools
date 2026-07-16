"use client"

import { toast } from "sonner"
import type { TranslationType } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { isToastLiveRegionReady, queueToastFeedback } from "@/core/feedback/toast-live-region-state"
import type { ToolActionResult } from "./tool-action-bar"

type ActionFeedbackKind = "copy" | "download" | "export" | "share"

type ActionFeedbackOptions = {
    kind: ActionFeedbackKind
    label: string
    title?: string
    description?: string
}

function result(status: "success" | "failed", message: string, description: string | undefined, announce: boolean): ToolActionResult {
    return { status, message, description, announce }
}

export function notifyToolActionSuccess(
    t: TranslationType,
    { kind, label, title, description }: ActionFeedbackOptions,
): ToolActionResult {
    const fallbackTitle = kind === "download" || kind === "export"
        ? t.common.downloaded_file.replace("{filename}", label)
        : t.common.copied
    const message = title || fallbackTitle
    const detail = description || (kind === "copy" ? `${label}: ${t.common.copied_desc}` : undefined)

    const announceInToolbar = !isToastLiveRegionReady()
    const toastId = toast.success(message, detail ? { description: detail } : undefined)
    if (announceInToolbar) {
        queueToastFeedback({ id: toastId, type: "success", message, description: detail })
    }
    return result("success", message, detail, announceInToolbar)
}

export function notifyToolActionFailure(
    t: TranslationType,
    { label, title, description }: ActionFeedbackOptions,
): ToolActionResult {
    const message = title || t.common.copy_failed
    const detail = description || label

    const announceInToolbar = !isToastLiveRegionReady()
    const toastId = toast.error(message, detail ? { description: detail } : undefined)
    if (announceInToolbar) {
        queueToastFeedback({ id: toastId, type: "error", message, description: detail })
    }
    return result("failed", message, detail, announceInToolbar)
}

export async function copyTextWithToolFeedback(
    t: TranslationType,
    text: string,
    label: string,
    description?: string,
): Promise<ToolActionResult> {
    const copyResult = await safeClipboardWrite(text)
    if (!copyResult.ok) {
        return notifyToolActionFailure(t, {
            kind: "copy",
            label,
            title: t.common.copy_failed,
        })
    }

    return notifyToolActionSuccess(t, {
        kind: "copy",
        label,
        description,
    })
}

export function downloadedFileFeedback(
    t: TranslationType,
    filename: string,
    description?: string,
): ToolActionResult {
    return notifyToolActionSuccess(t, {
        kind: "download",
        label: filename,
        description,
    })
}
