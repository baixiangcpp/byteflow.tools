"use client"

import dynamic from "next/dynamic"
import { Globe, Sun } from "lucide-react"
import { useDeferredMount } from "@/hooks/use-deferred-mount"

const LanguageSwitcher = dynamic(
    () => import("./language-switcher").then((mod) => mod.LanguageSwitcher),
    { ssr: false },
)

const ThemeToggle = dynamic(
    () => import("./theme-toggle").then((mod) => mod.ThemeToggle),
    { ssr: false },
)

export function DeferredNavbarControls() {
    const isMounted = useDeferredMount({ delayMs: 1200, activateOnInteraction: true })

    if (!isMounted) {
        return (
            <>
                <div
                    className="flex h-11 items-center gap-1 px-2.5 pointer-events-none"
                    aria-hidden="true"
                >
                    <Globe className="h-4 w-4 opacity-70" />
                    <span className="hidden 2xl:inline text-xs opacity-0">Language</span>
                </div>
                <div
                    className="flex h-11 w-11 items-center justify-center pointer-events-none"
                    aria-hidden="true"
                >
                    <Sun className="h-4 w-4 opacity-70" />
                </div>
            </>
        )
    }

    return (
        <>
            <LanguageSwitcher />
            <ThemeToggle />
        </>
    )
}
