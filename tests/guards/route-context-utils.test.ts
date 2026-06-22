import { describe, expect, it } from "vitest"
import { getRouteContext } from "@/core/routing/route-context"

describe("route context", () => {
    it("classifies locale home pages", () => {
        expect(getRouteContext("/en")).toEqual({
            locale: "en",
            routeType: "home",
            slug: null,
        })
    })

    it("classifies tool routes", () => {
        expect(getRouteContext("/en/json-formatter")).toEqual({
            locale: "en",
            routeType: "tool",
            slug: "json-formatter",
        })
    })

    it("does not treat removed duplicate-entry routes as tools", () => {
        expect(getRouteContext("/en/json-validator")).toEqual({
            locale: "en",
            routeType: "content",
            slug: "json-validator",
        })

        expect(getRouteContext("/en/cron-expression-generator")).toEqual({
            locale: "en",
            routeType: "content",
            slug: "cron-expression-generator",
        })

        expect(getRouteContext("/en/ip-address-lookup")).toEqual({
            locale: "en",
            routeType: "content",
            slug: "ip-address-lookup",
        })

        expect(getRouteContext("/en/ssl-checker")).toEqual({
            locale: "en",
            routeType: "content",
            slug: "ssl-checker",
        })
    })

    it("classifies hub routes", () => {
        expect(getRouteContext("/en/formatters")).toEqual({
            locale: "en",
            routeType: "hub",
            slug: "formatters",
        })

        expect(getRouteContext("/en/workflows")).toEqual({
            locale: "en",
            routeType: "hub",
            slug: "workflows",
        })

        expect(getRouteContext("/en/workflows/api-payload-cleanup")).toEqual({
            locale: "en",
            routeType: "hub",
            slug: "workflows/api-payload-cleanup",
        })
    })

    it("classifies localized content routes", () => {
        expect(getRouteContext("/en/about")).toEqual({
            locale: "en",
            routeType: "content",
            slug: "about",
        })

        expect(getRouteContext("/en/trust-center")).toEqual({
            locale: "en",
            routeType: "content",
            slug: "trust-center",
        })

        expect(getRouteContext("/en/compare/byteflow-vs-cyberchef")).toEqual({
            locale: "en",
            routeType: "content",
            slug: "compare/byteflow-vs-cyberchef",
        })
    })

    it("classifies non-locale routes as other", () => {
        expect(getRouteContext("/robots.txt")).toEqual({
            locale: null,
            routeType: "other",
            slug: "robots.txt",
        })
    })
})
