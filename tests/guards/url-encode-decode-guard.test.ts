import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function read(relativePath: string) {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("URL Encode/Decode guard", () => {
    it("keeps malformed percent errors structured and full URL payloads out of handoff", () => {
        const pageSource = read("src/features/tools/url-encode-decode/page.tsx")
        const codecSource = read("src/core/utils/url-codec-utils.ts")

        expect(pageSource).toContain("buildSensitiveToolHandoffLink")
        expect(pageSource).not.toContain("buildToolHandoffLink")
        expect(pageSource).toContain("handoffPayload = input.trim() ? \"url-encode-decode\" : \"\"")
        expect(pageSource).toContain("decode_error_position_label")
        expect(pageSource).toContain("role=\"alert\"")
        expect(pageSource).not.toContain("<ToolTrustHeader")

        expect(codecSource).toContain("findMalformedPercentSequence")
        expect(codecSource).toContain("decodeUrlByModeSafe")
        expect(codecSource).toContain("reason: \"invalid_encoding\"")
    })
})
