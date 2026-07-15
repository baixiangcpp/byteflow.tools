import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "messagepack_inspector",
    slug: "messagepack-inspector",
    inputBehavior: "explicit-sample",
    category: "formatters",
    relatedTools: ["json_formatter", "hex_bytes_workbench", "base64_encode_decode", "yaml_json_converter"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: true,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    sampleInput: "82a2696401a46e616d65a5416c696365",
    sampleMode: "hex-to-json",
    keywords: ["messagepack inspector", "msgpack to json", "messagepack decoder", "binary json converter"],
    searchKeywords: ["msgpack", "binary", "event payload", "base64"],
    persistInput: false,
    networkAccess: "none",
} satisfies ToolMeta
