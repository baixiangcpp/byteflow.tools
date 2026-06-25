import type { JwksKeySummary, JwksVerificationOptions, JwtJwksVerificationReport, PkcePair } from "./types"

function bytesToBase64Url(bytes: Uint8Array): string {
    let binary = ""
    for (const byte of bytes) binary += String.fromCharCode(byte)
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function base64UrlToBytes(input: string): Uint8Array {
    const base64 = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(input.length / 4) * 4, "=")
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
    return bytes
}

function asBufferSource(bytes: Uint8Array): BufferSource {
    const copy = new Uint8Array(bytes.byteLength)
    copy.set(bytes)
    return copy.buffer
}

export async function generatePkcePair(byteLength = 64): Promise<PkcePair> {
    const length = Math.max(32, Math.min(96, Math.floor(byteLength)))
    const random = new Uint8Array(length)
    crypto.getRandomValues(random)
    const verifier = bytesToBase64Url(random)
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))
    return {
        verifier,
        challenge: bytesToBase64Url(new Uint8Array(digest)),
        method: "S256",
    }
}

function parseJwtHeader(token: string): Record<string, unknown> {
    const parts = token.trim().split(".")
    if (parts.length !== 3) throw new Error("JWT must contain header, payload, and signature.")
    return JSON.parse(new TextDecoder().decode(base64UrlToBytes(parts[0]))) as Record<string, unknown>
}

export function summarizeJwks(jwksInput: string): JwksKeySummary[] {
    const parsed = JSON.parse(jwksInput) as { keys?: unknown[] }
    if (!Array.isArray(parsed.keys)) throw new Error("JWKS must contain a keys array.")
    return parsed.keys.map((entry, index) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new Error(`keys[${index}] must be a JWK object.`)
        const jwk = entry as JsonWebKey & { kid?: string }
        if (typeof jwk.kty !== "string") throw new Error(`keys[${index}].kty is required.`)
        const kid = typeof jwk.kid === "string" ? jwk.kid : `(no kid ${index})`
        return {
            index,
            selector: typeof jwk.kid === "string" ? jwk.kid : `#${index}`,
            kid,
            kty: jwk.kty,
            alg: typeof jwk.alg === "string" ? jwk.alg : undefined,
            use: typeof jwk.use === "string" ? jwk.use : undefined,
            keyOps: Array.isArray(jwk.key_ops) ? jwk.key_ops.map(String) : [],
        }
    })
}

function parseJwksKeys(jwksInput: string): Array<JsonWebKey & { kid?: string }> {
    const parsed = JSON.parse(jwksInput) as { keys?: JsonWebKey[] }
    if (!Array.isArray(parsed.keys)) throw new Error("JWKS must contain a keys array.")
    return parsed.keys.map((key) => key as JsonWebKey & { kid?: string })
}

function selectedKeyMatches(key: JsonWebKey & { kid?: string }, index: number, selectedKey: string): boolean {
    return key.kid === selectedKey || selectedKey === `#${index}` || selectedKey === String(index)
}

function findJwkForJwt(jwksInput: string, token: string, options: JwksVerificationOptions = {}): { jwk: JsonWebKey & { kid?: string }; selectedKey: string } {
    const header = parseJwtHeader(token)
    const keys = parseJwksKeys(jwksInput)
    const selectedKey = options.selectedKey?.trim()
    const kid = typeof header.kid === "string" ? header.kid : undefined
    const alg = typeof header.alg === "string" ? header.alg : undefined
    const matches = keys
        .map((key, index) => ({ key, index }))
        .filter(({ key, index }) => {
            if (selectedKey && !selectedKeyMatches(key, index, selectedKey)) return false
            if (!selectedKey && kid && key.kid !== kid) return false
            if (!selectedKey && alg && key.alg && key.alg !== alg) return false
            return true
        })
    if (matches.length === 0) {
        if (selectedKey) throw new Error(`No JWKS key matches selected key ${selectedKey}.`)
        throw new Error(kid ? `No JWKS key matches kid ${kid}.` : "No compatible JWKS key found.")
    }
    const selected = matches[0]
    return {
        jwk: selected.key,
        selectedKey: selected.key.kid ?? `#${selected.index}`,
    }
}

function algorithmForJwt(alg: string): AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams {
    if (alg === "RS256") return { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }
    if (alg === "RS384") return { name: "RSASSA-PKCS1-v1_5", hash: "SHA-384" }
    if (alg === "RS512") return { name: "RSASSA-PKCS1-v1_5", hash: "SHA-512" }
    if (alg === "ES256") return { name: "ECDSA", namedCurve: "P-256" }
    if (alg === "ES384") return { name: "ECDSA", namedCurve: "P-384" }
    throw new Error(`Unsupported JWT algorithm for JWKS verification: ${alg}.`)
}

export async function verifyJwtWithJwks(token: string, jwksInput: string, options: JwksVerificationOptions = {}): Promise<JwtJwksVerificationReport> {
    const parts = token.trim().split(".")
    const warnings: string[] = []
    if (parts.length !== 3) throw new Error("JWT must contain header, payload, and signature.")
    const header = parseJwtHeader(token)
    const alg = typeof header.alg === "string" ? header.alg : ""
    const { jwk, selectedKey } = findJwkForJwt(jwksInput, token, options)
    if (options.selectedKey?.trim() && typeof header.kid === "string" && jwk.kid !== header.kid) {
        warnings.push(`Selected JWK kid ${jwk.kid ?? selectedKey} does not match JWT kid ${header.kid}.`)
    }
    if (jwk.use && jwk.use !== "sig") warnings.push("Selected JWK use is not sig.")
    if (jwk.alg && jwk.alg !== alg) warnings.push(`Selected JWK alg ${jwk.alg} does not match JWT alg ${alg}.`)
    const algorithm = algorithmForJwt(alg)
    const key = await crypto.subtle.importKey("jwk", jwk, algorithm, false, ["verify"])
    const signature = base64UrlToBytes(parts[2])
    const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
    const verifyAlgorithm = alg.startsWith("ES") ? { name: "ECDSA", hash: alg === "ES384" ? "SHA-384" : "SHA-256" } : algorithm
    const valid = await crypto.subtle.verify(verifyAlgorithm, key, asBufferSource(signature), asBufferSource(data))
    return {
        valid,
        selectedKid: jwk.kid,
        selectedKey,
        algorithm: alg,
        message: valid ? "JWT signature matches the selected JWKS key." : "JWT signature does not match the selected JWKS key.",
        warnings,
    }
}

export function runTool(input: string): string {
    return JSON.stringify(summarizeJwks(input), null, 2)
}
