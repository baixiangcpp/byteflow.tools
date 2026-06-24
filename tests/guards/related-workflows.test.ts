import { describe, expect, it } from "vitest"
import fs from "node:fs"
import { TOOL_MANIFESTS } from "@/core/registry"
import type { ToolMeta } from "@/core/registry/types"

const RELATED_TOOLS_SOURCE = fs.readFileSync("src/core/seo/components/related-tools.tsx", "utf8")

const HIGH_VALUE_RELATED_TOOL_KEYS = [
    "json_formatter",
    "jwt_decoder",
    "base64_encode_decode",
    "regex_tester",
    "image_resizer",
    "uuid_generator",
    "log_scrubber",
    "har_viewer_sanitizer",
    "http_request_builder",
    "open_graph_meta_generator",
]

describe("related workflow metadata", () => {
    it("keeps structured workflow references valid and aligned with relatedTools", () => {
        const tools = TOOL_MANIFESTS as readonly ToolMeta[]
        const toolKeys = new Set(tools.map((tool) => tool.key))
        const offenders = tools.flatMap((tool) => {
            return (tool.relatedWorkflows || []).flatMap((workflow) => {
                const problems: string[] = []
                if (!toolKeys.has(workflow.toolKey)) problems.push(`unknown toolKey ${workflow.toolKey}`)
                if (!tool.relatedTools.includes(workflow.toolKey)) problems.push(`${workflow.toolKey} missing from relatedTools`)
                if (!/^[a-z][a-z0-9_]*$/.test(workflow.reasonKey)) problems.push(`invalid reasonKey ${workflow.reasonKey}`)
                if (workflow.handoffSupported !== undefined && typeof workflow.handoffSupported !== "boolean") {
                    problems.push("handoffSupported must be boolean")
                }

                return problems.map((problem) => `${tool.key}: ${problem}`)
            })
        })

        expect(offenders).toEqual([])
    })

    it("defines first workflow paths for high-traffic conversion tools", () => {
        const toolsByKey = new Map((TOOL_MANIFESTS as readonly ToolMeta[]).map((tool) => [tool.key, tool]))

        expect(toolsByKey.get("json_formatter")?.relatedWorkflows?.map((workflow) => workflow.toolKey)).toEqual([
            "json_to_typescript",
            "jsonpath_playground",
            "json_diff_viewer",
        ])
        expect(toolsByKey.get("base64_encode_decode")?.relatedWorkflows?.map((workflow) => workflow.toolKey)).toEqual([
            "jwt_decoder",
            "url_encode_decode",
            "hash_generator",
        ])
        expect(toolsByKey.get("yaml_json_converter")?.relatedWorkflows?.map((workflow) => workflow.toolKey)).toEqual([
            "json_formatter",
            "json_to_typescript",
            "structured_data_visualizer",
        ])
        expect(toolsByKey.get("base_encoding_converter")?.relatedWorkflows?.map((workflow) => workflow.toolKey)).toEqual([
            "base64_encode_decode",
            "hex_bytes_workbench",
            "hash_generator",
        ])
        expect(toolsByKey.get("public_key_jwk_helper")?.relatedWorkflows?.map((workflow) => workflow.toolKey)).toEqual([
            "certificate_decoder",
            "jwt_verifier",
            "asn1_der_inspector",
        ])
    })

    it("gives high-value related tools contextual reasons without empty or duplicate recommendations", () => {
        const toolsByKey = new Map((TOOL_MANIFESTS as readonly ToolMeta[]).map((tool) => [tool.key, tool]))

        for (const toolKey of HIGH_VALUE_RELATED_TOOL_KEYS) {
            const tool = toolsByKey.get(toolKey)
            expect(tool, toolKey).toBeTruthy()
            expect(tool?.relatedTools.length, `${toolKey} relatedTools`).toBeGreaterThanOrEqual(3)
            expect(tool?.relatedTools.length, `${toolKey} relatedTools`).toBeLessThanOrEqual(5)
            expect(new Set(tool?.relatedTools).size, `${toolKey} duplicate relatedTools`).toBe(tool?.relatedTools.length)

            const workflows = tool?.relatedWorkflows ?? []
            expect(workflows.length, `${toolKey} relatedWorkflows`).toBeGreaterThanOrEqual(3)
            expect(workflows.length, `${toolKey} relatedWorkflows`).toBeLessThanOrEqual(5)
            expect(new Set(workflows.map((workflow) => workflow.toolKey)).size, `${toolKey} duplicate workflow toolKey`).toBe(workflows.length)

            for (const workflow of workflows) {
                expect(tool?.relatedTools.includes(workflow.toolKey), `${toolKey} ${workflow.toolKey}`).toBe(true)
                expect(RELATED_TOOLS_SOURCE, `${toolKey} ${workflow.reasonKey}`).toContain(`${workflow.reasonKey}:`)
            }
        }
    })
})
