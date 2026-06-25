import fs from "node:fs"
import path from "node:path"
import sitemap from "@/app/sitemap"
import { LOCALES } from "@/core/i18n/i18n"
import { TOOL_REGISTRY } from "@/core/registry"
import { buildCanonicalUrl } from "@/core/seo/urls"
import { getPipelineAdapter } from "@/features/pipeline/adapter-registry"
import { SAMPLE_INPUT as DEVOPS_YAML_SAMPLE } from "@/features/tools/devops-yaml-validator/samples"
import { SAMPLE_INPUT as GRAPHQL_SAMPLE } from "@/features/tools/graphql-workbench/samples"
import { SAMPLE_INPUT as JSON_SCHEMA_SAMPLE } from "@/features/tools/json-schema-workbench/samples"
import { SAMPLE_INPUT as OPENAPI_DIFF_SAMPLE } from "@/features/tools/openapi-diff/samples"
import { WORKFLOW_DEFINITIONS } from "@/core/workflows/workflow-hubs"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

const NEW_LOCAL_TOOLS = [
    { key: "json_schema_workbench", slug: "json-schema-workbench", issue: "BF-049", pipelineSample: JSON_SCHEMA_SAMPLE },
    { key: "openapi_diff", slug: "openapi-diff", issue: "BF-050", pipelineSample: OPENAPI_DIFF_SAMPLE },
    { key: "graphql_workbench", slug: "graphql-workbench", issue: "BF-051", pipelineSample: GRAPHQL_SAMPLE },
    { key: "messagepack_inspector", slug: "messagepack-inspector", issue: "BF-052" },
    { key: "seo_metadata_workbench", slug: "seo-metadata-workbench", issue: "BF-053" },
    { key: "devops_yaml_validator", slug: "devops-yaml-validator", issue: "BF-054", pipelineSample: DEVOPS_YAML_SAMPLE },
    { key: "oauth_jwks_workbench", slug: "oauth-jwks-workbench", issue: "BF-055" },
    { key: "image_privacy_workbench", slug: "image-privacy-workbench", issue: "BF-056" },
] as const

const PIPELINE_COMPATIBLE_TOOLS = [
    { key: "json_schema_workbench", issue: "BF-049", pipelineSample: JSON_SCHEMA_SAMPLE },
    { key: "openapi_diff", issue: "BF-050", pipelineSample: OPENAPI_DIFF_SAMPLE },
    { key: "graphql_workbench", issue: "BF-051", pipelineSample: GRAPHQL_SAMPLE },
    { key: "devops_yaml_validator", issue: "BF-054", pipelineSample: DEVOPS_YAML_SAMPLE },
] as const

