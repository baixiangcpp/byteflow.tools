import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { RecipeStep } from "@/features/pipeline/recipe-types"

type AdapterOption = {
    title: string
    toolKey: string
}

type PipelineStepListProps = {
    adapterOptions: AdapterOption[]
    maxSteps: number
    onAddStep: () => void
    onMoveStep: (stepId: string, direction: -1 | 1) => void
    onPendingToolKeyChange: (toolKey: string) => void
    onRemoveStep: (stepId: string) => void
    onSelectStep: (stepId: string) => void
    pendingToolKey: string
    selectedStepId: string | null
    steps: RecipeStep[]
    text: (key: string) => string
}

export function PipelineStepList({
    adapterOptions,
    maxSteps,
    onAddStep,
    onMoveStep,
    onPendingToolKeyChange,
    onRemoveStep,
    onSelectStep,
    pendingToolKey,
    selectedStepId,
    steps,
    text,
}: PipelineStepListProps) {
    const adapterTitleByKey = new Map(adapterOptions.map((adapter) => [adapter.toolKey, adapter.title]))

    return (
        <section className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">{text("steps_title")}</h2>
                <span className="text-xs text-muted-foreground">{steps.length}/{maxSteps}</span>
            </div>
            <div className="mt-3 flex gap-2">
                <select
                    aria-label={text("adapter_select")}
                    className="h-9 min-w-0 flex-1 rounded-md border bg-background px-2 text-sm"
                    value={pendingToolKey}
                    onChange={(event) => onPendingToolKeyChange(event.target.value)}
                >
                    {adapterOptions.map((adapter) => (
                        <option key={adapter.toolKey} value={adapter.toolKey}>
                            {adapter.title}
                        </option>
                    ))}
                </select>
                <Button size="sm" onClick={onAddStep} disabled={steps.length >= maxSteps}>
                    <Plus className="h-4 w-4" />
                    {text("add_step")}
                </Button>
            </div>
            <div className="mt-4 space-y-2">
                {steps.length === 0 ? (
                    <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">{text("no_steps")}</div>
                ) : steps.map((step, index) => {
                    const adapterTitle = adapterTitleByKey.get(step.toolKey) ?? step.toolKey
                    const active = step.id === selectedStepId
                    return (
                        <div
                            key={step.id}
                            className={`flex w-full items-start justify-between gap-2 rounded-md border p-3 text-sm transition-colors ${active ? "border-primary bg-primary/5" : "bg-background hover:bg-muted/50"}`}
                        >
                            <button
                                type="button"
                                className="min-w-0 flex-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                onClick={() => onSelectStep(step.id)}
                                aria-pressed={active}
                            >
                                <span className="block min-w-0">
                                    <span className="block font-medium">{index + 1}. {step.label || adapterTitle}</span>
                                    <span className="block truncate text-xs text-muted-foreground">{adapterTitle}</span>
                                </span>
                            </button>
                            <div className="flex shrink-0 gap-1">
                                <button
                                    type="button"
                                    className="rounded p-1 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        onMoveStep(step.id, -1)
                                    }}
                                    disabled={index === 0}
                                    aria-label={text("move_up")}
                                >
                                    <ArrowUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    className="rounded p-1 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        onMoveStep(step.id, 1)
                                    }}
                                    disabled={index === steps.length - 1}
                                    aria-label={text("move_down")}
                                >
                                    <ArrowDown className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    className="rounded p-1 text-destructive hover:bg-destructive/10"
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        onRemoveStep(step.id)
                                    }}
                                    aria-label={text("remove_step")}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </section>
    )
}
