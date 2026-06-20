import legacyRoutes from "./legacy-routes.json"

export type LegacyRouteStatus = 301 | 302 | 410
export type LegacyRouteReason = "deleted" | "renamed" | "merged"

export type LegacyRoute = {
    sourceSlug: string
    targetSlug?: string
    status: LegacyRouteStatus
    reason: LegacyRouteReason
}

export const LEGACY_ROUTES = legacyRoutes as LegacyRoute[]

const LEGACY_ROUTE_BY_SOURCE_SLUG = new Map(
    LEGACY_ROUTES.map((route) => [route.sourceSlug, route]),
)

export function getLegacyRouteBySourceSlug(sourceSlug: string) {
    return LEGACY_ROUTE_BY_SOURCE_SLUG.get(sourceSlug)
}
