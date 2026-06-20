import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "asn1_der_inspector",
    slug: "asn1-der-inspector",
    category: "network-web",
    relatedTools: ["certificate_decoder", "base64_encode_decode", "hex_bytes_workbench", "jwt_decoder"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["asn1 der inspector", "der parser", "asn.1 viewer", "certificate der decoder"],
} satisfies ToolMeta
