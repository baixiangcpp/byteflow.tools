import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "unicode_inspector",
    slug: "unicode-inspector",
    category: "text-string",
    relatedTools: ["invisible_chars_detector", "text_diff_checker", "hex_bytes_workbench", "multiple_whitespace_remover"],
    keywords: ["unicode inspector", "code point inspector", "unicode analyzer", "utf8 inspector"],
} satisfies ToolMeta
