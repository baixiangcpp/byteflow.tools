import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "css_gradient_generator",
    slug: "css-gradient-generator",
    category: "generators",
    relatedTools: ["css_glassmorphism_generator", "color_converter", "css_background_pattern_generator", "css_minifier"],
    keywords: ["css gradient generator", "linear gradient css", "radial gradient generator", "gradient maker online"],
} satisfies ToolMeta