describe("BF-049 through BF-056 local tools", () => {
    it("registers each tool with browser-local privacy and non-persistent inputs", () => {
        for (const expected of NEW_LOCAL_TOOLS) {
            const tool = TOOL_REGISTRY.find((candidate) => candidate.key === expected.key)

            expect(tool, `${expected.issue} must be registered`).toBeDefined()
            expect(tool).toMatchObject({
                key: expected.key,
                slug: expected.slug,
                persistInput: false,
                privacy: {
                    executionMode: "browser-local",
                    offlineCapable: true,
                    externalRequest: {
                        required: false,
                    },
                },
                networkAccess: "none",
            })
            expect(tool?.sampleInput?.trim(), `${expected.issue} must provide a sample input`).toBeTruthy()
            expect(tool?.relatedTools.length, `${expected.issue} should have internal related-tool links`).toBeGreaterThanOrEqual(4)
        }
    })

    it("adds canonical localized routes and sitemap entries", () => {
        const urls = new Set(sitemap().map((entry) => entry.url))

        for (const { issue, slug } of NEW_LOCAL_TOOLS) {
            expect(fs.existsSync(path.join(ROOT, "src/app/[lang]", slug, "page.tsx")), `${issue} route wrapper`).toBe(true)
            expect(fs.existsSync(path.join(ROOT, "src/features/tools", slug, "page.tsx")), `${issue} feature page`).toBe(true)
            expect(fs.existsSync(path.join(ROOT, "src/features/tools", slug, "logic.test.ts")), `${issue} logic tests`).toBe(true)

            for (const locale of LOCALES) {
                expect(urls.has(buildCanonicalUrl(locale, slug)), `${issue} ${locale} sitemap entry`).toBe(true)
            }
        }
    })

    it("links new tools from relevant workflow hubs", () => {
        const workflowToolKeys = new Set(WORKFLOW_DEFINITIONS.flatMap((workflow) => workflow.relatedToolKeys))

        for (const key of [
            "json_schema_workbench",
            "openapi_diff",
            "graphql_workbench",
            "oauth_jwks_workbench",
            "image_privacy_workbench",
            "seo_metadata_workbench",
        ]) {
            expect(workflowToolKeys.has(key), `${key} should be reachable from a workflow hub`).toBe(true)
        }
    })

    it("runs pipeline adapters for newly pipeline-compatible tools", async () => {
        for (const { key, issue, pipelineSample } of PIPELINE_COMPATIBLE_TOOLS) {
            const adapter = getPipelineAdapter(key)

            expect(adapter, `${issue} pipeline adapter`).toBeDefined()
            expect(adapter?.safeForSensitiveInput, `${issue} local adapter privacy`).toBe(true)
            expect(adapter?.validateOptions(adapter.defaultOptions).ok, `${issue} adapter options`).toBe(true)

            const result = await adapter?.run(pipelineSample, adapter.defaultOptions)

            expect(result?.ok, `${issue} adapter should run its sample`).toBe(true)
            if (!result?.ok) throw new Error(`${issue} adapter failed`)
            expect(typeof result.output, `${issue} adapter output type`).toBe("string")
            if (typeof result.output !== "string") throw new Error(`${issue} adapter did not return text output`)
            expect(result.output.trim(), `${issue} adapter should produce output`).toBeTruthy()
        }
    })

    it("supports JSON Schema validation inside Pipeline Builder", async () => {
        const adapter = getPipelineAdapter("json_schema_workbench")
        const schema = JSON.stringify({
            type: "object",
            required: ["id"],
            properties: {
                id: { type: "integer" },
            },
        })

        expect(adapter?.validateOptions({ mode: "validate", schema }).ok).toBe(true)

        const result = await adapter?.run('{"id":"wrong"}', { mode: "validate", schema })

        expect(result?.ok).toBe(true)
        expect(result?.output).toContain("$.id")
        expect(result?.output).toContain("Expected integer")
    })

    it("keeps BF-055 JWKS verification selectable and covered by real signature tests", () => {
        const pageSource = fs.readFileSync(path.join(ROOT, "src/features/tools/oauth-jwks-workbench/page.tsx"), "utf8")
        const logicSource = fs.readFileSync(path.join(ROOT, "src/features/tools/oauth-jwks-workbench/logic.ts"), "utf8")
        const testSource = fs.readFileSync(path.join(ROOT, "src/features/tools/oauth-jwks-workbench/logic.test.ts"), "utf8")
        const jwtDecoderManifest = fs.readFileSync(path.join(ROOT, "src/features/tools/jwt-decoder/manifest.ts"), "utf8")
        const jwtWorkbenchManifest = fs.readFileSync(path.join(ROOT, "src/features/tools/jwt-workbench/manifest.ts"), "utf8")
        const jwtVerifierManifest = fs.readFileSync(path.join(ROOT, "src/features/tools/jwt-verifier/manifest.ts"), "utf8")

        expect(pageSource).toContain("selectedKey")
        expect(pageSource).toContain("selected_key_label")
        expect(pageSource).toContain("<select")
        expect(pageSource).toContain("verifyJwtWithJwks(token, jwks, { selectedKey })")
        expect(logicSource).toContain("JwksVerificationOptions")
        expect(logicSource).toContain("selectedKeyMatches")
        expect(logicSource).toContain("does not match JWT kid")
        expect(testSource).toContain("verifies a JWT signature against the selected pasted JWKS key")
        expect(testSource).toContain("does not silently switch keys")
        expect(testSource).toContain("crypto.subtle.sign")
        expect(jwtDecoderManifest).toContain("oauth_jwks_workbench")
        expect(jwtWorkbenchManifest).toContain("oauth_jwks_workbench")
        expect(jwtVerifierManifest).toContain("oauth_jwks_workbench")
    })
})
