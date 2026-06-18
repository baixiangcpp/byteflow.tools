export type InlineScriptPolicyEntry = {
    id: string
    file: string
    purpose: string
    requiresUnsafeInline: boolean
    migrationPath: string
}

export const INLINE_SCRIPT_POLICY: readonly InlineScriptPolicyEntry[] = [
    {
        id: "root-locale-redirect",
        file: "src/app/page.tsx",
        purpose: "Static export root locale redirect before React hydration.",
        requiresUnsafeInline: true,
        migrationPath: "Move redirect bootstrap into a hashed static script once static export can preserve locale fallback behavior.",
    },
    {
        id: "theme-manifest-bootstrap",
        file: "src/app/layout.tsx",
        purpose: "Set locale lang, color scheme, theme-color, and localized manifest before first paint.",
        requiresUnsafeInline: true,
        migrationPath: "Move bootstrap into a hashed static script after verifying no theme flash or manifest race in exported HTML.",
    },
    {
        id: "legacy-tool-redirect",
        file: "src/core/seo/components/legacy-tool-redirect-page.tsx",
        purpose: "Fallback content for statically exported legacy tool aliases after deployment-level redirects.",
        requiresUnsafeInline: false,
        migrationPath: "Keep alias redirects in public/_redirects and remove this fallback when old exports can be dropped.",
    },
]

export function inlineScriptPolicyRequiresUnsafeInline(): boolean {
    return INLINE_SCRIPT_POLICY.some((entry) => entry.requiresUnsafeInline)
}
