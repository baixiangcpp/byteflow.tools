import type {
    PublicKeyConversionOptions,
    PublicKeyConversionResult,
    PublicKeyInputFormat,
    PublicKeyOutputFormat,
    PublicKeySummary,
} from "./types"
import { bytesToBase64Url } from "@/core/jwt/base64url"

const RSA_HASH_ALGORITHMS = ["SHA-256", "SHA-384", "SHA-512"] as const
const EC_CURVES = ["P-256", "P-384", "P-521"] as const
const ED_CURVES = ["Ed25519"] as const

type PublicJwk = JsonWebKey & {
    kty: string
    kid?: string
}

type BufferConstructorLike = {
    from(value: Uint8Array<ArrayBuffer>): Uint8Array
}

function bytesToBase64(bytes: Uint8Array): string {
    let binary = ""
    for (const byte of bytes) binary += String.fromCharCode(byte)
    return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
    const binary = atob(value)
    const bytes = new Uint8Array(binary.length) as Uint8Array<ArrayBuffer>
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index)
    }
    return bytes
}

function formatPem(label: string, bytes: Uint8Array): string {
    const body = bytesToBase64(bytes).replace(/.{1,64}/g, "$&\n").trim()
    return `-----BEGIN ${label}-----\n${body}\n-----END ${label}-----`
}

function pemToDerBytes(input: string): Uint8Array<ArrayBuffer> {
    const match = input.match(/-----BEGIN ([A-Z ]+)-----([\s\S]+?)-----END \1-----/)
    if (!match) {
        throw new Error("Input must be a PEM encoded public key.")
    }
    if (match[1] !== "PUBLIC KEY") {
        throw new Error("Only SPKI public key PEM blocks are supported.")
    }

    const body = match[2].replace(/\s+/g, "")
    if (!body || /[^A-Za-z0-9+/=]/.test(body)) {
        throw new Error("Input must be a valid PEM encoded public key.")
    }

    return base64ToBytes(body)
}

function toSpkiImportData(bytes: Uint8Array<ArrayBuffer>): BufferSource {
    const { Buffer: bufferConstructor } = globalThis as typeof globalThis & { Buffer?: BufferConstructorLike }
    return (bufferConstructor ? bufferConstructor.from(bytes) : bytes) as BufferSource
}

