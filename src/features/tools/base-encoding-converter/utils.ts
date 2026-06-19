export type BaseEncoding = "base32" | "base58"

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

function bytesToText(bytes: Uint8Array): string {
    return textDecoder.decode(bytes)
}

function textToBytes(value: string): Uint8Array {
    return textEncoder.encode(value)
}

export function encodeBytesToBase32(bytes: Uint8Array): string {
    if (bytes.length === 0) return ""

    let output = ""
    let buffer = 0
    let bitsLeft = 0

    for (const byte of bytes) {
        buffer = (buffer << 8) | byte
        bitsLeft += 8

        while (bitsLeft >= 5) {
            output += BASE32_ALPHABET[(buffer >>> (bitsLeft - 5)) & 31]
            bitsLeft -= 5
        }
    }

    if (bitsLeft > 0) {
        output += BASE32_ALPHABET[(buffer << (5 - bitsLeft)) & 31]
    }

    while (output.length % 8 !== 0) {
        output += "="
    }

    return output
}

export function decodeBase32ToBytes(value: string): Uint8Array {
    const normalized = value.trim().replace(/\s+/g, "").toUpperCase()
    if (!normalized) return new Uint8Array()
    if (!/^[A-Z2-7]+=*$/.test(normalized) || /=[^=]/.test(normalized)) {
        throw new Error("Invalid Base32 character.")
    }

    const unpadded = normalized.replace(/=+$/g, "")
    const paddingLength = normalized.length - unpadded.length
    const unpaddedRemainder = unpadded.length % 8
    const expectedPaddingByRemainder: Partial<Record<number, number>> = {
        0: 0,
        2: 6,
        4: 4,
        5: 3,
        7: 1,
    }
    const expectedPaddingLength = expectedPaddingByRemainder[unpaddedRemainder]

    if (expectedPaddingLength === undefined) {
        throw new Error("Invalid Base32 character.")
    }
    if (paddingLength > 0 && (normalized.length % 8 !== 0 || paddingLength !== expectedPaddingLength)) {
        throw new Error("Invalid Base32 character.")
    }

    const bytes: number[] = []
    let buffer = 0
    let bitsLeft = 0

    for (const char of unpadded) {
        const valueIndex = BASE32_ALPHABET.indexOf(char)
        if (valueIndex < 0) {
            throw new Error("Invalid Base32 character.")
        }

        buffer = (buffer << 5) | valueIndex
        bitsLeft += 5

        if (bitsLeft >= 8) {
            bytes.push((buffer >>> (bitsLeft - 8)) & 255)
            bitsLeft -= 8
        }
    }

    if (bitsLeft > 0 && (buffer & ((1 << bitsLeft) - 1)) !== 0) {
        throw new Error("Invalid Base32 character.")
    }

    return new Uint8Array(bytes)
}

export function encodeBytesToBase58(bytes: Uint8Array): string {
    if (bytes.length === 0) return ""

    let leadingZeroCount = 0
    while (leadingZeroCount < bytes.length && bytes[leadingZeroCount] === 0) {
        leadingZeroCount += 1
    }

    const digits: number[] = []
    for (const byte of bytes.slice(leadingZeroCount)) {
        let carry = byte
        for (let index = 0; index < digits.length; index += 1) {
            carry += digits[index] << 8
            digits[index] = carry % BASE58_ALPHABET.length
            carry = Math.floor(carry / BASE58_ALPHABET.length)
        }
        while (carry > 0) {
            digits.push(carry % BASE58_ALPHABET.length)
            carry = Math.floor(carry / BASE58_ALPHABET.length)
        }
    }

    const encoded = digits.reverse().map((digit) => BASE58_ALPHABET[digit]).join("")
    return `${BASE58_ALPHABET[0].repeat(leadingZeroCount)}${encoded}`
}

export function decodeBase58ToBytes(value: string): Uint8Array {
    const normalized = value.trim().replace(/\s+/g, "")
    if (!normalized) return new Uint8Array()

    let leadingZeroCount = 0
    while (leadingZeroCount < normalized.length && normalized[leadingZeroCount] === BASE58_ALPHABET[0]) {
        leadingZeroCount += 1
    }

    const bytes: number[] = []
    for (const char of normalized.slice(leadingZeroCount)) {
        const digit = BASE58_ALPHABET.indexOf(char)
        if (digit < 0) {
            throw new Error("Invalid Base58 character.")
        }
        let carry = digit
        for (let index = 0; index < bytes.length; index += 1) {
            carry += bytes[index] * BASE58_ALPHABET.length
            bytes[index] = carry & 255
            carry >>= 8
        }
        while (carry > 0) {
            bytes.push(carry & 255)
            carry >>= 8
        }
    }

    const decoded = bytes.reverse()
    decoded.unshift(...Array.from({ length: leadingZeroCount }, () => 0))

    return new Uint8Array(decoded)
}

export function encodeTextToBase32(value: string): string {
    return encodeBytesToBase32(textToBytes(value))
}

export function decodeBase32ToText(value: string): string {
    return bytesToText(decodeBase32ToBytes(value))
}

export function encodeTextToBase58(value: string): string {
    return encodeBytesToBase58(textToBytes(value))
}

export function decodeBase58ToText(value: string): string {
    return bytesToText(decodeBase58ToBytes(value))
}

export function convertBaseEncoding(input: string, encoding: BaseEncoding, operation: "encode" | "decode"): string {
    if (encoding === "base32") {
        return operation === "encode" ? encodeTextToBase32(input) : decodeBase32ToText(input)
    }

    return operation === "encode" ? encodeTextToBase58(input) : decodeBase58ToText(input)
}
