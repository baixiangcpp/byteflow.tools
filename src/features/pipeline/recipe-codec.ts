import type { RecipeDocument } from "./recipe-types"
import { getPipelineAdapter } from "./adapter-registry"

export type RecipeCodecResult =
    | { ok: true; recipe: RecipeDocument }
    | { ok: false; error: string }

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

function bytesToBase64Url(bytes: Uint8Array): string {
    let binary = ""
    const chunkSize = 0x8000
    for (let index = 0; index < bytes.length; index += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
    }
    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "")
}

function base64UrlToBytes(value: string): Uint8Array {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4)
    const binary = atob(padded)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index)
    }
    return bytes
}

export function encodeRecipeForUrl(recipe: RecipeDocument): string {
    return bytesToBase64Url(textEncoder.encode(JSON.stringify(recipe)))
}

export function decodeRecipeFromUrlParam(value: string): RecipeCodecResult {
    try {
        const json = textDecoder.decode(base64UrlToBytes(value))
        const parsed = JSON.parse(json)
        if (!parsed || typeof parsed !== "object") {
            return { ok: false, error: "Recipe payload must decode to an object." }
        }
        return { ok: true, recipe: parsed as RecipeDocument }
    } catch {
        return { ok: false, error: "Recipe URL payload is malformed." }
    }
}

export function recipeContainsRuntimeInput(recipe: RecipeDocument): boolean {
    return recipe.steps.some((step) => step.inputMode === "constant" && typeof step.constantInput === "string" && step.constantInput.length > 0)
}

function sanitizePortableOptions(toolKey: string, options: Record<string, unknown>): Record<string, unknown> {
    const adapter = getPipelineAdapter(toolKey)
    if (!adapter) return {}

    return Object.fromEntries(
        adapter.publicOptionKeys
            .filter((key) => Object.prototype.hasOwnProperty.call(options, key))
            .map((key) => [key, options[key]]),
    )
}

export function createPortableRecipe(recipe: RecipeDocument): RecipeDocument {
    return {
        ...recipe,
        steps: recipe.steps.map((step) => {
            const base = {
                ...step,
                options: sanitizePortableOptions(step.toolKey, step.options || {}),
            }

            if (step.inputMode === "constant") {
                const withoutInput = { ...base }
                delete withoutInput.constantInput
                return {
                    ...withoutInput,
                    inputMode: "previous_output" as const,
                }
            }

            return base
        }),
    }
}

export function encodeRecipeForShareUrl(recipe: RecipeDocument): string {
    return encodeRecipeForUrl(createPortableRecipe(recipe))
}
