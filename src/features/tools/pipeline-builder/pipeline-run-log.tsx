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
            <div className="mt-3 overflow-hidden rounded-md border">
                {result ? (
                    <table className="w-full text-sm" aria-label={text("run_log")}>
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
