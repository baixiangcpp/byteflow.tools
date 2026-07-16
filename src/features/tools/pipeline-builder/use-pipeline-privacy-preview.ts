import * as React from "react"
import type { ToolActionResult } from "@/features/tool-shell/tool-action-bar"
import { useDialogReturnFocus } from "@/hooks/use-dialog-return-focus"

type PendingPrivacyAction = "save" | "export" | "share"

type UsePipelinePrivacyPreviewOptions = {
    onExport: () => unknown
    onSave: () => unknown
    onShare: () => unknown
    setActionAnnouncement: React.Dispatch<React.SetStateAction<string>>
    text: (key: string) => string
}

export function usePipelinePrivacyPreview({
    onExport,
    onSave,
    onShare,
    setActionAnnouncement,
    text,
}: UsePipelinePrivacyPreviewOptions) {
    const { captureReturnFocus, restoreReturnFocus } = useDialogReturnFocus()
    const [privacyPreviewAction, setPrivacyPreviewAction] = React.useState<PendingPrivacyAction>("export")
    const [privacyPreviewOpen, setPrivacyPreviewOpen] = React.useState(false)

    const requestPrivacyPreview = React.useCallback((
        action: PendingPrivacyAction,
        announceInPageStatus = false,
    ): ToolActionResult => {
        const feedback: ToolActionResult = {
            status: "success",
            message: text("privacy_preview_title"),
            description: text(`privacy_preview_${action}`),
        }
        captureReturnFocus()
        setPrivacyPreviewAction(action)
        setPrivacyPreviewOpen(true)
        if (announceInPageStatus) {
            setActionAnnouncement(`${feedback.message}. ${feedback.description}`)
        }
        return feedback
    }, [captureReturnFocus, setActionAnnouncement, text])

    const cancelPrivacyPreview = React.useCallback(() => {
        setPrivacyPreviewOpen(false)
    }, [])

    const confirmPrivacyPreview = React.useCallback(() => {
        setPrivacyPreviewOpen(false)
        if (privacyPreviewAction === "save") {
            void onSave()
        } else if (privacyPreviewAction === "export") {
            onExport()
        } else if (privacyPreviewAction === "share") {
            void onShare()
        }
    }, [onExport, onSave, onShare, privacyPreviewAction])

    return {
        cancelPrivacyPreview,
        confirmPrivacyPreview,
        privacyPreviewAction,
        privacyPreviewOpen,
        requestPrivacyPreview,
        restorePrivacyReturnFocus: restoreReturnFocus,
    }
}
