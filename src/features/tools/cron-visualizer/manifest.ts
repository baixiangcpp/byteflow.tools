import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "cron_visualizer",
    slug: "cron-visualizer",
    category: "network-web",
    relatedTools: ["crontab_generator", "unix_timestamp", "regex_tester"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["cron visualizer", "cron schedule viewer", "visualize cron expression"],
} satisfies ToolMeta
