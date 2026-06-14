import { describe, expect, it } from "vitest"
import { getPipelineAdapter, getPipelineAdapterKeys } from "@/features/pipeline/adapter-registry"
import { decodeRecipeFromUrlParam, encodeRecipeForShareUrl, encodeRecipeForUrl, recipeContainsRuntimeInput } from "@/features/pipeline/recipe-codec"
import { createEmptyRecipe, runRecipe, validateRecipe } from "@/features/pipeline/executor"
import { exportRecipeToJson, importRecipeFromJson } from "@/features/pipeline/recipe-import-export"
import { createRecipeFromTemplate, PIPELINE_RECIPE_TEMPLATES } from "@/features/pipeline/recipe-templates"
import { isRecipeStoreAvailable } from "@/features/pipeline/recipe-store"
import { DEFAULT_RECIPE_SETTINGS, type PipelineToolAdapter, type RecipeDocument } from "@/features/pipeline/recipe-types"

function buildRecipe(overrides: Partial<RecipeDocument> = {}): RecipeDocument {
    const base: RecipeDocument = {
        schemaVersion: 1,
        id: "recipe_test",
        name: "Test recipe",
        createdAt: "2026-06-10T00:00:00.000Z",
        updatedAt: "2026-06-10T00:00:00.000Z",
        steps: [
            {
                id: "format",
                toolKey: "json_formatter",
                adapterVersion: 1,
                inputMode: "previous_output",
                options: { mode: "minify" },
            },
            {
                id: "encode",
                toolKey: "base64_encode_decode",
                adapterVersion: 1,
                inputMode: "previous_output",
                options: { operation: "encode", urlSafe: true },
            },
        ],
        edges: [
            { fromStepId: "format", toStepId: "encode" },
        ],
        settings: { ...DEFAULT_RECIPE_SETTINGS },
    }
    return { ...base, ...overrides }
}

