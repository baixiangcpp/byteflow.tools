export type InlineScriptPolicyEntry = {
    id: string
    file: string
    purpose: string
    requiresUnsafeInline: boolean
    migrationPath: string
    externalScript?: string
}

export const INLINE_SCRIPT_POLICY: readonly InlineScriptPolicyEntry[] = [
    {
        id: "theme-manifest-bootstrap",
        file: "src/app/layout.tsx",
        purpose: "Set locale, theme, and localized manifest before first paint, and bridge the one-shot PWA install lifecycle before hydration.",
        requiresUnsafeInline: false,
        migrationPath: "Implemented as a parser-blocking same-origin runtime script in <head> so theme and PWA install events are captured before hydration.",
        externalScript: "/runtime/theme-manifest-bootstrap.js",
    },
    {
        id: "json-ld-structured-data",
        file: "src/core/seo/components/json-ld-script.tsx",
        purpose: "Emit per-page application/ld+json structured data in statically exported HTML.",
        requiresUnsafeInline: true,
        migrationPath: "Next static export uses one global CSP header, so per-page JSON-LD hashes cannot be enumerated centrally; keep the serializer guard active until structured data can be moved to hashed page-specific headers or external JSON assets.",
    },
]

export function inlineScriptPolicyRequiresUnsafeInline(): boolean {
    return INLINE_SCRIPT_POLICY.some((entry) => entry.requiresUnsafeInline)
}
