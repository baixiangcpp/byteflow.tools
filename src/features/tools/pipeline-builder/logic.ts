import { getPipelineAdapter } from "@/features/pipeline/adapter-registry"
import { createEmptyRecipe } from "@/features/pipeline/executor"
import type { PipelineValueKind, RecipeDocument, RecipeStep } from "@/features/pipeline/recipe-types"
import { FIRST_ADAPTER } from "./constants"
import type { OptionValue } from "./types"

export function createId(prefix: string): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return `${prefix}_${crypto.randomUUID().slice(0, 8)}`
    }
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function createRecipe(name = "Untitled pipeline"): RecipeDocument {
    return createEmptyRecipe(createId("recipe"), name)
}

export function createStep(toolKey: string): RecipeStep {
    const adapter = getPipelineAdapter(toolKey) ?? FIRST_ADAPTER
    return {
        id: createId("step"),
        toolKey: adapter.toolKey,
        label: adapter.toolKey.replace(/_/g, " "),
        adapterVersion: adapter.version,
        inputMode: "previous_output",
        options: { ...adapter.defaultOptions },
    }
}

export function updateRecipeTimestamp(recipe: RecipeDocument): RecipeDocument {
    return {
        ...recipe,
        updatedAt: new Date().toISOString(),
    }
}

export function getOptionValue(value: unknown): OptionValue {
    if (typeof value === "boolean" || typeof value === "number" || typeof value === "string") return value
    return ""
}

export type StepCompatibilityHint = {
    fromKind: PipelineValueKind
    fromStepId: string
    toKind: PipelineValueKind
    toStepId: string
}

function canPipeOutputToInput(outputKind: PipelineValueKind, inputKind: PipelineValueKind): boolean {
    if (outputKind === inputKind) return true
    return inputKind === "text"
}

export function getStepCompatibilityHints(steps: RecipeStep[]): StepCompatibilityHint[] {
    const hints: StepCompatibilityHint[] = []

    for (let index = 1; index < steps.length; index += 1) {
        const previousStep = steps[index - 1]
        const step = steps[index]
        if (step.inputMode === "constant") continue

        const previousAdapter = getPipelineAdapter(previousStep.toolKey)
        const adapter = getPipelineAdapter(step.toolKey)
        if (!previousAdapter || !adapter) continue
        if (canPipeOutputToInput(previousAdapter.outputKind, adapter.inputKind)) continue

        hints.push({
            fromKind: previousAdapter.outputKind,
            fromStepId: previousStep.id,
            toKind: adapter.inputKind,
            toStepId: step.id,
        })
    }

    return hints
}
