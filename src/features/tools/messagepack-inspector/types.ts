export type MessagePackInputMode = "hex" | "base64"

export type MessagePackDecodeReport = {
    value: unknown
    json: string
    bytes: number
    summary: string
}

