import { estimateBase64DecodedBytes, measureUtf8Bytes, PHASE4_LIMITS } from "@/core/utils/phase4-inspector-limits"

export interface Asn1Node {
    id: string
    offset: number
    headerLength: number
    length: number
    tagClass: string
    tagNumber: number
    tagName: string
    constructed: boolean
    valuePreview: string
    children: Asn1Node[]
    truncated?: boolean
}

export interface Asn1ParseResult {
    ok: boolean
    nodes: Asn1Node[]
    totalNodes: number
    truncated: boolean
    maxDepthReached: boolean
    maxNodesReached: boolean
    error?: string
}

export interface Asn1ParseOptions {
    maxNodes?: number
    maxDepth?: number
}

const DEFAULT_MAX_NODES = 1000
const DEFAULT_MAX_DEPTH = 32
const ASN1_RAW_INPUT_TOO_LARGE = "Input is too large for the local ASN.1 inspector."
const ASN1_DECODED_TOO_LARGE = "Decoded DER payload is too large for the local ASN.1 inspector."

function cleanPemOrHex(input: string): string {
    const pemMatch = input.match(/-----BEGIN [^-]+-----([\s\S]*?)-----END [^-]+-----/)
    if (pemMatch) return pemMatch[1].replace(/\s+/g, "")
    return input.trim()
}

function base64ToBytes(value: string): number[] {
    const compact = value.replace(/\s+/g, "")
    if (estimateBase64DecodedBytes(compact) > PHASE4_LIMITS.maxAsn1DecodedBytes) {
        throw new Error(ASN1_DECODED_TOO_LARGE)
    }
    const binary = typeof atob === "function"
        ? atob(compact)
        : typeof Buffer !== "undefined"
            ? Buffer.from(compact, "base64").toString("binary")
            : ""
    return Array.from(binary, (char) => char.charCodeAt(0))
}

function hexToBytes(value: string): number[] {
    const compact = value.replace(/0x/gi, "").replace(/[^0-9a-fA-F]/g, "")
    if (!compact) return []
    if (compact.length % 2 !== 0) throw new Error("DER hex input must contain an even number of digits.")
    if (compact.length / 2 > PHASE4_LIMITS.maxAsn1DecodedBytes) {
        throw new Error(ASN1_DECODED_TOO_LARGE)
    }
    const bytes: number[] = []
    for (let index = 0; index < compact.length; index += 2) bytes.push(Number.parseInt(compact.slice(index, index + 2), 16))
    return bytes
}

export function parseDerInputToBytes(input: string): number[] {
    const cleaned = cleanPemOrHex(input)
    if (/^[0-9a-fA-F\s:,-]+$/.test(cleaned) && /[0-9a-fA-F]/.test(cleaned)) return hexToBytes(cleaned)
    return base64ToBytes(cleaned)
}

function tagName(tagNumber: number): string {
    const names: Record<number, string> = {
        1: "BOOLEAN",
        2: "INTEGER",
        3: "BIT STRING",
        4: "OCTET STRING",
        5: "NULL",
        6: "OBJECT IDENTIFIER",
        12: "UTF8String",
        16: "SEQUENCE",
        17: "SET",
        19: "PrintableString",
        22: "IA5String",
        23: "UTCTime",
        24: "GeneralizedTime",
    }
    return names[tagNumber] || `Tag ${tagNumber}`
}

function className(tagByte: number): string {
    return ["Universal", "Application", "Context-specific", "Private"][(tagByte & 0xc0) >> 6]
}

function previewValue(bytes: number[], tagNumber: number): string {
    if (tagNumber === 5) return "NULL"
    if (tagNumber === 2 && bytes.length <= 6) {
        return String(bytes.reduce((value, byte) => (value << 8) + byte, 0))
    }
    if (tagNumber === 6) return decodeOid(bytes)
    if ([12, 19, 22, 23, 24].includes(tagNumber)) return new TextDecoder().decode(new Uint8Array(bytes))
    return bytes.slice(0, 16).map((byte) => byte.toString(16).padStart(2, "0").toUpperCase()).join(" ") + (bytes.length > 16 ? " ..." : "")
}

function decodeOid(bytes: number[]): string {
    if (bytes.length === 0) return ""
    const first = bytes[0]
    const parts = [Math.floor(first / 40), first % 40]
    let value = 0
    for (const byte of bytes.slice(1)) {
        value = (value << 7) | (byte & 0x7f)
        if ((byte & 0x80) === 0) {
            parts.push(value)
            value = 0
        }
    }
    return parts.join(".")
}

interface Context {
    nodes: number
    maxNodes: number
    maxDepth: number
    truncated: boolean
    maxDepthReached: boolean
    maxNodesReached: boolean
}

