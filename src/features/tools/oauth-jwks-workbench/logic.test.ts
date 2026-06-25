import { describe, expect, it, vi } from "vitest"
import { generatePkcePair, summarizeJwks, verifyJwtWithJwks } from "./logic"

function bytesToBase64Url(bytes: Uint8Array): string {
    return Buffer.from(bytes).toString("base64url")
}

async function createSignedJwt(kid: string) {
    const keyPair = await crypto.subtle.generateKey(
        {
            name: "RSASSA-PKCS1-v1_5",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true,
        ["sign", "verify"],
    )
    const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey)
    const header = bytesToBase64Url(new TextEncoder().encode(JSON.stringify({ alg: "RS256", kid, typ: "JWT" })))
    const payload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify({ sub: "user_123", aud: "api" })))
    const signingInput = `${header}.${payload}`
    const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", keyPair.privateKey, new TextEncoder().encode(signingInput))

    return {
        token: `${signingInput}.${bytesToBase64Url(new Uint8Array(signature))}`,
        jwk: { ...publicJwk, kid, alg: "RS256", use: "sig" },
    }
}

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
        expect(keys[0]).toMatchObject({ index: 0, selector: "main", kid: "main", kty: "RSA", alg: "RS256" })
    })

    it("rejects JWKS without keys array", () => {
        expect(() => summarizeJwks("{}")).toThrow("keys array")
    })

    it("verifies a JWT signature against the selected pasted JWKS key", async () => {
        const signed = await createSignedJwt("main")
        const jwks = JSON.stringify({ keys: [signed.jwk] })

        await expect(verifyJwtWithJwks(signed.token, jwks, { selectedKey: "main" })).resolves.toMatchObject({
            valid: true,
            selectedKid: "main",
            selectedKey: "main",
            algorithm: "RS256",
            warnings: [],
        })
    })

    it("does not silently switch keys when the selected JWKS key differs from the JWT kid", async () => {
        const main = await createSignedJwt("main")
        const wrong = await createSignedJwt("wrong")
        const jwks = JSON.stringify({ keys: [main.jwk, wrong.jwk] })

        const report = await verifyJwtWithJwks(main.token, jwks, { selectedKey: "wrong" })

        expect(report).toMatchObject({
            valid: false,
            selectedKid: "wrong",
            selectedKey: "wrong",
            algorithm: "RS256",
        })
        expect(report.warnings.join(" ")).toContain("does not match JWT kid main")
    })
})
