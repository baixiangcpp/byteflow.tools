import { describe, expect, it } from "vitest"
import {
    buildSensitiveToolHandoffLink,
    buildShareableToolHandoffHref,
    buildToolHandoffHref,
    buildToolHandoffLink,
    getToolHandoffFromSearchParams,
} from "@/core/routing/tool-handoff"

describe("tool handoff", () => {
    it("builds a localized shareable handoff URL", () => {
        const href = buildShareableToolHandoffHref("en", "json-to-typescript", '{"a":1}')
        expect(href.startsWith("/en/json-to-typescript#handoff=")).toBe(true)
        expect(href).not.toContain("?handoff=")
    })

    it("returns base path when payload is empty", () => {
        expect(buildShareableToolHandoffHref("zh-CN", "javascript-minifier", "   ")).toBe("/zh-CN/javascript-minifier")
    })

    it("round-trips unicode payload from query params", () => {
        const payload = "你好, JSON\n{\"name\":\"ByteFlow\"}"
        const href = buildShareableToolHandoffHref("en", "json-to-typescript", payload)
        const fragment = href.split("#")[1] || ""
        expect(getToolHandoffFromSearchParams(new URLSearchParams(), fragment)).toBe(payload)
    })

    it("returns null on invalid handoff value", () => {
        const params = new URLSearchParams("handoff=%%%")
        expect(getToolHandoffFromSearchParams(params)).toBeNull()
    })

    it("fails fast when locale is missing instead of defaulting to English", () => {
        expect(() => buildShareableToolHandoffHref("   ", "json-to-typescript", '{"a":1}')).toThrow(
            "[i18n] tool handoff requires an explicit locale",
        )
    })

    it("keeps the legacy handoff href export as explicit share-link behavior", () => {
        const href = buildToolHandoffHref("en", "json-to-typescript", '{"a":1}')
        expect(href.startsWith("/en/json-to-typescript#handoff=")).toBe(true)
    })

    it("uses sessionStorage handoff by default when available", () => {
        const payload = '{"token":"secret"}'
        const handoff = buildToolHandoffLink("en", "json-to-typescript", payload)

        expect(handoff.href.startsWith("/en/json-to-typescript#handoff_ref=")).toBe(true)
        expect(handoff.href).not.toContain("secret")
        handoff.prime()

        const fragment = handoff.href.split("#")[1] || ""
        expect(getToolHandoffFromSearchParams(new URLSearchParams(), fragment)).toBe(payload)
        expect(getToolHandoffFromSearchParams(new URLSearchParams(), fragment)).toBeNull()
    })

    it("builds sensitive handoff links without storing or encoding payloads", () => {
        const handoff = buildSensitiveToolHandoffLink("en", "pipeline-builder")

        expect(handoff.href).toBe("/en/pipeline-builder")
        expect(handoff.href).not.toContain("handoff")
        expect(handoff.href).not.toContain("secret")

        handoff.prime()
        const storageKeys = Object.keys(window.sessionStorage)
        expect(storageKeys.filter((key) => key.startsWith("byteflow:handoff:"))).toEqual([])
    })

    it("still reads old query-string handoff URLs for backward compatibility", () => {
        const href = buildShareableToolHandoffHref("en", "json-to-typescript", "legacy payload")
        const fragment = href.split("#")[1] || ""
        const value = new URLSearchParams(fragment).get("handoff") ?? ""

        expect(getToolHandoffFromSearchParams(new URLSearchParams(`handoff=${encodeURIComponent(value)}`))).toBe(
            "legacy payload",
        )
    })
})
