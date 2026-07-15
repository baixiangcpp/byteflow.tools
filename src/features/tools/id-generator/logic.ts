import { v4 as uuidv4 } from "uuid"

export const NANOID_DEFAULT_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-"
export const MIN_BATCH_QUANTITY = 1
export const MAX_BATCH_QUANTITY = 1000
export const MIN_NANOID_SIZE = 1
export const MAX_NANOID_SIZE = 256
export const MIN_NANOID_ALPHABET_SIZE = 2
export const MAX_NANOID_ALPHABET_SIZE = 256

const ULID_ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
const MAX_48_BIT_TIMESTAMP = 0xffffffffffff

export type IDType = "uuid-v4" | "uuid-v7" | "ulid" | "nanoid"
export type IDCaseFormat = "lowercase" | "uppercase"
export type IdGeneratorField = "quantity" | "nanoidSize" | "nanoidAlphabet"
export type IdGeneratorErrorCode =
    | "error_quantity_invalid"
    | "error_nanoid_size_invalid"
    | "error_alphabet_too_short"
    | "error_alphabet_too_long"
    | "error_alphabet_duplicate"
    | "error_alphabet_invalid_unicode"

export type IdGeneratorFieldErrors = Partial<Record<IdGeneratorField, IdGeneratorErrorCode>>

export interface RawIdGeneratorSettings {
    quantity: string
    idType: IDType
    caseFormat: IDCaseFormat
    nanoidSize: string
    nanoidAlphabet: string
}

export interface ValidatedIdGeneratorSettings {
    quantity: number
    idType: IDType
    caseFormat: IDCaseFormat
    nanoidSize: number
    nanoidAlphabet: string
}

export type IdGeneratorValidationResult =
    | { ok: true; value: ValidatedIdGeneratorSettings; errors: IdGeneratorFieldErrors }
    | { ok: false; errors: IdGeneratorFieldErrors }

export type RandomFill = (bytes: Uint8Array) => void

export interface IdGeneratorDependencies {
    now?: () => number
    randomFill?: RandomFill
    uuidV4?: () => string
}

export type NanoIdAlphabetValidation =
    | { ok: true; symbols: string[] }
    | { ok: false; code: Extract<IdGeneratorErrorCode,
        | "error_alphabet_too_short"
        | "error_alphabet_too_long"
        | "error_alphabet_duplicate"
        | "error_alphabet_invalid_unicode"> }

function defaultRandomFill(bytes: Uint8Array): void {
    crypto.getRandomValues(bytes)
}

function parseBoundedInteger(value: string, min: number, max: number): number | null {
    if (value.trim() === "") return null

    const parsed = Number(value)
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < min || parsed > max) {
        return null
    }

    return parsed
}

function isUnicodeScalar(symbol: string): boolean {
    const codePoint = symbol.codePointAt(0)
    return codePoint !== undefined && (codePoint < 0xd800 || codePoint > 0xdfff)
}

export function validateNanoIdAlphabet(alphabet: string): NanoIdAlphabetValidation {
    const symbols = Array.from(alphabet)

    if (symbols.some((symbol) => !isUnicodeScalar(symbol))) {
        return { ok: false, code: "error_alphabet_invalid_unicode" }
    }
    if (symbols.length < MIN_NANOID_ALPHABET_SIZE) {
        return { ok: false, code: "error_alphabet_too_short" }
    }
    if (symbols.length > MAX_NANOID_ALPHABET_SIZE) {
        return { ok: false, code: "error_alphabet_too_long" }
    }
    if (new Set(symbols).size !== symbols.length) {
        return { ok: false, code: "error_alphabet_duplicate" }
    }

    return { ok: true, symbols }
}

export function validateIdGeneratorSettings(raw: RawIdGeneratorSettings): IdGeneratorValidationResult {
    const errors: IdGeneratorFieldErrors = {}
    const quantity = parseBoundedInteger(raw.quantity, MIN_BATCH_QUANTITY, MAX_BATCH_QUANTITY)

    if (quantity === null) {
        errors.quantity = "error_quantity_invalid"
    }

    let nanoidSize = 21
    if (raw.idType === "nanoid") {
        const parsedSize = parseBoundedInteger(raw.nanoidSize, MIN_NANOID_SIZE, MAX_NANOID_SIZE)
        if (parsedSize === null) {
            errors.nanoidSize = "error_nanoid_size_invalid"
        } else {
            nanoidSize = parsedSize
        }

        const alphabetValidation = validateNanoIdAlphabet(raw.nanoidAlphabet)
        if (!alphabetValidation.ok) {
            errors.nanoidAlphabet = alphabetValidation.code
        }
    }

    if (Object.keys(errors).length > 0 || quantity === null) {
        return { ok: false, errors }
    }

    return {
        ok: true,
        errors,
        value: {
            quantity,
            idType: raw.idType,
            caseFormat: raw.caseFormat,
            nanoidSize,
            nanoidAlphabet: raw.nanoidAlphabet,
        },
    }
}

function assertTimestamp(timestamp: number): void {
    if (!Number.isSafeInteger(timestamp) || timestamp < 0 || timestamp > MAX_48_BIT_TIMESTAMP) {
        throw new RangeError("Timestamp must be a non-negative 48-bit integer.")
    }
}

function byteToHex(byte: number): string {
    return byte.toString(16).padStart(2, "0")
}

