import { ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { RecipePrivacyScope } from "@/features/pipeline/recipe-sanitizer"

type PendingPrivacyAction = "save" | "export" | "share"

type PipelinePrivacyPreviewProps = {
    action: PendingPrivacyAction
    onCancel: () => void
    onConfirm: () => void
    scope: RecipePrivacyScope
    text: (key: string) => string
}

export function PipelinePrivacyPreview({
    action,
    onCancel,
    onConfirm,
    scope,
    text,
}: PipelinePrivacyPreviewProps) {
    return (
        <section className="rounded-lg border border-primary/25 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div className="min-w-0 flex-1 space-y-3">
                    <div>
                        <h2 className="text-sm font-semibold">{text("privacy_preview_title")}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {text(`privacy_preview_${action}`)}
                        </p>
                    </div>

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

                    <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" onClick={onConfirm}>
                            {text(`privacy_preview_confirm_${action}`)}
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
                            {text("privacy_preview_cancel")}
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    )
}
