import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const SMOKE_SOURCE = fs.readFileSync(path.join(process.cwd(), "scripts/e2e/run-playwright-smoke.js"), "utf8")

describe("playwright smoke matrix guard", () => {
    it("keeps representative routes and browser journeys in the smoke script", () => {
        expect(SMOKE_SOURCE).toContain('"/en/base64-encode-decode"')
        expect(SMOKE_SOURCE).toContain('"/en/pipeline-builder"')
        expect(SMOKE_SOURCE).toContain('"/en/csv-json-converter"')
        expect(SMOKE_SOURCE).toContain("assertBase64PipelineHandoffJourney")
        expect(SMOKE_SOURCE).toContain("assertPipelineRecipeJourney")
        expect(SMOKE_SOURCE).toContain("assertMonacoFallbackJourney")
        expect(SMOKE_SOURCE).toContain("assertMobileCommandPaletteJourney")
        expect(SMOKE_SOURCE).toContain("assertMobileToolPageJourneys")
        expect(SMOKE_SOURCE).toContain("assertBasicAccessibility")
    })

    it("keeps mobile tool-page regression coverage for core workflows", () => {
        expect(SMOKE_SOURCE).toContain("MOBILE_TOOL_VIEWPORTS")
        expect(SMOKE_SOURCE).toContain('{ width: 390, height: 844 }')
        expect(SMOKE_SOURCE).toContain('{ width: 430, height: 932 }')
        expect(SMOKE_SOURCE).toContain('route: "/en/json-formatter"')
        expect(SMOKE_SOURCE).toContain('route: "/en/base64-encode-decode"')
        expect(SMOKE_SOURCE).toContain('route: "/en/jwt-decoder"')
        expect(SMOKE_SOURCE).toContain('route: "/en/regex-tester"')
        expect(SMOKE_SOURCE).toContain('route: "/en/crontab-generator"')
        expect(SMOKE_SOURCE).toContain("assertNoHorizontalOverflow")
        expect(SMOKE_SOURCE).toContain("clickCopyAndExpectToast")
    })

    it("keeps PWA smoke opt-in so CI can cover service worker behavior after export", () => {
        expect(SMOKE_SOURCE).toContain('if (arg === "--pwa")')
        expect(SMOKE_SOURCE).toContain("assertPwaShellJourney")
        expect(SMOKE_SOURCE).toContain("serviceWorkers: \"allow\"")
        expect(SMOKE_SOURCE).toContain("goOffline")
        expect(SMOKE_SOURCE).toContain("await stopServer(serverHandle.server)")
        expect(SMOKE_SOURCE).toContain("await context.setOffline(true)")
        expect(SMOKE_SOURCE).toContain('headers: { accept: "text/html" }')
    })
})
