import { describe, expect, it } from "vitest"
import { getPipelineAdapter, getPipelineAdapterKeys, PIPELINE_TOOL_ADAPTERS } from "@/features/pipeline/adapter-registry"
import { TOOL_MANIFESTS } from "@/core/registry"
import { createPortableRecipe, decodeRecipeFromUrlParam, encodeRecipeForShareUrl, encodeRecipeForUrl, recipeContainsRuntimeInput } from "@/features/pipeline/recipe-codec"
import { createEmptyRecipe, runRecipe, validateRecipe } from "@/features/pipeline/executor"
import { exportRecipeToJson, importRecipeFromJson } from "@/features/pipeline/recipe-import-export"
import { sanitizeRecipeForPersistence } from "@/features/pipeline/recipe-sanitizer"
import { createRecipeFromTemplate, getPipelineRecipeTemplateForWorkflow, PIPELINE_RECIPE_TEMPLATES } from "@/features/pipeline/recipe-templates"
import { createSavedRecipeRecord, isRecipeStoreAvailable } from "@/features/pipeline/recipe-store"
import { DEFAULT_RECIPE_SETTINGS, type PipelineToolAdapter, type RecipeDocument } from "@/features/pipeline/recipe-types"
import { getStepCompatibilityHints } from "@/features/tools/pipeline-builder/logic"

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
            "yaml_json_converter",
            "csv_json_converter",
            "ndjson_formatter",
            "slugify_case_converter",
            "hash_generator",
            "jwt_decoder",
            "unix_timestamp",
            "html_to_markdown",
            "regex_tester",
            "env_parser",
            "json_schema_workbench",
            "openapi_diff",
            "graphql_workbench",
            "devops_yaml_validator",
        ])
        expect(getPipelineAdapter("json_formatter")?.version).toBe(1)
    })

    it("keeps adapter metadata explicit and aligned with canonical tool manifests", () => {
        const adapterKeys = PIPELINE_TOOL_ADAPTERS.map((adapter) => adapter.toolKey)
        const manifestKeys = new Set(TOOL_MANIFESTS.map((tool) => tool.key))

        expect(new Set(adapterKeys).size).toBe(adapterKeys.length)

        for (const adapter of PIPELINE_TOOL_ADAPTERS) {
            expect(manifestKeys.has(adapter.toolKey), `${adapter.toolKey} must map to a canonical tool manifest`).toBe(true)
            expect(adapter.slug).toBe(TOOL_MANIFESTS.find((tool) => tool.key === adapter.toolKey)?.slug)
            expect(["text", "json", "yaml", "csv", "bytes"]).toContain(adapter.inputKind)
            expect(["text", "json", "yaml", "csv", "bytes"]).toContain(adapter.outputKind)
            expect(adapter.deterministic).toBe(true)
            expect(typeof adapter.safeForSensitiveInput).toBe("boolean")
            expect(typeof adapter.mayIncreaseSize).toBe("boolean")
            expect(Array.isArray(adapter.warnings)).toBe(true)
            expect(adapter.publicOptionKeys.every((key) => Object.prototype.hasOwnProperty.call(adapter.defaultOptions, key))).toBe(true)
        }
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

    it("runs phase-one data format adapters", async () => {
        const yamlRecipe = buildRecipe({
            steps: [{
                id: "yaml",
                toolKey: "yaml_json_converter",
                adapterVersion: 1,
                inputMode: "previous_output",
                options: { mode: "yaml-to-json" },
            }],
            edges: [],
        })
        const csvRecipe = buildRecipe({
            steps: [{
                id: "csv",
                toolKey: "csv_json_converter",
                adapterVersion: 1,
                inputMode: "previous_output",
                options: { direction: "csv-to-json", delimiter: "auto", hasHeader: true, typeInference: true },
            }],
            edges: [],
        })
        const ndjsonRecipe = buildRecipe({
            steps: [{
                id: "ndjson",
                toolKey: "ndjson_formatter",
                adapterVersion: 1,
                inputMode: "previous_output",
                options: { mode: "to-array" },
            }],
            edges: [],
        })
        const slugRecipe = buildRecipe({
            steps: [{
                id: "slug",
                toolKey: "slugify_case_converter",
                adapterVersion: 1,
                inputMode: "previous_output",
                options: { style: "slug", locale: "en-US", preserveAcronyms: true },
            }],
            edges: [],
        })

        await expect(runRecipe(yamlRecipe, "name: byteflow\nactive: true\n")).resolves.toMatchObject({
            ok: true,
            finalOutput: "{\n  \"name\": \"byteflow\",\n  \"active\": true\n}",
        })
        await expect(runRecipe(csvRecipe, "id,name\n1,Alice")).resolves.toMatchObject({
            ok: true,
            finalOutput: "[\n  {\n    \"id\": 1,\n    \"name\": \"Alice\"\n  }\n]",
        })
        await expect(runRecipe(ndjsonRecipe, "{\"id\":1}\n{\"id\":2}")).resolves.toMatchObject({
            ok: true,
            finalOutput: "[\n  {\n    \"id\": 1\n  },\n  {\n    \"id\": 2\n  }\n]",
        })
        await expect(runRecipe(slugRecipe, "Hello Byteflow Tools")).resolves.toMatchObject({
            ok: true,
            finalOutput: "hello-byteflow-tools",
        })
    })

    it("returns structured errors for phase-one adapter invalid input and options", async () => {
        const badYamlOptions = validateRecipe(buildRecipe({
            steps: [{
                id: "yaml",
                toolKey: "yaml_json_converter",
                adapterVersion: 1,
                inputMode: "previous_output",
                options: { mode: "xml-to-json" },
            }],
            edges: [],
        }))
        const badCsv = await runRecipe(buildRecipe({
            steps: [{
                id: "csv",
                toolKey: "csv_json_converter",
                adapterVersion: 1,
                inputMode: "previous_output",
                options: { direction: "json-to-csv", delimiter: "auto", hasHeader: true, typeInference: true },
            }],
            edges: [],
        }), "{\"not\":\"array\"}")

        expect(badYamlOptions.ok).toBe(false)
        expect(badYamlOptions.errors).toContain("yaml: mode must be yaml-to-json or json-to-yaml.")
        expect(badCsv.ok).toBe(false)
        expect(badCsv.errors).toContain("csv: JSON input must be an array to convert to CSV.")
    })

    it("runs phase-two text utility adapters", async () => {
        const hashRecipe = buildRecipe({
            steps: [{
                id: "hash",
                toolKey: "hash_generator",
                adapterVersion: 1,
                inputMode: "previous_output",
                options: { algorithm: "sha256" },
            }],
            edges: [],
        })
        const jwtRecipe = buildRecipe({
            steps: [{
                id: "jwt",
                toolKey: "jwt_decoder",
                adapterVersion: 1,
                inputMode: "previous_output",
                options: { part: "payload" },
            }],
            edges: [],
        })
        const unixRecipe = buildRecipe({
            steps: [{
                id: "time",
                toolKey: "unix_timestamp",
                adapterVersion: 1,
                inputMode: "previous_output",
                options: { output: "iso" },
            }],
            edges: [],
        })
        const htmlRecipe = buildRecipe({
            steps: [{
                id: "markdown",
                toolKey: "html_to_markdown",
                adapterVersion: 1,
                inputMode: "previous_output",
                options: {},
            }],
            edges: [],
        })
        const sampleJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiQnl0ZWZsb3cifQ.signature"

        await expect(runRecipe(hashRecipe, "hello")).resolves.toMatchObject({
            ok: true,
            finalOutput: "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
        })
        await expect(runRecipe(jwtRecipe, sampleJwt)).resolves.toMatchObject({
            ok: true,
            finalOutput: "{\n  \"sub\": \"123\",\n  \"name\": \"Byteflow\"\n}",
        })
        await expect(runRecipe(unixRecipe, "1712810000")).resolves.toMatchObject({
            ok: true,
            finalOutput: "2024-04-11T04:33:20.000Z",
        })
        await expect(runRecipe(htmlRecipe, "<h1>Title</h1><p>Hello</p>")).resolves.toMatchObject({
            ok: true,
            finalOutput: "# Title\n\nHello",
        })
    })

    it("returns structured errors for phase-two adapter invalid input and options", async () => {
        const badHashOptions = validateRecipe(buildRecipe({
            steps: [{
                id: "hash",
                toolKey: "hash_generator",
                adapterVersion: 1,
                inputMode: "previous_output",
                options: { algorithm: "bcrypt" },
            }],
            edges: [],
        }))
        const badJwt = await runRecipe(buildRecipe({
            steps: [{
                id: "jwt",
                toolKey: "jwt_decoder",
                adapterVersion: 1,
                inputMode: "previous_output",
                options: { part: "payload" },
            }],
            edges: [],
        }), "not-a-jwt")
        const badTimestamp = await runRecipe(buildRecipe({
            steps: [{
                id: "time",
                toolKey: "unix_timestamp",
                adapterVersion: 1,
                inputMode: "previous_output",
                options: { output: "iso" },
            }],
            edges: [],
        }), "not-a-timestamp")

        expect(badHashOptions.ok).toBe(false)
        expect(badHashOptions.errors).toContain("hash: algorithm must be md5, sha1, sha224, sha256, sha384, or sha512.")
        expect(badJwt.ok).toBe(false)
        expect(badJwt.steps[0].error?.code).toBe("jwt_decode_error")
        expect(badTimestamp.ok).toBe(false)
        expect(badTimestamp.steps[0].error?.code).toBe("timestamp_parse_error")
    })

    it("runs regex summary and env parser adapters", async () => {
        const regexRecipe = buildRecipe({
            steps: [{
                id: "regex",
                toolKey: "regex_tester",
                adapterVersion: 1,
                inputMode: "previous_output",
                options: { pattern: "([A-Z][a-z]+)(\\d)", flags: "g", maxMatches: 10 },
            }],
            edges: [],
        })
        const envRecipe = buildRecipe({
            steps: [{
                id: "env",
                toolKey: "env_parser",
                adapterVersion: 1,
                inputMode: "previous_output",
                options: { format: "json" },
            }],
            edges: [],
        })

        const regexResult = await runRecipe(regexRecipe, "Ab1 Cd2")
        const envResult = await runRecipe(envRecipe, "PORT=3000\nSECRET=\"quoted value\"")

        expect(regexResult.ok).toBe(true)
        expect(JSON.parse(regexResult.finalOutput)).toMatchObject({
            count: 2,
            limited: false,
            matches: [
                { match: "Ab1", index: 0, groupIndex: 0, groups: ["Ab", "1"] },
                { match: "Cd2", index: 4, groupIndex: 1, groups: ["Cd", "2"] },
            ],
        })
        expect(envResult).toMatchObject({
            ok: true,
            finalOutput: "{\n  \"PORT\": \"3000\",\n  \"SECRET\": \"quoted value\"\n}",
        })
    })

    it("rejects invalid regex and env adapter options", () => {
        const badRegex = validateRecipe(buildRecipe({
            steps: [{
                id: "regex",
                toolKey: "regex_tester",
                adapterVersion: 1,
                inputMode: "previous_output",
                options: { pattern: "", flags: "g", maxMatches: 10 },
            }],
            edges: [],
        }))
        const badEnv = validateRecipe(buildRecipe({
            steps: [{
                id: "env",
                toolKey: "env_parser",
                adapterVersion: 1,
                inputMode: "previous_output",
                options: { format: "xml" },
            }],
            edges: [],
        }))

        expect(badRegex.ok).toBe(false)
        expect(badRegex.errors).toContain("regex: pattern is required.")
        expect(badEnv.ok).toBe(false)
        expect(badEnv.errors).toContain("env: format must be json, yaml, or docker-args.")
    })

    it("allows empty edges and executes recipe.steps order", async () => {
        const result = await runRecipe(buildRecipe({ edges: [] }), '{ "name": "byteflow" }')

        expect(result.ok).toBe(true)
        expect(result.steps.map((step) => step.stepId)).toEqual(["format", "encode"])
        expect(result.finalOutput).toBe("eyJuYW1lIjoiYnl0ZWZsb3cifQ")
    })

    it("executes explicit linear edges from the only start step instead of array order", async () => {
        const recipe = buildRecipe({
            steps: [
                {
                    id: "encode",
                    toolKey: "base64_encode_decode",
                    adapterVersion: 1,
                    inputMode: "previous_output",
                    options: { operation: "encode", urlSafe: true },
                },
                {
                    id: "format",
                    toolKey: "json_formatter",
                    adapterVersion: 1,
                    inputMode: "previous_output",
                    options: { mode: "minify" },
                },
            ],
            edges: [
                { fromStepId: "format", toStepId: "encode" },
            ],
        })
        const result = await runRecipe(recipe, '{ "name": "byteflow" }')

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

    it("rejects edges that reference unknown step ids", () => {
        const result = validateRecipe(buildRecipe({
            edges: [
                { fromStepId: "format", toStepId: "missing" },
                { fromStepId: "also_missing", toStepId: "encode" },
            ],
        }))

        expect(result.ok).toBe(false)
        expect(result.errors).toContain("Edge references unknown toStepId: missing.")
        expect(result.errors).toContain("Edge references unknown fromStepId: also_missing.")
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
            safeForSensitiveInput: true,
            deterministic: true,
            mayIncreaseSize: false,
            warnings: [],
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

    it("rejects oversized initial input before running adapters", async () => {
        const result = await runRecipe(
            buildRecipe({
                settings: {
                    ...DEFAULT_RECIPE_SETTINGS,
                    maxInputBytes: 4,
                },
            }),
            "too large",
        )

        expect(result.ok).toBe(false)
        expect(result.steps).toEqual([])
        expect(result.errors).toContain("Initial input exceeds 4 bytes.")
        expect(result.finalOutput).toBe("too large")
    })

    it("stops when a step output exceeds the configured output budget", async () => {
        const result = await runRecipe(
            buildRecipe({
                steps: [
                    {
                        id: "encode",
                        toolKey: "base64_encode_decode",
                        adapterVersion: 1,
                        inputMode: "previous_output",
                        options: { operation: "encode", urlSafe: true },
                    },
                ],
                edges: [],
                settings: {
                    ...DEFAULT_RECIPE_SETTINGS,
                    maxOutputBytes: 4,
                },
            }),
            "byteflow",
        )

        expect(result.ok).toBe(false)
        expect(result.steps).toHaveLength(1)
        expect(result.steps[0].error?.code).toBe("output_too_large")
        expect(result.errors).toContain("Step encode output exceeds 4 bytes.")
    })

    it("omits intermediate output fields when configured", async () => {
        const result = await runRecipe(
            buildRecipe({
                settings: {
                    ...DEFAULT_RECIPE_SETTINGS,
                    keepIntermediateOutputs: false,
                },
            }),
            '{ "name": "byteflow" }',
        )

        expect(result.ok).toBe(true)
        expect(result.finalOutput).toBe("eyJuYW1lIjoiYnl0ZWZsb3cifQ")
        expect(result.steps.every((step) => !Object.prototype.hasOwnProperty.call(step, "output"))).toBe(true)
    })

    it("creates portable recipes without runtime payloads or private options", () => {
        const recipe = buildRecipe({
            steps: [
                {
                    id: "secret_sample",
                    toolKey: "log_scrubber",
                    adapterVersion: 1,
                    inputMode: "constant",
                    constantInput: "Authorization: Bearer secret-token-value",
                    options: {
                        bearerTokens: true,
                        privatePayload: "secret-token-value",
                    },
                },
            ],
            edges: [],
        })

        expect(recipeContainsRuntimeInput(recipe)).toBe(true)
        const portable = createPortableRecipe(recipe)

        expect(portable.steps[0].inputMode).toBe("previous_output")
        expect(portable.steps[0].constantInput).toBeUndefined()
        expect(portable.steps[0].options).toHaveProperty("bearerTokens", true)
        expect(portable.steps[0].options).not.toHaveProperty("privatePayload")
        expect(JSON.stringify(portable)).not.toContain("secret-token-value")
    })

    it("uses constant input without leaking it into share URLs", () => {
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
        const decoded = decodeRecipeFromUrlParam(encodeRecipeForShareUrl(recipe))

        expect(decoded.ok).toBe(true)
        if (decoded.ok) {
            expect(decoded.recipe.steps[0].inputMode).toBe("previous_output")
            expect(decoded.recipe.steps[0].constantInput).toBeUndefined()
            expect(JSON.stringify(decoded.recipe)).not.toContain("secret-token-value")
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

    it("sanitizes saved and exported recipes to workflow structure only", () => {
        const recipe = buildRecipe({
            steps: [
                {
                    id: "secret_sample",
                    toolKey: "log_scrubber",
                    adapterVersion: 1,
                    inputMode: "constant",
                    constantInput: "Authorization: Bearer secret-token-value",
                    options: {
                        emails: true,
                        apiKey: "secret",
                    },
                },
            ],
            edges: [],
        })

        const sanitized = sanitizeRecipeForPersistence(recipe)
        const exported = exportRecipeToJson(recipe)

        expect(sanitized.steps[0].inputMode).toBe("previous_output")
        expect(sanitized.steps[0].constantInput).toBeUndefined()
        expect(sanitized.steps[0].options).toEqual({ emails: true })
        expect(exported).not.toContain("secret-token-value")
        expect(exported).not.toContain('"apiKey"')
    })

    it("preserves visible step order through structure-only export and import", () => {
        const recipe = buildRecipe({
            steps: [
                {
                    id: "encode",
                    toolKey: "base64_encode_decode",
                    adapterVersion: 1,
                    inputMode: "previous_output",
                    options: { operation: "encode", urlSafe: true },
                },
                {
                    id: "format",
                    toolKey: "json_formatter",
                    adapterVersion: 1,
                    inputMode: "previous_output",
                    options: { mode: "pretty", indent: 2 },
                },
            ],
            edges: [],
        })

        const imported = importRecipeFromJson(exportRecipeToJson(recipe))

        expect(imported.ok).toBe(true)
        if (imported.ok) {
            expect(imported.recipe.steps.map((step) => step.id)).toEqual(["encode", "format"])
        }
    })

    it("reports adjacent pipeline step compatibility hints", () => {
        const recipe = buildRecipe({
            steps: [
                {
                    id: "encode",
                    toolKey: "base64_encode_decode",
                    adapterVersion: 1,
                    inputMode: "previous_output",
                    options: { operation: "encode" },
                },
                {
                    id: "format",
                    toolKey: "json_formatter",
                    adapterVersion: 1,
                    inputMode: "previous_output",
                    options: { mode: "pretty", indent: 2 },
                },
                {
                    id: "constant_json",
                    toolKey: "json_formatter",
                    adapterVersion: 1,
                    inputMode: "constant",
                    constantInput: "{\"ok\":true}",
                    options: { mode: "minify" },
                },
            ],
            edges: [],
        })

        expect(getStepCompatibilityHints(recipe.steps)).toEqual([
            {
                fromKind: "text",
                fromStepId: "encode",
                toKind: "json",
                toStepId: "format",
            },
        ])
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

    it("exports and imports portable recipe JSON without auto-running it or including runtime payload", () => {
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
        const exported = exportRecipeToJson(recipe)
        const imported = importRecipeFromJson(exportRecipeToJson(recipe))

        expect(exported).not.toContain("secret-token-value")
        expect(imported.ok).toBe(true)
        if (imported.ok) {
            expect(imported.recipe.name).toBe("Test recipe")
            expect(imported.recipe.steps[0].toolKey).toBe("log_scrubber")
            expect(imported.recipe.steps[0].inputMode).toBe("previous_output")
            expect(imported.recipe.steps[0].constantInput).toBeUndefined()
        }
    })

    it("builds saved recipe records without storing runtime payload", () => {
        const recipe = buildRecipe({
            steps: [
                {
                    id: "constant_secret",
                    toolKey: "jwt_decoder",
                    adapterVersion: 1,
                    inputMode: "constant",
                    constantInput: "eyJ.secret.payload",
                    options: { part: "payload", rawToken: "eyJ.secret.payload" },
                },
            ],
            edges: [],
        })
        const record = createSavedRecipeRecord(recipe, {}, "2026-06-10T01:00:00.000Z")
        const serialized = JSON.stringify(record)

        expect(record.recipe.steps[0].inputMode).toBe("previous_output")
        expect(record.recipe.steps[0].constantInput).toBeUndefined()
        expect(record.recipe.steps[0].options).toEqual({ part: "payload" })
        expect(serialized).not.toContain("eyJ.secret.payload")
        expect(serialized).not.toContain("rawToken")
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
        expect(PIPELINE_RECIPE_TEMPLATES.map((template) => template.id)).toEqual(
            expect.arrayContaining([
                "api_payload_cleanup",
                "security_token_review",
                "log_scrub_before_sharing",
            ]),
        )
        expect(PIPELINE_RECIPE_TEMPLATES.length).toBeGreaterThanOrEqual(3)

        for (const template of PIPELINE_RECIPE_TEMPLATES) {
            const generated = createRecipeFromTemplate(template, {
                recipeId: `recipe_${template.id}`,
                now: "2026-06-10T00:00:00.000Z",
                createStepId: (index) => `step_${index + 1}`,
                translate: (key) => key,
            })

            expect(generated.initialInput).toBe(template.sampleInput)
            expect(template.categoryKey).toMatch(/^recipe_category_/)
            expect(template.difficultyKey).toMatch(/^recipe_difficulty_/)
            expect(template.privacyBoundaryKey).toBe("recipe_privacy_structure_only")
            expect(template.tags.length).toBeGreaterThan(0)
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

    it("maps workflow pages to structure-only pipeline templates", () => {
        expect(getPipelineRecipeTemplateForWorkflow("api-payload-cleanup")?.id).toBe("api_payload_cleanup")
        expect(getPipelineRecipeTemplateForWorkflow("security-token-review")?.id).toBe("security_token_review")
        expect(getPipelineRecipeTemplateForWorkflow("log-scrub-before-sharing")?.id).toBe("log_scrub_before_sharing")

        for (const template of PIPELINE_RECIPE_TEMPLATES.filter((candidate) => "workflowSlug" in candidate)) {
            const generated = createRecipeFromTemplate(template, {
                recipeId: `recipe_${template.id}`,
                now: "2026-06-10T00:00:00.000Z",
                createStepId: (index) => `step_${index + 1}`,
                translate: (key) => key,
            })
            const encoded = encodeRecipeForShareUrl(generated.recipe)

            expect(encoded).not.toContain(generated.initialInput)
            expect(recipeContainsRuntimeInput(generated.recipe)).toBe(false)
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
