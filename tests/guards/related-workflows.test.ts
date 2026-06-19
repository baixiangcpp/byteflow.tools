import { describe, expect, it } from "vitest"
import { TOOL_MANIFESTS } from "@/core/registry"
import type { ToolMeta } from "@/core/registry/types"

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
    })
})
