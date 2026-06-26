import { Copy, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PipelineExecutionResult, PipelineStepExecution, RecipeDocument } from "@/features/pipeline/recipe-types"

const PREVIEW_LIMIT = 2000

type PipelineStepDiagnosticsProps = {
    onCopyStepInput: (step: PipelineStepExecution) => void
    onCopyStepOutput: (step: PipelineStepExecution) => void
    recipe: RecipeDocument
    result: PipelineExecutionResult | null
    text: (key: string) => string
}

function previewValue(value?: string) {
    if (!value) return ""
    return value.length > PREVIEW_LIMIT ? `${value.slice(0, PREVIEW_LIMIT)}\n...` : value
}

export function PipelineStepDiagnostics({
    onCopyStepInput,
    onCopyStepOutput,
    recipe,
    result,
    text,
}: PipelineStepDiagnosticsProps) {
    const executionsByStepId = new Map((result?.steps ?? []).map((step) => [step.stepId, step]))

    return (
        <section className="rounded-lg border bg-card p-4" aria-labelledby="pipeline-step-diagnostics-title">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h2 id="pipeline-step-diagnostics-title" className="text-sm font-semibold">
                        {text("step_diagnostics_title")}
                    </h2>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {text("step_diagnostics_description")}
                    </p>
                </div>
                <span className="rounded-full border border-border bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
                    {recipe.steps.length} {text("steps_count_label")}
                </span>
            </div>

            <div className="mt-3 grid gap-3">
                {recipe.steps.map((recipeStep, index) => {
                    const execution = executionsByStepId.get(recipeStep.id)
                    const status = execution
                        ? execution.ok ? text("status_ok") : text("status_failed")
                        : text("status_not_run")
                    const inputPreview = execution ? previewValue(execution.input) : ""
                    const outputPreview = execution ? previewValue(execution.output) : ""
                    const messages = execution
                        ? [
                            ...(execution.error?.message ? [execution.error.message] : []),
                            ...execution.warnings,
                        ]
                        : []

                    return (
                        <article
                            key={recipeStep.id}
                            id={`pipeline-diagnostic-${recipeStep.id}`}
                            className={`scroll-mt-24 rounded-md border p-3 ${execution?.ok === false ? "border-destructive/35 bg-destructive/5" : "border-border/75 bg-background/65"}`}
                            tabIndex={-1}
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium">
                                        {index + 1}. {recipeStep.label || recipeStep.toolKey}
                                    </p>
                                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                                        {recipeStep.id}
                                    </p>
                                </div>
                                <span className={execution?.ok === false
                                    ? "rounded-full border border-destructive/35 bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive"
                                    : execution?.ok
                                        ? "rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                                        : "rounded-full border border-border bg-muted/30 px-2 py-1 text-xs font-medium text-muted-foreground"
                                }>
                                    {status}
                                </span>
                            </div>

                            <dl className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                                <div className="rounded-md border border-border/70 bg-muted/20 p-2">
                                    <dt>{text("diagnostic_input_bytes")}</dt>
                                    <dd className="mt-1 font-mono text-foreground">{execution?.inputBytes ?? "-"}</dd>
                                </div>
                                <div className="rounded-md border border-border/70 bg-muted/20 p-2">
                                    <dt>{text("diagnostic_output_bytes")}</dt>
                                    <dd className="mt-1 font-mono text-foreground">{execution?.outputBytes ?? "-"}</dd>
                                </div>
                                <div className="rounded-md border border-border/70 bg-muted/20 p-2">
                                    <dt className="inline-flex items-center gap-1">
                                        <Timer className="h-3 w-3" />
                                        {text("diagnostic_duration")}
                                    </dt>
                                    <dd className="mt-1 font-mono text-foreground">
                                        {execution ? `${execution.durationMs.toFixed(1)} ms` : "-"}
                                    </dd>
                                </div>
                            </dl>

                            {messages.length > 0 ? (
                                <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-5 text-muted-foreground">
                                    {messages.map((message) => <li key={message}>{message}</li>)}
                                </ul>
                            ) : null}

                            <div className="mt-3 grid gap-3 lg:grid-cols-2">
                                <details className="rounded-md border border-border/70 bg-muted/20">
                                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 border-b border-border/70 px-3 py-2">
                                        <span className="text-xs font-medium">{text("diagnostic_input_preview")}</span>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            disabled={!inputPreview}
                                            onClick={(event) => {
                                                event.preventDefault()
                                                if (execution) onCopyStepInput(execution)
                                            }}
                                        >
                                            <Copy className="h-3.5 w-3.5" />
                                            {text("copy_step_input")}
                                        </Button>
                                    </summary>
                                    <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words p-3 text-xs text-muted-foreground">
                                        {inputPreview || text("diagnostic_input_empty")}
                                    </pre>
                                </details>
                                <details className="rounded-md border border-border/70 bg-muted/20">
                                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 border-b border-border/70 px-3 py-2">
                                        <span className="text-xs font-medium">{text("diagnostic_output_preview")}</span>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            disabled={!outputPreview}
                                            onClick={(event) => {
                                                event.preventDefault()
                                                if (execution) onCopyStepOutput(execution)
                                            }}
                                        >
                                            <Copy className="h-3.5 w-3.5" />
                                            {text("copy_step_output")}
                                        </Button>
                                    </summary>
                                    <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words p-3 text-xs text-muted-foreground">
                                        {outputPreview || text("diagnostic_output_empty")}
                                    </pre>
                                </details>
                            </div>
                        </article>
                    )
                })}
                {recipe.steps.length === 0 ? (
                    <div className="rounded-md border border-dashed bg-background/60 p-4 text-sm text-muted-foreground">
                        {text("no_steps")}
                    </div>
                ) : null}
            </div>
        </section>
    )
}
