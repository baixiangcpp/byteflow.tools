import { describe, expect, it, vi } from "vitest"
import { generatePkcePair, summarizeJwks } from "./logic"

describe("oauth-jwks-workbench logic", () => {
    it("generates local PKCE verifier and S256 challenge", async () => {
        vi.spyOn(crypto, "getRandomValues").mockImplementation((array) => {
            const bytes = array as Uint8Array
            bytes.fill(7)
            return array
        })
        const pair = await generatePkcePair(32)
        expect(pair.method).toBe("S256")
        expect(pair.verifier.length).toBeGreaterThan(32)
        expect(pair.challenge).toMatch(/^[A-Za-z0-9_-]+$/)
        vi.restoreAllMocks()
    })

    it("summarizes pasted JWKS key sets", () => {
        const keys = summarizeJwks('{"keys":[{"kty":"RSA","kid":"main","alg":"RS256","use":"sig"}]}')
        expect(keys[0]).toMatchObject({ kid: "main", kty: "RSA", alg: "RS256" })
    })

    it("rejects JWKS without keys array", () => {
        expect(() => summarizeJwks("{}")).toThrow("keys array")
    })
})
