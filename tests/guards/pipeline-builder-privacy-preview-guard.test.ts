import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

describe("pipeline builder privacy preview guard", () => {
    it("routes save, export, and share actions through an explicit privacy preview", () => {
        const source = readFileSync("src/features/tools/pipeline-builder/page.tsx", "utf8")

        expect(source).toContain("PipelinePrivacyPreview")
        expect(source).toContain('requestPrivacyPreview("save")')
        expect(source).toContain('requestPrivacyPreview("export")')
        expect(source).toContain('requestPrivacyPreview("share")')
        expect(source).toContain("RECIPE_STRUCTURE_PRIVACY_SCOPE")
    })

    it("keeps recipe persistence sanitized before export and save", () => {
        const exportSource = readFileSync("src/features/pipeline/recipe-import-export.ts", "utf8")
        const storeSource = readFileSync("src/features/pipeline/recipe-store.ts", "utf8")
        const sanitizerSource = readFileSync("src/features/pipeline/recipe-sanitizer.ts", "utf8")

        expect(exportSource).toContain("sanitizeRecipeForPersistence(recipe)")
        expect(storeSource).toContain("sanitizeRecipeForPersistence(recipe)")
        expect(sanitizerSource).toContain("constantInput")
        expect(sanitizerSource).toContain('inputMode: "previous_output"')
        expect(sanitizerSource).toContain("persistentOptionKeys")
        expect(sanitizerSource).toContain("SUSPICIOUS_PERSISTENT_OPTION_KEY_PARTS")
        expect(sanitizerSource).not.toContain("adapter.publicOptionKeys")
    })

    it("names user-authored options as excluded in the privacy preview scope", () => {
        const sanitizerSource = readFileSync("src/features/pipeline/recipe-sanitizer.ts", "utf8")
        const previewSource = readFileSync("src/features/tools/pipeline-builder/pipeline-privacy-preview.tsx", "utf8")

        expect(sanitizerSource).toContain("privacy_scope_user_authored_options")
        expect(previewSource).toContain("scope.included")
        expect(previewSource).toContain("scope.excluded")
    })
})
