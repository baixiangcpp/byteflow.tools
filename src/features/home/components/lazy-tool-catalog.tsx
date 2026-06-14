"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowUpRight, History, Heart, Star } from "lucide-react"
import {
  readFavoriteToolKeys,
  readRecentToolKeys,
  toggleFavoriteToolKey,
  TOOL_DISCOVERY_UPDATED_EVENT,
} from "@/core/storage/tool-discovery-state"

type ToolCard = {
  key: string
  slug: string
  title: string
  description: string
}

type ToolGroup = {
  key: string
  title: string
  description: string
  href: string
  toolCount: number
  tools: ToolCard[]
}

type LazyToolCatalogProps = {
  sectionTitle: string
  sectionDescription: string
  openLabel: string
  favoritesLabel: string
  recentToolsLabel: string
  noFavoritesLabel: string
  noRecentToolsLabel: string
  addFavoriteLabel: string
  removeFavoriteLabel: string
  groups: ToolGroup[]
}

const GROUP_LOGO_CLASS: Record<string, string> = {
  format_validate: "border-cyan-500/35 bg-cyan-500/15 text-cyan-300",
  convert_encode: "border-blue-500/35 bg-blue-500/15 text-blue-300",
  text_content: "border-emerald-500/35 bg-emerald-500/15 text-emerald-300",
  web_api: "border-indigo-500/35 bg-indigo-500/15 text-indigo-300",
  generators_ids: "border-amber-500/35 bg-amber-500/15 text-amber-300",
  design_media: "border-pink-500/35 bg-pink-500/15 text-pink-300",
}

function getToolLogoToken(toolKey: string): string {
  if (toolKey.includes("json")) return "{}"
  if (toolKey.includes("xml")) return "<>"
  if (toolKey.includes("html")) return "</>"
  if (toolKey.includes("css")) return "CSS"
  if (toolKey.includes("yaml")) return "YML"
  if (toolKey.includes("markdown")) return "MD"
  if (toolKey.includes("jwt")) return "JWT"
  if (toolKey.includes("uuid")) return "ID"
  if (toolKey.includes("regex")) return ".*"
  if (toolKey.includes("url")) return "URL"
  if (toolKey.includes("base64")) return "64"
  if (toolKey.includes("qr")) return "QR"
  if (toolKey.includes("csv")) return "CSV"
  if (toolKey.includes("svg")) return "SVG"
  if (toolKey.includes("image")) return "IMG"
  if (toolKey.includes("color")) return "COL"
  if (toolKey.includes("timestamp")) return "TS"
  if (toolKey.includes("password")) return "PWD"
  if (toolKey.includes("hash")) return "#"
  return toolKey.slice(0, 2).toUpperCase()
}

