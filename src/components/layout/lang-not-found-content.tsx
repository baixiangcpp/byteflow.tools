"use client"

import Link from "next/link"
import { AlertTriangle, Home, Layers, Search, Wrench } from "lucide-react"
import { useLang } from "@/core/i18n/lang-provider"
import { requireTranslationValue } from "@/core/i18n/i18n"
import { getAllToolsHref } from "@/core/routing/all-tools-route"
import { MENU_GROUP_DEFS } from "@/core/registry/menu-groups"

function getHubHref(lang: string, groupKey: (typeof MENU_GROUP_DEFS)[number]["key"]) {
    const group = MENU_GROUP_DEFS.find((item) => item.key === groupKey)
    return group ? `/${lang}/${group.slug}` : getAllToolsHref(lang)
}

export function LangNotFoundContent() {
    const { lang, t } = useLang()
    const title = requireTranslationValue(t.common.not_found_title, "common.not_found_title")
    const description = requireTranslationValue(t.common.not_found_description, "common.not_found_description")
    const homeLabel = requireTranslationValue(t.common.route_error_home, "common.route_error_home")
    const allToolsLabel = requireTranslationValue(t.common.all_tools, "common.all_tools")
    const popularLabel = requireTranslationValue(t.common.popular_tools, "common.popular_tools")
    const installLabel = requireTranslationValue(t.common.install_app_label, "common.install_app_label")
    const searchLabel = requireTranslationValue(t.nav.search, "nav.search")
    const dataCodeFormatsLabel = requireTranslationValue(t.nav.data_code_formats, "nav.data_code_formats")
    const webApiNetworkLabel = requireTranslationValue(t.nav.web_api_network, "nav.web_api_network")
    const securityLabel = requireTranslationValue(t.nav.encoding_crypto, "nav.encoding_crypto")
    const getToolTitle = (toolKey: string) =>
        requireTranslationValue(t.tools?.[toolKey]?.title, `tools.${toolKey}.title`)

    return (
        <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-2xl border border-border/60 bg-card/45 px-6 py-12 md:px-10">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-amber-400/35 bg-amber-400/10 text-amber-500">
                <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>

            <div className="flex flex-wrap gap-3">
                <Link
                    href={`/${lang}`}
                    className="inline-flex items-center gap-2 rounded-md border border-primary/50 bg-primary/10 px-4 py-2 text-sm font-medium hover:bg-primary/15"
                >
                    <Home className="h-4 w-4" />
                    {homeLabel}
                </Link>
                <Link
                    href={getAllToolsHref(lang)}
                    className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:border-primary/35"
                >
                    <Layers className="h-4 w-4" />
                    {allToolsLabel}
                </Link>
                <button
                    type="button"
                    data-command-palette-trigger
                    className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:border-primary/35"
                >
                    <Search className="h-4 w-4" />
                    {searchLabel}
                </button>
                <Link
                    href={`/${lang}/install-app`}
                    className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:border-primary/35"
                >
                    <Layers className="h-4 w-4" />
                    {installLabel}
                </Link>
            </div>

            <div className="space-y-3 rounded-xl border border-border/60 bg-background/35 p-4">
                <p className="text-sm font-medium text-foreground">{popularLabel}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                    <Link href={`/${lang}/json-formatter`} className="inline-flex items-center gap-2 rounded-md border border-border/60 px-3 py-2 text-sm hover:border-primary/35">
                        <Wrench className="h-4 w-4 text-primary" />
                        {getToolTitle("json_formatter")}
                    </Link>
                    <Link href={`/${lang}/base64-encode-decode`} className="inline-flex items-center gap-2 rounded-md border border-border/60 px-3 py-2 text-sm hover:border-primary/35">
                        <Wrench className="h-4 w-4 text-primary" />
                        {getToolTitle("base64_encode_decode")}
                    </Link>
                    <Link href={`/${lang}/url-encode-decode`} className="inline-flex items-center gap-2 rounded-md border border-border/60 px-3 py-2 text-sm hover:border-primary/35">
                        <Wrench className="h-4 w-4 text-primary" />
                        {getToolTitle("url_encode_decode")}
                    </Link>
                    <Link href={`/${lang}/javascript-formatter`} className="inline-flex items-center gap-2 rounded-md border border-border/60 px-3 py-2 text-sm hover:border-primary/35">
                        <Wrench className="h-4 w-4 text-primary" />
                        {getToolTitle("javascript_formatter")}
                    </Link>
                </div>
            </div>

            <div className="space-y-3 rounded-xl border border-border/60 bg-background/35 p-4">
                <p className="text-sm font-medium text-foreground">{allToolsLabel}</p>
                <div className="grid gap-2 sm:grid-cols-3">
                    <Link href={getHubHref(lang, "data_code_formats")} className="rounded-md border border-border/60 px-3 py-2 text-sm hover:border-primary/35">
                        {dataCodeFormatsLabel}
                    </Link>
                    <Link href={getHubHref(lang, "encoding_crypto")} className="rounded-md border border-border/60 px-3 py-2 text-sm hover:border-primary/35">
                        {securityLabel}
                    </Link>
                    <Link href={getHubHref(lang, "web_api_network")} className="rounded-md border border-border/60 px-3 py-2 text-sm hover:border-primary/35">
                        {webApiNetworkLabel}
                    </Link>
                </div>
            </div>
        </section>
    )
}
