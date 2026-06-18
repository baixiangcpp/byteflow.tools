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
        purpose: "Client-side redirect for statically exported legacy tool aliases.",
        requiresUnsafeInline: true,
        migrationPath: "Replace with static redirect artifacts or a hashed redirect bootstrap per alias.",
    },
]

export function inlineScriptPolicyRequiresUnsafeInline(): boolean {
    return INLINE_SCRIPT_POLICY.some((entry) => entry.requiresUnsafeInline)
}

