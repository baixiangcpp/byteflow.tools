import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "saml_decoder",
    slug: "saml-decoder",
    category: "network-web",
    relatedTools: ["jwt_decoder", "certificate_decoder", "base64_encode_decode", "security_header_analyzer"],
    keywords: ["saml decoder", "saml response decoder", "saml request parser", "saml assertion viewer"],
    persistInput: false,
} satisfies ToolMeta
