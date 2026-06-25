"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Check, Languages, Moon, Search, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { LOCALES, LOCALE_NAMES, type Locale } from "@/core/i18n/i18n"
import { useLang } from "@/core/i18n/lang-provider"
import { buildHomepageHref } from "@/core/routing/homepage-route"
import { cn } from "@/core/utils/utils"
import { type ThemePreference, useThemePreference } from "@/hooks/use-theme-preference"

type PageLink = {
    slug: "about" | "contact"
    key: "about_title" | "contact_title"
}

const CATEGORY_LINKS = [
    { slug: "data-code-formats", key: "data_code_formats" },
    { slug: "encoding-crypto", key: "encoding_crypto" },
    { slug: "web-api-network", key: "web_api_network" },
    { slug: "devops-logs", key: "devops_logs" },
    { slug: "text-regex", key: "text_regex" },
    { slug: "images-svg-css", key: "images_svg_css" },
    { slug: "generators-calculators", key: "generators_calculators" },
    { slug: "social-metadata", key: "social_metadata" },
] as const

const PAGE_LINKS: PageLink[] = [
    { slug: "about", key: "about_title" },
    { slug: "contact", key: "contact_title" },
]

const THEME_OPTIONS: Array<{ value: ThemePreference; labelKey: "theme_light" | "theme_dark" | "theme_system" }> = [
    { value: "light", labelKey: "theme_light" },
    { value: "dark", labelKey: "theme_dark" },
    { value: "system", labelKey: "theme_system" },
]

export function NavbarMobileMenu({
    open,
    onOpenChange,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const pathname = usePathname()
    const router = useRouter()
    const searchParams = useSearchParams()
    const { lang, t } = useLang()
    const { theme, setTheme } = useThemePreference()

    const getCategoryHref = React.useCallback((slug: string) => `/${lang}/${slug}`, [lang])
    const switchLang = React.useCallback((newLang: Locale) => {
        if (newLang === lang) return

        try {
            localStorage.setItem("byteflow:preferred-locale", newLang)
        } catch {
            // Safe preference only; ignore unavailable storage.
        }

        const segments = pathname.split("/").filter(Boolean)
        const currentIsHome = pathname === "/" || (segments.length === 1 && LOCALES.includes(segments[0] as Locale))
        const targetPathname = currentIsHome
            ? buildHomepageHref(newLang)
            : `/${[newLang, ...segments.slice(1)].join("/")}`
        const queryString = searchParams.toString()
        const hash = typeof window !== "undefined" ? window.location.hash : ""

        onOpenChange(false)
        router.replace(`${targetPathname}${queryString ? `?${queryString}` : ""}${hash}`)
    }, [lang, onOpenChange, pathname, router, searchParams])

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="top"
                className="overscroll-y-contain border-border/70 bg-popover/95 px-2 pb-6 pt-11 backdrop-blur-xl"
                showCloseButton
            >
                <SheetTitle className="sr-only">{t.nav.navigation}</SheetTitle>
                <div className="grid grid-cols-2 gap-2 px-1">
                    <SheetClose asChild>
                        <Link
                            href={`/${lang}/pipeline-builder`}
                            prefetch={false}
                            aria-current={pathname === `/${lang}/pipeline-builder` ? "page" : undefined}
                            className={cn(
                                "col-span-2 rounded-lg border px-3 py-2 text-sm font-medium",
                                pathname === `/${lang}/pipeline-builder`
                                    ? "border-primary/35 bg-primary/12 text-primary"
                                    : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
                            )}
                        >
                            {(t.tools["pipeline_builder"] as { title?: string } | undefined)?.title ?? "Pipeline Builder"}
                        </Link>
                    </SheetClose>
                    {CATEGORY_LINKS.map((cat) => {
                        const href = getCategoryHref(cat.slug)
                        return (
                            <SheetClose asChild key={cat.slug}>
                                <Link
                                    href={href}
                                    prefetch={false}
                                    aria-current={pathname === href ? "page" : undefined}
                                    className={cn(
                                        "rounded-lg border px-3 py-2 text-sm",
                                        pathname === href
                                            ? "border-primary/35 bg-primary/12 text-primary"
                                            : "border-border/70 text-foreground/90 hover:bg-muted"
                                    )}
                                >
                                    {t.nav[cat.key]}
                                </Link>
                            </SheetClose>
                        )
                    })}
                    {PAGE_LINKS.map((page) => {
                        const href = `/${lang}/${page.slug}`
                        return (
                            <SheetClose asChild key={page.slug}>
                                <Link
                                    href={href}
                                    prefetch={false}
                                    aria-current={pathname === href ? "page" : undefined}
                                    className={cn(
                                        "rounded-lg border px-3 py-2 text-sm",
                                        pathname === href
                                            ? "border-primary/35 bg-primary/12 text-primary"
                                            : "border-border/70 text-foreground/90 hover:bg-muted"
                                    )}
                                >
                                    {t.pages[page.key]}
                                </Link>
                            </SheetClose>
                        )
                    })}
                </div>
                <div className="mt-3 px-1">
                    <SheetClose asChild>
                        <Button
                            variant="outline"
                            className="w-full justify-start rounded-lg border-border/70 bg-background/80 text-sm text-muted-foreground hover:text-foreground"
                            data-command-palette-trigger
                        >
                            <Search className="mr-2 h-4 w-4" />
                            {t.common.all_tools} · {t.nav.search}
                        </Button>
                    </SheetClose>
                </div>
                <section className="mt-4 space-y-3 border-t border-border/70 px-1 pt-4" aria-labelledby="mobile-language-title">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        <Languages className="h-4 w-4 text-primary" aria-hidden="true" />
                        <h2 id="mobile-language-title">{t.nav.language}</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {LOCALES.map((locale) => {
                            const selected = locale === lang
                            return (
                                <button
                                    key={locale}
                                    type="button"
                                    aria-current={selected ? "true" : undefined}
                                    className={cn(
                                        "inline-flex min-h-11 items-center justify-between rounded-lg border px-3 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45",
                                        selected
                                            ? "border-primary/35 bg-primary/12 text-primary"
                                            : "border-border/70 text-foreground/90 hover:bg-muted",
                                    )}
                                    onClick={() => switchLang(locale)}
                                >
                                    <span>{LOCALE_NAMES[locale]}</span>
                                    {selected ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                                </button>
                            )
                        })}
                    </div>
                </section>
                <section className="mt-4 space-y-3 border-t border-border/70 px-1 pt-4" aria-labelledby="mobile-theme-title">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        {theme === "light" ? (
                            <Sun className="h-4 w-4 text-primary" aria-hidden="true" />
                        ) : (
                            <Moon className="h-4 w-4 text-primary" aria-hidden="true" />
                        )}
                        <h2 id="mobile-theme-title">{t.common.theme}</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t.common.theme_toggle}>
                        {THEME_OPTIONS.map((option) => {
                            const selected = theme === option.value
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    role="radio"
                                    aria-checked={selected}
                                    className={cn(
                                        "inline-flex min-h-11 items-center justify-center rounded-lg border px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45",
                                        selected
                                            ? "border-primary/35 bg-primary/12 text-primary"
                                            : "border-border/70 text-foreground/90 hover:bg-muted",
                                    )}
                                    onClick={() => setTheme(option.value)}
                                >
                                    {t.common[option.labelKey]}
                                </button>
                            )
                        })}
                    </div>
                </section>
            </SheetContent>
        </Sheet>
    )
}
