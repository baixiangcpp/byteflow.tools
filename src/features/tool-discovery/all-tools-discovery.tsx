"use client"

import * as React from "react"
import Link from "next/link"
import {
    FileText,
    Filter,
    History,
    Heart,
    ImageIcon,
    Link2,
    Network,
    Search,
    ShieldCheck,
    Sparkles,
    Tag,
    Trash2,
    WifiOff,
    Workflow,
    X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { scoreToolSearch } from "@/core/search/command-search"
import {
    clearFavoriteToolKeys,
    clearRecentToolKeys,
    readFavoriteToolKeys,
    readRecentToolKeys,
    toggleFavoriteToolKey,
    TOOL_DISCOVERY_UPDATED_EVENT,
} from "@/core/storage/tool-discovery-state"
import { cn } from "@/core/utils/utils"

type DiscoveryTool = {
    key: string
    slug: string
    title: string
    description: string
    family: string
    familyLabel: string
    keywords?: readonly string[]
    searchKeywords?: readonly string[]
    aliases?: readonly string[]
    localizedAliases?: readonly string[]
    categoryTerms?: readonly string[]
    popularity?: number
    tags: string[]
    capabilities: string[]
}

type DiscoveryGroup = {
    key: string
    title: string
    description: string
    href: string
    tools: DiscoveryTool[]
}

type DiscoveryWorkflow = {
    href: string
    id: string
    tags: string[]
    title: string
}

type AllToolsDiscoveryLabels = {
    activeFilters: string
    allFamilies: string
    clearFilters: string
    clearFavorites: string
    commonWorkflows: string
    favorites: string
    filterByCategory: string
    filterByExecution: string
    filterByInputType: string
    filterByUseCase: string
    filterSearch: string
    inputFile: string
    inputImage: string
    inputSvg: string
    inputText: string
    inputUrlDomain: string
    noResults: string
    noResultsSuggestion: string
    noFavorites: string
    noRecentTools: string
    open: string
    popularTags: string
    removeFilter: string
    showFilters: string
    closeFilters: string
    clearRecentTools: string
    recentTools: string
    recentToolsPrivacy: string
    addFavorite: string
    removeFavorite: string
    favoritesPrivacy: string
    searchPlaceholder: string
    toolsLabel: string
    useCaseEncode: string
    useCaseFormat: string
    useCaseImage: string
    useCaseSecurity: string
    useCaseWorkflow: string
}

type AllToolsDiscoveryProps = {
    capabilityLabels: Record<string, string>
    groups: DiscoveryGroup[]
    labels: AllToolsDiscoveryLabels
    locale: string
    tags: string[]
    totalTools: number
    workflows: DiscoveryWorkflow[]
}

type FilterOption = {
    id: string
    label: string
    matches: (tool: DiscoveryTool) => boolean
}

type ActiveFilter = {
    id: string
    label: string
    onRemove: () => void
}

const CAPABILITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    "browser-local": ShieldCheck,
    "offline-capable": WifiOff,
    "external-request": Network,
    "pipeline-ready": Workflow,
    "file-input": FileText,
    "visual-output": ImageIcon,
}

const CAPABILITY_DISPLAY_ORDER = [
    "external-request",
    "browser-local",
    "offline-capable",
    "file-input",
    "pipeline-ready",
    "visual-output",
    "sensitive-input",
]

const INPUT_FILTER_IDS = ["text", "file", "url-domain", "image", "svg"] as const
const EXECUTION_FILTER_IDS = ["browser-local", "external-request", "offline-capable"] as const
const USE_CASE_FILTER_IDS = ["format", "encode", "security", "image", "workflow"] as const
const FILTER_QUERY_KEYS = {
    category: "category",
    input: "input",
    execution: "execution",
    useCase: "use",
    tag: "tag",
} as const
const MOBILE_FILTER_FOCUSABLE_SELECTOR = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
].join(",")

function sortCapabilitiesForDisplay(capabilities: string[]): string[] {
    return [...capabilities].sort((left, right) => {
        const leftIndex = CAPABILITY_DISPLAY_ORDER.indexOf(left)
        const rightIndex = CAPABILITY_DISPLAY_ORDER.indexOf(right)
        return (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex) - (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex)
    })
}

