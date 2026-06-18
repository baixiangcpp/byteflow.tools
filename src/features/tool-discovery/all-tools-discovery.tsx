"use client"

import * as React from "react"
import Link from "next/link"
import { History, Network, Search, ShieldCheck, Tag, WifiOff, Workflow, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { readRecentToolKeys, TOOL_DISCOVERY_UPDATED_EVENT } from "@/core/storage/tool-discovery-state"

type DiscoveryTool = {
    key: string
    slug: string
    title: string
    description: string
    family: string
    familyLabel: string
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

type DiscoveryFamily = {
    key: string
    label: string
}

type DiscoveryWorkflow = {
    href: string
    id: string
    tags: string[]
    title: string
}

type AllToolsDiscoveryLabels = {
    allFamilies: string
    clearFilters: string
    commonWorkflows: string
    filterByFamily: string
    noResults: string
    noResultsSuggestion: string
    open: string
    popularTags: string
    recentTools: string
    searchPlaceholder: string
    toolsLabel: string
}

type AllToolsDiscoveryProps = {
    capabilityLabels: Record<string, string>
    families: DiscoveryFamily[]
    groups: DiscoveryGroup[]
    labels: AllToolsDiscoveryLabels
    locale: string
    tags: string[]
    workflows: DiscoveryWorkflow[]
}

const CAPABILITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    "browser-local": ShieldCheck,
    "offline-capable": WifiOff,
    "external-request": Network,
    "pipeline-ready": Workflow,
}

function normalize(value: string): string {
    return value.trim().toLowerCase()
}

function includesSearch(tool: DiscoveryTool, query: string): boolean {
    if (!query) return true
    return [
        tool.key,
        tool.slug,
        tool.title,
        tool.description,
        tool.family,
        tool.familyLabel,
        ...tool.tags,
        ...tool.capabilities,
    ].some((part) => part.toLowerCase().includes(query))
}

function toggleTag(current: string[], tag: string): string[] {
    return current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]
}

