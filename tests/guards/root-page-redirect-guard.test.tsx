import fs from "node:fs"
import path from "node:path"
import { metadata as rootMetadata } from "@/app/page"
import { SITE_URL } from "@/core/seo/urls"
import { describe, expect, it } from "vitest"

describe("root x-default page guard", () => {
    it("keeps the root page as a crawlable x-default landing page with language choices", () => {
        const pageSource = fs.readFileSync(path.join(process.cwd(), "src/app/page.tsx"), "utf8")

        expect(pageSource).not.toContain('import Script from "next/script"')
        expect(pageSource).not.toContain("root-locale-redirect.js")
        expect(pageSource).toContain("Privacy-first local developer tools")
        expect(pageSource).toContain("Popular tools")
        expect(pageSource).toContain('formatToolRegistryStatsTemplate("{categoryCount} curated categories", stats)')
        expect(pageSource).toContain("Choose your language")

        const languages = rootMetadata.alternates?.languages as Record<string, string>
        expect(rootMetadata.alternates?.canonical).toBe(SITE_URL)
        expect(languages["x-default"]).toBe(SITE_URL)
    })
})
