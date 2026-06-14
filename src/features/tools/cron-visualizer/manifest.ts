import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "cron_visualizer",
    slug: "cron-visualizer",
    category: "network-web",
    relatedTools: ["crontab_generator", "unix_timestamp", "regex_tester"],
    keywords: ["cron visualizer", "cron schedule viewer", "visualize cron expression"],
} satisfies ToolMeta
