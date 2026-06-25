import type { MessagePackDecodeReport, MessagePackInputMode } from "./types"

class Reader {
    offset = 0
    constructor(readonly bytes: Uint8Array) {}

    remaining(): number {
        return this.bytes.length - this.offset
    }

    readByte(): number {
        if (this.offset >= this.bytes.length) throw new Error("Unexpected end of MessagePack payload.")
        return this.bytes[this.offset++]
    }

    readBytes(length: number): Uint8Array {
        if (this.offset + length > this.bytes.length) throw new Error("Unexpected end of MessagePack payload.")
        const slice = this.bytes.slice(this.offset, this.offset + length)
        this.offset += length
        return slice
    }

    readUInt16(): number {
        const bytes = this.readBytes(2)
        return (bytes[0] << 8) | bytes[1]
    }

    readInt8(): number {
        const value = this.readByte()
        return value > 0x7f ? value - 0x100 : value
    }

    readInt16(): number {
        const value = this.readUInt16()
        return value > 0x7fff ? value - 0x10000 : value
    }

    readUInt32(): number {
        const bytes = this.readBytes(4)
        return readUInt32FromBytes(bytes)
    }

    readInt32(): number {
        const value = this.readUInt32()
        return value > 0x7fffffff ? value - 2 ** 32 : value
    }

    readUInt64String(): string {
        return unsignedBytesToDecimal(this.readBytes(8))
    }

    readInt64String(): string {
        return signedBytesToDecimal(this.readBytes(8))
    }

    readFloat32(): number {
        const bytes = this.readBytes(4)
        return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getFloat32(0, false)
    }

    readFloat64(): number {
        const bytes = this.readBytes(8)
        return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getFloat64(0, false)
    }
}

type MessagePackBinaryValue = {
    type: "binary"
    length: number
    hex: string
    base64: string
}

type MessagePackExtensionValue = {
    type: "extension"
    extensionType: number
    length: number
    hex: string
    base64: string
}

type MessagePackInteger64Value = {
    type: "uint64" | "int64"
    value: string
}

type MessagePackSpecialFloatValue = {
    type: "float32" | "float64"
    value: string
}

type MessagePackTimestampValue = {
    type: "timestamp"
    extensionType: -1
    length: number
    seconds: string
    nanoseconds: number
    iso?: string
    hex: string
}

function readUInt32FromBytes(bytes: Uint8Array, offset = 0): number {
    return bytes[offset] * 2 ** 24 + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3]
}

function multiplyDecimalBySmall(value: string, multiplier: number): string {
    let carry = 0
    let output = ""
    for (let index = value.length - 1; index >= 0; index -= 1) {
        const product = Number(value[index]) * multiplier + carry
        output = String(product % 10) + output
        carry = Math.floor(product / 10)
    }
    while (carry > 0) {
        output = String(carry % 10) + output
        carry = Math.floor(carry / 10)
    }
    return output.replace(/^0+(?=\d)/, "")
}

function addSmallToDecimal(value: string, addend: number): string {
    let carry = addend
    let output = ""
    for (let index = value.length - 1; index >= 0; index -= 1) {
        const sum = Number(value[index]) + carry
        output = String(sum % 10) + output
        carry = Math.floor(sum / 10)
    }
    while (carry > 0) {
        output = String(carry % 10) + output
        carry = Math.floor(carry / 10)
    }
    return output.replace(/^0+(?=\d)/, "")
}

function unsignedBytesToDecimal(bytes: Uint8Array): string {
    let result = "0"
    for (const byte of bytes) {
        result = addSmallToDecimal(multiplyDecimalBySmall(result, 256), byte)
    }
    return result
}

function signedBytesToDecimal(bytes: Uint8Array): string {
    if ((bytes[0] & 0x80) === 0) return unsignedBytesToDecimal(bytes)

    const magnitude = Uint8Array.from(bytes, (byte) => byte ^ 0xff)
    let carry = 1
    for (let index = magnitude.length - 1; index >= 0; index -= 1) {
        const sum = magnitude[index] + carry
        magnitude[index] = sum & 0xff
        carry = sum > 0xff ? 1 : 0
    }
    return `-${unsignedBytesToDecimal(magnitude)}`
}

function hexToBytes(input: string): Uint8Array {
    const compact = input.replace(/\s+/g, "")
    if (!compact || compact.length % 2 !== 0 || /[^0-9a-f]/i.test(compact)) {
        throw new Error("Hex input must contain an even number of hexadecimal characters.")
    }
    const bytes = new Uint8Array(compact.length / 2)
    for (let index = 0; index < compact.length; index += 2) {
        bytes[index / 2] = Number.parseInt(compact.slice(index, index + 2), 16)
    }
    return bytes
}

