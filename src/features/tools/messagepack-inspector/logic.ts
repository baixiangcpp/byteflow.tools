import type { MessagePackDecodeReport, MessagePackInputMode } from "./types"

class Reader {
    offset = 0
    constructor(readonly bytes: Uint8Array) {}

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

    readUInt32(): number {
        const bytes = this.readBytes(4)
        return bytes[0] * 2 ** 24 + (bytes[1] << 16) + (bytes[2] << 8) + bytes[3]
    }
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

function decodeValue(reader: Reader): unknown {
    const prefix = reader.readByte()
    if (prefix <= 0x7f) return prefix
    if (prefix >= 0xe0) return prefix - 0x100
    if ((prefix & 0xe0) === 0xa0) return decodeUtf8(reader.readBytes(prefix & 0x1f))
    if ((prefix & 0xf0) === 0x90) return Array.from({ length: prefix & 0x0f }, () => decodeValue(reader))
    if ((prefix & 0xf0) === 0x80) return decodeMap(reader, prefix & 0x0f)

    switch (prefix) {
        case 0xc0:
            return null
        case 0xc2:
            return false
        case 0xc3:
            return true
        case 0xc4:
            return Array.from(reader.readBytes(reader.readByte()))
        case 0xc5:
            return Array.from(reader.readBytes(reader.readUInt16()))
        case 0xcc:
            return reader.readByte()
        case 0xcd:
            return reader.readUInt16()
        case 0xce:
            return reader.readUInt32()
        case 0xd0: {
            const value = reader.readByte()
            return value > 0x7f ? value - 0x100 : value
        }
        case 0xd1: {
            const value = reader.readUInt16()
            return value > 0x7fff ? value - 0x10000 : value
        }
        case 0xd9:
            return decodeUtf8(reader.readBytes(reader.readByte()))
        case 0xda:
            return decodeUtf8(reader.readBytes(reader.readUInt16()))
        case 0xdc:
            return Array.from({ length: reader.readUInt16() }, () => decodeValue(reader))
        case 0xde:
            return decodeMap(reader, reader.readUInt16())
        default:
            throw new Error(`Unsupported MessagePack prefix 0x${prefix.toString(16)} at byte ${reader.offset - 1}.`)
    }
}

function decodeMap(reader: Reader, length: number): Record<string, unknown> {
    const output: Record<string, unknown> = {}
    for (let index = 0; index < length; index += 1) {
        const key = decodeValue(reader)
        output[String(key)] = decodeValue(reader)
    }
    return output
}

function summarize(value: unknown): string {
    if (Array.isArray(value)) return `Decoded MessagePack array with ${value.length} item(s).`
    if (value && typeof value === "object") return `Decoded MessagePack map with ${Object.keys(value).length} key(s).`
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

