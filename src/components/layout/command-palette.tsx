"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { FileText, FolderOpen, History, Search, Sparkles, Star, Workflow } from "lucide-react"
import { requireTranslationValue } from "@/core/i18n/i18n"

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"

import { toolGroups } from "./tool-groups"
import { useLang } from "@/core/i18n/lang-provider"
import { getCommandSearchToolByKey } from "@/generated/command-search-index"
import { readFavoriteToolKeys, readRecentToolKeys, TOOL_DISCOVERY_UPDATED_EVENT } from "@/core/storage/tool-discovery-state"
import { useSystemCommands } from "@/core/commands/registry"
import { applyToolSearchScoreBonuses, scoreCommandSearch } from "@/core/search/command-search"
import { useDialogReturnFocus } from "@/hooks/use-dialog-return-focus"
import {
    getToolSearchMetadata,
    getToolSearchMetadataTerms,
} from "@/core/search/tool-search-metadata"
import { trackSearchPerformed } from "@/core/analytics/analytics"
import { getAllToolsHref } from "@/core/routing/all-tools-route"
import { buildHomepageHref } from "@/core/routing/homepage-route"
import { cn } from "@/core/utils/utils"

const STATIC_PAGES = [
    { slug: "all-tools", namespace: "common", key: "all_tools", keywords: ["all tools", "directory", "tool list"] },
    { slug: "install-app", namespace: "common", key: "install_app_label", keywords: ["pwa", "offline", "install"] },
    { slug: "trust-center", namespace: "pages", key: "trust_center_title", keywords: ["privacy", "security", "trust", "external request"] },
    { slug: "privacy", namespace: "pages", key: "privacy_title", keywords: ["privacy policy", "data", "analytics"] },
    { slug: "about", namespace: "pages", key: "about_title", keywords: ["about", "open source"] },
    { slug: "contact", namespace: "pages", key: "contact_title", keywords: ["contact", "support", "request tool", "feature request"] },
    { slug: "terms", namespace: "pages", key: "terms_title", keywords: ["terms", "policy"] },
] as const

const WORKFLOW_ENTRIES = [
    {
        id: "api-payload-cleanup",
        labelKey: "workflow_api_payload_cleanup",
        keywords: ["api payload cleanup", "json", "url decode", "base64", "pipeline", "recipe"],
    },
    {
        id: "security-token-review",
        labelKey: "workflow_security_token_review",
        keywords: ["security token review", "jwt", "token", "hash", "certificate", "pipeline"],
    },
    {
        id: "image-social-export",
        labelKey: "workflow_image_social_export",
        keywords: ["image social export", "open graph", "og image", "social metadata", "pipeline"],
    },
] as const

const RECOMMENDED_TOOL_KEYS = ["json_formatter", "jwt_decoder", "base64_encode_decode", "regex_tester"] as const
const TOOL_KEY_SCORE_MARKER = "tool-key:"

const CAPABILITY_LABEL_KEYS: Record<string, string> = {
    "browser-local": "capability_browser_local",
    "external-request": "capability_external_request",
    "file-input": "capability_file_input",
    "pipeline-ready": "capability_pipeline_ready",
}

const CAPABILITY_BADGE_ORDER = ["external-request", "browser-local", "file-input", "pipeline-ready"] as const

function buildSearchValue(parts: Array<string | undefined>): string {
    return parts
        .map((part) => (typeof part === "string" ? part.trim() : ""))
        .filter((part) => part.length > 0)
        .join(" ")
}

type ToolCommandItem = {
    toolKey: string
    title: string
    href: string
    searchValue: string
    searchKeywords: string[]
    capabilities: readonly string[]
    popularity: number
}

type CommandPaletteProps = {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    enableShortcut?: boolean
    takeReturnFocusTarget?: () => HTMLElement | null
}

function isEditableShortcutTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false
    if (target.isContentEditable) return true
    if (target.closest("[contenteditable=''], [contenteditable='true']")) return true

    const tagName = target.tagName.toLowerCase()
    if (["input", "textarea", "select"].includes(tagName)) return true

    if (target.getAttribute("role") === "textbox") return true

    return Boolean(target.closest("input, textarea, select, [role='textbox'], .monaco-editor, .monaco-diff-editor"))
}

function buildToolSearchKeywords(toolKey: string, title: string, searchValue: string, locale?: string): string[] {
    const tool = getCommandSearchToolByKey(toolKey)
    const metadata = getToolSearchMetadata(toolKey)
    return [
        title,
        searchValue,
        toolKey,
        tool?.slug,
        ...(tool?.keywords ?? []),
        ...(tool?.aliases ?? []),
        ...(tool?.searchKeywords ?? []),
        ...(metadata.aliases ?? []),
        ...(metadata.taskSynonyms ?? []),
        ...(metadata.categoryTerms ?? []),
        ...getToolSearchMetadataTerms(toolKey, locale),
        tool?.family,
        ...(tool?.tags ?? []),
        ...(tool?.capabilities ?? []),
    ].filter((value): value is string => typeof value === "string" && value.trim().length > 0)
}

function resolveLabel(
    namespace: "common" | "nav" | "pages",
    key: string,
    labels: {
        common: Record<string, string>
        nav: Record<string, string>
        pages: Record<string, string>
    },
): string {
    return requireTranslationValue(labels[namespace]?.[key], `${namespace}.${key}`)
}

function resolveSystemCommandLabel(
    labelKey: string,
    labels: { common: Record<string, string>; nav: Record<string, string> },
): string {
    const [namespace, key] = labelKey.split(".")
    const source = namespace === "nav" ? labels.nav : labels.common
    return requireTranslationValue(source?.[key], labelKey)
}

function getCapabilityLabels(capabilities: readonly string[], labels: Record<string, string>): string[] {
    const capabilitySet = new Set(capabilities)
    return CAPABILITY_BADGE_ORDER
        .filter((capability) => capabilitySet.has(capability))
        .map((capability) => requireTranslationValue(labels[CAPABILITY_LABEL_KEYS[capability]], `common.${CAPABILITY_LABEL_KEYS[capability]}`))
}

function CapabilityBadges({
    capabilities,
    labels,
}: {
    capabilities: readonly string[]
    labels: Record<string, string>
}) {
    const visibleLabels = getCapabilityLabels(capabilities, labels).slice(0, 3)
    if (visibleLabels.length === 0) return null

    return (
        <span aria-hidden="true" className="ml-auto flex shrink-0 flex-wrap justify-end gap-1">
            {visibleLabels.map((label) => (
                <span
                    key={label}
                    className="rounded-md border border-border/70 bg-background/70 px-1.5 py-0.5 text-[10px] font-medium leading-none text-muted-foreground"
                >
                    {label}
                </span>
            ))}
        </span>
    )
}

function ToolCommandRow({
    item,
    labels,
    icon: Icon = Search,
}: {
    item: ToolCommandItem
    labels: Record<string, string>
    icon?: typeof Search
}) {
    const capabilityLabels = getCapabilityLabels(item.capabilities, labels)
    const ariaLabel = capabilityLabels.length > 0
        ? `${item.title}, ${capabilityLabels.join(", ")}`
        : item.title

    return (
        <>
            <Icon className="mr-1 h-4 w-4" />
            <span className="min-w-0 flex-1 truncate" aria-label={ariaLabel}>
                {item.title}
            </span>
            <CapabilityBadges capabilities={item.capabilities} labels={labels} />
        </>
    )
}

