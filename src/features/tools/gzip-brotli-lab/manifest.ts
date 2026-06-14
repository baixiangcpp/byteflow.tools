import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "gzip_brotli_lab",
    slug: "gzip-brotli-lab",
    category: "text-string",
    relatedTools: ["base64_encode_decode", "url_encode_decode", "http_request_builder", "local_log_parser"],
    keywords: ["gzip brotli lab", "gzip decoder", "brotli compression", "http compression"],
} satisfies ToolMeta
