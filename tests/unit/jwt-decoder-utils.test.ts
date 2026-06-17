import { describe, expect, it } from "vitest"
import { decodeJwtParts } from "@/features/tools/jwt-decoder/utils"

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
    })

    it("throws for invalid JWT input", () => {
        expect(() => decodeJwtParts("not-a-jwt")).toThrow()
    })
})