export function AllToolsDiscovery({
    capabilityLabels,
    families,
    groups,
    labels,
    locale,
    tags,
    workflows,
}: AllToolsDiscoveryProps) {
    const [query, setQuery] = React.useState("")
    const [selectedFamily, setSelectedFamily] = React.useState("")
    const [selectedTags, setSelectedTags] = React.useState<string[]>([])
    const [recentToolKeys, setRecentToolKeys] = React.useState<string[]>([])

    React.useEffect(() => {
        const syncRecentTools = () => setRecentToolKeys(readRecentToolKeys())
        syncRecentTools()
        window.addEventListener(TOOL_DISCOVERY_UPDATED_EVENT, syncRecentTools)
        return () => window.removeEventListener(TOOL_DISCOVERY_UPDATED_EVENT, syncRecentTools)
    }, [])

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

    const filteredGroups = React.useMemo(() => {
        const normalizedQuery = normalize(query)
        return groups
            .map((group) => ({
                ...group,
                tools: group.tools.filter((tool) => {
                    if (selectedFamily && tool.family !== selectedFamily) return false
                    if (selectedTags.some((tag) => !tool.tags.includes(tag) && !tool.capabilities.includes(tag))) return false
                    return includesSearch(tool, normalizedQuery)
                }),
            }))
            .filter((group) => group.tools.length > 0)
    }, [groups, query, selectedFamily, selectedTags])

    const resultCount = filteredGroups.reduce((count, group) => count + group.tools.length, 0)
    const hasFilters = Boolean(query || selectedFamily || selectedTags.length > 0)

    const clearFilters = React.useCallback(() => {
        setQuery("")
        setSelectedFamily("")
        setSelectedTags([])
    }, [])

    return (
        <div className="space-y-5">
            <section className="rounded-xl border border-border/70 bg-card/55 p-4 backdrop-blur-sm">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px_auto]">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={labels.searchPlaceholder}
                            className="pl-9"
                        />
                    </div>
                    <select
                        aria-label={labels.filterByFamily}
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        value={selectedFamily}
                        onChange={(event) => setSelectedFamily(event.target.value)}
                    >
                        <option value="">{labels.allFamilies}</option>
                        {families.map((family) => (
                            <option key={family.key} value={family.key}>
                                {family.label}
                            </option>
                        ))}
                    </select>
                    <Button type="button" variant="outline" onClick={clearFilters} disabled={!hasFilters}>
                        <X className="h-4 w-4" />
                        {labels.clearFilters}
                    </Button>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <Tag className="h-3.5 w-3.5" />
                        {labels.popularTags}
                    </span>
                    {tags.map((tag) => {
                        const active = selectedTags.includes(tag)
                        return (
                            <button
                                key={tag}
                                type="button"
                                className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}
                                onClick={() => setSelectedTags((current) => toggleTag(current, tag))}
                                aria-pressed={active}
                            >
                                {tag}
                            </button>
                        )
                    })}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3 text-xs text-muted-foreground">
                    <span>{resultCount} {labels.toolsLabel}</span>
                    {recentTools.length > 0 ? (
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 font-medium">
                                <History className="h-3.5 w-3.5" />
                                {labels.recentTools}
                            </span>
                            {recentTools.map((tool) => (
                                <Link key={tool.key} href={`/${locale}/${tool.slug}`} className="rounded-md border border-border bg-background px-2 py-1 text-foreground hover:border-primary/40">
                                    {tool.title}
                                </Link>
                            ))}
                        </div>
                    ) : null}
                </div>
            </section>

            {workflows.length > 0 ? (
                <section className="rounded-xl border border-border/70 bg-card/55 p-4 backdrop-blur-sm">
                    <h2 className="text-sm font-semibold">{labels.commonWorkflows}</h2>
                    <div className="mt-3 grid gap-2 md:grid-cols-3">
                        {workflows.map((workflow) => (
                            <Link
                                key={workflow.id}
                                href={workflow.href}
                                className="group rounded-lg border border-border/70 bg-background/55 p-3 text-sm transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
                            >
                                <span className="font-medium text-foreground group-hover:text-primary">{workflow.title}</span>
                                <span className="mt-2 flex flex-wrap gap-1">
                                    {workflow.tags.map((tag) => (
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
                <div className="grid gap-5">
                    {filteredGroups.map((group) => (
                        <section key={group.key} className="rounded-xl border border-border/70 bg-card/55 p-5 backdrop-blur-sm">
                            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-semibold tracking-tight">{group.title}</h2>
                                    <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                                        {group.description}
                                    </p>
                                </div>
                                <Link
                                    href={`/${locale}${group.href}`}
                                    className="inline-flex min-h-9 items-center gap-1 rounded-md border border-border/75 bg-background/55 px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
                                >
                                    {labels.open}
                                </Link>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {group.tools.map((tool) => (
                                    <Link
                                        key={tool.key}
                                        href={`/${locale}/${tool.slug}`}
                                        className="group flex min-h-36 flex-col rounded-lg border border-border/70 bg-background/45 p-4 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg hover:shadow-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 dark:hover:shadow-black/35"
                                    >
                                        <div className="mb-2 flex flex-wrap items-center gap-1.5">
                                            <span className="rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                                                {tool.familyLabel}
                                            </span>
                                            {tool.capabilities.slice(0, 3).map((capability) => {
                                                const Icon = CAPABILITY_ICONS[capability]
                                                return (
                                                    <span key={capability} className="inline-flex items-center gap-1 rounded-md border border-border/70 px-1.5 py-0.5 text-[11px] text-muted-foreground">
                                                        {Icon ? <Icon className="h-3 w-3" /> : null}
                                                        {capabilityLabels[capability] ?? capability}
                                                    </span>
                                                )
                                            })}
                                        </div>
                                        <h3 className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                                            {tool.title}
                                        </h3>
                                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                                            {tool.description}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            ) : (
                <section className="rounded-xl border border-dashed border-border/80 bg-card/35 p-8 text-center">
                    <h2 className="text-lg font-semibold">{labels.noResults}</h2>
                    <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{labels.noResultsSuggestion}</p>
                    <Button type="button" variant="outline" className="mt-4" onClick={clearFilters}>
                        {labels.clearFilters}
                    </Button>
                </section>
            )}
        </div>
    )
}

