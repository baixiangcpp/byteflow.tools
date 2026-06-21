import { describe, expect, it } from "vitest"
import { analyzeJwtSemantics, decodeJwtParts, JwtDecodeError } from "@/features/tools/jwt-decoder/utils"

function encodeSegment(value: unknown): string {
    const json = JSON.stringify(value)
    const bytes = new TextEncoder().encode(json)
    let binary = ""
    for (const byte of bytes) binary += String.fromCharCode(byte)
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function makeToken(header: Record<string, unknown>, payload: Record<string, unknown>, signature = "signature") {
    return `${encodeSegment(header)}.${encodeSegment(payload)}.${signature}`
}

describe("jwt decoder utils", () => {
    it("decodes header and payload without verifying signatures", () => {
        const decoded = decodeJwtParts("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiQnl0ZWZsb3cifQ.signature")

        expect(decoded.header).toEqual({
            alg: "HS256",
            typ: "JWT",
        })
        expect(decoded.payload).toEqual({
            sub: "123",
            name: "Byteflow",
        })
        expect(decoded.semantics.algorithm).toBe("HS256")
    })

    it("throws for invalid JWT input", () => {
        expect(() => decodeJwtParts("not-a-jwt")).toThrow(JwtDecodeError)
        expect(() => decodeJwtParts("not-a-jwt")).toThrow("segment_count")
    })

    it("reports malformed base64url segments distinctly", () => {
        expect(() => decodeJwtParts(`${encodeSegment({ alg: "HS256" })}.%%%.$sig`)).toThrow("invalid_base64url")
    })

    it("flags alg none as an unsigned-token warning", () => {
        const decoded = decodeJwtParts(makeToken({ alg: "none", typ: "JWT" }, { sub: "123" }, ""), new Date("2026-01-01T00:00:00.000Z"))

        expect(decoded.semantics.algNone).toBe(true)
        expect(decoded.semantics.warnings).toContain("alg_none")
    })

    it("flags expired tokens with UTC claim details", () => {
        const decoded = decodeJwtParts(
            makeToken({ alg: "HS256", typ: "JWT" }, { exp: 1_704_067_200, iat: 1_704_066_000, iss: "https://issuer.example", aud: ["api"] }),
            new Date("2026-01-01T00:00:00.000Z"),
        )

        expect(decoded.semantics.warnings).toContain("expired")
        expect(decoded.semantics.claims).toContainEqual({
            claim: "exp",
            status: "warning",
            detail: "expired",
            utc: "2024-01-01T00:00:00.000Z",
            epochSeconds: 1_704_067_200,
        })
        expect(decoded.semantics.claims).toContainEqual({
            claim: "iss",
            status: "info",
            detail: "present",
            valueSummary: "string",
        })
        expect(decoded.semantics.claims).toContainEqual({
            claim: "aud",
            status: "info",
            detail: "present",
            valueSummary: "array:1",
        })
    })

    it("marks not-before and future issued-at claims as warnings", () => {
        const summary = analyzeJwtSemantics(
            { alg: "HS256" },
            { nbf: 1_767_312_000, iat: 1_767_312_000 },
            new Date("2026-01-01T00:00:00.000Z"),
        )

        expect(summary.warnings).toEqual(["not_yet_valid", "issued_in_future"])
        expect(summary.claims.map((claim) => claim.detail)).toEqual(["not_yet_valid", "issued_in_future"])
    })
})
