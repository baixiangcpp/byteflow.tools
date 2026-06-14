import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "yaml_merge_patch_explorer",
    slug: "yaml-merge-patch-explorer",
    category: "formatters",
    relatedTools: ["yaml_json_converter", "json_diff_viewer", "openapi_viewer", "docker_run_to_compose"],
    keywords: ["yaml merge", "yaml patch", "json merge patch", "kubernetes yaml"],
} satisfies ToolMeta
