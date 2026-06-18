"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { History, Search, Star } from "lucide-react"
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
import { DialogTitle } from "@/components/ui/dialog"
import { useLang } from "@/core/i18n/lang-provider"
import { getClientToolByKey } from "@/generated/client-tool-lookup"
import { readFavoriteToolKeys, readRecentToolKeys, TOOL_DISCOVERY_UPDATED_EVENT } from "@/core/storage/tool-discovery-state"
import { useSystemCommands } from "@/core/commands/registry"

const STATIC_PAGES = [
    { slug: "about", key: "about_title" },
    { slug: "contact", key: "contact_title" },
    { slug: "privacy", key: "privacy_title" },
    { slug: "terms", key: "terms_title" },
] as const

function buildSearchValue(parts: Array<string | undefined>): string {
    return parts
        .map((part) => (typeof part === "string" ? part.trim() : ""))
        .filter((part) => part.length > 0)
        .join(" ")
}

type ToolCommandItem = { toolKey: string; title: string; href: string; searchValue: string }

type CommandPaletteProps = {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    enableShortcut?: boolean
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

export function CommandPalette({ open: openProp, onOpenChange, enableShortcut = true }: CommandPaletteProps = {}) {
    const [internalOpen, setInternalOpen] = React.useState(false)
    const [favoriteToolKeys, setFavoriteToolKeys] = React.useState<string[]>([])
    const [recentToolKeys, setRecentToolKeys] = React.useState<string[]>([])
    const router = useRouter()
    const { lang, t, englishToolSearchAliases } = useLang()
    const commonLabels = t.common
    const navigationLabel = requireTranslationValue(t.nav.navigation, "nav.navigation")
    const searchLabel = requireTranslationValue(t.nav.search, "nav.search")
    const noResultsLabel = requireTranslationValue(commonLabels.no_results, "common.no_results")
    const favoritesLabel = requireTranslationValue(commonLabels.favorites, "common.favorites")
    const recentToolsLabel = requireTranslationValue(commonLabels.recent_tools, "common.recent_tools")

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
                setOpen((prev) => !prev)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [enableShortcut, setOpen])

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
                const tool = getClientToolByKey(item.key)
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
                        tool?.family,
                        ...(tool?.tags ?? []),
                        ...(tool?.capabilities ?? []),
                    ]),
                )
            }
        }
        return values
    }, [englishToolSearchAliases, t.tools])

    const favoriteCommands = React.useMemo(() => {
        return favoriteToolKeys
            .map((toolKey) => {
                const tool = getClientToolByKey(toolKey)
                if (!tool) return null
                const title = requireTranslationValue(t.tools[tool.key]?.title, `tools.${tool.key}.title`)
                return {
                    toolKey: tool.key,
                    title,
                    href: `/${lang}/${tool.slug}`,
                    searchValue: toolSearchValues.get(tool.key) || title,
                }
            })
            .filter((item): item is ToolCommandItem => item !== null)
    }, [favoriteToolKeys, lang, t.tools, toolSearchValues])

    const recentCommands = React.useMemo(() => {
        const favoriteKeySet = new Set(favoriteCommands.map((item) => item.toolKey))
        return recentToolKeys
            .filter((toolKey) => !favoriteKeySet.has(toolKey))
            .map((toolKey) => {
                const tool = getClientToolByKey(toolKey)
                if (!tool) return null
                const title = requireTranslationValue(t.tools[tool.key]?.title, `tools.${tool.key}.title`)
                return {
                    toolKey: tool.key,
                    title,
                    href: `/${lang}/${tool.slug}`,
                    searchValue: toolSearchValues.get(tool.key) || title,
                }
            })
            .filter((item): item is ToolCommandItem => item !== null)
    }, [favoriteCommands, lang, recentToolKeys, t.tools, toolSearchValues])

    const [search, setSearch] = React.useState("")
    const systemCommands = useSystemCommands()
    const isCommandMode = search.startsWith(">")

    return (
        <CommandDialog
            open={open}
            onOpenChange={setOpen}
            title={navigationLabel}
            description={searchLabel}
        >
            <DialogTitle className="sr-only">{navigationLabel}</DialogTitle>
            <CommandInput 
                placeholder={searchLabel} 
                value={search}
                onValueChange={setSearch}
            />
            <CommandList>
                <CommandEmpty>{noResultsLabel}</CommandEmpty>

                {isCommandMode ? (
                    <CommandGroup heading="Actions">
                        {systemCommands.map((cmd) => {
                            const labelKey = cmd.labelKey.split(".")[1]
                            const label = requireTranslationValue((commonLabels as unknown as Record<string, string>)[labelKey], cmd.labelKey)
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
                                    <span className="ml-auto text-xs text-muted-foreground font-mono tracking-tighter opacity-70">[ACTION]</span>
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
                                            onSelect={() => runCommand(() => router.push(item.href))}
                                        >
                                            <Star className="mr-2 h-4 w-4" />
                                            <span>{item.title}</span>
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
                                            onSelect={() => runCommand(() => router.push(item.href))}
                                        >
                                            <History className="mr-2 h-4 w-4" />
                                            <span>{item.title}</span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                                <CommandSeparator />
                            </>
                        ) : null}

                        <CommandGroup heading={navigationLabel}>
                            <CommandItem onSelect={() => runCommand(() => router.push(`/${lang}`))}>
                                <Search className="mr-2 h-4 w-4" />
                                <span>{requireTranslationValue(t.nav.home, "nav.home")}</span>
                            </CommandItem>
                            {toolGroups.map((group) => (
                                <CommandItem
                                    key={group.hubSlug}
                                    onSelect={() => runCommand(() => router.push(`/${lang}/${group.hubSlug}`))}
                                >
                                    <Search className="mr-2 h-4 w-4" />
                                    <span>{requireTranslationValue(t.nav[group.navKey], `nav.${group.navKey}`)}</span>
                                </CommandItem>
                            ))}
                            {STATIC_PAGES.map((page) => (
                                <CommandItem
                                    key={page.slug}
                                    onSelect={() => runCommand(() => router.push(`/${lang}/${page.slug}`))}
                                >
                                    <Search className="mr-2 h-4 w-4" />
                                    <span>{requireTranslationValue(t.pages[page.key], `pages.${page.key}`)}</span>
                                </CommandItem>
                            ))}
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
                                                onSelect={() => runCommand(() => router.push(`/${lang}${tool.href}`))}
                                            >
                                                <Search className="mr-2 h-4 w-4" />
                                                <span>{title}</span>
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
