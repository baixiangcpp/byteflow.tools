import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

describe("home prefetch guard", () => {
    it("disables eager prefetch for first-viewport hub links", () => {
        const source = fs.readFileSync(path.join(process.cwd(), "src/app/[lang]/page.tsx"), "utf8")

        expect(source).toContain("href={`/${locale}/install-app`}")
        expect(source).toContain("prefetch={false}")
        expect(source).toContain("href={`/${locale}/${item.slug}`}")
    })
})