export function LazyToolCatalog({
  sectionTitle,
  sectionDescription,
  openLabel,
  favoritesLabel,
  recentToolsLabel,
  noFavoritesLabel,
  noRecentToolsLabel,
  addFavoriteLabel,
  removeFavoriteLabel,
  groups,
}: LazyToolCatalogProps) {
  const [visibleGroupCount, setVisibleGroupCount] = React.useState(Math.min(1, groups.length))
  const [favoriteToolKeys, setFavoriteToolKeys] = React.useState<string[]>([])
  const [recentToolKeys, setRecentToolKeys] = React.useState<string[]>([])
  const sentinelRef = React.useRef<HTMLDivElement | null>(null)

  const syncPersonalizedState = React.useCallback(() => {
    setFavoriteToolKeys(readFavoriteToolKeys())
    setRecentToolKeys(readRecentToolKeys())
  }, [])

  React.useEffect(() => {
    syncPersonalizedState()
    window.addEventListener(TOOL_DISCOVERY_UPDATED_EVENT, syncPersonalizedState)
    return () => window.removeEventListener(TOOL_DISCOVERY_UPDATED_EVENT, syncPersonalizedState)
  }, [syncPersonalizedState])

  React.useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    if (visibleGroupCount >= groups.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        setVisibleGroupCount((current) => Math.min(current + 1, groups.length))
      },
      { rootMargin: "320px 0px 320px 0px" }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [visibleGroupCount, groups.length])

  const visibleGroups = groups.slice(0, visibleGroupCount)
  const nextGroup = groups[visibleGroupCount]
  const toolByKey = React.useMemo(() => {
    const map = new Map<string, ToolCard>()
    for (const group of groups) {
      for (const tool of group.tools) {
        map.set(tool.key, tool)
      }
    }
    return map
  }, [groups])
  const favoriteTools = React.useMemo(
    () => favoriteToolKeys.map((key) => toolByKey.get(key)).filter((item): item is ToolCard => Boolean(item)),
    [favoriteToolKeys, toolByKey],
  )
  const recentTools = React.useMemo(
    () => recentToolKeys.map((key) => toolByKey.get(key)).filter((item): item is ToolCard => Boolean(item)).slice(0, 8),
    [recentToolKeys, toolByKey],
  )

  const handleToggleFavorite = React.useCallback((toolKey: string) => {
    const next = toggleFavoriteToolKey(toolKey)
    setFavoriteToolKeys(next)
  }, [])

  return (
    <section
      className="home-reveal relative overflow-hidden rounded-3xl border border-border/75 bg-card/60 p-4 shadow-xl shadow-black/10 backdrop-blur-sm dark:shadow-black/35 sm:p-6"
      style={{ animationDelay: "168ms" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_0%,hsl(226_88%_62%/0.1),transparent_44%)]" />
      <div className="relative mb-4 sm:mb-5">
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{sectionTitle}</h2>
        <p className="text-sm text-muted-foreground">{sectionDescription}</p>
      </div>

      <div className="relative mb-4 grid gap-3 sm:mb-5 lg:grid-cols-2">
        <article className="rounded-xl border border-border/70 bg-background/55 p-3.5">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <Star className="h-4 w-4 text-primary" />
            {favoritesLabel}
          </div>
          {favoriteTools.length > 0 ? (
            <ul className="space-y-1.5">
              {favoriteTools.map((tool) => {
                const isFavorite = favoriteToolKeys.includes(tool.key)
                return (
                  <li key={`favorite-row-${tool.key}`} className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/40 px-2 py-1.5">
                    <Link href={tool.slug} className="min-w-0 flex-1 truncate text-sm text-foreground hover:text-primary">
                      {tool.title}
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(tool.key)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent/50 hover:text-primary"
                      aria-label={isFavorite ? removeFavoriteLabel : addFavoriteLabel}
                    >
                      <Heart className={`h-4 w-4 ${isFavorite ? "fill-primary text-primary" : ""}`} />
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">{noFavoritesLabel}</p>
          )}
        </article>

        <article className="rounded-xl border border-border/70 bg-background/55 p-3.5">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <History className="h-4 w-4 text-primary" />
            {recentToolsLabel}
          </div>
          {recentTools.length > 0 ? (
            <ul className="space-y-1.5">
              {recentTools.map((tool) => {
                const isFavorite = favoriteToolKeys.includes(tool.key)
                return (
                  <li key={`recent-row-${tool.key}`} className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/40 px-2 py-1.5">
                    <Link href={tool.slug} className="min-w-0 flex-1 truncate text-sm text-foreground hover:text-primary">
                      {tool.title}
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(tool.key)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent/50 hover:text-primary"
                      aria-label={isFavorite ? removeFavoriteLabel : addFavoriteLabel}
                    >
                      <Heart className={`h-4 w-4 ${isFavorite ? "fill-primary text-primary" : ""}`} />
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">{noRecentToolsLabel}</p>
          )}
        </article>
      </div>

      <div className="relative space-y-4 sm:space-y-5">
        {visibleGroups.map((group) => (
          <article
            key={group.key}
            className="overflow-hidden rounded-2xl border border-border/70 bg-background/55 p-5 backdrop-blur-sm sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold tracking-tight text-foreground">{group.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{group.description}</p>
              </div>
              <Link
                href={group.href}
                className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full border border-border/75 bg-card/60 px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
              >
                {openLabel}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {group.tools.map((tool) => {
                const isFavorite = favoriteToolKeys.includes(tool.key)

                return (
                  <Link
                    key={tool.key}
                    href={tool.slug}
                    className="group relative flex min-h-[238px] flex-col overflow-hidden rounded-xl border border-border/70 bg-card/45 p-6 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-xl hover:shadow-black/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 dark:hover:shadow-black/35"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(155deg,hsl(206_92%_58%/0.08),transparent_60%)] opacity-90" />
                    <div className="relative flex items-start justify-between gap-3">
                      <span
                        className={`inline-flex h-12 min-w-12 items-center justify-center rounded-xl border px-2 text-[11px] font-semibold tracking-wide ${GROUP_LOGO_CLASS[group.key] || "border-primary/35 bg-primary/15 text-primary"}`}
                      >
                        {getToolLogoToken(tool.key)}
                      </span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-primary/80 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </div>
                    <h4 className="relative mt-5 line-clamp-2 text-[1.35rem] font-semibold tracking-tight text-foreground">{tool.title}</h4>
                    <p className="relative mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{tool.description}</p>
                    <div className="relative mt-auto flex items-center justify-between pt-5">
                      <span className="text-sm font-medium text-primary/90">{openLabel}</span>
                      <Heart className={`h-4 w-4 transition-colors duration-200 group-hover:text-primary/70 ${isFavorite ? "fill-primary text-primary" : "text-muted-foreground/55"}`} />
                    </div>
                  </Link>
                )
              })}
            </div>
          </article>
        ))}
      </div>

      {visibleGroupCount < groups.length ? (
        <div ref={sentinelRef} className="relative mt-4 flex items-center justify-center">
          <button
            type="button"
            onClick={() => setVisibleGroupCount((current) => Math.min(current + 1, groups.length))}
            className="inline-flex min-h-10 items-center rounded-lg border border-border/75 bg-background/55 px-4 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
          >
            {openLabel} {nextGroup?.title}
          </button>
        </div>
      ) : null}
    </section>
  )
}
