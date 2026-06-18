import { describe, expect, it } from "vitest"
import { buildLastmodInputPaths, resolveTrackedFileLastmod, toUtcDayIso } from "../../scripts/lib/sitemap-lastmod-lib.js"

describe("sitemap lastmod lib", () => {
    it("normalizes git timestamps to UTC day granularity", () => {
        expect(toUtcDayIso("2026-04-10T23:59:58+09:00")).toBe("2026-04-10T00:00:00.000Z")
        expect(toUtcDayIso("2026-04-10")).toBe("2026-04-10T00:00:00.000Z")
    })

    it("keeps committed day when the file is clean", () => {
        expect(
            resolveTrackedFileLastmod({
                committedIso: "2026-04-08T14:32:11.000Z",
                hasLocalChanges: false,
                todayIso: "2026-04-10T09:15:00.000Z",
            }),
        ).toBe("2026-04-08T00:00:00.000Z")
    })

    it("uses today's day for locally modified files so pre-commit generation stays stable after commit", () => {
        expect(
            resolveTrackedFileLastmod({
                committedIso: "2026-04-08T14:32:11.000Z",
                hasLocalChanges: true,
                todayIso: "2026-04-10T09:15:00.000Z",
            }),
        ).toBe("2026-04-10T00:00:00.000Z")
    })

    it("keeps route lastmod inputs scoped to files that materially change the rendered page", () => {
        const homePaths = buildLastmodInputPaths({
            slug: "",
            includeToolMeta: false,
        })
        const toolPaths = buildLastmodInputPaths({
            slug: "json-formatter",
            includeToolMeta: true,
        })

        expect(homePaths).toContain("src/app/[lang]/page.tsx")
        expect(homePaths).not.toContain("src/app/layout.tsx")
        expect(homePaths).not.toContain("src/app/[lang]/layout.tsx")
        expect(homePaths).not.toContain("src/core/i18n/translations/en.json")

        expect(toolPaths).toContain("src/app/[lang]/json-formatter/page.tsx")
        expect(toolPaths).toContain("src/app/[lang]/json-formatter/layout.tsx")
        expect(toolPaths).toContain("src/features/tools/json-formatter/manifest.ts")
        expect(toolPaths).not.toContain("src/core/registry/manifests.ts")
        expect(toolPaths).not.toContain("src/core/registry/registry.ts")
        expect(toolPaths).not.toContain("src/core/registry/tool-order.json")
        expect(toolPaths).not.toContain("src/core/i18n/translations/en.json")
    })
})
