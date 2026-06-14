import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "cidr_subnet_calculator",
    slug: "cidr-subnet-calculator",
    category: "network-web",
    relatedTools: ["url_parser", "http_request_builder", "chmod_calculator", "http_status_codes"],
    keywords: ["cidr calculator", "subnet calculator", "ipv4 cidr to range", "network broadcast calculator"],
} satisfies ToolMeta
