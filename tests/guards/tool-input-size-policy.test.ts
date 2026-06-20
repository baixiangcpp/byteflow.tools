import { describe, expect, it } from "vitest"
import { TOOL_MANIFESTS } from "@/core/registry"
import type { ToolMeta } from "@/core/registry/types"

const HIGH_RISK_INPUT_TOOL_KEYS = [
    "json_formatter",
    "base64_encode_decode",
    "hash_generator",
    "csv_json_converter",
    "image_resizer",
    "scanned_pdf_converter",
] as const

const WORKER_BACKED_TOOL_KEYS = [
    "json_formatter",
    "base64_encode_decode",
    "hash_generator",
    "csv_json_converter",
    "image_resizer",
] as const

describe("tool input size policies", () => {
    it("requires explicit input-size limits for high-risk local processing tools", () => {
        const toolsByKey = new Map((TOOL_MANIFESTS as readonly ToolMeta[]).map((tool) => [tool.key, tool]))
        const offenders = HIGH_RISK_INPUT_TOOL_KEYS.flatMap((toolKey) => {
            const tool = toolsByKey.get(toolKey)
            if (!tool) return [`${toolKey}: missing manifest`]

            const policy = tool.inputSizePolicy
            const problems: string[] = []
            if (!policy) problems.push("missing inputSizePolicy")
            if (policy && typeof policy.hardLimitBytes !== "number") problems.push("missing hardLimitBytes")
            if (policy && typeof policy.warnAtBytes === "number" && typeof policy.hardLimitBytes === "number" && policy.warnAtBytes > policy.hardLimitBytes) {
                problems.push("warnAtBytes exceeds hardLimitBytes")
            }
            if (policy && typeof policy.workerAtBytes === "number" && typeof policy.hardLimitBytes === "number" && policy.workerAtBytes > policy.hardLimitBytes) {
                problems.push("workerAtBytes exceeds hardLimitBytes")
            }
            if (policy && typeof policy.streamingSupported !== "boolean") problems.push("missing streamingSupported")

            return problems.map((problem) => `${toolKey}: ${problem}`)
        })

        expect(offenders).toEqual([])
    })

    it("requires worker thresholds for high-risk tools that have worker task guards", () => {
        const toolsByKey = new Map((TOOL_MANIFESTS as readonly ToolMeta[]).map((tool) => [tool.key, tool]))
        const offenders = WORKER_BACKED_TOOL_KEYS.flatMap((toolKey) => {
            const policy = toolsByKey.get(toolKey)?.inputSizePolicy
            return typeof policy?.workerAtBytes === "number" ? [] : [`${toolKey}: missing workerAtBytes`]
        })

        expect(offenders).toEqual([])
    })
})