describe("pipeline foundation", () => {
    it("exposes the first deterministic adapter set", () => {
        expect(getPipelineAdapterKeys()).toEqual([
            "json_formatter",
            "base64_encode_decode",
            "url_encode_decode",
            "multiple_whitespace_remover",
            "invisible_chars_detector",
            "log_scrubber",
        ])
        expect(getPipelineAdapter("json_formatter")?.version).toBe(1)
    })

    it("validates a supported MVP recipe", () => {
        expect(validateRecipe(buildRecipe())).toEqual({ ok: true, errors: [] })
    })

    it("rejects manual inputMode until UI semantics are implemented", () => {
        const result = validateRecipe(buildRecipe({
            steps: [
                {
                    id: "manual",
                    toolKey: "json_formatter",
                    adapterVersion: 1,
                    inputMode: "manual",
                    options: {},
                } as never,
            ],
            edges: [],
        }))

        expect(result.ok).toBe(false)
        expect(result.errors).toContain("manual has an unsupported inputMode.")
    })

    it.each([
        ["steps null item", { steps: [null], edges: [] }, "Each step must be a plain object."],
        ["steps array item", { steps: [[]], edges: [] }, "Each step must be a plain object."],
        ["empty step object", { steps: [{}], edges: [] }, "Each step requires a non-empty string id."],
        ["edges null item", { edges: [null] }, "Each edge must be a plain object."],
        ["edges string item", { edges: ["x"] }, "Each edge must be a plain object."],
        ["empty edge object", { edges: [{}] }, "Each edge requires a non-empty string fromStepId."],
        ["bad string settings", { settings: "bad" }, "settings must be a plain object."],
        ["null settings", { settings: null }, "settings must be a plain object."],
        ["null step options", {
            steps: [{
                id: "bad_options",
                toolKey: "json_formatter",
                adapterVersion: 1,
                inputMode: "previous_output",
                options: null,
            }],
            edges: [],
        }, "bad_options options must be a plain object."],
    ])("returns validation errors instead of throwing for malformed recipe input: %s", (_name, overrides, expectedError) => {
        expect(() => validateRecipe(buildRecipe(overrides as Partial<RecipeDocument>))).not.toThrow()
        const result = validateRecipe(buildRecipe(overrides as Partial<RecipeDocument>))

        expect(result.ok).toBe(false)
        expect(result.errors).toContain(expectedError)
    })

    it("rejects unsupported adapters and adapter version drift", () => {
        const result = validateRecipe(buildRecipe({
            steps: [
                {
                    id: "bad",
                    toolKey: "missing_tool",
                    adapterVersion: 1,
                    inputMode: "previous_output",
                    options: {},
                },
                {
                    id: "old",
                    toolKey: "json_formatter",
                    adapterVersion: 0,
                    inputMode: "previous_output",
                    options: {},
                },
            ],
            edges: [],
        }))

        expect(result.ok).toBe(false)
        expect(result.errors).toContain("No pipeline adapter is available for missing_tool.")
        expect(result.errors).toContain("json_formatter requires adapter version 1.")
    })

    it("runs a linear recipe and passes output between steps", async () => {
        const result = await runRecipe(buildRecipe(), '{ "name": "byteflow" }')

        expect(result.ok).toBe(true)
        expect(result.errors).toEqual([])
        expect(result.steps).toHaveLength(2)
        expect(result.steps[0].output).toBe('{"name":"byteflow"}')
        expect(result.finalOutput).toBe("eyJuYW1lIjoiYnl0ZWZsb3cifQ")
    })

    it("allows empty edges and executes recipe.steps order", async () => {
        const result = await runRecipe(buildRecipe({ edges: [] }), '{ "name": "byteflow" }')

        expect(result.ok).toBe(true)
        expect(result.steps.map((step) => step.stepId)).toEqual(["format", "encode"])
        expect(result.finalOutput).toBe("eyJuYW1lIjoiYnl0ZWZsb3cifQ")
    })

    it("accepts a valid explicit linear chain", () => {
        const recipe = buildRecipe({
            steps: [
                {
                    id: "a",
                    toolKey: "multiple_whitespace_remover",
                    adapterVersion: 1,
                    inputMode: "previous_output",
                    options: {},
                },
                {
                    id: "b",
                    toolKey: "url_encode_decode",
                    adapterVersion: 1,
                    inputMode: "previous_output",
                    options: { operation: "encode", mode: "component" },
                },
                {
                    id: "c",
                    toolKey: "base64_encode_decode",
                    adapterVersion: 1,
                    inputMode: "previous_output",
                    options: { operation: "encode" },
                },
            ],
            edges: [
                { fromStepId: "a", toStepId: "b" },
                { fromStepId: "b", toStepId: "c" },
            ],
        })

        expect(validateRecipe(recipe)).toEqual({ ok: true, errors: [] })
    })

    it.each([
        ["self loop", [{ fromStepId: "format", toStepId: "format" }], "Edge format -> format is a self-loop."],
        ["branch", [{ fromStepId: "format", toStepId: "encode" }, { fromStepId: "format", toStepId: "scrub" }], "Step format has multiple outgoing edges."],
        ["merge", [{ fromStepId: "format", toStepId: "scrub" }, { fromStepId: "encode", toStepId: "scrub" }], "Step scrub has multiple incoming edges."],
        ["cycle", [{ fromStepId: "format", toStepId: "encode" }, { fromStepId: "encode", toStepId: "format" }], "edges must form one connected linear chain covering every step."],
        ["disconnected", [{ fromStepId: "format", toStepId: "encode" }], "edges must form a single linear chain covering every step."],
    ])("rejects non-linear edge graph: %s", (_name, edges, expectedError) => {
        const recipe = buildRecipe({
            steps: [
                ...buildRecipe({ edges: [] }).steps,
                {
                    id: "scrub",
                    toolKey: "log_scrubber",
                    adapterVersion: 1,
                    inputMode: "previous_output",
                    options: {},
                },
            ],
            edges,
        })
        const result = validateRecipe(recipe)

        expect(result.ok).toBe(false)
        expect(result.errors).toContain(expectedError)
    })

    it("stops on error when configured", async () => {
        const result = await runRecipe(buildRecipe(), "{broken json")

        expect(result.ok).toBe(false)
        expect(result.steps).toHaveLength(1)
        expect(result.steps[0].toolKey).toBe("json_formatter")
        expect(result.steps[0].error?.code).toBe("json_parse_error")
    })

    it("continues after a failed step when stopOnError is disabled", async () => {
        const recipe = buildRecipe({
            settings: { ...DEFAULT_RECIPE_SETTINGS, stopOnError: false },
        })
        const result = await runRecipe(recipe, "{broken json")

        expect(result.ok).toBe(false)
        expect(result.steps).toHaveLength(2)
        expect(result.steps[0].ok).toBe(false)
        expect(result.steps[1].ok).toBe(true)
    })

    it("converts adapter runtime throws into structured step errors", async () => {
        const throwingAdapter: PipelineToolAdapter = {
            toolKey: "throwing_adapter",
            slug: "throwing-adapter",
            version: 1,
            inputKind: "text",
            outputKind: "text",
            defaultOptions: {},
            publicOptionKeys: [],
            validateOptions: () => ({ ok: true, errors: [] }),
            run: () => {
                throw new Error("unexpected adapter failure")
            },
        }
        const recipe = buildRecipe({
            steps: [{
                id: "explode",
                toolKey: "throwing_adapter",
                adapterVersion: 1,
                inputMode: "previous_output",
                options: {},
            }],
            edges: [],
        })
        const result = await runRecipe(recipe, "input", (toolKey) => toolKey === "throwing_adapter" ? throwingAdapter : getPipelineAdapter(toolKey))

        expect(result.ok).toBe(false)
        expect(result.errors).toContain("explode: unexpected adapter failure")
        expect(result.steps).toHaveLength(1)
        expect(result.steps[0].error?.code).toBe("adapter_runtime_error")
    })

    it("uses constant input without leaking it into default share URLs", () => {
        const recipe = buildRecipe({
            steps: [
                {
                    id: "secret_sample",
                    toolKey: "log_scrubber",
                    adapterVersion: 1,
                    inputMode: "constant",
                    constantInput: "Authorization: Bearer secret-token-value",
                    options: {},
                },
            ],
            edges: [],
        })

        expect(recipeContainsRuntimeInput(recipe)).toBe(true)
        const shared = encodeRecipeForShareUrl(recipe)
        const decoded = decodeRecipeFromUrlParam(shared)

        expect(decoded.ok).toBe(true)
        if (decoded.ok) {
            expect(decoded.recipe.steps[0].inputMode).toBe("previous_output")
            expect(decoded.recipe.steps[0].constantInput).toBeUndefined()
        }
    })

    it("removes non-public options from share URLs", () => {
        const recipe = buildRecipe({
            steps: [
                {
                    id: "encode",
                    toolKey: "base64_encode_decode",
                    adapterVersion: 1,
                    inputMode: "previous_output",
                    options: {
                        operation: "encode",
                        urlSafe: true,
                        apiKey: "secret",
                        token: "secret-token",
                    },
                },
            ],
            edges: [],
        })
        const decoded = decodeRecipeFromUrlParam(encodeRecipeForShareUrl(recipe))

        expect(decoded.ok).toBe(true)
        if (decoded.ok) {
            expect(decoded.recipe.steps[0].options).toEqual({
                operation: "encode",
                urlSafe: true,
            })
            expect(decoded.recipe.steps[0].options).not.toHaveProperty("apiKey")
            expect(decoded.recipe.steps[0].options).not.toHaveProperty("token")
        }
    })

    it("round trips recipe URL encoding", () => {
        const recipe = buildRecipe()
        const encoded = encodeRecipeForUrl(recipe)
        const decoded = decodeRecipeFromUrlParam(encoded)

        expect(decoded.ok).toBe(true)
        if (decoded.ok) {
            expect(decoded.recipe.name).toBe("Test recipe")
            expect(decoded.recipe.steps.map((step) => step.toolKey)).toEqual(["json_formatter", "base64_encode_decode"])
        }
    })

    it("reports malformed recipe URL payloads", () => {
        expect(decodeRecipeFromUrlParam("not valid base64!")).toEqual({
            ok: false,
            error: "Recipe URL payload is malformed.",
        })
    })

    it("exports and imports recipe JSON without auto-running it", () => {
        const recipe = buildRecipe()
        const imported = importRecipeFromJson(exportRecipeToJson(recipe))

        expect(imported.ok).toBe(true)
        if (imported.ok) {
            expect(imported.recipe.name).toBe("Test recipe")
            expect(imported.recipe.steps.map((step) => step.toolKey)).toEqual(["json_formatter", "base64_encode_decode"])
        }
    })

    it("returns structured import errors for invalid recipe JSON", () => {
        const imported = importRecipeFromJson("{bad json")

        expect(imported.ok).toBe(false)
        if (!imported.ok) {
            expect(imported.errors[0]).toMatch(/Recipe JSON is invalid/)
        }
    })

    it("exposes a safe storage availability probe", () => {
        expect(typeof isRecipeStoreAvailable()).toBe("boolean")
    })

    it("creates an empty recipe with safe defaults", () => {
        const recipe = createEmptyRecipe("new_recipe", "New recipe")

        expect(recipe.schemaVersion).toBe(1)
        expect(recipe.steps).toEqual([])
        expect(recipe.settings).toEqual(DEFAULT_RECIPE_SETTINGS)
    })

    it("creates valid built-in recipe templates with deterministic linear edges", () => {
        for (const template of PIPELINE_RECIPE_TEMPLATES) {
            const generated = createRecipeFromTemplate(template, {
                recipeId: `recipe_${template.id}`,
                now: "2026-06-10T00:00:00.000Z",
                createStepId: (index) => `step_${index + 1}`,
                translate: (key) => key,
            })

            expect(generated.initialInput).toBe(template.sampleInput)
            expect(validateRecipe(generated.recipe)).toEqual({ ok: true, errors: [] })
            expect(generated.recipe.steps).toHaveLength(template.steps.length)
            expect(generated.recipe.edges).toEqual(
                generated.recipe.steps.slice(0, -1).map((step, index) => ({
                    fromStepId: step.id,
                    toStepId: generated.recipe.steps[index + 1].id,
                })),
            )
        }
    })

    it("runs the built-in recipe templates without leaking sample input into share URLs", async () => {
        for (const template of PIPELINE_RECIPE_TEMPLATES) {
            const generated = createRecipeFromTemplate(template, {
                recipeId: `recipe_${template.id}`,
                now: "2026-06-10T00:00:00.000Z",
                createStepId: (index) => `step_${index + 1}`,
                translate: (key) => key,
            })
            const result = await runRecipe(generated.recipe, generated.initialInput)
            const decoded = decodeRecipeFromUrlParam(encodeRecipeForShareUrl(generated.recipe))

            expect(result.ok).toBe(true)
            expect(result.finalOutput.length).toBeGreaterThan(0)
            expect(decoded.ok).toBe(true)
            if (decoded.ok) {
                expect(JSON.stringify(decoded.recipe)).not.toContain(generated.initialInput)
                expect(decoded.recipe.steps.every((step) => step.inputMode === "previous_output")).toBe(true)
            }
        }
    })
})
