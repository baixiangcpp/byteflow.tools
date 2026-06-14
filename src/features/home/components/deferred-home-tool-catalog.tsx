"use client"

import dynamic from "next/dynamic"
import * as React from "react"

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

type DeferredHomeToolCatalogProps = {
    sectionTitle: string
    sectionDescription: string
    openLabel: string
    toolsLabel: string
    favoritesLabel: string
    recentToolsLabel: string
    noFavoritesLabel: string
    noRecentToolsLabel: string
    addFavoriteLabel: string
    removeFavoriteLabel: string
    groups: ToolGroup[]
}

const LazyToolCatalog = dynamic(
    () => import("./lazy-tool-catalog").then((mod) => mod.LazyToolCatalog),
    { ssr: false },
)

export function DeferredHomeToolCatalog(props: DeferredHomeToolCatalogProps) {
    const [isVisible, setIsVisible] = React.useState(false)
    const sentinelRef = React.useRef<HTMLDivElement | null>(null)

    React.useEffect(() => {
        if (isVisible) return

        const sentinel = sentinelRef.current
        if (!sentinel) return

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                if (!entry?.isIntersecting) return
                setIsVisible(true)
                observer.disconnect()
            },
            { rootMargin: "320px 0px 320px 0px" },
        )

        observer.observe(sentinel)
        return () => observer.disconnect()
    }, [isVisible])

    if (isVisible) {
        return <LazyToolCatalog {...props} />
    }

    return (
        <section
            ref={sentinelRef}
            className="home-reveal relative overflow-hidden rounded-3xl border border-border/75 bg-card/60 p-4 shadow-xl shadow-black/10 backdrop-blur-sm dark:shadow-black/35 sm:p-6"
            style={{ animationDelay: "168ms" }}
        >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_0%,hsl(226_88%_62%/0.1),transparent_44%)]" />
            <div className="relative">
                <div className="mb-4 sm:mb-5">
                    <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{props.sectionTitle}</h2>
                    <p className="text-sm text-muted-foreground">{props.sectionDescription}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-28 animate-pulse rounded-2xl border border-border/70 bg-background/45"
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}
