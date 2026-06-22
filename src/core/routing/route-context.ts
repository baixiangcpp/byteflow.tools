import { LOCALES } from "@/core/i18n/i18n"
import { isRouteSourceToolSlug } from "@/core/registry/tool-source"
import { ROUTE_MENU_GROUP_HUB_SLUGS, getRouteToolBySlug } from "@/generated/route-tool-lookup"

export type RouteType = "home" | "tool" | "hub" | "content" | "other"

const CATEGORY_HUB_SLUGS = ["formatters", "text-tools", "generators", "network-tools"] as const
const LEGACY_MENU_GROUP_HUB_SLUGS = [
    "format-validate",
    "convert-encode",
    "text-content",
    "web-api",
    "generators-ids",
    "design-media",
] as const
const HUB_SLUGS = new Set([
    ...CATEGORY_HUB_SLUGS,
    ...ROUTE_MENU_GROUP_HUB_SLUGS,
    ...LEGACY_MENU_GROUP_HUB_SLUGS,
])
const CONTENT_ROUTE_SLUGS = new Set(["about", "pricing", "contact", "privacy", "trust-center", "terms"])

export function getRouteContext(pathname: string): {
    locale: string | null
    routeType: RouteType
    slug: string | null
} {
    const segments = pathname.split("/").filter(Boolean)

    if (segments.length === 0) {
        return { locale: null, routeType: "home", slug: null }
    }

    const localeSegment = segments[0]
    if (!LOCALES.includes(localeSegment as (typeof LOCALES)[number])) {
        return { locale: null, routeType: "other", slug: segments[0] || null }
    }

    if (segments.length === 1) {
        return { locale: localeSegment, routeType: "home", slug: null }
    }

    const slug = segments[1]
    const routeSlug = segments.slice(1).join("/")

    if (slug === "workflows") {
        return { locale: localeSegment, routeType: "hub", slug: routeSlug }
    }

    if (getRouteToolBySlug(slug) || isRouteSourceToolSlug(slug)) {
        return { locale: localeSegment, routeType: "tool", slug }
    }

    if (HUB_SLUGS.has(slug)) {
        return { locale: localeSegment, routeType: "hub", slug }
    }

    if (CONTENT_ROUTE_SLUGS.has(slug)) {
        return { locale: localeSegment, routeType: "content", slug: routeSlug }
    }

    return { locale: localeSegment, routeType: "content", slug: routeSlug }
}
