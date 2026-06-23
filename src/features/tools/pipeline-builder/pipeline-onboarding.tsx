import { ArrowRight, Play, Workflow, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type PipelineOnboardingProps = {
    dismissed: boolean
    onDismiss: () => void
    onRunSample: () => void
    text: (key: string) => string
}

export function PipelineOnboarding({
    dismissed,
    onDismiss,
    onRunSample,
    text,
}: PipelineOnboardingProps) {
    if (dismissed) return null

    return (
        <section className="rounded-lg border border-primary/20 bg-card p-4 shadow-xs">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <Workflow className="h-5 w-5 text-primary" aria-hidden="true" />
                        <h2 className="text-base font-semibold">{text("onboarding_title")}</h2>
                    </div>
                    <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{text("onboarding_description")}</p>
                </div>
                <Button type="button" variant="ghost" size="icon-sm" onClick={onDismiss} aria-label={text("onboarding_dismiss")}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch">
                <OnboardingStep number="1" title={text("onboarding_step_sample_title")} body={text("onboarding_step_sample_body")} />
                <ArrowRight className="hidden h-4 w-4 self-center text-muted-foreground md:block" aria-hidden="true" />
                <OnboardingStep number="2" title={text("onboarding_step_edit_title")} body={text("onboarding_step_edit_body")} />
                <ArrowRight className="hidden h-4 w-4 self-center text-muted-foreground md:block" aria-hidden="true" />
                <OnboardingStep number="3" title={text("onboarding_step_run_title")} body={text("onboarding_step_run_body")} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={onRunSample}>
                    <Play className="h-4 w-4" />
                    {text("onboarding_run_sample")}
                </Button>
                <span className="inline-flex items-center rounded-md border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                    {text("onboarding_local_only")}
                </span>
            </div>
        </section>
    )
}

function OnboardingStep({
    body,
    number,
    title,
}: {
    body: string
    number: string
    title: string
}) {
    return (
        <article className="rounded-md border bg-background/70 p-3">
            <div className="flex items-start gap-2">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {number}
                </span>
                <div>
                    <h3 className="text-sm font-semibold">{title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
                </div>
            </div>
        </article>
    )
}
