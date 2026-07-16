import { ArrowLeftRight, ListChecks, PanelRight } from "lucide-react"

type PipelineWorkspaceNavigationProps = {
    text: (key: string) => string
}

export function PipelineWorkspaceNavigation({ text }: PipelineWorkspaceNavigationProps) {
    return (
        <nav aria-label={text("workspace_navigation")} className="sticky top-16 z-20 lg:hidden">
            <div className="grid grid-cols-3 gap-1 rounded-md border bg-background/95 p-1 shadow-sm backdrop-blur">
                <a
                    href="#pipeline-steps"
                    data-pipeline-jump="steps"
                    className="inline-flex min-h-11 min-w-0 items-center justify-center gap-1 rounded-sm px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <ListChecks className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 text-center leading-tight">{text("steps_title")}</span>
                </a>
                <a
                    href="#pipeline-input-output"
                    data-pipeline-jump="input-output"
                    className="inline-flex min-h-11 min-w-0 items-center justify-center gap-1 rounded-sm px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <ArrowLeftRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 text-center leading-tight">{text("input_output_short")}</span>
                </a>
                <a
                    href="#pipeline-inspector"
                    data-pipeline-jump="inspector"
                    className="inline-flex min-h-11 min-w-0 items-center justify-center gap-1 rounded-sm px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <PanelRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 text-center leading-tight">{text("inspector_short")}</span>
                </a>
            </div>
        </nav>
    )
}
