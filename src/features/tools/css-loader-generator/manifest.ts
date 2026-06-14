import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "css_loader_generator",
    slug: "css-loader-generator",
    category: "generators",
    relatedTools: ["css_cubic_bezier_generator", "css_gradient_generator", "css_box_shadow_generator", "css_minifier"],
    keywords: ["css loader generator", "spinner css generator", "loading animation css", "css preloaders"],
} satisfies ToolMeta
