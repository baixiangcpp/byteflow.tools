export type PkcePair = {
    verifier: string
    challenge: string
    method: "S256"
}

export type JwksKeySummary = {
    kid: string
    kty: string
    alg?: string
    use?: string
    keyOps: string[]
}

export type JwtJwksVerificationReport = {
    valid: boolean
    selectedKid?: string
    algorithm?: string
    message: string
    warnings: string[]
}

