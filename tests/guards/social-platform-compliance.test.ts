import { describe, expect, it } from "vitest"
import { TOOL_MANIFESTS } from "@/core/registry"
import type { ToolMeta } from "@/core/registry/types"
import { getRouteToolBySlug } from "@/generated/route-tool-lookup"

const SOCIAL_TOOL_KEYS = [
    "tweet_generator",
    "tweet_to_image_converter",
    "twitter_ad_revenue_generator",
    "instagram_post_generator",
    "instagram_story_generator",
    "instagram_photo_downloader",
    "youtube_thumbnail_grabber",
    "vimeo_thumbnail_grabber",
    "open_graph_meta_generator",
]

const EXTERNAL_MEDIA_TOOL_KEYS = [
    "instagram_photo_downloader",
    "youtube_thumbnail_grabber",
    "vimeo_thumbnail_grabber",
]

describe("social platform compliance metadata", () => {
    it("keeps social/media tools on a consistent naming and rights guidance model", () => {
        const toolsByKey = new Map((TOOL_MANIFESTS as readonly ToolMeta[]).map((tool) => [tool.key, tool]))

        for (const toolKey of SOCIAL_TOOL_KEYS) {
            const tool = toolsByKey.get(toolKey)
            expect(tool, toolKey).toBeTruthy()
            expect(tool?.compliance?.platformName?.trim(), `${toolKey} platformName`).toBeTruthy()
            expect(tool?.compliance?.rightsGuidance?.trim(), `${toolKey} rightsGuidance`).toBeTruthy()
            expect(tool?.compliance?.affiliationDisclaimer?.trim(), `${toolKey} affiliationDisclaimer`).toBeTruthy()
            expect(tool?.compliance?.affiliationDisclaimer, `${toolKey} affiliationDisclaimer`).toMatch(/not affiliated|descriptively only/i)
        }

        for (const toolKey of ["tweet_generator", "tweet_to_image_converter", "twitter_ad_revenue_generator"]) {
            expect(toolsByKey.get(toolKey)?.compliance?.platformName, toolKey).toBe("X (Twitter)")
        }
    })

    it("keeps external media tools explicit about confirmation, remote hosts, and rights", () => {
        const toolsByKey = new Map((TOOL_MANIFESTS as readonly ToolMeta[]).map((tool) => [tool.key, tool]))

        for (const toolKey of EXTERNAL_MEDIA_TOOL_KEYS) {
            const tool = toolsByKey.get(toolKey)
            expect(tool?.privacy.executionMode, toolKey).toBe("external-request")
            expect(tool?.privacy.externalRequest.consentRequired, toolKey).toBe(true)
            expect(tool?.privacy.externalRequest.domains?.length, toolKey).toBeGreaterThan(0)
            expect(tool?.privacy.externalRequest.disclosure, toolKey).toMatch(/only after|after you/i)
            expect(tool?.compliance?.rightsGuidance, toolKey).toMatch(/own|permission|allowed|rights/i)
        }
    })

    it("exposes compliance metadata through route lookup for visible tool-page guidance", () => {
        const toolsByKey = new Map((TOOL_MANIFESTS as readonly ToolMeta[]).map((tool) => [tool.key, tool]))

        for (const toolKey of SOCIAL_TOOL_KEYS) {
            const tool = toolsByKey.get(toolKey)
            expect(tool, toolKey).toBeTruthy()
            const routeTool = getRouteToolBySlug(tool?.slug ?? "")
            expect(routeTool?.compliance?.platformName, toolKey).toBe(tool?.compliance?.platformName)
            expect(routeTool?.compliance?.rightsGuidance, toolKey).toBe(tool?.compliance?.rightsGuidance)
            expect(routeTool?.compliance?.affiliationDisclaimer, toolKey).toBe(tool?.compliance?.affiliationDisclaimer)
        }
    })
})