function readLength(bytes: number[], offset: number): { length: number; lengthBytes: number } {
    const first = bytes[offset]
    if (first === undefined) throw new Error("Unexpected end of DER while reading length.")
    if ((first & 0x80) === 0) return { length: first, lengthBytes: 1 }
    const count = first & 0x7f
    if (count === 0) throw new Error("Indefinite length BER is not valid DER.")
    if (count > 4) throw new Error("Length field is too large for this inspector.")
    let length = 0
    for (let index = 0; index < count; index += 1) {
        const byte = bytes[offset + 1 + index]
        if (byte === undefined) throw new Error("Unexpected end of DER length.")
        length = (length << 8) | byte
    }
    return { length, lengthBytes: 1 + count }
}

function parseNode(bytes: number[], offset: number, end: number, depth: number, context: Context, path: string): { node: Asn1Node; nextOffset: number } {
    if (context.nodes >= context.maxNodes) {
        context.truncated = true
        context.maxNodesReached = true
        return {
            node: {
                id: `${path}.truncated`,
                offset,
                headerLength: 0,
                length: 0,
                tagClass: "Truncated",
                tagNumber: -1,
                tagName: "Truncated",
                constructed: false,
                valuePreview: "Maximum node count reached",
                children: [],
                truncated: true,
            },
            nextOffset: end,
        }
    }
    if (depth > context.maxDepth) {
        context.truncated = true
        context.maxDepthReached = true
        return {
            node: {
                id: `${path}.depth`,
                offset,
                headerLength: 0,
                length: 0,
                tagClass: "Truncated",
                tagNumber: -1,
                tagName: "Truncated",
                constructed: false,
                valuePreview: "Maximum depth reached",
                children: [],
                truncated: true,
            },
            nextOffset: end,
        }
    }

    const tagByte = bytes[offset]
    if (tagByte === undefined) throw new Error("Unexpected end of DER while reading tag.")
    const constructed = (tagByte & 0x20) !== 0
    const tagNumber = tagByte & 0x1f
    if (tagNumber === 0x1f) throw new Error("High-tag-number form is not supported in this MVP.")
    const lengthInfo = readLength(bytes, offset + 1)
    const headerLength = 1 + lengthInfo.lengthBytes
    const valueStart = offset + headerLength
    const valueEnd = valueStart + lengthInfo.length
    if (valueEnd > end || valueEnd > bytes.length) throw new Error("DER length exceeds available bytes.")

    context.nodes += 1
    const valueBytes = bytes.slice(valueStart, valueEnd)
    const node: Asn1Node = {
        id: path,
        offset,
        headerLength,
        length: lengthInfo.length,
        tagClass: className(tagByte),
        tagNumber,
        tagName: tagName(tagNumber),
        constructed,
        valuePreview: constructed ? `${lengthInfo.length} byte container` : previewValue(valueBytes, tagNumber),
        children: [],
    }

    if (constructed) {
        let childOffset = valueStart
        let childIndex = 0
        while (childOffset < valueEnd) {
            const parsed = parseNode(bytes, childOffset, valueEnd, depth + 1, context, `${path}.${childIndex}`)
            node.children.push(parsed.node)
            childOffset = parsed.nextOffset
            childIndex += 1
            if (context.truncated) break
        }
    }

    return { node, nextOffset: valueEnd }
}

export function parseAsn1Der(input: string, options: Asn1ParseOptions = {}): Asn1ParseResult {
    try {
        if (measureUtf8Bytes(input, PHASE4_LIMITS.maxAsn1RawInputBytes).exceeded) {
            throw new Error(ASN1_RAW_INPUT_TOO_LARGE)
        }
        const bytes = parseDerInputToBytes(input)
        if (bytes.length === 0) throw new Error("Input is required.")
        const context: Context = {
            nodes: 0,
            maxNodes: options.maxNodes ?? DEFAULT_MAX_NODES,
            maxDepth: options.maxDepth ?? DEFAULT_MAX_DEPTH,
            truncated: false,
            maxDepthReached: false,
            maxNodesReached: false,
        }
        const nodes: Asn1Node[] = []
        let offset = 0
        let index = 0
        while (offset < bytes.length) {
            const parsed = parseNode(bytes, offset, bytes.length, 0, context, String(index))
            nodes.push(parsed.node)
            offset = parsed.nextOffset
            index += 1
            if (context.truncated) break
        }
        return {
            ok: true,
            nodes,
            totalNodes: context.nodes,
            truncated: context.truncated,
            maxDepthReached: context.maxDepthReached,
            maxNodesReached: context.maxNodesReached,
        }
    } catch (error) {
        return {
            ok: false,
            nodes: [],
            totalNodes: 0,
            truncated: false,
            maxDepthReached: false,
            maxNodesReached: false,
            error: error instanceof Error ? error.message : "Unable to parse DER input.",
        }
    }
}
