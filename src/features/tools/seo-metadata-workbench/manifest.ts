import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "seo_metadata_workbench",
    slug: "seo-metadata-workbench",
    category: "network-web",
    relatedTools: ["open_graph_meta_generator", "robots_txt_tester", "structured_data_visualizer", "csp_parser"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: true,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    sampleInput: "{\"title\":\"Privacy-first Local Developer Tools\",\"url\":\"https://byteflow.tools/\"}",
    sampleMode: "seo-audit",
    keywords: ["serp preview", "hreflang checker", "sitemap validator", "llms txt generator"],
    searchKeywords: ["seo", "serp", "hreflang", "sitemap", "llms.txt", "canonical"],
    persistInput: false,
    networkAccess: "none",
} satisfies ToolMeta