function base64ToBytes(input: string): Uint8Array {
    const binary = atob(input.trim())
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
    return bytes
}

function decodeUtf8(bytes: Uint8Array): string {
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes)
}

function bytesToHex(bytes: Uint8Array): string {
    let output = ""
    for (const byte of bytes) output += byte.toString(16).padStart(2, "0")
    return output
}

function bytesToBase64(bytes: Uint8Array): string {
    let binary = ""
    const chunkSize = 0x8000
    for (let index = 0; index < bytes.length; index += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
    }
    return btoa(binary)
}

function formatBinary(bytes: Uint8Array): MessagePackBinaryValue {
    return {
        type: "binary",
        length: bytes.length,
        hex: bytesToHex(bytes),
        base64: bytesToBase64(bytes),
    }
}

function formatFloat(value: number, type: "float32" | "float64"): number | MessagePackSpecialFloatValue {
    if (Number.isFinite(value)) return value
    return { type, value: String(value) }
}

function formatTimestamp(bytes: Uint8Array, seconds: string, nanoseconds: number): MessagePackTimestampValue {
    const timestamp: MessagePackTimestampValue = {
        type: "timestamp",
        extensionType: -1,
        length: bytes.length,
        seconds,
        nanoseconds,
        hex: bytesToHex(bytes),
    }
    const iso = timestampToIso(seconds, nanoseconds)
    if (iso) timestamp.iso = iso
    return timestamp
}

function timestampToIso(seconds: string, nanoseconds: number): string | undefined {
    const secondsNumber = Number(seconds)
    if (!Number.isSafeInteger(secondsNumber)) return undefined
    const milliseconds = secondsNumber * 1000 + Math.floor(nanoseconds / 1_000_000)
    if (!Number.isFinite(milliseconds) || Math.abs(milliseconds) > 8.64e15) return undefined
    return new Date(milliseconds).toISOString()
}

function decodeTimestamp(bytes: Uint8Array): MessagePackTimestampValue | null {
    if (bytes.length === 4) {
        return formatTimestamp(bytes, String(readUInt32FromBytes(bytes)), 0)
    }

    if (bytes.length === 8) {
        const nanoseconds = bytes[0] * 2 ** 22 + (bytes[1] << 14) + (bytes[2] << 6) + (bytes[3] >>> 2)
        if (nanoseconds > 999_999_999) return null
        const seconds = (bytes[3] & 0x03) * 2 ** 32 + readUInt32FromBytes(bytes, 4)
        return formatTimestamp(bytes, String(seconds), nanoseconds)
    }

    if (bytes.length === 12) {
        const nanoseconds = readUInt32FromBytes(bytes)
        if (nanoseconds > 999_999_999) return null
        return formatTimestamp(bytes, signedBytesToDecimal(bytes.slice(4)), nanoseconds)
    }

    return null
}

function decodeExtension(reader: Reader, length: number): MessagePackExtensionValue | MessagePackTimestampValue {
    const extensionType = reader.readInt8()
    const bytes = reader.readBytes(length)
    if (extensionType === -1) {
        const timestamp = decodeTimestamp(bytes)
        if (timestamp) return timestamp
    }
    return {
        type: "extension",
        extensionType,
        length: bytes.length,
        hex: bytesToHex(bytes),
        base64: bytesToBase64(bytes),
    }
}

function decodeArray(reader: Reader, length: number): unknown[] {
    if (length > reader.remaining()) throw new Error(`MessagePack array declares ${length} item(s), but only ${reader.remaining()} byte(s) remain.`)
    return Array.from({ length }, () => decodeValue(reader))
}

