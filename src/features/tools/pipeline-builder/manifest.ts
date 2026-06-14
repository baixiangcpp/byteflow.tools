import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "pipeline_builder",
    slug: "pipeline-builder",
    category: "network-web",
    relatedTools: ["json_formatter", "base64_encode_decode", "url_encode_decode", "log_scrubber"],
    keywords: ["pipeline builder", "recipe builder", "tool chaining", "local workflow", "developer workbench"],
    searchKeywords: ["pipeline", "recipe builder", "chain tools", "local workflow", "工作流", "パイプライン", "파이프라인"],
} satisfies ToolMeta