export function generateUUIDv7(timestamp: number = Date.now(), randomFill: RandomFill = defaultRandomFill): string {
    assertTimestamp(timestamp)

    const timestampHex = timestamp.toString(16).padStart(12, "0")
    const randomBytes = new Uint8Array(10)
    randomFill(randomBytes)
    randomBytes[0] = (randomBytes[0] & 0x0f) | 0x70
    randomBytes[2] = (randomBytes[2] & 0x3f) | 0x80
    const randomHex = Array.from(randomBytes, byteToHex).join("")

    return (
        `${timestampHex.slice(0, 8)}-${timestampHex.slice(8, 12)}-` +
        `${randomHex.slice(0, 4)}-${randomHex.slice(4, 8)}-${randomHex.slice(8, 20)}`
    )
}

export function extractUUIDv7Timestamp(uuid: string): Date | null {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid)) {
        return null
    }

    const timestamp = Number.parseInt(uuid.replace(/-/g, "").slice(0, 12), 16)
    return new Date(timestamp)
}

export function generateULID(timestamp: number = Date.now(), randomFill: RandomFill = defaultRandomFill): string {
    assertTimestamp(timestamp)

    let timePart = ""
    let remainingTime = timestamp
    for (let i = 0; i < 10; i++) {
        timePart = ULID_ENCODING[remainingTime % 32] + timePart
        remainingTime = Math.floor(remainingTime / 32)
    }

    const randomBytes = new Uint8Array(10)
    randomFill(randomBytes)
    let randomPart = ""
    let buffer = 0
    let bufferedBits = 0

    for (const byte of randomBytes) {
        buffer = (buffer << 8) | byte
        bufferedBits += 8

        while (bufferedBits >= 5) {
            bufferedBits -= 5
            randomPart += ULID_ENCODING[(buffer >>> bufferedBits) & 0x1f]
            buffer &= (1 << bufferedBits) - 1
        }
    }

    return timePart + randomPart
}

export function extractULIDTimestamp(ulid: string): Date | null {
    if (!/^[0-7][0-9A-HJKMNP-TV-Z]{25}$/i.test(ulid)) return null

    let timestamp = 0
    for (let i = 0; i < 10; i++) {
        timestamp = timestamp * 32 + ULID_ENCODING.indexOf(ulid[i].toUpperCase())
    }

    return new Date(timestamp)
}

function assertNanoIdSize(size: number): void {
    if (!Number.isInteger(size) || size < MIN_NANOID_SIZE || size > MAX_NANOID_SIZE) {
        throw new RangeError("NanoID size must be an integer from 1 to 256.")
    }
}

function generateNanoIdFromSymbols(size: number, symbols: string[], randomFill: RandomFill): string {
    const mask = (1 << Math.ceil(Math.log2(symbols.length))) - 1
    const step = Math.ceil((1.6 * mask * size) / symbols.length)
    const output: string[] = []

    while (output.length < size) {
        const bytes = new Uint8Array(step)
        randomFill(bytes)

        for (const byte of bytes) {
            const symbolIndex = byte & mask
            if (symbolIndex < symbols.length) {
                output.push(symbols[symbolIndex])
                if (output.length === size) break
            }
        }
    }

    return output.join("")
}

export function generateNanoID(
    size: number = 21,
    alphabet: string = NANOID_DEFAULT_ALPHABET,
    randomFill: RandomFill = defaultRandomFill,
): string {
    assertNanoIdSize(size)
    const alphabetValidation = validateNanoIdAlphabet(alphabet)
    if (!alphabetValidation.ok) {
        throw new RangeError(alphabetValidation.code)
    }

    return generateNanoIdFromSymbols(size, alphabetValidation.symbols, randomFill)
}

export function generateIdBatch(
    settings: ValidatedIdGeneratorSettings,
    dependencies: IdGeneratorDependencies = {},
): string[] {
    if (!Number.isInteger(settings.quantity) || settings.quantity < MIN_BATCH_QUANTITY || settings.quantity > MAX_BATCH_QUANTITY) {
        throw new RangeError("Quantity must be an integer from 1 to 1000.")
    }

    const randomFill = dependencies.randomFill ?? defaultRandomFill
    const now = dependencies.now ?? Date.now
    const createUuidV4 = dependencies.uuidV4 ?? uuidv4
    let nanoIdSymbols: string[] | null = null

    if (settings.idType === "nanoid") {
        assertNanoIdSize(settings.nanoidSize)
        const alphabetValidation = validateNanoIdAlphabet(settings.nanoidAlphabet)
        if (!alphabetValidation.ok) {
            throw new RangeError(alphabetValidation.code)
        }
        nanoIdSymbols = alphabetValidation.symbols
    }

    const results: string[] = []
    for (let i = 0; i < settings.quantity; i++) {
        let id: string
        switch (settings.idType) {
            case "uuid-v4":
                id = createUuidV4()
                break
            case "uuid-v7":
                id = generateUUIDv7(now(), randomFill)
                break
            case "ulid":
                id = generateULID(now(), randomFill)
                break
            case "nanoid":
                id = generateNanoIdFromSymbols(settings.nanoidSize, nanoIdSymbols as string[], randomFill)
                break
        }

        results.push(settings.caseFormat === "uppercase" && settings.idType !== "nanoid" ? id.toUpperCase() : id)
    }

    return results
}
