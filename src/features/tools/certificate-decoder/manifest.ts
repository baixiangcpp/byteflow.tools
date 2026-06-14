import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "certificate_decoder",
    slug: "certificate-decoder",
    category: "network-web",
    relatedTools: ["jwt_decoder", "base64_encode_decode", "http_status_codes", "security_header_analyzer"],
    keywords: ["pem decoder", "x509 certificate viewer", "ssl certificate decoder online", "certificate parser"],
} satisfies ToolMeta
