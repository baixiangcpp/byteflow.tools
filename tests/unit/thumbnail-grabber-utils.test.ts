import { describe, expect, it } from "vitest"
import {
    buildVimeoThumbnailCandidates,
    buildYouTubeThumbnailCandidates,
    parseVimeoVideoId,
    parseYouTubeVideoId,
} from "@/core/utils/thumbnail-grabber-utils"

describe("thumbnail-grabber-utils", () => {
    it("parses youtube ids from watch and short urls", () => {
        expect(parseYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ")
        expect(parseYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ")
        expect(parseYouTubeVideoId("www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ")
        expect(parseYouTubeVideoId("https://www.youtube.com/shorts/abc123DEF45")).toBe("abc123DEF45")
    })

    it("rejects unsafe youtube urls", () => {
        expect(parseYouTubeVideoId("javascript:alert(1)")).toBeNull()
        expect(parseYouTubeVideoId("data:text/html,<script>alert(1)</script>")).toBeNull()
        expect(parseYouTubeVideoId("http://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBeNull()
        expect(parseYouTubeVideoId("https://notyoutube.com/watch?v=dQw4w9WgXcQ")).toBeNull()
    })

    it("parses vimeo ids from regular and player urls", () => {
        expect(parseVimeoVideoId("https://vimeo.com/76979871")).toBe("76979871")
        expect(parseVimeoVideoId("https://player.vimeo.com/video/76979871?h=abc")).toBe("76979871")
        expect(parseVimeoVideoId("vimeo.com/channels/staffpicks/76979871")).toBe("76979871")
        expect(parseVimeoVideoId("https://vimeo.com/channels/staffpicks/76979871")).toBe("76979871")
    })

    it("rejects unsafe vimeo urls", () => {
        expect(parseVimeoVideoId("javascript:alert(1)")).toBeNull()
        expect(parseVimeoVideoId("data:text/html,<script>alert(1)</script>")).toBeNull()
        expect(parseVimeoVideoId("http://vimeo.com/76979871")).toBeNull()
        expect(parseVimeoVideoId("https://notvimeo.com/76979871")).toBeNull()
    })

    it("builds youtube thumbnail candidate list", () => {
        const items = buildYouTubeThumbnailCandidates("dQw4w9WgXcQ")
        expect(items).toHaveLength(5)
        expect(items[0].url).toContain("maxresdefault.jpg")
    })

    it("builds vimeo thumbnail candidate list", () => {
        const items = buildVimeoThumbnailCandidates("76979871")
        expect(items).toHaveLength(4)
        expect(items[0].url).toContain("_large.jpg")
    })
})
