import { validateRecipe } from "./executor"
import { createPortableRecipe } from "./recipe-codec"
import type { RecipeDocument } from "./recipe-types"

export type RecipeImportResult =
    | { ok: true; recipe: RecipeDocument }
    | { ok: false; errors: string[] }

export function exportRecipeToJson(recipe: RecipeDocument): string {
    return `${JSON.stringify(createPortableRecipe(recipe), null, 2)}\n`
}

export function importRecipeFromJson(source: string): RecipeImportResult {
    try {
        const parsed = JSON.parse(source)
        const validation = validateRecipe(parsed)
        if (!validation.ok) return { ok: false, errors: validation.errors }
        return { ok: true, recipe: parsed as RecipeDocument }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Invalid JSON."
        return { ok: false, errors: [`Recipe JSON is invalid: ${message}`] }
    }
}
