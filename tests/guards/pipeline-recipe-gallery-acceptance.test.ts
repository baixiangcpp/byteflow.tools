import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { decodeRecipeFromUrlParam, encodeRecipeForShareUrl } from "@/features/pipeline/recipe-codec"
import { runRecipe, validateRecipe } from "@/features/pipeline/executor"
import { createRecipeFromTemplate, PIPELINE_RECIPE_TEMPLATES } from "@/features/pipeline/recipe-templates"

describe("pipeline recipe gallery acceptance", () => {
    it("keeps at least twelve executable built-in templates with complete gallery metadata", async () => {
        expect(PIPELINE_RECIPE_TEMPLATES.length).toBeGreaterThanOrEqual(12)

        const categories = new Set<string>(PIPELINE_RECIPE_TEMPLATES.map((template) => template.categoryKey))
        for (const requiredCategory of [
            "recipe_category_api",
            "recipe_category_security",
            "recipe_category_logs",
            "recipe_category_text",
            "recipe_category_image",
            "recipe_category_schema",
        ]) {
            expect(categories.has(requiredCategory), `${requiredCategory} should be represented`).toBe(true)
        }

        for (const template of PIPELINE_RECIPE_TEMPLATES) {
            expect(template.titleKey).toMatch(/^template_.*_title$/)
            expect(template.descriptionKey).toMatch(/^template_.*_description$/)
            expect(template.categoryKey).toMatch(/^recipe_category_/)
            expect(template.difficultyKey).toMatch(/^recipe_difficulty_/)
            expect(template.inputTypeKey).toMatch(/^recipe_input_/)
            expect(template.privacyBoundaryKey).toBe("recipe_privacy_structure_only")
            expect(template.steps.length).toBeGreaterThan(0)
            expect(template.tags.length).toBeGreaterThan(0)

            const generated = createRecipeFromTemplate(template, {
                recipeId: `recipe_${template.id}`,
                now: "2026-06-10T00:00:00.000Z",
                createStepId: (index) => `step_${index + 1}`,
                translate: (key) => key,
            })
            const result = await runRecipe(generated.recipe, generated.initialInput)
            const decodedShare = decodeRecipeFromUrlParam(encodeRecipeForShareUrl(generated.recipe))

            expect(validateRecipe(generated.recipe)).toEqual({ ok: true, errors: [] })
            expect(result.ok, `${template.id} should run from gallery sample input`).toBe(true)
            expect(decodedShare.ok, `${template.id} should share as a valid structure-only recipe`).toBe(true)
            if (decodedShare.ok) {
                expect(JSON.stringify(decodedShare.recipe)).not.toContain(generated.initialInput)
                expect(decodedShare.recipe.steps.every((step) => step.inputMode === "previous_output")).toBe(true)
            }
        }
    })

    it("keeps gallery loading, filtering, input-type, and community deferral surfaces visible", () => {
        const gallerySource = readFileSync("src/features/tools/pipeline-builder/pipeline-template-list.tsx", "utf8")
        const pageSource = readFileSync("src/features/tools/pipeline-builder/page.tsx", "utf8")
        const designDoc = readFileSync("docs/specs/pipeline-recipe-builder-technical-design.md", "utf8")
        const recipeRequestTemplate = readFileSync(".github/ISSUE_TEMPLATE/recipe_request.yml", "utf8")

        expect(gallerySource).toContain("recipe_gallery_search")
        expect(gallerySource).toContain("recipe_gallery_category_filter")
        expect(gallerySource).toContain("inputTypeKey")
        expect(gallerySource).toContain("onLoadTemplate(template)")
        expect(pageSource).toContain("createRecipeFromTemplate(template")
        expect(pageSource).toContain("setInitialInput(generated.initialInput)")
        expect(pageSource).toContain("sharePipelineRecipe(recipe")
        expect(designDoc).toContain("curated-only")
        expect(designDoc).toContain("Community recipe submissions are deferred")
        expect(recipeRequestTemplate).toContain("structure-only JSON or URL state without runtime input")
    })
})
