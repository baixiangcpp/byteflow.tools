"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { ChevronDown, Globe, Moon, Sun } from "lucide-react"
import { useDeferredMount } from "@/hooks/use-deferred-mount"

const LanguageSwitcher = dynamic(
    () => import("./language-switcher").then((mod) => mod.LanguageSwitcher),
    { ssr: false },
)

const ThemeToggle = dynamic(
    () => import("./theme-toggle").then((mod) => mod.ThemeToggle),
    { ssr: false },
)

function LanguageControlPlaceholder({ languageLabel }: { languageLabel: string }) {
    return (
        <div className="flex h-11 items-center gap-1 px-2.5 pointer-events-none" aria-hidden="true">
            <Globe className="h-4 w-4 opacity-70" />
            <span className="hidden 2xl:inline text-xs opacity-70">{languageLabel}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
        </div>
    )
}

function ThemeControlPlaceholder() {
    return (
        <div className="flex h-11 w-11 items-center justify-center pointer-events-none" aria-hidden="true">
            <Sun className="h-4 w-4 opacity-70 dark:hidden" />
            <Moon className="hidden h-4 w-4 opacity-70 dark:block" />
        </div>
    )
}

export function DeferredNavbarControls({ languageLabel }: { languageLabel: string }) {
    const isMounted = useDeferredMount({ delayMs: 1200, activateOnInteraction: true })
    const [languageReady, setLanguageReady] = React.useState(false)
    const [themeReady, setThemeReady] = React.useState(false)
    const handleLanguageReady = React.useCallback(() => setLanguageReady(true), [])
    const handleThemeReady = React.useCallback(() => setThemeReady(true), [])

    return (
        <>
            <div className="relative h-11 shrink-0" data-navbar-language-footprint>
                <div className="invisible">
                    <LanguageControlPlaceholder languageLabel={languageLabel} />
                </div>
                {!languageReady ? (
                    <div className="absolute inset-0">
                        <LanguageControlPlaceholder languageLabel={languageLabel} />
                    </div>
                ) : null}
                {isMounted ? (
                    <div className="absolute inset-0">
                        <LanguageSwitcher onReady={handleLanguageReady} />
                    </div>
                ) : null}
            </div>
            <div className="relative h-11 w-11 shrink-0" data-navbar-theme-footprint>
                {!themeReady ? (
                    <div className="absolute inset-0">
                        <ThemeControlPlaceholder />
                    </div>
                ) : null}
                {isMounted ? (
                    <div className="absolute inset-0">
                        <ThemeToggle onReady={handleThemeReady} />
                    </div>
                ) : null}
            </div>
        </>
    )
}
