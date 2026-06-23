import { getPipelineAdapter } from "./adapter-registry"
import type { RecipeDocument, RecipeStep } from "./recipe-types"

export type RecipePrivacyScope = {
    included: string[]
    excluded: string[]
}

export const RECIPE_STRUCTURE_PRIVACY_SCOPE: RecipePrivacyScope = {
    included: [
        "privacy_scope_recipe_metadata",
        "privacy_scope_steps_options",
        "privacy_scope_settings",
    ],
    excluded: [
        "privacy_scope_runtime_input",
        "privacy_scope_outputs",
        "privacy_scope_logs",
        "privacy_scope_files",
        "privacy_scope_constants",
    ],
}

function sanitizeOptions(toolKey: string, options: Record<string, unknown>): Record<string, unknown> {
    const adapter = getPipelineAdapter(toolKey)
    if (!adapter) return {}

    return Object.fromEntries(
        adapter.publicOptionKeys
            .filter((key) => Object.prototype.hasOwnProperty.call(options, key))
            .map((key) => [key, options[key]]),
    )
}

function sanitizeStepForStructure(step: RecipeStep): RecipeStep {
    const sanitized: RecipeStep = {
        id: step.id,
        toolKey: step.toolKey,
        label: step.label,
        adapterVersion: step.adapterVersion,
        inputMode: "previous_output",
        options: sanitizeOptions(step.toolKey, step.options || {}),
    }

    if (!sanitized.label) delete sanitized.label
    return sanitized
}

export function sanitizeRecipeForPersistence(recipe: RecipeDocument): RecipeDocument {
    return {
        schemaVersion: recipe.schemaVersion,
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        createdAt: recipe.createdAt,
        updatedAt: recipe.updatedAt,
        steps: recipe.steps.map(sanitizeStepForStructure),
        edges: recipe.edges.map((edge) => ({ ...edge })),
        settings: { ...recipe.settings },
    }
}

export function recipeHasRuntimePersistenceRisk(recipe: RecipeDocument): boolean {
    return recipe.steps.some((step) => step.inputMode === "constant" && typeof step.constantInput === "string" && step.constantInput.length > 0)
}
