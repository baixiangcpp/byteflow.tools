import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "cidr_subnet_calculator",
    slug: "cidr-subnet-calculator",
    inputBehavior: "explicit-sample",
    category: "network-web",
    relatedTools: ["url_parser", "http_request_builder", "chmod_calculator", "http_status_codes"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["cidr calculator", "subnet calculator", "ipv4 cidr to range", "network broadcast calculator"],
} satisfies ToolMeta
