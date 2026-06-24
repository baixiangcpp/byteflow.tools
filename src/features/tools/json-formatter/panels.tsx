import { Braces } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolEmptyState } from "@/features/tool-shell/tool-empty-state"
import type { JsonParseErrorDetails } from "./error-utils"
import type { TreeDialogState } from "./types"

interface JsonErrorAlertProps {
    details: JsonParseErrorDetails | null
    error: string | null
    text: (key: string) => string
}

export function JsonErrorAlert({ details, error, text }: JsonErrorAlertProps) {
    if (!error) return null

    return (
        <div id="json-formatter-error" role="alert" className="rounded-md bg-destructive/90 p-3 text-sm font-medium text-destructive-foreground">
            <p>{error}</p>
            {details?.line != null && details?.column != null ? (
                <p className="mt-1 text-xs font-normal opacity-90">
                    {text("json_error_location")}: {details.line}:{details.column}
                </p>
            ) : null}
            {details?.snippet ? (
                <pre className="mt-2 max-h-32 overflow-auto rounded bg-background/15 p-2 text-xs font-normal text-destructive-foreground">
                    <code>{details.snippet}</code>
                </pre>
            ) : null}
        </div>
    )
}

interface JsonInputHeaderProps {
    input: string
    text: (key: string) => string
}

export function JsonInputHeader({ input, text }: JsonInputHeaderProps) {
    if (!input) return null

    const inputSizeLabel = input.length < 1_000_000
        ? `${Math.round(input.length / 1024)} KB`
        : `${(input.length / 1024 / 1024).toFixed(1)} MB`
    const sizeText = input.length >= 1_000_000
        ? text("large_input_hint").replace("{size}", inputSizeLabel)
        : inputSizeLabel

    return <span className="text-xs text-muted-foreground">{sizeText}</span>
}

interface JsonTextOutputEmptyStateProps {
    hasInput: boolean
    text: (key: string) => string
}

export function JsonTextOutputEmptyState({ hasInput, text }: JsonTextOutputEmptyStateProps) {
    return (
        <ToolEmptyState
            icon={Braces}
            title={text("output_empty")}
            description={hasInput ? text("output_empty_ready") : text("output_empty_description")}
            className="h-full"
        />
    )
}

interface JsonTreeEditDialogProps {
    applyLabel: string
    closeLabel: string
    dialog: TreeDialogState
    onClose: () => void
    onDraftChange: (draft: string) => void
    onSubmit: () => void
    text: (key: string) => string
}

export function JsonTreeEditDialog({
    applyLabel,
    closeLabel,
    dialog,
    onClose,
    onDraftChange,
    onSubmit,
    text,
}: JsonTreeEditDialogProps) {
    const title = (() => {
        if (!dialog) return ""
        if (dialog.type === "edit_value") return text("tree_edit_value_title")
        if (dialog.type === "add_key") return text("tree_add_key_title")
        return text("tree_rename_key_title")
    })()
    const description = (() => {
        if (!dialog) return ""
        if (dialog.type === "edit_value") return text("tree_edit_value_description")
        if (dialog.type === "add_key") return text("tree_add_key_description")
        return text("tree_rename_key_description")
    })()

    return (
        <Dialog open={dialog !== null} onOpenChange={(open) => { if (!open) onClose() }}>
            <DialogContent closeLabel={closeLabel}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <form
                    className="space-y-3"
                    onSubmit={(event) => {
                        event.preventDefault()
                        onSubmit()
                    }}
                >
                    {dialog?.type === "edit_value" ? (
                        <Textarea
                            autoFocus
                            className="min-h-[140px] w-full font-mono text-sm"
                            value={dialog.draft}
                            onChange={(event) => onDraftChange(event.target.value)}
                            spellCheck={false}
                        />
                    ) : (
                        <Input
                            autoFocus
                            value={dialog?.draft || ""}
                            onChange={(event) => onDraftChange(event.target.value)}
                            placeholder={dialog?.type === "add_key" ? text("tree_new_key_placeholder") : undefined}
                        />
                    )}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            {closeLabel}
                        </Button>
                        <Button type="submit">{applyLabel}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
