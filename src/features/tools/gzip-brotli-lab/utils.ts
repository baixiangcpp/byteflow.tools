export type CompressionFormatName = "gzip" | "deflate" | "brotli"
export type CompressionMode = "compress" | "decompress"
export type BinaryEncoding = "base64" | "text"

export interface CompressionResult {
    output: string
    inputBytes: number
    outputBytes: number
    ratio: number
    warning?: string
}

const FORMAT_TO_STREAM: Record<CompressionFormatName, string> = {
    gzip: "gzip",
    deflate: "deflate",
    brotli: "br",
}

function bytesToBase64(bytes: Uint8Array): string {
    let binary = ""
    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte)
    })
    return btoa(binary)
}

function base64ToBytes(base64: string): Uint8Array {
    const normalized = base64.trim()
    const binary = atob(normalized)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index)
    }
    return bytes
}

async function streamBytes(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
    const writer = stream.writable.getWriter()
    const inputBuffer = new ArrayBuffer(bytes.byteLength)
    const inputView = new Uint8Array(inputBuffer)
    inputView.set(bytes)

    const writePromise = (async () => {
        await writer.write(inputView)
        await writer.close()
    })()

    const readPromise = (async () => {
        const chunks: Uint8Array[] = []
        const reader = stream.readable.getReader()
        while (true) {
            const { value, done } = await reader.read()
            if (done) break
            chunks.push(value)
        }
        return chunks
    })()

    const [, chunks] = await Promise.all([writePromise, readPromise])

    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
    const result = new Uint8Array(totalLength)
    let offset = 0
    chunks.forEach((chunk) => {
        result.set(chunk, offset)
        offset += chunk.length
    })
    return result
}

export function hasCompressionStreamSupport(format: CompressionFormatName): boolean {
    if (typeof CompressionStream === "undefined" || typeof DecompressionStream === "undefined") return false

    try {
        const streamFormat = FORMAT_TO_STREAM[format]
        new CompressionStream(streamFormat as CompressionFormat)
        new DecompressionStream(streamFormat as CompressionFormat)
        return true
    } catch {
        return false
    }
}

export async function runCompressionLab(
    input: string,
    options: {
        mode: CompressionMode
        format: CompressionFormatName
        inputEncoding: BinaryEncoding
        outputEncoding: BinaryEncoding
    },
): Promise<CompressionResult> {
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    const streamFormat = FORMAT_TO_STREAM[options.format]

    if (!hasCompressionStreamSupport(options.format)) {
        throw new Error(`${options.format.toUpperCase()} is not supported by this browser runtime.`)
    }

    const inputBytes = options.mode === "compress" || options.inputEncoding === "text"
        ? encoder.encode(input)
        : base64ToBytes(input)

    const stream = options.mode === "compress"
        ? new CompressionStream(streamFormat as CompressionFormat)
        : new DecompressionStream(streamFormat as CompressionFormat)

    const outputBytes = await streamBytes(inputBytes, stream)
    const output = options.mode === "compress" || options.outputEncoding === "base64"
        ? bytesToBase64(outputBytes)
        : decoder.decode(outputBytes)

    return {
        output,
        inputBytes: inputBytes.length,
        outputBytes: outputBytes.length,
        ratio: inputBytes.length === 0 ? 0 : outputBytes.length / inputBytes.length,
        warning: options.format === "brotli" ? "Brotli depends on browser CompressionStream('br') support." : undefined,
    }
}

export function formatByteSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function validateBase64Input(value: string): boolean {
    if (!value.trim()) return false
    try {
        base64ToBytes(value)
        return true
    } catch {
        return false
    }
}
