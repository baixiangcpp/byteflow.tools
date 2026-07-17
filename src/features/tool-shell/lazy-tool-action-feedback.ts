"use client"

import type { TranslationType } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { isToastLiveRegionReady } from "@/core/feedback/toast-live-region-state"
import type { ToolActionResult } from "./tool-action-bar"

let feedbackSequence = 0

function nextFeedbackId() {
    feedbackSequence += 1
    return `lazy-tool-action-feedback-${feedbackSequence}`
}

export async function copyTextWithLazyToolFeedback(
    t: TranslationType,
    text: string,
    label: string,
    description?: string,
): Promise<ToolActionResult> {
    const copyResult = await safeClipboardWrite(text)
    const status = copyResult.ok ? "success" : "failed"
    const message = copyResult.ok ? t.common.copied : t.common.copy_failed
    const detail = copyResult.ok ? description || `${label}: ${t.common.copied_desc}` : label
    const toastId = nextFeedbackId()

    if (!isToastLiveRegionReady()) {
        return { status, message, description: detail, announce: true }
    }

    try {
        const { toast } = await import("sonner")
        const options = { id: toastId, description: detail }
        if (copyResult.ok) {
            toast.success(message, options)
        } else {
            toast.error(message, options)
        }
        return { status, message, description: detail, announce: false }
    } catch {
        return { status, message, description: detail, announce: true }
    }
}
