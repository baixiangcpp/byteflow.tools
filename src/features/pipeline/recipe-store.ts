import type { RecipeDocument } from "./recipe-types"
import { createPortableRecipe } from "./recipe-codec"

const DB_NAME = "byteflow-pipeline-recipes"
const DB_VERSION = 1
const STORE_NAME = "recipes"

export interface SavedRecipeRecord {
    id: string
    name: string
    recipe: RecipeDocument
    createdAt: string
    updatedAt: string
    lastRunAt?: string
    pinned?: boolean
}

export type RecipeStoreResult<T> =
    | { ok: true; value: T }
    | { ok: false; error: string }

export function isRecipeStoreAvailable(): boolean {
    return typeof window !== "undefined" && typeof window.indexedDB !== "undefined"
}

export function createSavedRecipeRecord(
    recipe: RecipeDocument,
    metadata: Partial<SavedRecipeRecord> = {},
    now = new Date().toISOString(),
): SavedRecipeRecord {
    const portableRecipe = createPortableRecipe(recipe)
    return {
        id: portableRecipe.id,
        name: portableRecipe.name,
        recipe: portableRecipe,
        createdAt: metadata.createdAt ?? portableRecipe.createdAt ?? now,
        updatedAt: now,
        lastRunAt: metadata.lastRunAt,
        pinned: metadata.pinned,
    }
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."))
    })
}

function openRecipeDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (!isRecipeStoreAvailable()) {
            reject(new Error("IndexedDB is unavailable in this browser."))
            return
        }

        const request = window.indexedDB.open(DB_NAME, DB_VERSION)
        request.onupgradeneeded = () => {
            const db = request.result
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "id" })
            }
        }
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error ?? new Error("Unable to open recipe store."))
    })
}

async function withStore<T>(
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<RecipeStoreResult<T>> {
    let db: IDBDatabase | null = null
    try {
        db = await openRecipeDb()
        const transaction = db.transaction(STORE_NAME, mode)
        const result = await requestToPromise(action(transaction.objectStore(STORE_NAME)))
        return { ok: true, value: result }
    } catch (error) {
        return {
            ok: false,
            error: error instanceof Error ? error.message : "Recipe storage failed.",
        }
    } finally {
        db?.close()
    }
}

export async function saveRecipeRecord(recipe: RecipeDocument, metadata: Partial<SavedRecipeRecord> = {}): Promise<RecipeStoreResult<SavedRecipeRecord>> {
    const record = createSavedRecipeRecord(recipe, metadata)

    const result = await withStore<IDBValidKey>("readwrite", (store) => store.put(record))
    if (!result.ok) return result
    return { ok: true, value: record }
}

export async function listSavedRecipes(): Promise<RecipeStoreResult<SavedRecipeRecord[]>> {
    const result = await withStore<SavedRecipeRecord[]>("readonly", (store) => store.getAll())
    if (!result.ok) return result
    return {
        ok: true,
        value: result.value.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    }
}

export async function loadSavedRecipe(id: string): Promise<RecipeStoreResult<SavedRecipeRecord | null>> {
    return withStore<SavedRecipeRecord | undefined>("readonly", (store) => store.get(id))
        .then((result) => result.ok ? { ok: true, value: result.value ?? null } : result)
}

export async function deleteSavedRecipe(id: string): Promise<RecipeStoreResult<void>> {
    return withStore<undefined>("readwrite", (store) => store.delete(id))
        .then((result) => result.ok ? { ok: true, value: undefined } : result)
}
