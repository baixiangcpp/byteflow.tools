import { notFound } from "next/navigation"
import { isValidLocale, requireTranslationValue } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { getMenuGroups } from "@/core/registry/menu-groups"
import { getToolRegistryStats } from "@/core/registry/stats"
import { TOOL_CAPABILITY_LABELS, TOOL_FAMILY_LABELS, type ToolCapability, type ToolFamily } from "@/core/registry"
import { getGuideIndexCopy, getGuideIndexItems } from "@/core/growth/guide-index"
import { AllToolsDiscovery } from "@/features/tool-discovery/all-tools-discovery"
import { AllToolsQueryRobots } from "@/features/tool-discovery/all-tools-query-robots"
import { CatalogPageContainer } from "@/components/layout/page-container"

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
    const guideCopy = getGuideIndexCopy(locale)
    const guideItems = getGuideIndexItems(locale).slice(0, 6)
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
    return (
        <CatalogPageContainer className="flex flex-col gap-7 pb-8">
            <AllToolsQueryRobots />
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
                groups={discoveryGroups}
                labels={{
                    activeFilters: requireTranslationValue(t.common.active_filters, "common.active_filters"),
                    allFamilies: requireTranslationValue(t.common.all_families, "common.all_families"),
                    clearFilters: requireTranslationValue(t.common.clear_filters, "common.clear_filters"),
                    clearFavorites: requireTranslationValue(t.common.clear_favorites, "common.clear_favorites"),
                    commonWorkflows: requireTranslationValue(t.common.common_workflows, "common.common_workflows"),
                    guideLibrary: guideCopy.curatedGuides,
                    favorites: requireTranslationValue(t.common.favorites, "common.favorites"),
                    filterByCategory: requireTranslationValue(t.common.filter_by_category, "common.filter_by_category"),
                    filterByExecution: requireTranslationValue(t.common.filter_by_execution, "common.filter_by_execution"),
                    filterByInputType: requireTranslationValue(t.common.filter_by_input_type, "common.filter_by_input_type"),
                    filterByUseCase: requireTranslationValue(t.common.filter_by_use_case, "common.filter_by_use_case"),
                    filterSearch: requireTranslationValue(t.common.filter_search, "common.filter_search"),
                    inputFile: requireTranslationValue(t.common.input_file, "common.input_file"),
                    inputImage: requireTranslationValue(t.common.input_image, "common.input_image"),
                    inputSvg: requireTranslationValue(t.common.input_svg, "common.input_svg"),
                    inputText: requireTranslationValue(t.common.input_text, "common.input_text"),
                    inputUrlDomain: requireTranslationValue(t.common.input_url_domain, "common.input_url_domain"),
                    noResults: requireTranslationValue(t.common.no_results, "common.no_results"),
                    noResultsSuggestion: requireTranslationValue(t.common.no_results_suggestion, "common.no_results_suggestion"),
                    requestTool: requireTranslationValue(t.common.request_tool, "common.request_tool"),
                    requestToolPrivacy: requireTranslationValue(t.common.request_tool_privacy, "common.request_tool_privacy"),
                    voteOnRequests: requireTranslationValue(t.common.vote_on_requests, "common.vote_on_requests"),
                    noFavorites: requireTranslationValue(t.common.no_favorites, "common.no_favorites"),
                    noRecentTools: requireTranslationValue(t.common.no_recent_tools, "common.no_recent_tools"),
                    open: requireTranslationValue(t.common.open, "common.open"),
                    popularTags: requireTranslationValue(t.common.popular_tags, "common.popular_tags"),
                    removeFilter: requireTranslationValue(t.common.remove_filter, "common.remove_filter"),
                    showFilters: requireTranslationValue(t.common.show_filters, "common.show_filters"),
                    showFiltersWithCount: requireTranslationValue(t.common.show_filters_with_count, "common.show_filters_with_count"),
                    showFewerTools: requireTranslationValue(t.common.show_fewer_tools, "common.show_fewer_tools"),
                    showMoreTools: requireTranslationValue(t.common.show_more_tools, "common.show_more_tools"),
                    closeFilters: requireTranslationValue(t.common.close_filters, "common.close_filters"),
                    clearRecentTools: requireTranslationValue(t.common.clear_recent_tools, "common.clear_recent_tools"),
                    recentTools: requireTranslationValue(t.common.recent_tools, "common.recent_tools"),
                    recentToolsPrivacy: requireTranslationValue(t.common.recent_tools_local_only, "common.recent_tools_local_only"),
                    addFavorite: requireTranslationValue(t.common.add_favorite, "common.add_favorite"),
                    removeFavorite: requireTranslationValue(t.common.remove_favorite, "common.remove_favorite"),
                    favoritesPrivacy: requireTranslationValue(t.common.favorites_local_only, "common.favorites_local_only"),
                    searchPlaceholder: requireTranslationValue(t.nav.search, "nav.search"),
                    toolsLabel: requireTranslationValue(t.common.tools, "common.tools"),
                    useCaseEncode: requireTranslationValue(t.common.use_case_encode, "common.use_case_encode"),
                    useCaseFormat: requireTranslationValue(t.common.use_case_format, "common.use_case_format"),
                    useCaseImage: requireTranslationValue(t.common.use_case_image, "common.use_case_image"),
                    useCaseSecurity: requireTranslationValue(t.common.use_case_security, "common.use_case_security"),
                    useCaseWorkflow: requireTranslationValue(t.common.use_case_workflow, "common.use_case_workflow"),
                }}
                locale={locale}
                totalTools={registryStats.totalTools}
                tags={POPULAR_DISCOVERY_TAGS}
                guides={guideItems.map((guide) => ({
                    id: guide.slug,
                    title: guide.title,
                    description: guide.description,
                    href: `/${locale}/${guide.slug}`,
                    tags: [guideCopy.guideCategoryLabel(guide.category), ...guide.relatedToolKeys.slice(0, 2)],
                }))}
                workflows={COMMON_WORKFLOWS.map((workflow) => ({
                    id: workflow.id,
                    title: requireTranslationValue(commonTranslations[workflow.titleKey], `common.${workflow.titleKey}`),
                    href: `/${locale}/${workflow.hrefSlug}`,
                    tags: workflow.tags,
                }))}
            />
        </CatalogPageContainer>
    )
}
