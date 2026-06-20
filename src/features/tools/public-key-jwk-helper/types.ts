export type PublicKeyInputFormat = "pem" | "jwk"
export type PublicKeyOutputFormat = "pem" | "jwk"

export type PublicKeyConversionOptions = {
    inputFormat: PublicKeyInputFormat
    outputFormat: PublicKeyOutputFormat
}

export type PublicKeySummary = {
    keyType: string
    algorithm: string
    curve?: string
    modulusBits?: number
    keyUse?: string
    keyOps: string[]
    kid?: string
    thumbprint: string
}

export type PublicKeyConversionResult = {
    output: string
    summary: PublicKeySummary
}
