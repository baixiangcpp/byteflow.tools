import { describe, expect, it } from "vitest"
import { convertPublicKey, inspectPublicKey, runTool } from "./logic"
import { SAMPLE_PUBLIC_JWK, SAMPLE_PUBLIC_KEY_PEM } from "./samples"

describe("public-key-jwk-helper logic", () => {
    it("converts SPKI PEM public keys to JWK and reports a stable thumbprint", async () => {
        const result = await convertPublicKey(SAMPLE_PUBLIC_KEY_PEM, { inputFormat: "pem", outputFormat: "jwk" })
        const jwk = JSON.parse(result.output) as JsonWebKey

        expect(jwk).toMatchObject({
            kty: "EC",
            crv: "P-256",
            x: "41_OY9-aOsLQUGBaMMvqp3iWkY8MSUnX_JH1ltblBFk",
            y: "Y__kUHodsLAnxer0TbUN6YPlp2pEa6tMtuZhO1IFMXQ",
        })
        expect(jwk).not.toHaveProperty("d")
        expect(result.summary).toMatchObject({
            keyType: "EC",
            curve: "P-256",
            thumbprint: "K8JlQcU6WJq4MFbMa0cEFADDTOMRrrG1yj0K3Xs2-4g",
        })
    })

    it("converts public JWKs to SPKI PEM and preserves public-key identity", async () => {
        const result = await convertPublicKey(SAMPLE_PUBLIC_JWK, { inputFormat: "jwk", outputFormat: "pem" })

        expect(result.output).toContain("-----BEGIN PUBLIC KEY-----")
        expect(result.output).toContain("-----END PUBLIC KEY-----")

        const roundTrip = await convertPublicKey(result.output, { inputFormat: "pem", outputFormat: "jwk" })
        expect(JSON.parse(roundTrip.output)).toMatchObject({
            kty: "EC",
            crv: "P-256",
            x: "41_OY9-aOsLQUGBaMMvqp3iWkY8MSUnX_JH1ltblBFk",
            y: "Y__kUHodsLAnxer0TbUN6YPlp2pEa6tMtuZhO1IFMXQ",
        })
        expect(roundTrip.summary.thumbprint).toBe(result.summary.thumbprint)
    })

    it("inspects a JWK without changing output format", async () => {
        await expect(inspectPublicKey(SAMPLE_PUBLIC_JWK, "jwk")).resolves.toMatchObject({
            keyType: "EC",
            algorithm: "ECDSA / P-256",
            thumbprint: "K8JlQcU6WJq4MFbMa0cEFADDTOMRrrG1yj0K3Xs2-4g",
        })
    })

    it("returns combined conversion output and summary for pipeline-style callers", async () => {
        await expect(runTool(SAMPLE_PUBLIC_KEY_PEM)).resolves.toContain("JWK thumbprint (SHA-256): K8JlQcU6WJq4MFbMa0cEFADDTOMRrrG1yj0K3Xs2-4g")
    })

    it("rejects malformed PEM and JWK inputs", async () => {
        await expect(convertPublicKey("not a pem", { inputFormat: "pem", outputFormat: "jwk" })).rejects.toThrow("PEM encoded public key")
        await expect(convertPublicKey("{", { inputFormat: "jwk", outputFormat: "pem" })).rejects.toThrow("valid JWK JSON")
    })

    it("rejects private and symmetric JWK material", async () => {
        const privateJwk = {
            ...JSON.parse(SAMPLE_PUBLIC_JWK),
            d: "private-coordinate",
        }
        const symmetricJwk = {
            kty: "oct",
            k: "secret",
        }

        await expect(convertPublicKey(JSON.stringify(privateJwk), { inputFormat: "jwk", outputFormat: "pem" })).rejects.toThrow("Private or symmetric JWK material")
        await expect(convertPublicKey(JSON.stringify(symmetricJwk), { inputFormat: "jwk", outputFormat: "pem" })).rejects.toThrow("Private or symmetric JWK material")
    })
})
