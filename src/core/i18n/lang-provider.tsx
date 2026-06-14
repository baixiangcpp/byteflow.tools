"use client"

import * as React from "react"
import type { Locale } from "@/core/i18n/i18n"
import type { ToolSearchAliases, TranslationSchema } from "@/core/i18n/translations/catalog"

export type TranslationType = Omit<TranslationSchema, "tools" | "common" | "nav" | "categories" | "pages"> & {
    tools: Record<string, { title: string; description: string; [key: string]: string }>;
    common: TranslationSchema["common"];
    nav: Record<string, string>;
    categories: Record<string, string>;
    pages: Record<string, string>;
}

interface LangContextValue {
    lang: Locale
    t: TranslationType
    englishToolSearchAliases?: ToolSearchAliases
}

const LangContext = React.createContext<LangContextValue | null>(null)

export function LangProvider({
    children,
    lang,
    translations,
    englishToolSearchAliases,
}: {
    children: React.ReactNode
    lang: Locale
    translations: TranslationSchema
    englishToolSearchAliases?: ToolSearchAliases
}) {
    React.useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.lang = lang
            const manifestLink = document.getElementById("app-manifest")
            if (manifestLink instanceof HTMLLinkElement) {
                manifestLink.href = lang === "en" ? "/manifest.json" : `/manifest.${lang}.json`
            }
        }
    }, [lang])

    const t = translations as TranslationType
    const value = React.useMemo(
        () => ({ lang, t, englishToolSearchAliases }),
        [englishToolSearchAliases, lang, t],
    )

    return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang() {
    const context = React.useContext(LangContext)
    if (!context) {
        throw new Error("[i18n] useLang must be used within LangProvider")
    }

    return context
}
