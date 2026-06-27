import * as React from "react"
import { ArrowDown, ArrowUp, GripVertical, Network, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { RecipeStep } from "@/features/pipeline/recipe-types"
import type { StepCompatibilityHint } from "./logic"

type AdapterOption = {
    externalRequestRequired: boolean
    inputKind: string
    outputKind: string
    title: string
    toolKey: string
}

type PipelineStepListProps = {
    adapterOptions: AdapterOption[]
    compatibilityHints: StepCompatibilityHint[]
    maxSteps: number
    onAddStep: () => void
    onMoveStep: (stepId: string, direction: -1 | 1) => void
    onPendingToolKeyChange: (toolKey: string) => void
    onReorderStep: (stepId: string, targetIndex: number) => void
    onRemoveStep: (stepId: string) => void
    onSelectStep: (stepId: string) => void
    pendingToolKey: string
    selectedStepId: string | null
    steps: RecipeStep[]
    text: (key: string) => string
}

export function PipelineStepList({
    adapterOptions,
    compatibilityHints,
    maxSteps,
    onAddStep,
    onMoveStep,
    onPendingToolKeyChange,
    onReorderStep,
    onRemoveStep,
    onSelectStep,
    pendingToolKey,
    selectedStepId,
    steps,
    text,
}: PipelineStepListProps) {
    const adapterByKey = React.useMemo(
        () => new Map(adapterOptions.map((adapter) => [adapter.toolKey, adapter])),
        [adapterOptions],
    )
    const hintByStepId = React.useMemo(
        () => new Map(compatibilityHints.map((hint) => [hint.toStepId, hint])),
        [compatibilityHints],
    )
    const [draggingStepId, setDraggingStepId] = React.useState<string | null>(null)
    const [announcement, setAnnouncement] = React.useState("")

    const announceOrder = React.useCallback((step: RecipeStep, index: number) => {
        const adapterTitle = adapterByKey.get(step.toolKey)?.title ?? step.toolKey
        setAnnouncement(text("step_reordered_announcement")
            .replace("{label}", step.label || adapterTitle)
            .replace("{position}", String(index + 1))
            .replace("{total}", String(steps.length)))
    }, [adapterByKey, steps.length, text])

    const moveAndAnnounce = React.useCallback((step: RecipeStep, index: number, direction: -1 | 1) => {
        const nextIndex = index + direction
        if (nextIndex < 0 || nextIndex >= steps.length) return
        onMoveStep(step.id, direction)
        announceOrder(step, nextIndex)
    }, [announceOrder, onMoveStep, steps.length])

    const dropAndAnnounce = React.useCallback((stepId: string, targetIndex: number) => {
        const step = steps.find((candidate) => candidate.id === stepId)
        if (!step) return
        onReorderStep(stepId, targetIndex)
        announceOrder(step, targetIndex)
    }, [announceOrder, onReorderStep, steps])

    return (
        <section
            id="pipeline-steps"
            className="scroll-mt-24 rounded-lg border bg-card p-4"
            aria-labelledby="pipeline-steps-title"
            tabIndex={-1}
        >
            <div className="flex items-center justify-between gap-2">
                <h2 id="pipeline-steps-title" className="text-sm font-semibold">{text("steps_title")}</h2>
                <span className="text-xs text-muted-foreground" aria-label={text("step_count_summary")}>{steps.length}/{maxSteps}</span>
            </div>
            <div className="mt-3 flex gap-2">
                <select
                    aria-label={text("adapter_select")}
                    className="h-11 min-w-0 flex-1 rounded-md border bg-background px-2 text-sm lg:h-9"
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
                    <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">{text("no_steps_title")}</p>
                        <p className="mt-1">{text("no_steps")}</p>
                    </div>
                ) : steps.map((step, index) => {
                    const adapter = adapterByKey.get(step.toolKey)
                    const adapterTitle = adapter?.title ?? step.toolKey
                    const active = step.id === selectedStepId
                    const hint = hintByStepId.get(step.id)
                    return (
                        <div
                            key={step.id}
                            className={`flex w-full items-start justify-between gap-2 rounded-md border p-3 text-sm transition-colors ${draggingStepId === step.id ? "border-primary bg-primary/10" : active ? "border-primary bg-primary/5" : "bg-background hover:bg-muted/50"}`}
                            draggable
                            onDragStart={(event) => {
                                setDraggingStepId(step.id)
                                event.dataTransfer.effectAllowed = "move"
                                event.dataTransfer.setData("text/plain", step.id)
                            }}
                            onDragEnd={() => setDraggingStepId(null)}
                            onDragOver={(event) => {
                                if (!draggingStepId || draggingStepId === step.id) return
                                event.preventDefault()
                                event.dataTransfer.dropEffect = "move"
                            }}
                            onDrop={(event) => {
                                event.preventDefault()
                                const sourceStepId = event.dataTransfer.getData("text/plain") || draggingStepId
                                setDraggingStepId(null)
                                if (!sourceStepId || sourceStepId === step.id) return
                                dropAndAnnounce(sourceStepId, index)
                            }}
                        >
                            <div
                                className="mt-0.5 flex h-8 w-6 shrink-0 items-center justify-center rounded text-muted-foreground"
                                title={text("drag_handle")}
                                aria-hidden="true"
                            >
                                <GripVertical className="h-4 w-4" aria-hidden="true" />
                            </div>
                            <button
                                type="button"
                                className="min-w-0 flex-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                onClick={() => onSelectStep(step.id)}
                                aria-pressed={active}
                            >
                                <span className="block min-w-0">
                                    <span className="block font-medium">{index + 1}. {step.label || adapterTitle}</span>
                                    <span className="block truncate text-xs text-muted-foreground">{adapterTitle}</span>
                                    {adapter ? (
                                        <span className="mt-1 block text-xs text-muted-foreground">
                                            {text("step_io_hint").replace("{input}", adapter.inputKind).replace("{output}", adapter.outputKind)}
                                        </span>
                                    ) : null}
                                    {hint ? (
                                        <span className="mt-1 block text-xs text-amber-700 dark:text-amber-300">
                                            {text("compatibility_hint").replace("{from}", hint.fromKind).replace("{to}", hint.toKind)}
                                        </span>
                                    ) : null}
                                    {adapter?.externalRequestRequired ? (
                                        <span className="mt-1 flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300">
                                            <Network className="h-3 w-3" />
                                            {text("external_request_step_notice")}
                                        </span>
                                    ) : null}
                                </span>
                            </button>
                            <div className="flex shrink-0 gap-1">
                                <button
                                    type="button"
                                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 lg:min-h-8 lg:min-w-8"
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        moveAndAnnounce(step, index, -1)
                                    }}
                                    disabled={index === 0}
                                    aria-label={text("move_up")}
                                >
                                    <ArrowUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 lg:min-h-8 lg:min-w-8"
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        moveAndAnnounce(step, index, 1)
                                    }}
                                    disabled={index === steps.length - 1}
                                    aria-label={text("move_down")}
                                >
                                    <ArrowDown className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded text-destructive hover:bg-destructive/10 lg:min-h-8 lg:min-w-8"
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
            <div className="sr-only" aria-live="polite">{announcement}</div>
        </section>
    )
}
