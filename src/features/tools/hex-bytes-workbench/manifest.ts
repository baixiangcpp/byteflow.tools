import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "hex_bytes_workbench",
    slug: "hex-bytes-workbench",
    category: "text-string",
    relatedTools: ["base64_encode_decode", "url_encode_decode", "hash_generator", "unicode_inspector"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["hex bytes workbench", "hex decoder", "bytes inspector", "utf8 hex converter"],
} satisfies ToolMeta
