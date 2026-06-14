import fs from "node:fs"

const FILES = {
    analytics: "src/core/analytics/analytics.ts",
    routeAnalytics: "src/core/analytics/components/route-analytics.tsx",
    toolActionBar: "src/features/tool-shell/tool-action-bar.tsx",
    newsletterCta: "src/features/newsletter/components/newsletter-cta.tsx",
}

function read(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Missing required file: ${filePath}`)
    }
    return fs.readFileSync(filePath, "utf8")
}

function assertIncludes(source, pattern, errorMessage, failures) {
    if (!pattern.test(source)) {
        failures.push(errorMessage)
    }
}

function main() {
    const failures = []
    const analytics = read(FILES.analytics)
    const routeAnalytics = read(FILES.routeAnalytics)
    const toolActionBar = read(FILES.toolActionBar)
    const newsletterCta = read(FILES.newsletterCta)

    assertIncludes(analytics, /export (function|const) trackSeoLanding\b/, "analytics.ts missing trackSeoLanding export", failures)
    assertIncludes(analytics, /export (function|const) trackToolRun\b/, "analytics.ts missing trackToolRun export", failures)
    assertIncludes(analytics, /export (function|const) trackCopyOutput\b/, "analytics.ts missing trackCopyOutput export", failures)
    assertIncludes(analytics, /export (function|const) trackDownloadOutput\b/, "analytics.ts missing trackDownloadOutput export", failures)
    assertIncludes(analytics, /export (function|const) trackCTA\b/, "analytics.ts missing trackCTA export", failures)

    assertIncludes(routeAnalytics, /\btrackSeoLanding\b/, "route-analytics.tsx missing seo_landing tracking usage", failures)
    assertIncludes(routeAnalytics, /\btrackCopyOutput\b/, "route-analytics.tsx missing copy_output tracking usage", failures)
    assertIncludes(routeAnalytics, /\btrackDownloadOutput\b/, "route-analytics.tsx missing download_output tracking usage", failures)

    assertIncludes(toolActionBar, /\btrackToolRun\b/, "tool-action-bar.tsx missing tool_run tracking usage", failures)
    assertIncludes(toolActionBar, /\btrackCopyOutput\b/, "tool-action-bar.tsx missing copy_output tracking usage", failures)
    assertIncludes(toolActionBar, /\btrackDownloadOutput\b/, "tool-action-bar.tsx missing download_output tracking usage", failures)
    assertIncludes(toolActionBar, /data-analytics-action=/, "tool-action-bar.tsx missing analytics action marker", failures)

    assertIncludes(newsletterCta, /trackCTA\(\"newsletter\",\s*\"click\"\)/, "newsletter-cta.tsx missing CTA click tracking", failures)

    if (failures.length > 0) {
        console.error(`[check:analytics-taxonomy] ${failures.length} issue(s) found:`)
        for (const failure of failures) {
            console.error(`- ${failure}`)
        }
        process.exit(1)
    }

    console.log("[check:analytics-taxonomy] OK: required SEO and interaction analytics hooks are present.")
}

main()