function toggleValue(current: string[], value: string): string[] {
    return current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
}

function normalizeToolTerms(tool: DiscoveryTool): string {
    return [tool.key, tool.slug, tool.family, ...tool.tags, ...tool.capabilities].join(" ").toLowerCase()
}

function hasAnyTerm(tool: DiscoveryTool, terms: readonly string[]): boolean {
    const source = normalizeToolTerms(tool)
    return terms.some((term) => source.includes(term))
}

function matchesTextInput(tool: DiscoveryTool): boolean {
    if (hasAnyTerm(tool, ["image", "svg", "css", "color", "thumbnail", "photo", "barcode", "qr"])) {
        return false
    }
    return true
}

function buildInputOptions(labels: AllToolsDiscoveryLabels): FilterOption[] {
    return [
        { id: "text", label: labels.inputText, matches: matchesTextInput },
        { id: "file", label: labels.inputFile, matches: (tool) => tool.capabilities.includes("file-input") },
        {
            id: "url-domain",
            label: labels.inputUrlDomain,
            matches: (tool) => hasAnyTerm(tool, ["url", "domain", "dns", "http", "openapi", "curl", "request", "header", "robots", "thumbnail"]),
        },
        {
            id: "image",
            label: labels.inputImage,
            matches: (tool) => hasAnyTerm(tool, ["image", "photo", "thumbnail", "visual-output", "social-metadata"]),
        },
        {
            id: "svg",
            label: labels.inputSvg,
            matches: (tool) => hasAnyTerm(tool, ["svg"]),
        },
    ]
}

function buildExecutionOptions(labels: AllToolsDiscoveryLabels, capabilityLabels: Record<string, string>): FilterOption[] {
    return [
        {
            id: "browser-local",
            label: capabilityLabels["browser-local"] ?? labels.filterByExecution,
            matches: (tool) => tool.capabilities.includes("browser-local"),
        },
        {
            id: "external-request",
            label: capabilityLabels["external-request"] ?? labels.filterByExecution,
            matches: (tool) => tool.capabilities.includes("external-request"),
        },
        {
            id: "offline-capable",
            label: capabilityLabels["offline-capable"] ?? labels.filterByExecution,
            matches: (tool) => tool.capabilities.includes("offline-capable"),
        },
    ]
}

function buildUseCaseOptions(labels: AllToolsDiscoveryLabels): FilterOption[] {
    return [
        {
            id: "format",
            label: labels.useCaseFormat,
            matches: (tool) => hasAnyTerm(tool, ["format", "formatter", "validate", "validator", "beautifier", "minifier", "preview", "viewer", "parser"]),
        },
        {
            id: "encode",
            label: labels.useCaseEncode,
            matches: (tool) => hasAnyTerm(tool, ["encode", "decode", "base64", "hex", "gzip", "brotli", "url-encode", "html-encoder"]),
        },
        {
            id: "security",
            label: labels.useCaseSecurity,
            matches: (tool) => hasAnyTerm(tool, ["security", "jwt", "token", "hash", "certificate", "csp", "saml", "totp", "key", "headers"]),
        },
        {
            id: "image",
            label: labels.useCaseImage,
            matches: (tool) => hasAnyTerm(tool, ["image", "svg", "css", "color", "photo", "thumbnail", "social-metadata", "visual-output"]),
        },
        {
            id: "workflow",
            label: labels.useCaseWorkflow,
            matches: (tool) => tool.family === "workbench-pipeline" || tool.capabilities.includes("pipeline-ready"),
        },
    ]
}

function matchesSelectedOptions(tool: DiscoveryTool, selected: string[], options: FilterOption[]): boolean {
    if (selected.length === 0) return true
    return selected.some((id) => options.find((option) => option.id === id)?.matches(tool))
}

