import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "crontab_generator",
    slug: "crontab-generator",
    category: "network-web",
    relatedTools: ["cron_visualizer", "unix_timestamp", "regex_tester"],
    keywords: ["crontab generator", "cron expression builder", "cron maker online"],
    searchKeywords: ["cron", "crontab", "cron expression", "cron expression generator", "cron schedule", "cron syntax", "cron builder", "schedule job", "scheduler", "定时任务", "クーロン式", "크론 생성", "计划任务"],
} satisfies ToolMeta
