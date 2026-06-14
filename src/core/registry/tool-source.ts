const REPO_SOURCE_BASE = "https://github.com/baixiangcpp/byteflow.tools/blob/main"

const ROUTE_SOURCE_TOOLS = new Set([
    "md5-digest-generator",
    "sha1-digest-generator",
    "sha224-digest-generator",
    "sha256-digest-generator",
    "sha384-digest-generator",
    "sha512-digest-generator",
])

export function isRouteSourceToolSlug(slug: string): boolean {
    return ROUTE_SOURCE_TOOLS.has(slug)
}

export function getRouteSourceToolSlugs(): string[] {
    return Array.from(ROUTE_SOURCE_TOOLS)
}

export function getToolSourceUrl(slug: string): string {
    const sourcePath = isRouteSourceToolSlug(slug)
        ? `src/app/%5Blang%5D/${slug}/page.tsx`
        : `src/features/tools/${slug}/page.tsx`

    return `${REPO_SOURCE_BASE}/${sourcePath}`
}