function parseQuerySelection(searchParams: URLSearchParams, key: string, allowedValues: readonly string[]): string[] {
    const allowed = new Set(allowedValues)
    return (searchParams.get(key) ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter((value, index, values) => value.length > 0 && allowed.has(value) && values.indexOf(value) === index)
}

function setQuerySelection(searchParams: URLSearchParams, key: string, selected: readonly string[]): void {
    if (selected.length === 0) return
    searchParams.set(key, selected.join(","))
}

function FilterButton({
    active,
    label,
    onClick,
}: {
    active: boolean
    label: string
    onClick: () => void
}) {
    return (
        <button
            type="button"
            className={cn(
                "min-h-11 min-w-11 rounded-md border px-2.5 py-1 text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45",
                active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
            onClick={onClick}
            aria-pressed={active}
        >
            {label}
        </button>
    )
}

function FilterGroup({
    heading,
    children,
}: {
    heading: string
    children: React.ReactNode
}) {
    return (
        <fieldset className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {heading}
            </legend>
            <div className="flex flex-wrap gap-1.5">{children}</div>
        </fieldset>
    )
}

function ToolCardBadges({
    capabilityLabels,
    tool,
}: {
    capabilityLabels: Record<string, string>
    tool: DiscoveryTool
}) {
    const capabilities = sortCapabilitiesForDisplay(tool.capabilities).slice(0, 2)
    return (
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className="rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                {tool.familyLabel}
            </span>
            {capabilities.map((capability) => {
                const Icon = CAPABILITY_ICONS[capability]
                return (
                    <span key={capability} className="inline-flex items-center gap-1 rounded-md border border-border/70 px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        {Icon ? <Icon className="h-3 w-3" /> : null}
                        {capabilityLabels[capability] ?? capability}
                    </span>
                )
            })}
        </div>
    )
}

function FavoriteButton({
    active,
    addLabel,
    removeLabel,
    onToggle,
}: {
    active: boolean
    addLabel: string
    removeLabel: string
    onToggle: () => void
}) {
    return (
        <button
            type="button"
            className={cn(
                "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45",
                active
                    ? "border-primary/35 bg-primary/10 text-primary"
                    : "border-border/70 bg-background/55 text-muted-foreground hover:border-primary/35 hover:text-primary",
            )}
            aria-label={active ? removeLabel : addLabel}
            aria-pressed={active}
            onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onToggle()
            }}
        >
            <Heart className={cn("h-4 w-4", active ? "fill-current" : "")} />
        </button>
    )
}

export function AllToolsDiscovery({
    capabilityLabels,
    groups,
    labels,
    locale,
    tags,
    totalTools,
    workflows,
}: AllToolsDiscoveryProps) {
    const [query, setQuery] = React.useState("")
    const [selectedCategories, setSelectedCategories] = React.useState<string[]>([])
    const [selectedInputTypes, setSelectedInputTypes] = React.useState<string[]>([])
    const [selectedExecutionModes, setSelectedExecutionModes] = React.useState<string[]>([])
    const [selectedUseCases, setSelectedUseCases] = React.useState<string[]>([])
    const [selectedTags, setSelectedTags] = React.useState<string[]>([])
    const [recentToolKeys, setRecentToolKeys] = React.useState<string[]>([])
    const [favoriteToolKeys, setFavoriteToolKeys] = React.useState<string[]>([])
    const [personalizationReady, setPersonalizationReady] = React.useState(false)
    const [urlFiltersLoaded, setUrlFiltersLoaded] = React.useState(false)
    const [showMobileFilters, setShowMobileFilters] = React.useState(false)
    const mobileFilterDialogRef = React.useRef<HTMLDivElement>(null)
    const mobileFilterTriggerRef = React.useRef<HTMLButtonElement>(null)
    const mobileFilterPreviousFocusRef = React.useRef<HTMLElement | null>(null)

    const categoryOptions = React.useMemo(
        () => groups.map((group) => ({ id: group.key, label: group.title })),
        [groups],
    )
    const categoryIds = React.useMemo(() => categoryOptions.map((option) => option.id), [categoryOptions])
    const categoryIdsKey = categoryIds.join("|")
    const tagIdsKey = tags.join("|")
    const inputOptions = React.useMemo(() => buildInputOptions(labels), [labels])
    const executionOptions = React.useMemo(() => buildExecutionOptions(labels, capabilityLabels), [capabilityLabels, labels])
    const useCaseOptions = React.useMemo(() => buildUseCaseOptions(labels), [labels])

    React.useEffect(() => {
        const syncDiscoveryState = () => {
            setRecentToolKeys(readRecentToolKeys())
            setFavoriteToolKeys(readFavoriteToolKeys())
            setPersonalizationReady(true)
        }
        syncDiscoveryState()
        window.addEventListener(TOOL_DISCOVERY_UPDATED_EVENT, syncDiscoveryState)
        return () => window.removeEventListener(TOOL_DISCOVERY_UPDATED_EVENT, syncDiscoveryState)
    }, [])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        const params = new URLSearchParams(window.location.search)
        setSelectedCategories(parseQuerySelection(params, FILTER_QUERY_KEYS.category, categoryIdsKey.split("|")))
        setSelectedInputTypes(parseQuerySelection(params, FILTER_QUERY_KEYS.input, INPUT_FILTER_IDS))
        setSelectedExecutionModes(parseQuerySelection(params, FILTER_QUERY_KEYS.execution, EXECUTION_FILTER_IDS))
        setSelectedUseCases(parseQuerySelection(params, FILTER_QUERY_KEYS.useCase, USE_CASE_FILTER_IDS))
        setSelectedTags(parseQuerySelection(params, FILTER_QUERY_KEYS.tag, tagIdsKey.split("|")))
        setUrlFiltersLoaded(true)
    }, [categoryIdsKey, tagIdsKey])

    React.useEffect(() => {
        if (!urlFiltersLoaded || typeof window === "undefined") return
        const params = new URLSearchParams()
        setQuerySelection(params, FILTER_QUERY_KEYS.category, selectedCategories)
        setQuerySelection(params, FILTER_QUERY_KEYS.input, selectedInputTypes)
        setQuerySelection(params, FILTER_QUERY_KEYS.execution, selectedExecutionModes)
        setQuerySelection(params, FILTER_QUERY_KEYS.useCase, selectedUseCases)
        setQuerySelection(params, FILTER_QUERY_KEYS.tag, selectedTags)

        const queryString = params.toString()
        const nextUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ""}${window.location.hash}`
        window.history.replaceState(null, "", nextUrl)
    }, [selectedCategories, selectedExecutionModes, selectedInputTypes, selectedTags, selectedUseCases, urlFiltersLoaded])

    React.useEffect(() => {
        if (!showMobileFilters || typeof document === "undefined") return
        mobileFilterPreviousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
        const fallbackFocusTarget = mobileFilterTriggerRef.current

        const getFocusable = () => {
            const dialog = mobileFilterDialogRef.current
            if (!dialog) return []
            return Array.from(dialog.querySelectorAll<HTMLElement>(MOBILE_FILTER_FOCUSABLE_SELECTOR))
                .filter((element) => !element.closest("[hidden], [aria-hidden='true']"))
        }

        const focusInitialControl = () => {
            const dialog = mobileFilterDialogRef.current
            const firstFocusable = getFocusable()[0]
            if (firstFocusable) {
                firstFocusable.focus()
            } else {
                dialog?.focus()
            }
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault()
                setShowMobileFilters(false)
                return
            }
            if (event.key !== "Tab") return

            const focusable = getFocusable()
            if (focusable.length === 0) {
                event.preventDefault()
                mobileFilterDialogRef.current?.focus()
                return
            }

            const first = focusable[0]
            const last = focusable[focusable.length - 1]
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault()
                last.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault()
                first.focus()
            }
        }

        window.setTimeout(focusInitialControl, 0)
        document.addEventListener("keydown", handleKeyDown)
        return () => {
            document.removeEventListener("keydown", handleKeyDown)
            const focusTarget = mobileFilterPreviousFocusRef.current ?? fallbackFocusTarget
            if (focusTarget?.isConnected) {
                window.setTimeout(() => focusTarget.focus(), 0)
            }
        }
    }, [showMobileFilters])

    const toolByKey = React.useMemo(() => {
        const map = new Map<string, DiscoveryTool>()
        for (const group of groups) {
            for (const tool of group.tools) map.set(tool.key, tool)
        }
        return map
    }, [groups])

    const recentTools = React.useMemo(
        () => recentToolKeys.map((key) => toolByKey.get(key)).filter((tool): tool is DiscoveryTool => Boolean(tool)).slice(0, 6),
        [recentToolKeys, toolByKey],
    )
    const favoriteTools = React.useMemo(
        () => favoriteToolKeys.map((key) => toolByKey.get(key)).filter((tool): tool is DiscoveryTool => Boolean(tool)).slice(0, 8),
        [favoriteToolKeys, toolByKey],
    )
    const favoriteToolKeySet = React.useMemo(() => new Set(favoriteToolKeys), [favoriteToolKeys])
    const recentRankByToolKey = React.useMemo(() => {
        const map = new Map<string, number>()
        recentToolKeys.forEach((key, index) => {
            if (!map.has(key)) map.set(key, index)
        })
        return map
    }, [recentToolKeys])

    const filteredGroups = React.useMemo(() => {
        const normalizedQuery = query.trim()
        return groups
            .filter((group) => selectedCategories.length === 0 || selectedCategories.includes(group.key))
            .map((group) => ({
                ...group,
                tools: group.tools
                    .map((tool, index) => ({
                        index,
                        score: normalizedQuery
                            ? scoreToolSearch(tool, normalizedQuery, {
                                favorite: favoriteToolKeySet.has(tool.key),
                                locale,
                                recentRank: recentRankByToolKey.get(tool.key),
                            })
                            : 1,
                        tool,
                    }))
                    .filter(({ score, tool }) => {
                        if (!matchesSelectedOptions(tool, selectedInputTypes, inputOptions)) return false
                        if (!matchesSelectedOptions(tool, selectedExecutionModes, executionOptions)) return false
                        if (!matchesSelectedOptions(tool, selectedUseCases, useCaseOptions)) return false
                        if (selectedTags.some((tag) => !tool.tags.includes(tag) && !tool.capabilities.includes(tag))) return false
                        return score > 0
                    })
                    .sort((left, right) => right.score - left.score || left.index - right.index)
                    .map(({ tool }) => tool),
            }))
            .filter((group) => group.tools.length > 0)
    }, [
        executionOptions,
        favoriteToolKeySet,
        groups,
        inputOptions,
        locale,
        query,
        recentRankByToolKey,
        selectedCategories,
        selectedExecutionModes,
        selectedInputTypes,
        selectedTags,
        selectedUseCases,
        useCaseOptions,
    ])

    const hasFilters = Boolean(
        query ||
        selectedCategories.length > 0 ||
        selectedExecutionModes.length > 0 ||
        selectedInputTypes.length > 0 ||
        selectedTags.length > 0 ||
        selectedUseCases.length > 0
    )
    const resultCount = hasFilters
        ? filteredGroups.reduce((count, group) => count + group.tools.length, 0)
        : totalTools

    const clearFilters = React.useCallback(() => {
        setQuery("")
        setSelectedCategories([])
        setSelectedInputTypes([])
        setSelectedExecutionModes([])
        setSelectedUseCases([])
        setSelectedTags([])
    }, [])

    const handleClearRecentTools = React.useCallback(() => {
        setRecentToolKeys(clearRecentToolKeys())
    }, [])

    const handleClearFavorites = React.useCallback(() => {
        setFavoriteToolKeys(clearFavoriteToolKeys())
    }, [])

    const handleToggleFavorite = React.useCallback((toolKey: string) => {
        setFavoriteToolKeys(toggleFavoriteToolKey(toolKey))
    }, [])

    const removeSelectedValue = React.useCallback((setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
        setter((current) => current.filter((item) => item !== value))
    }, [])

    const activeFilters = React.useMemo<ActiveFilter[]>(() => {
        const active: ActiveFilter[] = []
        if (query.trim()) {
            active.push({
                id: "query",
                label: `${labels.filterSearch}: ${query.trim()}`,
                onRemove: () => setQuery(""),
            })
        }
        for (const category of categoryOptions) {
            if (selectedCategories.includes(category.id)) {
                active.push({
                    id: `category-${category.id}`,
                    label: category.label,
                    onRemove: () => removeSelectedValue(setSelectedCategories, category.id),
                })
            }
        }
        for (const option of inputOptions) {
            if (selectedInputTypes.includes(option.id)) {
                active.push({
                    id: `input-${option.id}`,
                    label: option.label,
                    onRemove: () => removeSelectedValue(setSelectedInputTypes, option.id),
                })
            }
        }
        for (const option of executionOptions) {
            if (selectedExecutionModes.includes(option.id)) {
                active.push({
                    id: `execution-${option.id}`,
                    label: option.label,
                    onRemove: () => removeSelectedValue(setSelectedExecutionModes, option.id),
                })
            }
        }
        for (const option of useCaseOptions) {
            if (selectedUseCases.includes(option.id)) {
                active.push({
                    id: `use-${option.id}`,
                    label: option.label,
                    onRemove: () => removeSelectedValue(setSelectedUseCases, option.id),
                })
            }
        }
        for (const tag of selectedTags) {
            active.push({
                id: `tag-${tag}`,
                label: tag,
                onRemove: () => removeSelectedValue(setSelectedTags, tag),
            })
        }
        return active
    }, [
        categoryOptions,
        executionOptions,
        inputOptions,
        labels.filterSearch,
        query,
        removeSelectedValue,
        selectedCategories,
        selectedExecutionModes,
        selectedInputTypes,
        selectedTags,
        selectedUseCases,
        useCaseOptions,
    ])

    const tagFilterPanel = (
        <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Tag className="h-3.5 w-3.5" />
                {labels.popularTags}
            </span>
            {tags.map((tag) => {
                const active = selectedTags.includes(tag)
                return (
                    <FilterButton
                        key={tag}
                        active={active}
                        label={tag}
                        onClick={() => setSelectedTags((current) => toggleValue(current, tag))}
                    />
                )
            })}
        </div>
    )

    const filterPanel = (
        <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr_1fr_1fr]">
            <FilterGroup heading={labels.filterByCategory}>
                {categoryOptions.map((category) => (
                    <FilterButton
                        key={category.id}
                        active={selectedCategories.includes(category.id)}
                        label={category.label}
                        onClick={() => setSelectedCategories((current) => toggleValue(current, category.id))}
                    />
                ))}
            </FilterGroup>
            <FilterGroup heading={labels.filterByInputType}>
                {inputOptions.map((option) => (
                    <FilterButton
                        key={option.id}
                        active={selectedInputTypes.includes(option.id)}
                        label={option.label}
                        onClick={() => setSelectedInputTypes((current) => toggleValue(current, option.id))}
                    />
                ))}
            </FilterGroup>
            <FilterGroup heading={labels.filterByExecution}>
                {executionOptions.map((option) => (
                    <FilterButton
                        key={option.id}
                        active={selectedExecutionModes.includes(option.id)}
                        label={option.label}
                        onClick={() => setSelectedExecutionModes((current) => toggleValue(current, option.id))}
                    />
                ))}
            </FilterGroup>
            <FilterGroup heading={labels.filterByUseCase}>
                {useCaseOptions.map((option) => (
                    <FilterButton
                        key={option.id}
                        active={selectedUseCases.includes(option.id)}
                        label={option.label}
                        onClick={() => setSelectedUseCases((current) => toggleValue(current, option.id))}
                    />
                ))}
            </FilterGroup>
        </div>
    )

    const localToolsPanel = personalizationReady ? (
        <div className="grid gap-3 lg:grid-cols-2">
            <section className="rounded-lg border border-border/70 bg-background/35 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold">
                            <Heart className="h-4 w-4 text-primary" />
                            {labels.favorites}
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">{labels.favoritesPrivacy}</p>
                    </div>
                    <Button type="button" variant="ghost" className="min-h-10 px-2 text-xs" onClick={handleClearFavorites} disabled={favoriteTools.length === 0}>
                        <Trash2 className="h-3.5 w-3.5" />
                        {labels.clearFavorites}
                    </Button>
                </div>
                {favoriteTools.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {favoriteTools.map((tool) => (
                            <Link
                                key={tool.key}
                                href={`/${locale}/${tool.slug}`}
                                className="inline-flex min-h-10 items-center rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
                            >
                                {tool.title}
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="mt-3 text-xs text-muted-foreground">{labels.noFavorites}</p>
                )}
            </section>

            <section className="rounded-lg border border-border/70 bg-background/35 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold">
                            <History className="h-4 w-4 text-primary" />
                            {labels.recentTools}
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">{labels.recentToolsPrivacy}</p>
                    </div>
                    <Button type="button" variant="ghost" className="min-h-10 px-2 text-xs" onClick={handleClearRecentTools} disabled={recentTools.length === 0}>
                        <Trash2 className="h-3.5 w-3.5" />
                        {labels.clearRecentTools}
                    </Button>
                </div>
                {recentTools.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {recentTools.map((tool) => (
                            <Link
                                key={tool.key}
                                href={`/${locale}/${tool.slug}`}
                                className="inline-flex min-h-10 items-center rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
                            >
                                {tool.title}
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="mt-3 text-xs text-muted-foreground">{labels.noRecentTools}</p>
                )}
            </section>
        </div>
    ) : null

    return (
        <div id="tool-discovery" className="min-w-0 space-y-5">
            <section className="min-w-0 rounded-xl border border-border/70 bg-card/55 p-4 backdrop-blur-sm">
                <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="relative min-w-0">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={labels.searchPlaceholder}
                            className="min-h-11 pl-9"
                            aria-label={labels.filterSearch}
                            aria-controls="all-tools-results"
                            aria-describedby="all-tools-result-status"
                        />
                    </div>
                    <Button type="button" variant="outline" className="hidden lg:inline-flex" onClick={clearFilters} disabled={!hasFilters}>
                        <X className="h-4 w-4" />
                        {labels.clearFilters}
                    </Button>
                </div>

                <button
                    ref={mobileFilterTriggerRef}
                    type="button"
                    className="mt-4 flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/45 px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 lg:hidden"
                    onClick={() => setShowMobileFilters(true)}
                    aria-expanded={showMobileFilters}
                    aria-controls="all-tools-filter-drawer"
                    aria-describedby="all-tools-result-status"
                >
                        <span className="inline-flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            {labels.showFilters}
                        </span>
                        <span className="rounded-md border border-border/70 px-2 py-0.5 text-xs text-muted-foreground">
                            {activeFilters.length}
                        </span>
                </button>

                <div className={cn(
                    "mt-4 rounded-lg border border-border/70 bg-background/35 p-4",
                    "hidden",
                    "lg:block",
                )}>
                    {filterPanel}
                </div>

                <div className="mt-4 hidden lg:block">
                    {tagFilterPanel}
                </div>

                <div className="mt-4 border-t border-border/70 pt-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span id="all-tools-result-status" role="status" aria-live="polite" aria-atomic="true">
                            {resultCount} {labels.toolsLabel}
                        </span>
                    </div>

                    {activeFilters.length > 0 ? (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">{labels.activeFilters}</span>
                            {activeFilters.map((filter) => (
                                <button
                                    key={filter.id}
                                    type="button"
                                    className="inline-flex min-h-11 min-w-11 items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 text-xs font-medium text-primary transition-colors hover:border-primary/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
                                    onClick={filter.onRemove}
                                    aria-label={`${labels.removeFilter}: ${filter.label}`}
                                >
                                    {filter.label}
                                    <X className="h-3 w-3" />
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>
            </section>

            {showMobileFilters ? (
                <div className="fixed inset-0 z-[70] lg:hidden">
                    <div
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        aria-hidden="true"
                        onClick={() => setShowMobileFilters(false)}
                    />
                    <div
                        ref={mobileFilterDialogRef}
                        id="all-tools-filter-drawer"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="all-tools-filter-title"
                        aria-describedby="all-tools-filter-summary"
                        tabIndex={-1}
                        className="absolute inset-x-0 bottom-0 max-h-[86dvh] overflow-y-auto rounded-t-2xl border border-border/70 bg-background p-4 shadow-2xl"
                    >
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <h2 id="all-tools-filter-title" className="inline-flex items-center gap-2 text-base font-semibold">
                                    <Filter className="h-4 w-4" />
                                    {labels.showFilters}
                                </h2>
                                <p id="all-tools-filter-summary" className="mt-1 text-xs text-muted-foreground">
                                    {resultCount} {labels.toolsLabel} - {activeFilters.length} {labels.activeFilters}
                                </p>
                            </div>
                            <Button type="button" variant="ghost" size="icon" aria-label={labels.closeFilters} onClick={() => setShowMobileFilters(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="space-y-4">
                            {filterPanel}
                            <div className="border-t border-border/70 pt-4">{tagFilterPanel}</div>
                            <div className="flex gap-2 border-t border-border/70 pt-4">
                                <Button type="button" variant="outline" className="flex-1" onClick={clearFilters} disabled={!hasFilters}>
                                    <X className="h-4 w-4" />
                                    {labels.clearFilters}
                                </Button>
                                <Button type="button" className="flex-1" onClick={() => setShowMobileFilters(false)}>
                                    {labels.closeFilters}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {localToolsPanel}

            {workflows.length > 0 ? (
                <section className="min-w-0 rounded-xl border border-border/70 bg-card/55 p-4 backdrop-blur-sm">
                    <h2 className="text-sm font-semibold">{labels.commonWorkflows}</h2>
                    <div className="mt-3 grid gap-2 md:grid-cols-3">
                        {workflows.map((workflow) => (
                            <Link
                                key={workflow.id}
                                href={workflow.href}
                                className="group min-w-0 rounded-lg border border-border/70 bg-background/55 p-3 text-sm transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
                            >
                                <span className="inline-flex items-center gap-2 font-medium text-foreground group-hover:text-primary">
                                    <Sparkles className="h-4 w-4" />
                                    {workflow.title}
                                </span>
                                <span className="mt-2 flex flex-wrap gap-1">
                                    {workflow.tags.slice(0, 3).map((tag) => (
                                        <span key={tag} className="rounded border border-border/70 px-1.5 py-0.5 text-[11px] text-muted-foreground">
                                            {tag}
                                        </span>
                                    ))}
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>
            ) : null}

            {filteredGroups.length > 0 ? (
                <div id="all-tools-results" className="grid gap-5">
                    {filteredGroups.map((group) => (
                        <section key={group.key} className="min-w-0 rounded-xl border border-border/70 bg-card/55 p-4 backdrop-blur-sm sm:p-5">
                            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-semibold tracking-tight">{group.title}</h2>
                                    <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                                        {group.description}
                                    </p>
                                </div>
                                <Link
                                    href={`/${locale}${group.href}`}
                                    className="inline-flex min-h-11 items-center gap-1 rounded-md border border-border/75 bg-background/55 px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
                                >
                                    <Link2 className="h-3.5 w-3.5" />
                                    {labels.open}
                                </Link>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {group.tools.map((tool) => {
                                    const isFavorite = favoriteToolKeySet.has(tool.key)
                                    return (
                                    <article
                                        key={tool.key}
                                        className="group flex min-h-36 min-w-0 flex-col rounded-lg border border-border/70 bg-background/45 p-4 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/35"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <Link
                                                href={`/${locale}/${tool.slug}`}
                                                aria-label={tool.title}
                                                className="min-w-0 flex-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
                                            >
                                                <ToolCardBadges capabilityLabels={capabilityLabels} tool={tool} />
                                                <h3 className="break-words text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                                                    {tool.title}
                                                </h3>
                                            </Link>
                                            {personalizationReady ? (
                                                <FavoriteButton
                                                    active={isFavorite}
                                                    addLabel={`${labels.addFavorite}: ${tool.title}`}
                                                    removeLabel={`${labels.removeFavorite}: ${tool.title}`}
                                                    onToggle={() => handleToggleFavorite(tool.key)}
                                                />
                                            ) : null}
                                        </div>
                                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                                            {tool.description}
                                        </p>
                                    </article>
                                )})}
                            </div>
                        </section>
                    ))}
                </div>
            ) : (
                <section id="all-tools-results" className="rounded-xl border border-dashed border-border/80 bg-card/35 p-8 text-center">
                    <h2 className="text-lg font-semibold">{labels.noResults}</h2>
                    <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{labels.noResultsSuggestion}</p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <Button type="button" variant="outline" onClick={clearFilters}>
                            {labels.clearFilters}
                        </Button>
                        {workflows.slice(0, 2).map((workflow) => (
                            <Link
                                key={workflow.id}
                                href={workflow.href}
                                className="inline-flex min-h-11 items-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
                            >
                                {workflow.title}
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}
