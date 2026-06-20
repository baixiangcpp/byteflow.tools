import { notFound } from "next/navigation"
import { isValidLocale, requireTranslationValue } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { getMenuGroups } from "@/core/registry/menu-groups"
import { getToolRegistryStats } from "@/core/registry/stats"
import { TOOL_CAPABILITY_LABELS, TOOL_FAMILY_LABELS, type ToolCapability, type ToolFamily } from "@/core/registry"
import { AllToolsDiscovery } from "@/features/tool-discovery/all-tools-discovery"

const POPULAR_DISCOVERY_TAGS = [
    "json",
    "base64",
    "security",
    "http",
    "image",
    "css",
    "logs",
    "pipeline-ready",
]

const COMMON_WORKFLOWS = [
    {
        id: "api-payload-cleanup",
        titleKey: "workflow_api_payload_cleanup",
        hrefSlug: "pipeline-builder",
        tags: ["json", "base64", "pipeline-ready"],
    },
    {
        id: "security-token-review",
        titleKey: "workflow_security_token_review",
        hrefSlug: "jwt-workbench",
        tags: ["jwt", "security", "browser-local"],
    },
    {
        id: "image-social-export",
        titleKey: "workflow_image_social_export",
        hrefSlug: "open-graph-meta-generator",
        tags: ["image", "social-metadata", "visual-output"],
    },
]

function familyTranslationKey(family: ToolFamily): string {
    return `family_${family.replace(/-/g, "_")}`
}

function capabilityTranslationKey(capability: ToolCapability): string {
    return `capability_${capability.replace(/-/g, "_")}`
}

export default async function AllToolsPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }

    const locale = lang
    const t = getTranslation(locale)
    const groups = getMenuGroups()
    const registryStats = getToolRegistryStats()
    const toolTranslations = t.tools as Record<string, { title?: string; description?: string }>
    const commonTranslations = t.common as unknown as Record<string, string>
    const familyLabels = Object.fromEntries(
        (Object.keys(TOOL_FAMILY_LABELS) as ToolFamily[]).map((family) => [
            family,
            requireTranslationValue(commonTranslations[familyTranslationKey(family)], `common.${familyTranslationKey(family)}`),
        ]),
    ) as Record<ToolFamily, string>
    const capabilityLabels = Object.fromEntries(
        (Object.keys(TOOL_CAPABILITY_LABELS) as ToolCapability[]).map((capability) => [
            capability,
            requireTranslationValue(commonTranslations[capabilityTranslationKey(capability)], `common.${capabilityTranslationKey(capability)}`),
        ]),
    )
    const discoveryGroups = groups.map((group) => ({
        key: group.key,
        title: requireTranslationValue(t.nav[group.navKey], `nav.${group.navKey}`),
        description: requireTranslationValue(t.categories[group.descriptionKey], `categories.${group.descriptionKey}`),
        href: `/${group.slug}`,
        tools: group.items.map((tool) => {
            const toolT = toolTranslations[tool.key]
            const family = tool.family ?? ("text-strings" as ToolFamily)
            return {
                key: tool.key,
                slug: tool.slug,
                title: requireTranslationValue(toolT?.title, `tools.${tool.key}.title`),
                description: requireTranslationValue(toolT?.description, `tools.${tool.key}.description`),
                family,
                familyLabel: familyLabels[family],
                tags: tool.tags ?? [],
                capabilities: tool.capabilities ?? [],
            }
        }),
    }))
    const families = (Object.keys(TOOL_FAMILY_LABELS) as ToolFamily[]).map((family) => ({
        key: family,
        label: familyLabels[family],
    }))

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-7 pb-8">
            <header className="rounded-2xl border border-border/70 bg-card/55 p-5 backdrop-blur-sm sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">
                    {t.common.all_tools}
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                    {t.site.explore_by_category_title}
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {t.site.explore_by_category_subtitle}
                </p>
            </header>

            <AllToolsDiscovery
                capabilityLabels={capabilityLabels}
                families={families}
                groups={discoveryGroups}
                labels={{
                    allFamilies: requireTranslationValue(t.common.all_families, "common.all_families"),
                    clearFilters: requireTranslationValue(t.common.clear_filters, "common.clear_filters"),
                    commonWorkflows: requireTranslationValue(t.common.common_workflows, "common.common_workflows"),
                    filterByFamily: requireTranslationValue(t.common.filter_by_family, "common.filter_by_family"),
                    noResults: requireTranslationValue(t.common.no_results, "common.no_results"),
                    noResultsSuggestion: requireTranslationValue(t.common.no_results_suggestion, "common.no_results_suggestion"),
                    open: requireTranslationValue(t.common.open, "common.open"),
                    popularTags: requireTranslationValue(t.common.popular_tags, "common.popular_tags"),
                    clearRecentTools: requireTranslationValue(t.common.clear_recent_tools, "common.clear_recent_tools"),
                    recentTools: requireTranslationValue(t.common.recent_tools, "common.recent_tools"),
                    recentToolsPrivacy: requireTranslationValue(t.common.recent_tools_local_only, "common.recent_tools_local_only"),
                    searchPlaceholder: requireTranslationValue(t.nav.search, "nav.search"),
                    toolsLabel: requireTranslationValue(t.common.tools, "common.tools"),
                }}
                locale={locale}
                totalTools={registryStats.totalTools}
                tags={POPULAR_DISCOVERY_TAGS}
                workflows={COMMON_WORKFLOWS.map((workflow) => ({
                    id: workflow.id,
                    title: requireTranslationValue(commonTranslations[workflow.titleKey], `common.${workflow.titleKey}`),
                    href: `/${locale}/${workflow.hrefSlug}`,
                    tags: workflow.tags,
                }))}
            />
        </div>
    )
}
