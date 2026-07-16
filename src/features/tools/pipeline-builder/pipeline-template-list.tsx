import * as React from "react"
import { BookOpen, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { PipelineRecipeTemplate } from "@/features/pipeline/recipe-templates"

type PipelineTemplateListProps = {
    onLoadTemplate: (template: PipelineRecipeTemplate) => void
    templates: readonly PipelineRecipeTemplate[]
    text: (key: string) => string
}

export function PipelineTemplateList({ onLoadTemplate, templates, text }: PipelineTemplateListProps) {
    const [query, setQuery] = React.useState("")
    const [category, setCategory] = React.useState("all")
    const categories = React.useMemo(
        () => Array.from(new Set(templates.map((template) => template.categoryKey))),
        [templates],
    )
    const normalizedQuery = query.trim().toLowerCase()
    const filteredTemplates = templates.filter((template) => {
        const matchesCategory = category === "all" || template.categoryKey === category
        const searchable = [
            text(template.titleKey),
            text(template.descriptionKey),
            text(template.categoryKey),
            text(template.difficultyKey),
            text(template.inputTypeKey),
            ...template.tags,
        ].join(" ").toLowerCase()

        return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery))
    })

    return (
        <section className="rounded-lg border bg-card p-4">
            <div className="flex items-start gap-2">
                <BookOpen className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                    <h2 className="text-sm font-semibold">{text("recipe_gallery_title")}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">{text("recipe_gallery_description")}</p>
                </div>
            </div>
            <div className="mt-3 space-y-3">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        aria-label={text("recipe_gallery_search")}
                        intent="shortText"
                        className="pl-8"
                        placeholder={text("recipe_gallery_search_placeholder")}
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                    />
                </div>
                <div className="flex flex-wrap gap-2" role="group" aria-label={text("recipe_gallery_category_filter")}>
                    <Button
                        type="button"
                        size="sm"
                        variant={category === "all" ? "default" : "outline"}
                        onClick={() => setCategory("all")}
                    >
                        {text("recipe_category_all")}
                    </Button>
                    {categories.map((categoryKey) => (
                        <Button
                            key={categoryKey}
                            type="button"
                            size="sm"
                            variant={category === categoryKey ? "default" : "outline"}
                            onClick={() => setCategory(categoryKey)}
                        >
                            {text(categoryKey)}
                        </Button>
                    ))}
                </div>
            </div>
            <div className="mt-3 space-y-2">
                {filteredTemplates.map((template) => (
                    <div key={template.id} className="rounded-md border bg-background p-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-sm font-medium">{text(template.titleKey)}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{text(template.descriptionKey)}</p>
                                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                                    <span className="rounded-full border border-border bg-muted/30 px-2 py-0.5">
                                        {text(template.categoryKey)}
                                    </span>
                                    <span className="rounded-full border border-border bg-muted/30 px-2 py-0.5">
                                        {text(template.difficultyKey)}
                                    </span>
                                    <span className="rounded-full border border-border bg-muted/30 px-2 py-0.5">
                                        {text(template.inputTypeKey)}
                                    </span>
                                    <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-primary">
                                        {text(template.privacyBoundaryKey)}
                                    </span>
                                    <span className="rounded-full border border-border bg-muted/30 px-2 py-0.5">
                                        {template.steps.length} {text("steps_count_label")}
                                    </span>
                                </div>
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
                {filteredTemplates.length === 0 ? (
                    <div className="rounded-md border border-dashed bg-background/60 p-3 text-sm text-muted-foreground">
                        {text("recipe_gallery_empty")}
                    </div>
                ) : null}
            </div>
        </section>
    )
}