export function CommandPalette({
    open: openProp,
    onOpenChange,
    enableShortcut = true,
    takeReturnFocusTarget,
}: CommandPaletteProps = {}) {
    const [internalOpen, setInternalOpen] = React.useState(false)
    const [favoriteToolKeys, setFavoriteToolKeys] = React.useState<string[]>([])
    const [recentToolKeys, setRecentToolKeys] = React.useState<string[]>([])
    const router = useRouter()
    const { captureReturnFocus, restoreReturnFocus } = useDialogReturnFocus(takeReturnFocusTarget)
    const { lang, t, englishToolSearchAliases } = useLang()
    const commonLabels = t.common
    const navigationLabel = requireTranslationValue(t.nav.navigation, "nav.navigation")
    const searchLabel = requireTranslationValue(t.nav.search, "nav.search")
    const noResultsLabel = requireTranslationValue(commonLabels.no_results, "common.no_results")
    const favoritesLabel = requireTranslationValue(commonLabels.favorites, "common.favorites")
    const recentToolsLabel = requireTranslationValue(commonLabels.recent_tools, "common.recent_tools")
    const commandActionsLabel = requireTranslationValue(commonLabels.command_actions, "common.command_actions")
    const commandActionBadgeLabel = requireTranslationValue(commonLabels.command_action_badge, "common.command_action_badge")
    const commonWorkflowsLabel = requireTranslationValue(commonLabels.common_workflows, "common.common_workflows")
    const recommendedToolsLabel = requireTranslationValue(commonLabels.command_recommended_tools, "common.command_recommended_tools")
    const noResultsSuggestionLabel = requireTranslationValue(commonLabels.no_results_suggestion, "common.no_results_suggestion")
    const requestToolLabel = requireTranslationValue(commonLabels.request_tool, "common.request_tool")

    const isControlled = typeof openProp === "boolean"
    const open = isControlled ? openProp : internalOpen
    const setOpen = React.useCallback(
        (nextOpen: boolean | ((previousOpen: boolean) => boolean)) => {
            const resolvedOpen =
                typeof nextOpen === "function"
                    ? nextOpen(isControlled ? (openProp ?? false) : internalOpen)
                    : nextOpen

            if (!isControlled) {
                setInternalOpen(resolvedOpen)
            }

            onOpenChange?.(resolvedOpen)
        },
        [internalOpen, isControlled, onOpenChange, openProp],
    )

    React.useEffect(() => {
        if (!enableShortcut) return

        const down = (e: KeyboardEvent) => {
            if (e.defaultPrevented || isEditableShortcutTarget(e.target)) return
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                captureReturnFocus()
                setOpen((prev) => !prev)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [captureReturnFocus, enableShortcut, setOpen])

    React.useEffect(() => {
        const sync = () => {
            setFavoriteToolKeys(readFavoriteToolKeys())
            setRecentToolKeys(readRecentToolKeys())
        }

        sync()
        window.addEventListener(TOOL_DISCOVERY_UPDATED_EVENT, sync)
        return () => window.removeEventListener(TOOL_DISCOVERY_UPDATED_EVENT, sync)
    }, [])

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false)
        command()
    }, [setOpen])

    const toolSearchValues = React.useMemo(() => {
        const values = new Map<string, string>()
        for (const group of toolGroups) {
            for (const item of group.items) {
                const tool = getCommandSearchToolByKey(item.key)
                const localizedTool = t.tools[item.key] as { title?: string; description?: string } | undefined
                const englishTool = englishToolSearchAliases?.[item.key]
                values.set(
                    item.key,
                    buildSearchValue([
                        localizedTool?.title,
                        englishTool?.title,
                        localizedTool?.description,
                        englishTool?.description,
                        item.key,
                        tool?.slug,
                        ...(tool?.keywords ?? []),
                        ...(tool?.aliases ?? []),
                        ...(tool?.searchKeywords ?? []),
                        ...getToolSearchMetadataTerms(item.key, lang),
                        tool?.family,
                        ...(tool?.tags ?? []),
                        ...(tool?.capabilities ?? []),
                    ]),
                )
            }
        }
        return values
    }, [englishToolSearchAliases, lang, t.tools])

    const buildToolCommand = React.useCallback((toolKey: string): ToolCommandItem | null => {
        const tool = getCommandSearchToolByKey(toolKey)
        if (!tool) return null
        const title = requireTranslationValue(t.tools[tool.key]?.title, `tools.${tool.key}.title`)
        const searchValue = toolSearchValues.get(tool.key) || title
        return {
            toolKey: tool.key,
            title,
            href: `/${lang}/${tool.slug}`,
            searchValue,
            searchKeywords: buildToolSearchKeywords(tool.key, title, searchValue, lang),
            capabilities: tool.capabilities,
            popularity: getToolSearchMetadata(tool.key).popularity ?? 0,
        }
    }, [lang, t.tools, toolSearchValues])

    const favoriteCommands = React.useMemo(() => {
        return favoriteToolKeys
            .map((toolKey) => buildToolCommand(toolKey))
            .filter((item): item is ToolCommandItem => item !== null)
    }, [buildToolCommand, favoriteToolKeys])

    const recentCommands = React.useMemo(() => {
        const favoriteKeySet = new Set(favoriteCommands.map((item) => item.toolKey))
        return recentToolKeys
            .filter((toolKey) => !favoriteKeySet.has(toolKey))
            .map((toolKey) => buildToolCommand(toolKey))
            .filter((item): item is ToolCommandItem => item !== null)
    }, [buildToolCommand, favoriteCommands, recentToolKeys])

    const recommendedCommands = React.useMemo(() => {
        return RECOMMENDED_TOOL_KEYS
            .map((toolKey) => buildToolCommand(toolKey))
            .filter((item): item is ToolCommandItem => item !== null)
    }, [buildToolCommand])

    const [search, setSearch] = React.useState("")
    const lastSearchTelemetry = React.useRef("")
    const systemCommands = useSystemCommands()
    const isCommandMode = search.startsWith(">")
    const labelSources = React.useMemo(() => ({
        common: commonLabels as unknown as Record<string, string>,
        nav: t.nav as unknown as Record<string, string>,
        pages: t.pages as unknown as Record<string, string>,
    }), [commonLabels, t.nav, t.pages])

    React.useEffect(() => {
        const trimmed = search.trim()
        if (trimmed.length === 0 || trimmed.startsWith(">")) return

        const resultCount = [
            ...recommendedCommands,
            ...favoriteCommands,
            ...recentCommands,
            ...toolGroups.flatMap((group) =>
                group.items.map((tool) => buildToolCommand(tool.key)).filter((item): item is ToolCommandItem => item !== null),
            ),
        ].filter((item, index, items) => {
            if (items.findIndex((candidate) => candidate.toolKey === item.toolKey) !== index) return false
            return scoreCommandSearch(item.searchValue, trimmed, item.searchKeywords) > 0
        }).length
        const telemetryKey = `${trimmed.length}:${resultCount}`
        if (lastSearchTelemetry.current === telemetryKey) return
        lastSearchTelemetry.current = telemetryKey

        trackSearchPerformed({
            language: lang,
            queryLength: trimmed.length,
            resultsCount: resultCount,
            sourcePage: "command_palette",
        })
    }, [buildToolCommand, favoriteCommands, lang, recentCommands, recommendedCommands, search])

    return (
        <CommandDialog
            open={open}
            onOpenChange={setOpen}
            onCloseAutoFocus={restoreReturnFocus}
            title={navigationLabel}
            description={searchLabel}
            filter={(value, search, keywords) => {
                const safeKeywords = keywords?.filter((keyword) => !keyword.startsWith(TOOL_KEY_SCORE_MARKER))
                const score = scoreCommandSearch(value, search, safeKeywords)
                const toolKey = keywords?.find((keyword) => keyword.startsWith(TOOL_KEY_SCORE_MARKER))?.slice(TOOL_KEY_SCORE_MARKER.length)
                if (!toolKey) return score
                return applyToolSearchScoreBonuses(toolKey, score, {
                    favorite: favoriteToolKeys.includes(toolKey),
                    recentRank: recentToolKeys.indexOf(toolKey),
                })
            }}
        >
            <CommandInput 
                aria-label={searchLabel}
                placeholder={searchLabel} 
                value={search}
                onValueChange={setSearch}
            />
            <CommandList className="max-h-[min(70vh,520px)]">
                <CommandEmpty>
                    <div className="space-y-3 px-3 text-left">
                        <div>
                            <p className="text-sm font-medium text-foreground">{noResultsLabel}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{noResultsSuggestionLabel}</p>
                        </div>
                        <div aria-label={recommendedToolsLabel} className="flex flex-wrap gap-1.5">
                            {recommendedCommands.slice(0, 3).map((item) => (
                                <button
                                    key={`empty-${item.toolKey}`}
                                    type="button"
                                    className="rounded-md border border-border/75 px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
                                    onClick={() => runCommand(() => router.push(item.href))}
                                >
                                    {item.title}
                                </button>
                            ))}
                            <button
                                type="button"
                                className="rounded-md border border-border/75 px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
                                onClick={() => runCommand(() => router.push(`/${lang}/contact`))}
                            >
                                {requestToolLabel}
                            </button>
                        </div>
                    </div>
                </CommandEmpty>

                {isCommandMode ? (
                    <CommandGroup heading={commandActionsLabel}>
                        {systemCommands.map((cmd) => {
                            const label = resolveSystemCommandLabel(cmd.labelKey, {
                                common: commonLabels as unknown as Record<string, string>,
                                nav: t.nav as unknown as Record<string, string>,
                            })
                            return (
                                <CommandItem
                                    key={cmd.id}
                                    value={"> " + buildSearchValue([
                                        label,
                                        ...cmd.keywords,
                                    ])}
                                    onSelect={() => runCommand(cmd.execute)}
                                >
                                    <cmd.icon className="mr-2 h-4 w-4" />
                                    <span>{label}</span>
                                    <span className="ml-auto text-xs text-muted-foreground font-mono tracking-tighter opacity-70">{commandActionBadgeLabel}</span>
                                </CommandItem>
                            )
                        })}
                    </CommandGroup>
                ) : (
                    <>
                        {favoriteCommands.length > 0 ? (
                            <>
                                <CommandGroup heading={favoritesLabel}>
                                    {favoriteCommands.map((item) => (
                                        <CommandItem
                                            key={`favorite-${item.toolKey}`}
                                            value={item.searchValue}
                                            keywords={[`${TOOL_KEY_SCORE_MARKER}${item.toolKey}`, ...item.searchKeywords]}
                                            onSelect={() => runCommand(() => router.push(item.href))}
                                        >
                                            <ToolCommandRow item={item} labels={commonLabels as unknown as Record<string, string>} icon={Star} />
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                                <CommandSeparator />
                            </>
                        ) : null}

                        {recentCommands.length > 0 ? (
                            <>
                                <CommandGroup heading={recentToolsLabel}>
                                    {recentCommands.map((item) => (
                                        <CommandItem
                                            key={`recent-${item.toolKey}`}
                                            value={item.searchValue}
                                            keywords={[`${TOOL_KEY_SCORE_MARKER}${item.toolKey}`, ...item.searchKeywords]}
                                            onSelect={() => runCommand(() => router.push(item.href))}
                                        >
                                            <ToolCommandRow item={item} labels={commonLabels as unknown as Record<string, string>} icon={History} />
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                                <CommandSeparator />
                            </>
                        ) : null}

                        <CommandGroup heading={navigationLabel}>
                            <CommandItem
                                value={buildSearchValue([requireTranslationValue(t.nav.home, "nav.home"), "home", lang])}
                                keywords={["home", "start", "index"]}
                                onSelect={() => runCommand(() => router.push(buildHomepageHref(lang)))}
                            >
                                <Search className="mr-2 h-4 w-4" />
                                <span>{requireTranslationValue(t.nav.home, "nav.home")}</span>
                            </CommandItem>
                            {STATIC_PAGES.map((page) => {
                                const label = resolveLabel(page.namespace, page.key, labelSources)
                                const href = page.slug === "all-tools" ? getAllToolsHref(lang) : `/${lang}/${page.slug}`
                                return (
                                    <CommandItem
                                        key={page.slug}
                                        value={buildSearchValue([label, page.slug, ...page.keywords])}
                                        keywords={[page.slug, ...page.keywords]}
                                        onSelect={() => runCommand(() => router.push(href))}
                                    >
                                        <FileText className="mr-2 h-4 w-4" />
                                        <span>{label}</span>
                                    </CommandItem>
                                )
                            })}
                            {toolGroups.map((group) => (
                                <CommandItem
                                    key={group.hubSlug}
                                    value={buildSearchValue([
                                        requireTranslationValue(t.nav[group.navKey], `nav.${group.navKey}`),
                                        group.key,
                                        group.hubSlug,
                                        "category",
                                        "tools",
                                    ])}
                                    keywords={[group.key, group.hubSlug, "category", "tools"]}
                                    onSelect={() => runCommand(() => router.push(`/${lang}/${group.hubSlug}`))}
                                >
                                    <FolderOpen className="mr-2 h-4 w-4" />
                                    <span>{requireTranslationValue(t.nav[group.navKey], `nav.${group.navKey}`)}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>

                        <CommandSeparator />

                        <CommandGroup heading={commonWorkflowsLabel}>
                            {WORKFLOW_ENTRIES.map((workflow) => {
                                const label = requireTranslationValue(commonLabels[workflow.labelKey], `common.${workflow.labelKey}`)
                                return (
                                <CommandItem
                                    key={workflow.id}
                                    value={buildSearchValue([label, workflow.id, "workflow", "pipeline", ...workflow.keywords])}
                                    keywords={[workflow.id, "workflow", "pipeline", ...workflow.keywords]}
                                    onSelect={() => runCommand(() => router.push(`/${lang}/pipeline-builder`))}
                                >
                                    <Workflow className="mr-2 h-4 w-4" />
                                    <span className="min-w-0 flex-1 truncate">{label}</span>
                                    <span
                                        aria-hidden="true"
                                        className="ml-auto rounded-md border border-border/70 bg-background/70 px-1.5 py-0.5 text-[10px] font-medium leading-none text-muted-foreground"
                                    >
                                        {commonWorkflowsLabel}
                                    </span>
                                </CommandItem>
                                )
                            })}
                        </CommandGroup>

                        <CommandSeparator />

                        {toolGroups.map((group) => {
                            const translatedTitle = requireTranslationValue(t.nav[group.navKey], `nav.${group.navKey}`)
                            return (
                                <CommandGroup key={group.key} heading={translatedTitle}>
                                    {group.items.map((tool) => {
                                        const title = requireTranslationValue(t.tools[tool.key]?.title, `tools.${tool.key}.title`)
                                        return (
                                            <CommandItem
                                                key={tool.href}
                                                value={toolSearchValues.get(tool.key) || title}
                                                keywords={[`${TOOL_KEY_SCORE_MARKER}${tool.key}`, ...buildToolSearchKeywords(tool.key, title, toolSearchValues.get(tool.key) || title, lang)]}
                                                onSelect={() => runCommand(() => router.push(`/${lang}${tool.href}`))}
                                                className={cn("items-start")}
                                            >
                                                <ToolCommandRow
                                                    item={{
                                                        toolKey: tool.key,
                                                        title,
                                                        href: `/${lang}${tool.href}`,
                                                        searchValue: toolSearchValues.get(tool.key) || title,
                                                        searchKeywords: buildToolSearchKeywords(tool.key, title, toolSearchValues.get(tool.key) || title, lang),
                                                        capabilities: getCommandSearchToolByKey(tool.key)?.capabilities ?? [],
                                                        popularity: getToolSearchMetadata(tool.key).popularity ?? 0,
                                                    }}
                                                    labels={commonLabels as unknown as Record<string, string>}
                                                    icon={Sparkles}
                                                />
                                            </CommandItem>
                                        )
                                    })}
                                </CommandGroup>
                            )
                        })}
                    </>
                )}
            </CommandList>
        </CommandDialog>
    )
}
