export const MIN_TOTP_PERIOD = 15
export const MAX_TOTP_PERIOD = 120
export const MAX_HOTP_COUNTER = Number.MAX_SAFE_INTEGER

export type OtpValidationErrorCode =
    | "secret_required"
    | "secret_invalid_characters"
    | "secret_padding_unsupported"
    | "secret_invalid_length"
    | "secret_invalid_padding_bits"
    | "period_required"
    | "period_invalid_integer"
    | "period_out_of_range"
    | "counter_required"
    | "counter_invalid_integer"
    | "counter_out_of_range"
    | "digits_invalid"

export type ValidationResult<T> =
    | { ok: true; value: T }
    | { ok: false; errorCode: OtpValidationErrorCode }

export class OtpValidationError extends Error {
    code: OtpValidationErrorCode

    constructor(code: OtpValidationErrorCode) {
        super(code)
        this.name = "OtpValidationError"
        this.code = code
    }
}

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
const VALID_UNPADDED_LENGTH_REMAINDERS = new Set([0, 2, 4, 5, 7])
const UNUSED_BITS_BY_LENGTH_REMAINDER: Record<number, number> = {
    2: 2,
    4: 4,
    5: 1,
    7: 3,
}

function invalid<T>(errorCode: OtpValidationErrorCode): ValidationResult<T> {
    return { ok: false, errorCode }
}

export function decodeBase32Strict(input: string): ValidationResult<Uint8Array> {
    if (input.length === 0) return invalid("secret_required")
    if (input.includes("=")) return invalid("secret_padding_unsupported")
    if (!/^[A-Za-z2-7]+$/.test(input)) return invalid("secret_invalid_characters")

    const normalized = input.toUpperCase()
    const lengthRemainder = normalized.length % 8
    if (!VALID_UNPADDED_LENGTH_REMAINDERS.has(lengthRemainder)) return invalid("secret_invalid_length")

    const unusedBits = UNUSED_BITS_BY_LENGTH_REMAINDER[lengthRemainder] ?? 0
    const lastValue = BASE32_ALPHABET.indexOf(normalized.at(-1) ?? "")
    if (unusedBits > 0 && (lastValue & ((1 << unusedBits) - 1)) !== 0) {
        return invalid("secret_invalid_padding_bits")
    }

    const bytes: number[] = []
    let bitBuffer = 0
    let bitCount = 0
    for (const character of normalized) {
        bitBuffer = (bitBuffer << 5) | BASE32_ALPHABET.indexOf(character)
        bitCount += 5
        if (bitCount >= 8) {
            bitCount -= 8
            bytes.push((bitBuffer >> bitCount) & 0xff)
            bitBuffer &= (1 << bitCount) - 1
        }
    }

    if (bytes.length === 0) return invalid("secret_required")
    return { ok: true, value: new Uint8Array(bytes) }
}

function parseUnsignedIntegerInput(
    input: string,
    requiredCode: OtpValidationErrorCode,
    integerCode: OtpValidationErrorCode,
): ValidationResult<number> {
    if (input.length === 0) return invalid(requiredCode)
    if (!/^\d+$/.test(input)) return invalid(integerCode)
    const value = Number(input)
    if (!Number.isSafeInteger(value)) return invalid(integerCode)
    return { ok: true, value }
}

export function parseTotpPeriod(input: string): ValidationResult<number> {
    const parsed = parseUnsignedIntegerInput(input, "period_required", "period_invalid_integer")
    if (!parsed.ok) return parsed
    if (parsed.value < MIN_TOTP_PERIOD || parsed.value > MAX_TOTP_PERIOD) return invalid("period_out_of_range")
    return parsed
}

export function parseHotpCounter(input: string): ValidationResult<number> {
    const parsed = parseUnsignedIntegerInput(input, "counter_required", "counter_invalid_integer")
    if (!parsed.ok) return parsed
    if (parsed.value < 0 || parsed.value > MAX_HOTP_COUNTER) return invalid("counter_out_of_range")
    return parsed
}

function requireValidDigits(digits: number): void {
    if (digits !== 6 && digits !== 8) throw new OtpValidationError("digits_invalid")
}

function requireValidSecret(secret: string): Uint8Array {
    const result = decodeBase32Strict(secret)
    if (!result.ok) throw new OtpValidationError(result.errorCode)
    return result.value
}

function requireValidCounter(counter: number): void {
    if (!Number.isSafeInteger(counter) || counter < 0 || counter > MAX_HOTP_COUNTER) {
        throw new OtpValidationError("counter_out_of_range")
    }
}

function encodeCounter(counter: number): Uint8Array {
    requireValidCounter(counter)
    const bytes = new Uint8Array(8)
    let remaining = counter
    for (let index = bytes.length - 1; index >= 0; index -= 1) {
        bytes[index] = remaining % 256
        remaining = Math.floor(remaining / 256)
    }
    return bytes
}

function copyForWebCrypto(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
    // In jsdom, this uses the same typed-array realm as TextEncoder and SubtleCrypto.
    const ByteArray = new TextEncoder().encode("").constructor as Uint8ArrayConstructor
    const copy = new ByteArray(bytes.length)
    copy.set(bytes)
    return copy as Uint8Array<ArrayBuffer>
}

async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        copyForWebCrypto(key),
        { name: "HMAC", hash: "SHA-1" },
        false,
        ["sign"],
    )
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, copyForWebCrypto(message))
    return new Uint8Array(signature)
}

export async function generateHOTP(secret: string, counter: number, digits = 6): Promise<string> {
    requireValidDigits(digits)
    const key = requireValidSecret(secret)
    const hash = await hmacSha1(key, encodeCounter(counter))
    const offset = hash[hash.length - 1] & 0x0f
    const binary = (hash[offset] & 0x7f) * 0x1000000
        + hash[offset + 1] * 0x10000
        + hash[offset + 2] * 0x100
        + hash[offset + 3]
    return (binary % (10 ** digits)).toString().padStart(digits, "0")
}

export async function generateTOTP(secret: string, timeSeconds: number, digits = 6, period = 30): Promise<string> {
    if (!Number.isSafeInteger(period)) throw new OtpValidationError("period_invalid_integer")
    if (period < MIN_TOTP_PERIOD || period > MAX_TOTP_PERIOD) {
        throw new OtpValidationError("period_out_of_range")
    }
    if (!Number.isFinite(timeSeconds) || timeSeconds < 0) throw new OtpValidationError("counter_out_of_range")
    const counter = Math.floor(timeSeconds / period)
    return generateHOTP(secret, counter, digits)
}

export function generateRandomSecret(byteLength = 20): string {
    if (!Number.isSafeInteger(byteLength) || byteLength < 1) throw new RangeError("byteLength must be a positive integer")
    const bytes = crypto.getRandomValues(new Uint8Array(byteLength))
    let encoded = ""
    let bitBuffer = 0
    let bitCount = 0
    for (const byte of bytes) {
        bitBuffer = (bitBuffer << 8) | byte
        bitCount += 8
        while (bitCount >= 5) {
            bitCount -= 5
            encoded += BASE32_ALPHABET[(bitBuffer >> bitCount) & 0x1f]
        }
        bitBuffer &= (1 << bitCount) - 1
    }
    if (bitCount > 0) encoded += BASE32_ALPHABET[(bitBuffer << (5 - bitCount)) & 0x1f]
    return encoded
}
