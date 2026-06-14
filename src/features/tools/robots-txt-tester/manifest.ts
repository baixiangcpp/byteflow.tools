import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "robots_txt_tester",
    slug: "robots-txt-tester",
    category: "network-web",
    relatedTools: ["user_agent_parser", "http_status_codes", "url_parser", "csp_parser"],
    keywords: ["robots.txt tester", "robots txt checker", "robots txt validator", "crawler access tester"],
} satisfies ToolMeta
