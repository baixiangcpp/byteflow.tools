import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "css_text_glitch_effect_generator",
    slug: "css-text-glitch-effect-generator",
    category: "generators",
    relatedTools: ["css_gradient_generator", "css_loader_generator", "code_to_image_converter", "css_minifier"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["css text glitch effect", "glitch text css", "neon glitch generator", "animated text effect css"],
} satisfies ToolMeta
