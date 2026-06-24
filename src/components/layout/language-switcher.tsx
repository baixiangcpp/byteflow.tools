"use client"

import * as React from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Globe, ChevronDown } from "lucide-react"
import { LOCALES, LOCALE_NAMES, type Locale } from "@/core/i18n/i18n"
import { useLang } from "@/core/i18n/lang-provider"
import { buildHomepageHref } from "@/core/routing/homepage-route"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function LanguageSwitcher() {
    const { lang } = useLang()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const switchLang = (newLang: Locale) => {
        if (newLang === lang) return

        // Save user's language preference
        try {
            localStorage.setItem('byteflow:preferred-locale', newLang)
        } catch {
            // localStorage not available, ignore
        }

        const segments = pathname.split("/").filter(Boolean)
        const currentIsHome = pathname === "/" || (segments.length === 1 && LOCALES.includes(segments[0] as Locale))
        const targetPathname = currentIsHome
            ? buildHomepageHref(newLang)
            : `/${[newLang, ...segments.slice(1)].join("/")}`
        const queryString = searchParams.toString()
        const hash = typeof window !== "undefined" ? window.location.hash : ""
        const targetPath = `${targetPathname}${queryString ? `?${queryString}` : ""}${hash}`
        router.replace(targetPath)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-11 gap-1 px-2.5 border-0 !shadow-none hover:bg-muted"
                    aria-label={`Language: ${LOCALE_NAMES[lang]}`}
                    title={`Language: ${LOCALE_NAMES[lang]}`}
                >
                    <Globe className="h-4 w-4" />
                    <span className="hidden 2xl:inline text-xs">{LOCALE_NAMES[lang]}</span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {LOCALES.map((locale) => (
                    <DropdownMenuItem
                        key={locale}
                        onClick={() => switchLang(locale)}
                        className={lang === locale ? "bg-accent" : ""}
                    >
                        {LOCALE_NAMES[locale]}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
