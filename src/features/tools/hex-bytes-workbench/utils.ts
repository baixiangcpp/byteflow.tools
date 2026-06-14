import { measureUtf8Bytes, PHASE4_LIMITS } from "@/core/utils/phase4-inspector-limits"

export type ByteInputMode = "text" | "hex" | "base64"

export interface ByteRow {
    offset: number
    hex: string
    decimal: number
    binary: string
    ascii: string
}

export interface ByteWorkbenchResult {
    ok: boolean
    bytes: number[]
    text: string
    hex: string
    compactHex: string
    base64: string
    rows: ByteRow[]
    stats: {
        byteLength: number
        printableAscii: number
        nullBytes: number
        highBytes: number
    }
    truncated: boolean
    warnings: string[]
    error?: string
}

const HEX_BYTES_RAW_INPUT_TOO_LARGE = "Input is too large for the local Hex/Bytes Workbench."
const HEX_BYTES_ROWS_TRUNCATED = "Byte rows truncated for performance. Grouped hex, Base64, UTF-8 text, and stats still reflect the full inspected input."

function encodeBase64(bytes: number[]): string {
    if (typeof btoa === "function") {
        let binary = ""
        for (const byte of bytes) binary += String.fromCharCode(byte)
        return btoa(binary)
    }
    if (typeof Buffer !== "undefined") {
        return Buffer.from(bytes).toString("base64")
    }
    return ""
}

function decodeBase64(value: string): number[] {
    const normalized = value.trim().replace(/\s+/g, "")
    if (!normalized) return []
    if (!/^[A-Za-z0-9+/=_-]+$/.test(normalized)) {
        throw new Error("Input is not valid Base64.")
    }
    const padded = normalized.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(normalized.length / 4) * 4, "=")
    const binary = typeof atob === "function"
        ? atob(padded)
        : typeof Buffer !== "undefined"
            ? Buffer.from(padded, "base64").toString("binary")
            : ""
    return Array.from(binary, (char) => char.charCodeAt(0))
}

export function parseHexBytes(value: string): number[] {
    const compact = value
        .replace(/0x/gi, "")
        .replace(/[^0-9a-fA-F]/g, "")

    if (!compact) return []
    if (compact.length % 2 !== 0) {
        throw new Error("Hex input must contain an even number of digits.")
    }

    const bytes: number[] = []
    for (let index = 0; index < compact.length; index += 2) {
        bytes.push(Number.parseInt(compact.slice(index, index + 2), 16))
    }
    return bytes
}

export function bytesToGroupedHex(bytes: number[], groupSize = 16): string {
    return bytes
        .map((byte) => byte.toString(16).padStart(2, "0").toUpperCase())
        .reduce<string[]>((lines, hex, index) => {
            const lineIndex = Math.floor(index / groupSize)
            lines[lineIndex] = lines[lineIndex] ? `${lines[lineIndex]} ${hex}` : hex
            return lines
        }, [])
        .join("\n")
}

function bytesToText(bytes: number[]): string {
    if (bytes.length === 0) return ""
    return new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(bytes))
}

function bytesToRows(bytes: number[], maxRows: number): ByteRow[] {
    return bytes.slice(0, maxRows).map((byte, offset) => ({
        offset,
        hex: byte.toString(16).padStart(2, "0").toUpperCase(),
        decimal: byte,
        binary: byte.toString(2).padStart(8, "0"),
        ascii: byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ".",
    }))
}

export function inspectBytes(input: string, mode: ByteInputMode): ByteWorkbenchResult {
    try {
        if (measureUtf8Bytes(input, PHASE4_LIMITS.maxHexBytesRawInputBytes).exceeded) {
            throw new Error(HEX_BYTES_RAW_INPUT_TOO_LARGE)
        }
        const bytes = mode === "text"
            ? Array.from(new TextEncoder().encode(input))
            : mode === "hex"
                ? parseHexBytes(input)
                : decodeBase64(input)
        const compactHex = bytes.map((byte) => byte.toString(16).padStart(2, "0").toUpperCase()).join("")
        const truncated = bytes.length > PHASE4_LIMITS.maxHexBytesRows
        const rows = bytesToRows(bytes, PHASE4_LIMITS.maxHexBytesRows)
        return {
            ok: true,
            bytes,
            text: bytesToText(bytes),
            hex: bytesToGroupedHex(bytes),
            compactHex,
            base64: encodeBase64(bytes),
            rows,
            truncated,
            warnings: truncated ? [HEX_BYTES_ROWS_TRUNCATED] : [],
            stats: {
                byteLength: bytes.length,
                printableAscii: bytes.filter((byte) => byte >= 32 && byte <= 126).length,
                nullBytes: bytes.filter((byte) => byte === 0).length,
                highBytes: bytes.filter((byte) => byte >= 128).length,
            },
        }
    } catch (error) {
        return {
            ok: false,
            bytes: [],
            text: "",
            hex: "",
            compactHex: "",
            base64: "",
            rows: [],
            stats: { byteLength: 0, printableAscii: 0, nullBytes: 0, highBytes: 0 },
            truncated: false,
            warnings: [],
            error: error instanceof Error ? error.message : "Unable to parse byte input.",
        }
    }
}
