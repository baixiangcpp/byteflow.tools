import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "unix_timestamp",
    slug: "unix-timestamp",
    category: "generators",
    relatedTools: ["uuid_generator", "cron_visualizer", "crontab_generator"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["unix timestamp", "epoch converter", "timestamp to date", "unix time online"],
} satisfies ToolMeta