function canonicalJson(value: unknown): string {
    if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`
    if (value && typeof value === "object") {
        return `{${Object.entries(value as Record<string, unknown>)
            .filter(([, entryValue]) => entryValue !== undefined)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entryValue]) => `${JSON.stringify(key)}:${canonicalJson(entryValue)}`)
            .join(",")}}`
    }
    return JSON.stringify(value)
}

function prettyJson(value: unknown): string {
    return `${JSON.stringify(value, null, 2)}\n`
}

function assertPublicJwk(value: unknown): asserts value is PublicJwk {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("Input must be a public JWK object.")
    }

    const jwk = value as Record<string, unknown>
    if (typeof jwk.kty !== "string") {
        throw new Error("Input must be a public JWK object.")
    }
    if (typeof jwk.d === "string" || typeof jwk.p === "string" || typeof jwk.q === "string" || typeof jwk.k === "string") {
        throw new Error("Private or symmetric JWK material is not supported.")
    }
    if (jwk.kty === "RSA" && (typeof jwk.n !== "string" || typeof jwk.e !== "string")) {
        throw new Error("RSA public JWKs require n and e parameters.")
    }
    if (jwk.kty === "EC" && (typeof jwk.crv !== "string" || typeof jwk.x !== "string" || typeof jwk.y !== "string")) {
        throw new Error("EC public JWKs require crv, x, and y parameters.")
    }
    if (jwk.kty === "OKP" && (typeof jwk.crv !== "string" || typeof jwk.x !== "string")) {
        throw new Error("OKP public JWKs require crv and x parameters.")
    }
    if (!["RSA", "EC", "OKP"].includes(jwk.kty)) {
        throw new Error(`Unsupported public JWK type: ${jwk.kty}.`)
    }
}

function parseJwk(input: string): PublicJwk {
    let parsed: unknown
    try {
        parsed = JSON.parse(input)
    } catch {
        throw new Error("Input must be valid JWK JSON.")
    }
    assertPublicJwk(parsed)
    return parsed
}

function jwkThumbprintPayload(jwk: PublicJwk): Record<string, string> {
    if (jwk.kty === "RSA") {
        return {
            e: String(jwk.e),
            kty: "RSA",
            n: String(jwk.n),
        }
    }
    if (jwk.kty === "EC") {
        return {
            crv: String(jwk.crv),
            kty: "EC",
            x: String(jwk.x),
            y: String(jwk.y),
        }
    }
    return {
        crv: String(jwk.crv),
        kty: "OKP",
        x: String(jwk.x),
    }
}

async function computeJwkThumbprint(jwk: PublicJwk): Promise<string> {
    const canonical = canonicalJson(jwkThumbprintPayload(jwk))
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical))
    return bytesToBase64Url(new Uint8Array(digest))
}

function rsaImportCandidates(jwk?: PublicJwk): RsaHashedImportParams[] {
    const keyUsages = jwk?.key_ops?.includes("encrypt") || jwk?.use === "enc" ? ["RSA-OAEP"] : ["RSASSA-PKCS1-v1_5", "RSA-PSS", "RSA-OAEP"]
    return keyUsages.flatMap((name) => RSA_HASH_ALGORITHMS.map((hash) => ({ name, hash })))
}

function ecImportCandidates(jwk?: PublicJwk): EcKeyImportParams[] {
    const curve = typeof jwk?.crv === "string" ? jwk.crv : undefined
    const curves = EC_CURVES.includes(curve as (typeof EC_CURVES)[number]) ? [curve as (typeof EC_CURVES)[number]] : [...EC_CURVES]
    return curves.flatMap((namedCurve) => [
        { name: "ECDSA", namedCurve },
        { name: "ECDH", namedCurve },
    ])
}

function okpImportCandidates(jwk?: PublicJwk): AlgorithmIdentifier[] {
    const curve = typeof jwk?.crv === "string" ? jwk.crv : undefined
    if (!ED_CURVES.includes(curve as (typeof ED_CURVES)[number])) return []
    return [{ name: curve as (typeof ED_CURVES)[number] }]
}

function importCandidates(inputFormat: PublicKeyInputFormat, jwk?: PublicJwk): AlgorithmIdentifier[] {
    if (inputFormat === "jwk" && jwk?.kty === "RSA") return rsaImportCandidates(jwk)
    if (inputFormat === "jwk" && jwk?.kty === "EC") return ecImportCandidates(jwk)
    if (inputFormat === "jwk" && jwk?.kty === "OKP") return okpImportCandidates(jwk)
    return [...rsaImportCandidates(), ...ecImportCandidates()]
}

async function importPublicKey(input: string, inputFormat: PublicKeyInputFormat): Promise<{ key: CryptoKey; jwkHint?: PublicJwk }> {
    const jwk = inputFormat === "jwk" ? parseJwk(input) : undefined
    const spki = inputFormat === "pem" ? pemToDerBytes(input) : undefined
    const errors: string[] = []

    for (const algorithm of importCandidates(inputFormat, jwk)) {
        try {
            const key = inputFormat === "jwk"
                ? await crypto.subtle.importKey("jwk", jwk!, algorithm, true, [])
                : await crypto.subtle.importKey("spki", toSpkiImportData(spki!), algorithm, true, [])
            return { key, jwkHint: jwk }
        } catch (error) {
            errors.push(error instanceof Error ? error.message : String(error))
        }
    }

    throw new Error(errors[0] || "Unable to import public key.")
}

function normalizeJwk(jwk: JsonWebKey): PublicJwk {
    assertPublicJwk(jwk)
    return jwk
}

function mergePublicJwkMetadata(jwk: PublicJwk, hint?: PublicJwk): PublicJwk {
    if (!hint) return jwk

    const merged: PublicJwk = { ...jwk }
    if (typeof hint.kid === "string") merged.kid = hint.kid
    if (typeof hint.use === "string") merged.use = hint.use
    if (typeof hint.alg === "string") merged.alg = hint.alg
    if (Array.isArray(hint.key_ops)) merged.key_ops = hint.key_ops.map(String)
    assertPublicJwk(merged)
    return merged
}

function modulusBits(jwk: PublicJwk): number | undefined {
    if (jwk.kty !== "RSA" || typeof jwk.n !== "string") return undefined
    return Math.floor((jwk.n.length * 6) / 8) * 8
}

function algorithmLabel(key: CryptoKey, jwk: PublicJwk): string {
    const algorithm = key.algorithm as KeyAlgorithm & { hash?: string | Algorithm; namedCurve?: string }
    if (jwk.kty === "RSA" && algorithm.hash) {
        const hash = algorithm.hash
        return `${algorithm.name} / ${typeof hash === "string" ? hash : hash.name}`
    }
    if (jwk.kty === "EC" && algorithm.namedCurve) {
        return `${algorithm.name} / ${algorithm.namedCurve}`
    }
    return algorithm.name
}

async function summarizePublicKey(key: CryptoKey, jwk: PublicJwk): Promise<PublicKeySummary> {
    return {
        keyType: jwk.kty,
        algorithm: algorithmLabel(key, jwk),
        curve: typeof jwk.crv === "string" ? jwk.crv : undefined,
        modulusBits: modulusBits(jwk),
        keyUse: typeof jwk.use === "string" ? jwk.use : undefined,
        keyOps: Array.isArray(jwk.key_ops) ? jwk.key_ops.map(String) : [],
        kid: typeof jwk.kid === "string" ? jwk.kid : undefined,
        thumbprint: await computeJwkThumbprint(jwk),
    }
}

function formatSummary(summary: PublicKeySummary): string {
    return [
        `Key type: ${summary.keyType}`,
        `Algorithm: ${summary.algorithm}`,
        summary.curve ? `Curve: ${summary.curve}` : undefined,
        summary.modulusBits ? `Modulus bits: ${summary.modulusBits}` : undefined,
        summary.keyUse ? `Use: ${summary.keyUse}` : undefined,
        summary.keyOps.length > 0 ? `Key operations: ${summary.keyOps.join(", ")}` : undefined,
        summary.kid ? `Key ID: ${summary.kid}` : undefined,
        `JWK thumbprint (SHA-256): ${summary.thumbprint}`,
    ].filter(Boolean).join("\n")
}

export async function inspectPublicKey(input: string, inputFormat: PublicKeyInputFormat): Promise<PublicKeySummary> {
    const { key, jwkHint } = await importPublicKey(input, inputFormat)
    const jwk = mergePublicJwkMetadata(normalizeJwk(await crypto.subtle.exportKey("jwk", key)), jwkHint)
    return summarizePublicKey(key, jwk)
}

export async function convertPublicKey(input: string, options: PublicKeyConversionOptions): Promise<PublicKeyConversionResult> {
    if (!input.trim()) {
        throw new Error("Input is required.")
    }

    const { key, jwkHint } = await importPublicKey(input, options.inputFormat)
    const jwk = mergePublicJwkMetadata(normalizeJwk(await crypto.subtle.exportKey("jwk", key)), jwkHint)
    const summary = await summarizePublicKey(key, jwk)

    if (options.outputFormat === "jwk") {
        return {
            output: prettyJson(jwk),
            summary,
        }
    }

    const spki = await crypto.subtle.exportKey("spki", key)
    return {
        output: `${formatPem("PUBLIC KEY", new Uint8Array(spki))}\n`,
        summary,
    }
}

export async function runTool(
    input: string,
    inputFormat: PublicKeyInputFormat = "pem",
    outputFormat: PublicKeyOutputFormat = "jwk",
): Promise<string> {
    const result = await convertPublicKey(input, { inputFormat, outputFormat })
    return `${result.output}\n${formatSummary(result.summary)}`
}

export { formatSummary }
