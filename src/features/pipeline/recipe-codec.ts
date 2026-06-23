import type { RecipeDocument } from "./recipe-types"
import { recipeHasRuntimePersistenceRisk, sanitizeRecipeForPersistence } from "./recipe-sanitizer"

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
    return recipeHasRuntimePersistenceRisk(recipe)
}

export function createPortableRecipe(recipe: RecipeDocument): RecipeDocument {
    return sanitizeRecipeForPersistence(recipe)
}

export function encodeRecipeForShareUrl(recipe: RecipeDocument, options: { includeRuntimeInput?: boolean } = {}): string {
    return encodeRecipeForUrl(options.includeRuntimeInput ? recipe : createPortableRecipe(recipe))
}
