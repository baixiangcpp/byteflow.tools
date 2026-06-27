import type { PipelineExecutionResult } from "@/features/pipeline/recipe-types"

type PipelineRunLogProps = {
    result: PipelineExecutionResult | null
    text: (key: string) => string
}

export function PipelineRunLog({ result, text }: PipelineRunLogProps) {
    const statusMessage = result
        ? `${result.ok ? text("status_ok") : text("status_failed")}: ${result.steps.length} ${text("run_log")}`
        : text("run_log_empty")

    return (
        <section className="rounded-lg border bg-card p-4" aria-labelledby="pipeline-run-log-title">
            <h2 id="pipeline-run-log-title" className="text-sm font-semibold">{text("run_log")}</h2>
            <p id="pipeline-run-log-status" className="sr-only" role="status" aria-live="polite" aria-atomic="true">
                {statusMessage}
            </p>
            <div className="mt-3 rounded-md border">
                {result ? (
                    <>
                        <div className="divide-y sm:hidden" aria-label={text("run_log")}>
                            {result.steps.map((step) => (
                                <article key={step.stepId} className="space-y-2 p-3 text-sm">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="min-w-0 break-all font-mono text-xs">{step.stepId}</p>
                                        <span className={step.ok
                                            ? "shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                                            : "shrink-0 rounded-full border border-destructive/35 bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive"
                                        }>
                                            {step.ok ? text("status_ok") : text("status_failed")}
                                        </span>
                                    </div>
                                    <dl className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                        <div className="rounded border border-border/70 bg-muted/20 p-2">
                                            <dt>{text("diagnostic_input_bytes")}</dt>
                                            <dd className="mt-1 font-mono text-foreground">{step.inputBytes}</dd>
                                        </div>
                                        <div className="rounded border border-border/70 bg-muted/20 p-2">
                                            <dt>{text("diagnostic_output_bytes")}</dt>
                                            <dd className="mt-1 font-mono text-foreground">{step.outputBytes}</dd>
                                        </div>
                                    </dl>
                                    <p className="break-words text-xs text-muted-foreground">
                                        {step.error?.message || step.warnings.join("; ") || text("no_message")}
                                    </p>
                                </article>
                            ))}
                        </div>
                        <div className="hidden overflow-x-auto sm:block">
                            <table className="w-full min-w-[42rem] text-sm" aria-label={text("run_log")}>
                                <thead className="bg-muted text-xs text-muted-foreground">
                                    <tr>
                                        <th className="px-3 py-2 text-left">{text("table_step")}</th>
                                        <th className="px-3 py-2 text-left">{text("table_status")}</th>
                                        <th className="px-3 py-2 text-left">{text("table_bytes")}</th>
                                        <th className="px-3 py-2 text-left">{text("table_message")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.steps.map((step) => (
                                        <tr key={step.stepId} className="border-t">
                                            <td className="px-3 py-2 font-mono text-xs">{step.stepId}</td>
                                            <td className="px-3 py-2">{step.ok ? text("status_ok") : text("status_failed")}</td>
                                            <td className="px-3 py-2 text-xs text-muted-foreground">{step.inputBytes} {"->"} {step.outputBytes}</td>
                                            <td className="px-3 py-2 text-xs text-muted-foreground">
                                                {step.error?.message || step.warnings.join("; ") || text("no_message")}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div className="p-4 text-sm text-muted-foreground">{text("run_log_empty")}</div>
                )}
            </div>
            {result?.errors.length ? (
                <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                    {result.errors.join("\n")}
                </div>
            ) : null}
        </section>
    )
}
