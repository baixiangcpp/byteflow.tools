import * as React from "react"
import { ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import type { RecipePrivacyScope } from "@/features/pipeline/recipe-sanitizer"

type PendingPrivacyAction = "save" | "export" | "share"

type PipelinePrivacyPreviewProps = {
    action: PendingPrivacyAction
    closeLabel: string
    onCancel: () => void
    onCloseAutoFocus: (event: Event) => void
    onConfirm: () => void
    open: boolean
    scope: RecipePrivacyScope
    text: (key: string) => string
}

export function PipelinePrivacyPreview({
    action,
    closeLabel,
    onCancel,
    onCloseAutoFocus,
    onConfirm,
    open,
    scope,
    text,
}: PipelinePrivacyPreviewProps) {
    const confirmButtonRef = React.useRef<HTMLButtonElement>(null)
    const handleOpenAutoFocus = React.useCallback((event: Event) => {
        event.preventDefault()
        confirmButtonRef.current?.focus()
    }, [])

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onCancel() }}>
            <DialogContent
                className="max-h-[min(85dvh,44rem)] overflow-y-auto sm:max-w-2xl"
                closeLabel={closeLabel}
                onOpenAutoFocus={handleOpenAutoFocus}
                onCloseAutoFocus={onCloseAutoFocus}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                        {text("privacy_preview_title")}
                    </DialogTitle>
                    <DialogDescription>{text(`privacy_preview_${action}`)}</DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border bg-background/70 p-3">
                        <h3 className="text-xs font-semibold uppercase text-muted-foreground">{text("privacy_preview_included")}</h3>
                        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                            {scope.included.map((item) => <li key={item}>{text(item)}</li>)}
                        </ul>
                    </div>
                    <div className="rounded-md border bg-background/70 p-3">
                        <h3 className="text-xs font-semibold uppercase text-muted-foreground">{text("privacy_preview_excluded")}</h3>
                        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                            {scope.excluded.map((item) => <li key={item}>{text(item)}</li>)}
                        </ul>
                    </div>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" size="sm" variant="outline">
                            {text("privacy_preview_cancel")}
                        </Button>
                    </DialogClose>
                    <Button ref={confirmButtonRef} type="button" size="sm" onClick={onConfirm}>
                        {text(`privacy_preview_confirm_${action}`)}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
