import { describe, expect, it } from "vitest"
import { TOOL_MANIFESTS } from "@/core/registry"
import type { ToolMeta } from "@/core/registry/types"

const HIGH_TRAFFIC_SAMPLE_REQUIRED_KEYS = [
    "json_formatter",
    "base64_encode_decode",
    "hash_generator",
] as const

const SENSITIVE_SAMPLE_PATTERNS = [
    /sk_live_/i,
    /AKIA[0-9A-Z]{12,}/,
    /Bearer\s+[a-z0-9._-]{12,}/i,
    /password\s*[:=]/i,
    /secret\s*[:=]/i,
    /token\s*[:=]/i,
]

describe("tool sample metadata", () => {
    it("requires safe manifest sample metadata for high-traffic tools", () => {
        const toolsByKey = new Map((TOOL_MANIFESTS as readonly ToolMeta[]).map((tool) => [tool.key, tool]))
        const offenders = HIGH_TRAFFIC_SAMPLE_REQUIRED_KEYS.flatMap((toolKey) => {
            const tool = toolsByKey.get(toolKey)
            if (!tool) return [`${toolKey}: missing manifest`]

            const problems: string[] = []
            if (!tool.sampleInput?.trim()) problems.push("missing sampleInput")
            if (!tool.sampleMode?.trim()) problems.push("missing sampleMode")
            if (SENSITIVE_SAMPLE_PATTERNS.some((pattern) => pattern.test(tool.sampleInput || ""))) {
                problems.push("sampleInput looks sensitive")
            }

            return problems.map((problem) => `${toolKey}: ${problem}`)
        })

        expect(offenders).toEqual([])
    })
})
