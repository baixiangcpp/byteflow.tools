import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "lorem_ipsum",
    slug: "lorem-ipsum",
    category: "generators",
    relatedTools: ["password_generator", "uuid_generator", "markdown_preview"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["lorem ipsum generator", "dummy text generator", "placeholder text"],
} satisfies ToolMeta
