import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "json_diff_viewer",
    slug: "json-diff-viewer",
    category: "formatters",
    relatedTools: ["json_formatter", "text_diff_checker", "jsonpath_playground"],
    keywords: ["json diff", "compare json online", "json diff viewer", "json compare tool"],
} satisfies ToolMeta
