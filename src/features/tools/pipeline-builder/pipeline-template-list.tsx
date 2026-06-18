import { BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PipelineRecipeTemplate } from "@/features/pipeline/recipe-templates"

type PipelineTemplateListProps = {
    onLoadTemplate: (template: PipelineRecipeTemplate) => void
    templates: readonly PipelineRecipeTemplate[]
    text: (key: string) => string
}

export function PipelineTemplateList({ onLoadTemplate, templates, text }: PipelineTemplateListProps) {
    return (
        <section className="rounded-lg border bg-card p-4">
            <div className="flex items-start gap-2">
                <BookOpen className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                    <h2 className="text-sm font-semibold">{text("templates_title")}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">{text("templates_description")}</p>
                </div>
            </div>
            <div className="mt-3 space-y-2">
                {templates.map((template) => (
                    <div key={template.id} className="rounded-md border bg-background p-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-sm font-medium">{text(template.titleKey)}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{text(template.descriptionKey)}</p>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="shrink-0"
                                onClick={() => onLoadTemplate(template)}
                            >
                                {text("use_template")}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}
