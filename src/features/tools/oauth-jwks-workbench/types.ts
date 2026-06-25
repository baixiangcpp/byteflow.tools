export type PkcePair = {
    verifier: string
    challenge: string
    method: "S256"
}

export type JwksKeySummary = {
    index: number
    selector: string
    kid: string
    kty: string
    alg?: string
    use?: string
    keyOps: string[]
}

export type JwksVerificationOptions = {
    selectedKey?: string
}

export type JwtJwksVerificationReport = {
    valid: boolean
    selectedKid?: string
    selectedKey: string
    algorithm?: string
    message: string
    warnings: string[]
}
