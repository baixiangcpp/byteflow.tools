import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

describe("next config bundle analyzer wiring", () => {
    it("gates bundle analyzer behind ANALYZE=true", () => {
        const nextConfigPath = path.join(process.cwd(), "next.config.ts")
        const source = fs.readFileSync(nextConfigPath, "utf8")

        expect(source).toContain('import bundleAnalyzer from "@next/bundle-analyzer";')
        expect(source).toContain('enabled: process.env.ANALYZE === "true"')
        expect(source).toContain("export default withBundleAnalyzer(nextConfig);")
    })

    it("exposes an analyze script and dependency", () => {
        const packageJsonPath = path.join(process.cwd(), "package.json")
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))

        expect(packageJson.scripts?.analyze).toBe("ANALYZE=true next build --webpack")
        expect(packageJson.scripts?.["check:bundle-boundaries"]).toBe("node scripts/gates/check-bundle-boundaries.js")
        expect(packageJson.scripts?.validate).toContain("npm run check:bundle-boundaries")
        expect(packageJson.devDependencies?.["@next/bundle-analyzer"]).toBeTruthy()
    })
})
