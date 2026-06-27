import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function read(relativePath: string) {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("Lighthouse accessibility follow-ups", () => {
    it("keeps visible command and tool-card labels aligned with accessible names", () => {
        const homeSearchButton = read("src/app/[lang]/search-button.tsx")
        const allToolsDiscovery = read("src/features/tool-discovery/all-tools-discovery.tsx")

        expect(homeSearchButton).toContain("data-command-palette-trigger")
        expect(homeSearchButton).not.toContain("aria-label={label}")
        expect(allToolsDiscovery).toContain("<ToolCardBadges capabilityLabels={capabilityLabels} tool={tool} />")
        expect(allToolsDiscovery).not.toContain("aria-label={tool.title}")
    })

    it("keeps non-section labels out of heading order and preserves Trust Center heading sequence", () => {
        const footer = read("src/components/layout/footer-content.tsx")
        const trustCenter = read("src/app/[lang]/trust-center/page.tsx")

        expect(footer).toContain("<nav className=\"md:col-span-4\" aria-label={navigationLabel}>")
        expect(footer).not.toContain("<h4 className=\"mb-3")
        expect(trustCenter).toContain('titleAs="h2"')
        expect(trustCenter).toContain('titleAs?: "h2" | "h3"')
    })

    it("keeps destructive tool actions contrast-safe in dark mode", () => {
        const actionBar = read("src/features/tool-shell/tool-action-bar.tsx")

        expect(actionBar).toContain("dark:text-red-200")
        expect(actionBar).toContain("dark:bg-red-950/25")
        expect(actionBar).not.toContain("bg-background text-destructive shadow-xs hover:bg-destructive/10 dark:bg-input/30")
    })
})
