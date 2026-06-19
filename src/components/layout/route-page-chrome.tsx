"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { INLINE_RELATED_TOOLS_TOOL_SLUGS } from "./inline-related-tools-tool-slugs"
import { Button } from "@/components/ui/button"
import { useLang } from "@/core/i18n/lang-provider"
import { requireTranslationValue } from "@/core/i18n/i18n"
import { getRouteIntentCopy } from "@/core/seo/route-intent-copy"
import { getRouteContext } from "@/core/routing/route-context"
import { recordRecentToolKey } from "@/core/storage/tool-discovery-state"
import { getClientToolBySlug } from "@/generated/client-tool-lookup"
import { ExternalNetworkNotice } from "@/features/tool-shell/external-network-notice"

const EXCLUDED_CONTENT_INTRO_SLUGS = new Set(["about", "pricing", "contact", "privacy", "terms", "install-app"])

type RoutePageChromeProps = {
    children: React.ReactNode
    pathname: string
}

function RoutePageChromeContent({ children, pathname }: RoutePageChromeProps) {
    const { lang, t } = useLang()
    const routeContext = useMemo(() => getRouteContext(pathname), [pathname])

    const activeTool = useMemo(() => {
        if (routeContext.routeType !== "tool" || !routeContext.slug) return null
        const tool = getClientToolBySlug(routeContext.slug)
        if (!tool) return null
        return {
            key: tool.key,
            slug: tool.slug,
            networkAccess: tool.networkAccess,
            networkHosts: tool.networkHosts,
            networkPurposeKey: tool.networkPurposeKey,
            requiresExplicitUserAction: tool.requiresExplicitUserAction,
            externalDataSent: tool.externalDataSent,
        }
    }, [routeContext])

    useEffect(() => {
        if (!activeTool?.key) return
        recordRecentToolKey(activeTool.key)
    }, [activeTool?.key])

    const routeIntentCopy = useMemo(() => {
        if (routeContext.routeType !== "tool" && routeContext.routeType !== "hub" && routeContext.routeType !== "content") {
            return null
        }

        if (routeContext.routeType === "content" && EXCLUDED_CONTENT_INTRO_SLUGS.has(routeContext.slug || "")) {
            return null
        }

        return getRouteIntentCopy(routeContext.locale ?? lang, routeContext.routeType)
    }, [lang, routeContext])

    const routeLocale = routeContext.locale ?? lang
    const shouldRenderFallbackRelatedTools = Boolean(activeTool?.key) && !INLINE_RELATED_TOOLS_TOOL_SLUGS.has(activeTool?.slug ?? "")
    const installInlineCopy = {
        title: requireTranslationValue(t.common.install_inline_title, "common.install_inline_title"),
        description: requireTranslationValue(t.common.install_inline_description, "common.install_inline_description"),
        action: requireTranslationValue(t.common.install_guide, "common.install_guide"),
    }

    return (
        <>
            {routeIntentCopy ? (
                <div className="mb-4 rounded-xl border border-primary/25 bg-primary/8 px-4 py-2.5 text-sm text-muted-foreground">
                    {routeIntentCopy}
                </div>
            ) : null}
            {activeTool?.networkAccess && activeTool.networkAccess !== "none" ? (
                <ExternalNetworkNotice
                    networkAccess={activeTool.networkAccess}
                    networkHosts={activeTool.networkHosts}
                    networkPurposeKey={activeTool.networkPurposeKey}
                    requiresExplicitUserAction={activeTool.requiresExplicitUserAction}
                    externalDataSent={activeTool.externalDataSent}
                />
            ) : null}
            {children}
            {routeContext.routeType === "tool" ? (
                <section className="mt-8 rounded-xl border border-primary/30 bg-primary/8 px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{installInlineCopy.title}</p>
                    <div className="mt-1 flex flex-col gap-2">
                        <p className="text-sm text-muted-foreground">{installInlineCopy.description}</p>
                        <Button asChild size="sm" variant="outline">
                            <Link href={`/${routeLocale}/install-app`}>{installInlineCopy.action}</Link>
                        </Button>
                    </div>
                </section>
            ) : null}
            {shouldRenderFallbackRelatedTools && activeTool?.key ? (
                <RelatedTools toolKey={activeTool.key} source="fallback" />
            ) : null}
        </>
    )
}

export function RoutePageChrome({ children, pathname }: RoutePageChromeProps) {
    return <RoutePageChromeContent pathname={pathname}>{children}</RoutePageChromeContent>
}
