type PipelineUsageGuideProps = {
    maxSteps: number
    text: (key: string) => string
}

export function PipelineUsageGuide({ maxSteps, text }: PipelineUsageGuideProps) {
    return (
        <section id="pipeline-usage-guide" className="scroll-mt-24 border-t pt-4" aria-labelledby="pipeline-usage-guide-title">
            <h2 id="pipeline-usage-guide-title" className="text-sm font-semibold">{text("usage_guide_title")}</h2>
            <div className="mt-3 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                <div className="rounded-md border border-border/70 bg-muted/20 p-3">
                    <h3 className="text-xs font-semibold uppercase text-foreground">{text("usage_guide_linear_title")}</h3>
                    <p className="mt-2 leading-6">{text("usage_guide_linear_body")}</p>
                </div>
                <div className="rounded-md border border-border/70 bg-muted/20 p-3">
                    <h3 className="text-xs font-semibold uppercase text-foreground">{text("usage_guide_limits_title")}</h3>
                    <p className="mt-2 leading-6">{text("usage_guide_limits_body").replace("{max}", String(maxSteps))}</p>
                </div>
                <div className="rounded-md border border-border/70 bg-muted/20 p-3">
                    <h3 className="text-xs font-semibold uppercase text-foreground">{text("usage_guide_composition_title")}</h3>
                    <p className="mt-2 leading-6">{text("usage_guide_composition_body")}</p>
                </div>
                <div className="rounded-md border border-border/70 bg-muted/20 p-3">
                    <h3 className="text-xs font-semibold uppercase text-foreground">{text("usage_guide_privacy_title")}</h3>
                    <p className="mt-2 leading-6">{text("usage_guide_privacy_body")}</p>
                </div>
            </div>
        </section>
    )
}
