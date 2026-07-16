import type { RouteType } from "@/core/routing/route-context"

export type RouteContainerIntent = "tool" | "wide-tool" | "static" | "catalog"

export const ROUTE_CONTAINER_CLASS_NAMES: Record<RouteContainerIntent, string> = {
    tool: "mx-auto w-full max-w-6xl",
    "wide-tool": "mx-auto w-full max-w-[1400px]",
    static: "mx-auto w-full max-w-5xl",
    catalog: "mx-auto w-full max-w-6xl",
}

export const ROUTE_VIEWPORT_CLASS_NAME = "mx-auto w-full max-w-screen-2xl px-4 md:px-8 lg:px-10"

const WIDE_TOOL_SLUGS = new Set([
    "asn1-der-inspector",
    "base64-encode-decode",
    "code-to-image-converter",
    "css-formatter",
    "css-minifier",
    "csv-diff",
    "csv-json-converter",
    "curl-to-code",
    "env-parser",
    "graphql-workbench",
    "gzip-brotli-lab",
    "har-viewer-sanitizer",
    "header-diff",
    "hex-bytes-workbench",
    "html-css-beautifier",
    "html-encoder-decoder",
    "html-formatter",
    "html-minifier",
    "html-to-markdown",
    "javascript-formatter",
    "javascript-minifier",
    "jq-playground",
    "json-diff-viewer",
    "json-formatter",
    "json-schema-workbench",
    "json-to-typescript",
    "jsonpath-playground",
    "jwt-decoder",
    "letter-counter",
    "local-log-parser",
    "log-scrubber",
    "markdown-preview",
    "multiple-whitespace-remover",
    "ndjson-formatter",
    "openapi-diff",
    "openapi-mock",
    "openapi-viewer",
    "pipeline-builder",
    "regex-generator",
    "saml-decoder",
    "sql-formatter",
    "structured-data-visualizer",
    "svg-optimizer",
    "text-diff-checker",
    "unicode-inspector",
    "url-encode-decode",
    "xml-formatter",
    "yaml-json-converter",
    "yaml-merge-patch-explorer",
    "yq-playground",
])

const CATALOG_ROUTE_SLUGS = new Set(["alternatives", "compare", "fix", "how-to"])

export const REPRESENTATIVE_ROUTE_CONTAINER_INTENTS = {
    "all-tools": "catalog",
    "install-app": "static",
    "json-formatter": "wide-tool",
    "pipeline-builder": "wide-tool",
    "qr-code-generator": "tool",
    support: "static",
} as const satisfies Record<string, RouteContainerIntent>

export function getToolContainerIntent(slug: string | null | undefined): RouteContainerIntent {
    return slug && WIDE_TOOL_SLUGS.has(slug) ? "wide-tool" : "tool"
}

export function getRouteContainerIntent(route: {
    routeType: RouteType
    slug: string | null
}): RouteContainerIntent {
    const explicitIntent = route.slug
        ? REPRESENTATIVE_ROUTE_CONTAINER_INTENTS[route.slug as keyof typeof REPRESENTATIVE_ROUTE_CONTAINER_INTENTS]
        : undefined
    if (explicitIntent) return explicitIntent

    if (route.routeType === "tool") return getToolContainerIntent(route.slug)
    if (route.slug && CATALOG_ROUTE_SLUGS.has(route.slug)) return "catalog"
    if (route.routeType === "hub") return "catalog"
    return "static"
}

export function isWideToolSlug(slug: string): boolean {
    return WIDE_TOOL_SLUGS.has(slug)
}
