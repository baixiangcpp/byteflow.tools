import { describe, expect, it } from "vitest"
import {
    buildSensitiveToolHandoffLink,
    buildShareableToolHandoffHref,
    buildToolHandoffHref,
    buildToolHandoffLink,
    getToolHandoffFromSearchParams,
} from "@/core/routing/tool-handoff"

describe("tool handoff", () => {
    it("builds a localized handoff URL without embedding payloads", () => {
        const href = buildShareableToolHandoffHref("en", "json-to-typescript", '{"a":1}')
        expect(href).toBe("/en/json-to-typescript")
        expect(href).not.toContain("?handoff=")
        expect(href).not.toContain("#handoff=")
        expect(href).not.toContain('{"a":1}')
    })

    it("returns base path when payload is empty", () => {
        expect(buildShareableToolHandoffHref("zh-CN", "javascript-minifier", "   ")).toBe("/zh-CN/javascript-minifier")
    })

    it("still reads old fragment handoff URLs for backward compatibility", () => {
        const payload = "你好, JSON\n{\"name\":\"ByteFlow\"}"
        const encoded = btoa(String.fromCharCode(...new TextEncoder().encode(payload)))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/g, "")
        const fragment = `handoff=${encoded}`
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
        expect(href).toBe("/en/json-to-typescript")
        expect(href).not.toContain("#handoff=")
    })

    it("does not store handoff payloads in sessionStorage", () => {
        const payload = '{"token":"secret"}'
        const handoff = buildToolHandoffLink("en", "json-to-typescript", payload)

        expect(handoff.href).toBe("/en/json-to-typescript")
        expect(handoff.href).not.toContain("secret")
        handoff.prime()

        expect(Object.keys(window.sessionStorage).filter((key) => key.startsWith("byteflow:handoff:"))).toEqual([])
        expect(getToolHandoffFromSearchParams(new URLSearchParams(), "")).toBeNull()
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
        const value = btoa("legacy payload")

        expect(getToolHandoffFromSearchParams(new URLSearchParams(`handoff=${encodeURIComponent(value)}`))).toBe(
            "legacy payload",
        )
    })
})
