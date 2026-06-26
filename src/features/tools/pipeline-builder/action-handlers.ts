import { toast } from "sonner"
import type { TranslationType } from "@/core/i18n/lang-provider"
import { FILE_INPUT_POLICIES, readTextFileWithPolicy, validateFileAgainstPolicy } from "@/core/files/file-input-policy"
import { copyTextWithToolFeedback, downloadedFileFeedback } from "@/features/tool-shell/tool-action-feedback"
import { encodeRecipeForShareUrl, recipeContainsRuntimeInput } from "@/features/pipeline/recipe-codec"
import { exportRecipeToJson, importRecipeFromJson } from "@/features/pipeline/recipe-import-export"
import type { RecipeDocument } from "@/features/pipeline/recipe-types"
import type { ToolActionResult } from "@/features/tool-shell/tool-action-bar"
import { downloadText } from "./browser-actions"
import { SHARE_PARAM } from "./constants"

type TextLookup = (key: string) => string

type ImportRecipeResult =
    | { ok: true; recipe: RecipeDocument; announcement: string }
    | { ok: false; error: string; announcement: string }

function actionAnnouncement(feedback: ToolActionResult, fallback: string): string {
    if (feedback.description) return `${feedback.message}. ${feedback.description}`
    return feedback.message ?? fallback
}

function errorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback
}

function failedAction(title: string, message: string): ToolActionResult {
    toast.error(title, { description: message })
    return { status: "failed", message: title, description: message }
}

export function exportPipelineRecipe(
    recipe: RecipeDocument,
    t: TranslationType,
    text: TextLookup,
    announce: (message: string) => void,
): ToolActionResult {
    const filename = `${recipe.name.trim().replace(/[^\w.-]+/g, "-") || "byteflow-recipe"}.json`
    try {
        downloadText(filename, exportRecipeToJson(recipe))
    } catch (error) {
        const feedback = failedAction(text("recipe_export_failed"), errorMessage(error, text("recipe_export_failed")))
        announce(actionAnnouncement(feedback, text("recipe_export_failed")))
        return feedback
    }

    const feedback = downloadedFileFeedback(t, filename, text("recipe_exported"))
    announce(actionAnnouncement(feedback, text("recipe_exported")))
    return feedback
}

export async function importPipelineRecipeFile(file: File, text: TextLookup): Promise<ImportRecipeResult> {
    const fileValidation = validateFileAgainstPolicy(file, FILE_INPUT_POLICIES["recipe-json"])
    if (!fileValidation.ok) {
        toast.error(text("import_failed"), { description: fileValidation.message })
        return { ok: false, error: fileValidation.message, announcement: `${text("import_failed")}. ${fileValidation.message}` }
    }

    let source = ""
    try {
        source = await readTextFileWithPolicy(file, FILE_INPUT_POLICIES["recipe-json"])
    } catch (error) {
        const message = errorMessage(error, text("import_failed"))
        toast.error(text("import_failed"), { description: message })
        return { ok: false, error: message, announcement: `${text("import_failed")}. ${message}` }
    }

    const imported = importRecipeFromJson(source)
    if (!imported.ok) {
        const message = imported.errors.join("\n")
        toast.error(text("import_failed"), { description: message })
        return { ok: false, error: message, announcement: `${text("import_failed")}. ${message}` }
    }

    toast.success(text("recipe_imported"))
    return { ok: true, recipe: imported.recipe, announcement: text("recipe_imported") }
}

export async function sharePipelineRecipe(
    recipe: RecipeDocument,
    lang: string,
    t: TranslationType,
    text: TextLookup,
    announce: (message: string) => void,
): Promise<ToolActionResult> {
    const encoded = encodeRecipeForShareUrl(recipe)
    const url = `${window.location.origin}/${lang}/pipeline-builder?${SHARE_PARAM}=${encodeURIComponent(encoded)}`
    const feedback = await copyTextWithToolFeedback(
        t,
        url,
        text("share_recipe"),
        recipeContainsRuntimeInput(recipe) ? text("share_copied_without_runtime_input") : text("share_copied"),
    )
    announce(actionAnnouncement(feedback, text("share_recipe")))
    return feedback
}