function decodeValue(reader: Reader): unknown {
    const prefix = reader.readByte()
    if (prefix <= 0x7f) return prefix
    if (prefix >= 0xe0) return prefix - 0x100
    if ((prefix & 0xe0) === 0xa0) return decodeUtf8(reader.readBytes(prefix & 0x1f))
    if ((prefix & 0xf0) === 0x90) return decodeArray(reader, prefix & 0x0f)
    if ((prefix & 0xf0) === 0x80) return decodeMap(reader, prefix & 0x0f)

    switch (prefix) {
        case 0xc0:
            return null
        case 0xc2:
            return false
        case 0xc3:
            return true
        case 0xc4:
            return formatBinary(reader.readBytes(reader.readByte()))
        case 0xc5:
            return formatBinary(reader.readBytes(reader.readUInt16()))
        case 0xc6:
            return formatBinary(reader.readBytes(reader.readUInt32()))
        case 0xc7:
            return decodeExtension(reader, reader.readByte())
        case 0xc8:
            return decodeExtension(reader, reader.readUInt16())
        case 0xc9:
            return decodeExtension(reader, reader.readUInt32())
        case 0xca:
            return formatFloat(reader.readFloat32(), "float32")
        case 0xcb:
            return formatFloat(reader.readFloat64(), "float64")
        case 0xcc:
            return reader.readByte()
        case 0xcd:
            return reader.readUInt16()
        case 0xce:
            return reader.readUInt32()
        case 0xcf:
            return { type: "uint64", value: reader.readUInt64String() } satisfies MessagePackInteger64Value
        case 0xd0: {
            return reader.readInt8()
        }
        case 0xd1:
            return reader.readInt16()
        case 0xd2:
            return reader.readInt32()
        case 0xd3:
            return { type: "int64", value: reader.readInt64String() } satisfies MessagePackInteger64Value
        case 0xd4:
            return decodeExtension(reader, 1)
        case 0xd5:
            return decodeExtension(reader, 2)
        case 0xd6:
            return decodeExtension(reader, 4)
        case 0xd7:
            return decodeExtension(reader, 8)
        case 0xd8:
            return decodeExtension(reader, 16)
        case 0xd9:
            return decodeUtf8(reader.readBytes(reader.readByte()))
        case 0xda:
            return decodeUtf8(reader.readBytes(reader.readUInt16()))
        case 0xdb:
            return decodeUtf8(reader.readBytes(reader.readUInt32()))
        case 0xdc:
            return decodeArray(reader, reader.readUInt16())
        case 0xdd:
            return decodeArray(reader, reader.readUInt32())
        case 0xde:
            return decodeMap(reader, reader.readUInt16())
        case 0xdf:
            return decodeMap(reader, reader.readUInt32())
        default:
            throw new Error(`Unsupported MessagePack prefix 0x${prefix.toString(16)} at byte ${reader.offset - 1}.`)
    }
}

function decodeMap(reader: Reader, length: number): Record<string, unknown> {
    if (length > Math.floor(reader.remaining() / 2)) throw new Error(`MessagePack map declares ${length} pair(s), but only ${reader.remaining()} byte(s) remain.`)
    const output: Record<string, unknown> = {}
    for (let index = 0; index < length; index += 1) {
        const key = decodeValue(reader)
        output[mapKeyToString(key)] = decodeValue(reader)
    }
    return output
}

function mapKeyToString(key: unknown): string {
    if (typeof key === "string") return key
    if (key === null || typeof key !== "object") return String(key)
    try {
        return JSON.stringify(key) ?? String(key)
    } catch {
        return String(key)
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function summarize(value: unknown): string {
    if (Array.isArray(value)) return `Decoded MessagePack array with ${value.length} item(s).`
    if (isRecord(value)) {
        if (value.type === "binary" && typeof value.length === "number") return `Decoded MessagePack binary with ${value.length} byte(s).`
        if (value.type === "extension" && typeof value.extensionType === "number" && typeof value.length === "number") {
            return `Decoded MessagePack extension type ${value.extensionType} with ${value.length} byte(s).`
        }
        if (value.type === "timestamp" && typeof value.seconds === "string") return `Decoded MessagePack timestamp at ${value.iso ?? `${value.seconds}s`}.`
        if ((value.type === "uint64" || value.type === "int64") && typeof value.value === "string") return `Decoded MessagePack ${value.type} value.`
        if ((value.type === "float32" || value.type === "float64") && typeof value.value === "string") return `Decoded MessagePack ${value.type} value.`
        return `Decoded MessagePack map with ${Object.keys(value).length} key(s).`
    }
    if (value === null) return "Decoded MessagePack nil."
    return `Decoded MessagePack ${typeof value}.`
}

export function decodeMessagePack(input: string, mode: MessagePackInputMode): MessagePackDecodeReport {
    const bytes = mode === "hex" ? hexToBytes(input) : base64ToBytes(input)
    const reader = new Reader(bytes)
    const value = decodeValue(reader)
    if (reader.offset !== bytes.length) {
        throw new Error(`Decoded first value but ${bytes.length - reader.offset} trailing byte(s) remain.`)
    }
    return {
        value,
        json: JSON.stringify(value, null, 2),
        bytes: bytes.length,
        summary: summarize(value),
    }
}

export function runTool(input: string): string {
    return decodeMessagePack(input, "hex").json
}
