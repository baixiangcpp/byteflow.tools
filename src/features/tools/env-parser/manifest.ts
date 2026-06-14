import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "env_parser",
    slug: "env-parser",
    category: "generators",
    relatedTools: ["json_formatter", "yaml_json_converter", "base64_encode_decode"],
    keywords: ["env parser", "dotenv parser", "parse .env file online", "environment variable viewer"],
} satisfies ToolMeta
