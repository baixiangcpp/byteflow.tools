import { describe, expect, it } from "vitest"
import { TOOL_MANIFESTS, TOOL_REGISTRY } from "@/core/registry"
import { getClientToolByKey } from "@/generated/client-tool-lookup"

const EXPECTED_EXTERNAL_REQUEST_TOOLS = [
    "instagram-photo-downloader",
    "vimeo-thumbnail-grabber",
    "youtube-thumbnail-grabber",
]

describe("BF-007 external request taxonomy", () => {
    it("requires every tool manifest to declare execution privacy", () => {
        const offenders = TOOL_MANIFESTS.flatMap((tool) => {
            const problems: string[] = []
            if (!tool.privacy.executionMode) problems.push("missing executionMode")
            if (typeof tool.privacy.offlineCapable !== "boolean") problems.push("missing offlineCapable")
            if (typeof tool.privacy.sensitiveInput !== "boolean") problems.push("missing sensitiveInput")
            if (typeof tool.privacy.externalRequest.required !== "boolean") problems.push("missing externalRequest.required")
            return problems.map((problem) => `${tool.slug}: ${problem}`)
        })

        expect(offenders).toEqual([])
    })

    it("keeps the external request inventory explicit and complete", () => {
        const externalTools = TOOL_REGISTRY
            .filter((tool) => tool.privacy.externalRequest.required)
            .map((tool) => tool.slug)
            .sort()

        expect(externalTools).toEqual(EXPECTED_EXTERNAL_REQUEST_TOOLS)
    })

    it("does not label external request tools as offline capable", () => {
        for (const tool of TOOL_REGISTRY.filter((entry) => entry.privacy.externalRequest.required)) {
            expect(tool.privacy.executionMode, tool.slug).toBe("external-request")
            expect(tool.privacy.offlineCapable, tool.slug).toBe(false)
            expect(tool.capabilities, tool.slug).toContain("external-request")
            expect(tool.capabilities, tool.slug).not.toContain("offline-capable")
        }
    })

    it("keeps client lookup privacy metadata aligned with registry", () => {
        const drift = TOOL_REGISTRY.flatMap((tool) => {
            const clientTool = getClientToolByKey(tool.key)
            if (!clientTool) return [`${tool.slug}: missing client lookup entry`]
            return JSON.stringify(clientTool.privacy) === JSON.stringify(tool.privacy) ? [] : [`${tool.slug}: privacy drift`]
        })

        expect(drift).toEqual([])
    })
})
