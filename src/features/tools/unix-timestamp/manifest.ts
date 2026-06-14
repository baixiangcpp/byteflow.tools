import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "unix_timestamp",
    slug: "unix-timestamp",
    category: "generators",
    relatedTools: ["uuid_generator", "cron_visualizer", "crontab_generator"],
    keywords: ["unix timestamp", "epoch converter", "timestamp to date", "unix time online"],
} satisfies ToolMeta
