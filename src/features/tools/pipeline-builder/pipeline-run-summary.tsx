import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import type { PipelineExecutionResult, RecipeDocument } from "@/features/pipeline/recipe-types"

type PipelineRunSummaryProps = {
    isRunning: boolean
    recipe: RecipeDocument
    result: PipelineExecutionResult | null
    text: (key: string) => string
}

function formatDuration(value: number): string {
    return `${value.toFixed(1)} ms`
}

export function PipelineRunSummary({
    isRunning,
    recipe,
    result,
    text,
}: PipelineRunSummaryProps) {
    const completedSteps = result?.steps ?? []
    const succeeded = completedSteps.filter((step) => step.ok).length
    const failed = completedSteps.filter((step) => !step.ok).length
    const skipped = Math.max(0, recipe.steps.length - completedSteps.length)
    const totalDurationMs = completedSteps.reduce((total, step) => total + step.durationMs, 0)
    const finalOutputBytes = result
        ? new TextEncoder().encode(result.finalOutput).byteLength
        : 0
    const summaryStatus = result
        ? result.ok ? text("status_ok") : text("status_failed")
        : isRunning ? text("running") : text("run_summary_waiting")
    const hasResult = result !== null

    return (
        <section className="rounded-lg border bg-card p-4" aria-labelledby="pipeline-run-summary-title">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2 id="pipeline-run-summary-title" className="text-sm font-semibold">{text("run_summary_title")}</h2>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {hasResult ? text("run_summary_description") : text("run_summary_empty")}
                    </p>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium ${result?.ok === false
                    ? "border-destructive/35 bg-destructive/10 text-destructive"
                    : result?.ok
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border bg-muted/30 text-muted-foreground"
                }`}>
                    {isRunning ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    ) : result?.ok === false ? (
                        <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : result?.ok ? (
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : null}
                    {summaryStatus}
                </span>
            </div>

            <dl className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-md border border-border/70 bg-muted/20 p-2">
                    <dt>{text("run_summary_total_steps")}</dt>
                    <dd className="mt-1 font-mono text-foreground">{recipe.steps.length}</dd>
                </div>
                <div className="rounded-md border border-border/70 bg-muted/20 p-2">
                    <dt>{text("run_summary_succeeded")}</dt>
                    <dd className="mt-1 font-mono text-foreground">{succeeded}</dd>
                </div>
                <div className="rounded-md border border-border/70 bg-muted/20 p-2">
                    <dt>{text("run_summary_failed")}</dt>
                    <dd className={`mt-1 font-mono ${failed > 0 ? "text-destructive" : "text-foreground"}`}>{failed}</dd>
                </div>
                <div className="rounded-md border border-border/70 bg-muted/20 p-2">
                    <dt>{text("run_summary_skipped")}</dt>
                    <dd className="mt-1 font-mono text-foreground">{skipped}</dd>
                </div>
                <div className="rounded-md border border-border/70 bg-muted/20 p-2">
                    <dt>{text("run_summary_output_size")}</dt>
                    <dd className="mt-1 font-mono text-foreground">{hasResult ? finalOutputBytes : "-"} {text("bytes_label")}</dd>
                </div>
            </dl>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{text("run_summary_duration")}: <span className="font-mono text-foreground">{hasResult ? formatDuration(totalDurationMs) : "-"}</span></span>
                {completedSteps.map((step, index) => (
                    <a
                        key={step.stepId}
                        href={`#pipeline-diagnostic-${step.stepId}`}
                        className={`rounded-full border px-2 py-1 font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${step.ok ? "border-border text-muted-foreground" : "border-destructive/35 bg-destructive/10 text-destructive"}`}
                    >
                        {text("run_summary_step_link").replace("{index}", String(index + 1)).replace("{status}", step.ok ? text("status_ok") : text("status_failed"))}
                    </a>
                ))}
            </div>
        </section>
    )
}
