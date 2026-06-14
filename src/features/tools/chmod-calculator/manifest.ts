import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "chmod_calculator",
    slug: "chmod-calculator",
    category: "network-web",
    relatedTools: ["env_parser", "regex_tester", "user_agent_parser", "cidr_subnet_calculator"],
    keywords: ["chmod calculator", "unix permissions calculator", "file permissions chmod"],
} satisfies ToolMeta
