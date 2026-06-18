import { describe, expect, it } from "vitest"
import { checkClaims, parseUnixTimestampClaim, type JwtClaimLabels } from "@/features/tools/jwt-verifier/logic"

const labels: JwtClaimLabels = {
    exp: "exp",
    nbf: "nbf",
    iat: "iat",
    iss: "iss",
    sub: "sub",
    aud: "aud",
}

describe("jwt verifier claims", () => {
    it("rejects non-finite timestamp claims without throwing", () => {
        expect(parseUnixTimestampClaim("not-a-number")).toEqual({
            ok: false,
            error: "invalid timestamp: not-a-number",
        })
        expect(parseUnixTimestampClaim(Number.POSITIVE_INFINITY)).toEqual({
            ok: false,
            error: "invalid timestamp: Infinity",
        })
    })

    it("marks invalid timestamp claims as invalid checks", () => {
        const checks = checkClaims({ exp: "not-a-number", nbf: {}, iat: 253_402_300_800 }, labels)

        expect(checks).toEqual([
            { label: "exp", status: "invalid", value: "invalid timestamp: not-a-number" },
            { label: "nbf", status: "invalid", value: "invalid timestamp: [object Object]" },
            { label: "iat", status: "invalid", value: "timestamp out of range: 253402300800" },
        ])
    })

    it("formats valid timestamp claims", () => {
        const parsed = parseUnixTimestampClaim(1_704_067_200)

        expect(parsed).toEqual({
            ok: true,
            seconds: 1_704_067_200,
            iso: "2024-01-01T00:00:00.000Z",
        })
    })
})
