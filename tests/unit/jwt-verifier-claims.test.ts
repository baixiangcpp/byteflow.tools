import { describe, expect, it } from "vitest"
import {
    checkClaims,
    classifyJwtVerificationAlgorithm,
    parseUnixTimestampClaim,
    verifyJwtSignature,
    type JwtClaimLabels,
} from "@/features/tools/jwt-verifier/logic"
import { signHmac, encodeJsonSegment } from "@/features/tools/jwt-workbench/logic"

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

    it("classifies supported, unsupported, and unsigned JWT algorithms distinctly", () => {
        expect(classifyJwtVerificationAlgorithm("HS256")).toBe("hmac")
        expect(classifyJwtVerificationAlgorithm("RS256")).toBe("unsupported")
        expect(classifyJwtVerificationAlgorithm("ES256")).toBe("unsupported")
        expect(classifyJwtVerificationAlgorithm("none")).toBe("unsigned")
        expect(classifyJwtVerificationAlgorithm(123)).toBe("unsupported")
        expect(classifyJwtVerificationAlgorithm({ name: "HS256" })).toBe("unsupported")
    })

    it("verifies HMAC signatures without treating unsupported algorithms as invalid", async () => {
        const header = encodeJsonSegment({ alg: "HS256", typ: "JWT" })
        const payload = encodeJsonSegment({ sub: "alice" })
        const signingInput = `${header}.${payload}`
        const token = `${signingInput}.${await signHmac(signingInput, "correct", "HS256")}`

        await expect(verifyJwtSignature(token, "correct", "HS256")).resolves.toEqual({ status: "valid", algorithm: "HS256" })
        await expect(verifyJwtSignature(token, "wrong", "HS256")).resolves.toEqual({ status: "invalid", algorithm: "HS256" })
        await expect(verifyJwtSignature(token, "ignored", "RS256")).resolves.toEqual({ status: "unsupported", algorithm: "RS256" })
        await expect(verifyJwtSignature(token, "ignored", 123)).resolves.toEqual({ status: "unsupported", algorithm: "non-string alg" })
        await expect(verifyJwtSignature(`${encodeJsonSegment({ alg: "none" })}.${payload}.`, "", "none")).resolves.toEqual({ status: "unsigned", algorithm: "none" })
    })
})
