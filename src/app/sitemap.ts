import type { MetadataRoute } from "next"
import { LOCALES } from "@/core/i18n/i18n"
import { TOOL_REGISTRY } from "@/core/registry"
import { LEGACY_TAXONOMY_SLUGS } from "@/core/routing/seo-route-policy"
import { SITE_URL, buildCanonicalUrl, buildLocalizedAlternates } from "@/core/seo/urls"
import routeGroups from "@/lib/sitemap-route-groups.json"
import sitemapLastmod from "@/lib/sitemap-lastmod.json"

export const dynamic = "force-static"

const LEGACY_TAXONOMY_SLUG_SET = new Set<string>(LEGACY_TAXONOMY_SLUGS)
const HUB_SLUGS = Array.from(new Set(routeGroups.hubSlugs)).filter((slug) => !LEGACY_TAXONOMY_SLUG_SET.has(slug))
const STATIC_SLUGS = routeGroups.staticSlugs
const NOINDEX_STATIC_SLUGS = new Set(["about", "pricing", "terms"])
const SITEMAP_STATIC_SLUGS = STATIC_SLUGS.filter((slug) => !NOINDEX_STATIC_SLUGS.has(slug))

type Locale = (typeof LOCALES)[number]
type LocaleLastmodMap = Partial<Record<Locale, string>>
type RouteLastmodMap = Record<string, LocaleLastmodMap>
type LastmodManifest = {
    home?: LocaleLastmodMap
    hubs?: RouteLastmodMap
    static?: RouteLastmodMap
    tools?: RouteLastmodMap
}

const LASTMOD_MANIFEST = sitemapLastmod as LastmodManifest

function parseIsoDate(value: string | undefined): Date | undefined {
    if (!value) return undefined
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return undefined
    return parsed
}

function getHomeLastmod(locale: Locale, fallback: Date): Date {
    return (
        parseIsoDate(process.env.SITEMAP_LASTMOD_HOME)
        ?? parseIsoDate(LASTMOD_MANIFEST.home?.[locale])
        ?? fallback
    )
}

function getHubLastmod(locale: Locale, hub: string, homeFallback: Date): Date {
    return (
        parseIsoDate(process.env.SITEMAP_LASTMOD_HUB)
        ?? parseIsoDate(LASTMOD_MANIFEST.hubs?.[hub]?.[locale])
        ?? homeFallback
    )
}

function getStaticLastmod(locale: Locale, slug: string, homeFallback: Date): Date {
    return (
        parseIsoDate(process.env.SITEMAP_LASTMOD_STATIC)
        ?? parseIsoDate(LASTMOD_MANIFEST.static?.[slug]?.[locale])
        ?? homeFallback
    )
}

function getToolLastmod(locale: Locale, slug: string, homeFallback: Date): Date {
    return (
        parseIsoDate(process.env.SITEMAP_LASTMOD_TOOL)
        ?? parseIsoDate(LASTMOD_MANIFEST.tools?.[slug]?.[locale])
        ?? homeFallback
    )
}

function buildCoreEntries(): MetadataRoute.Sitemap {
    const entries: MetadataRoute.Sitemap = []
    const manifestFallback = parseIsoDate(LASTMOD_MANIFEST.home?.en) ?? new Date("2026-02-25T00:00:00.000Z")
    const rootLastmod = getHomeLastmod("en", manifestFallback)

    entries.push({
        url: `${SITE_URL}/`,
        lastModified: rootLastmod,
        changeFrequency: "weekly",
        priority: 1,
        alternates: {
            languages: buildLocalizedAlternates(),
        },
    })

    for (const locale of LOCALES) {
        const homeLastmod = getHomeLastmod(locale, manifestFallback)
        entries.push({
            url: buildCanonicalUrl(locale),
            lastModified: homeLastmod,
            changeFrequency: "weekly",
            priority: 1,
            alternates: {
                languages: buildLocalizedAlternates(),
            },
        })

        for (const hub of HUB_SLUGS) {
            entries.push({
                url: buildCanonicalUrl(locale, hub),
                lastModified: getHubLastmod(locale, hub, homeLastmod),
                changeFrequency: "weekly",
                priority: 0.9,
                alternates: {
                    languages: buildLocalizedAlternates({ slug: hub }),
                },
            })
        }

        for (const slug of SITEMAP_STATIC_SLUGS) {
            entries.push({
                url: buildCanonicalUrl(locale, slug),
                lastModified: getStaticLastmod(locale, slug, homeLastmod),
                changeFrequency: "monthly",
                priority: 0.6,
                alternates: {
                    languages: buildLocalizedAlternates({ slug }),
                },
            })
        }
    }

    return entries
}

function buildToolEntries(locale: Locale): MetadataRoute.Sitemap {
    const manifestFallback = parseIsoDate(LASTMOD_MANIFEST.home?.en) ?? new Date("2026-02-25T00:00:00.000Z")
    const homeLastmod = getHomeLastmod(locale, manifestFallback)

    return TOOL_REGISTRY.map((tool) => {
        const lastModified = parseIsoDate(tool.updatedAt) ?? getToolLastmod(locale, tool.slug, homeLastmod)
        return {
            url: buildCanonicalUrl(locale, tool.slug),
            lastModified,
            changeFrequency: "monthly",
            priority: 0.8,
            alternates: {
                languages: buildLocalizedAlternates({ slug: tool.slug }),
            },
        }
    })
}

export default function sitemap(): MetadataRoute.Sitemap {
    return [...buildCoreEntries(), ...LOCALES.flatMap((locale) => buildToolEntries(locale))]
}
