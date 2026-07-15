import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "qr_code_generator",
    slug: "qr-code-generator",
    inputBehavior: "empty-first",
    category: "generators",
    relatedTools: ["uuid_generator", "password_generator", "url_encode_decode"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["qr code generator", "generate qr code online", "qr code maker"],
} satisfies ToolMeta
