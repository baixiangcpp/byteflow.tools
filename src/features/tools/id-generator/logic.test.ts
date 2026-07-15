import { describe, expect, it } from "vitest"
import {
    NANOID_DEFAULT_ALPHABET,
    extractULIDTimestamp,
    extractUUIDv7Timestamp,
    generateIdBatch,
    generateNanoID,
    generateULID,
    generateUUIDv7,
    validateIdGeneratorSettings,
    validateNanoIdAlphabet,
    type RandomFill,
    type RawIdGeneratorSettings,
    type ValidatedIdGeneratorSettings,
} from "./logic"

function rawSettings(overrides: Partial<RawIdGeneratorSettings> = {}): RawIdGeneratorSettings {
    return {
        quantity: "5",
        idType: "nanoid",
        caseFormat: "lowercase",
        nanoidSize: "21",
        nanoidAlphabet: NANOID_DEFAULT_ALPHABET,
        ...overrides,
    }
}

function makeAlphabet(length: number): string {
    return Array.from({ length }, (_, index) => String.fromCodePoint(0x1000 + index)).join("")
}

function sequenceFill(...values: number[]): RandomFill {
    let offset = 0
    return (bytes) => {
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = values[offset % values.length]
            offset += 1
        }
    }
}

const zeroFill: RandomFill = (bytes) => bytes.fill(0)

describe("id-generator validation", () => {
    it("enforces alphabet boundaries in Unicode code points", () => {
        expect(validateNanoIdAlphabet("")).toEqual({ ok: false, code: "error_alphabet_too_short" })
        expect(validateNanoIdAlphabet("a")).toEqual({ ok: false, code: "error_alphabet_too_short" })
        expect(validateNanoIdAlphabet(makeAlphabet(2))).toMatchObject({ ok: true })
        expect(validateNanoIdAlphabet(makeAlphabet(255))).toMatchObject({ ok: true })
        expect(validateNanoIdAlphabet(makeAlphabet(256))).toMatchObject({ ok: true })
        expect(validateNanoIdAlphabet(makeAlphabet(257))).toEqual({ ok: false, code: "error_alphabet_too_long" })
    })

    it("rejects duplicate symbols and unpaired surrogates", () => {
        expect(validateNanoIdAlphabet("abca")).toEqual({ ok: false, code: "error_alphabet_duplicate" })
        expect(validateNanoIdAlphabet("a\ud800b")).toEqual({ ok: false, code: "error_alphabet_invalid_unicode" })
        expect(validateNanoIdAlphabet("😀🚀")).toEqual({ ok: true, symbols: ["😀", "🚀"] })
    })

    it.each(["", "0", "-1", "1.5", "NaN", "Infinity", "1001"])(
        "rejects invalid batch quantity %j",
        (quantity) => {
            const result = validateIdGeneratorSettings(rawSettings({ quantity }))
            expect(result).toEqual({ ok: false, errors: { quantity: "error_quantity_invalid" } })
        },
    )

    it.each(["", "0", "-1", "1.5", "NaN", "Infinity", "257"])(
        "rejects invalid NanoID size %j",
        (nanoidSize) => {
            const result = validateIdGeneratorSettings(rawSettings({ nanoidSize }))
            expect(result).toEqual({ ok: false, errors: { nanoidSize: "error_nanoid_size_invalid" } })
        },
    )

    it("accepts numeric endpoints and ignores NanoID-only fields for other ID types", () => {
        expect(validateIdGeneratorSettings(rawSettings({ quantity: "1", nanoidSize: "1" }))).toMatchObject({ ok: true })
        expect(validateIdGeneratorSettings(rawSettings({ quantity: "1000", nanoidSize: "256" }))).toMatchObject({ ok: true })
        expect(validateIdGeneratorSettings(rawSettings({
            idType: "uuid-v4",
            nanoidSize: "",
            nanoidAlphabet: "",
        }))).toMatchObject({ ok: true })
    })
})

describe("NanoID generation", () => {
    it("uses rejection sampling for non-power-of-two alphabets", () => {
        expect(generateNanoID(3, "abc", sequenceFill(3, 2, 1, 0, 3))).toBe("cba")
    })

    it("rejects byte 255 for a 255-symbol alphabet", () => {
        const alphabet = makeAlphabet(255)
        const symbols = Array.from(alphabet)

        expect(generateNanoID(1, alphabet, sequenceFill(255, 254))).toBe(symbols[254])
    })

    it("can select the final symbol from a 256-symbol alphabet", () => {
        const alphabet = makeAlphabet(256)
        const symbols = Array.from(alphabet)

        expect(generateNanoID(1, alphabet, sequenceFill(255, 0))).toBe(symbols[255])
    })

    it("counts and emits non-BMP symbols as complete code points", () => {
        const id = generateNanoID(4, "😀🚀", sequenceFill(0, 1, 0, 1))

        expect(id).toBe("😀🚀😀🚀")
        expect(Array.from(id)).toHaveLength(4)
    })

    it("defensively rejects invalid direct generation arguments", () => {
        expect(() => generateNanoID(0, "ab", zeroFill)).toThrow("NanoID size")
        expect(() => generateNanoID(1, "", zeroFill)).toThrow("error_alphabet_too_short")
        expect(() => generateNanoID(1, "aab", zeroFill)).toThrow("error_alphabet_duplicate")
    })
})

describe("ID algorithm regressions", () => {
    it("generates and extracts a valid UUID v7 timestamp", () => {
        const timestamp = 0x0123456789ab
        const uuid = generateUUIDv7(timestamp, zeroFill)

        expect(uuid).toBe("01234567-89ab-7000-8000-000000000000")
        expect(extractUUIDv7Timestamp(uuid)?.getTime()).toBe(timestamp)
        expect(extractUUIDv7Timestamp("01234567-89ab-7000-0000-000000000000")).toBeNull()
        expect(extractUUIDv7Timestamp("not-a-uuid")).toBeNull()
    })

    it("generates and extracts a valid ULID timestamp", () => {
        const timestamp = 1_700_000_000_123
        const ulid = generateULID(timestamp, zeroFill)

        expect(ulid).toMatch(/^[0-7][0-9A-HJKMNP-TV-Z]{25}$/)
        expect(extractULIDTimestamp(ulid)?.getTime()).toBe(timestamp)
        expect(extractULIDTimestamp(`8${"0".repeat(25)}`)).toBeNull()
        expect(extractULIDTimestamp(`${"0".repeat(25)}I`)).toBeNull()
    })

    it("keeps UUID v4 batch generation and case formatting stable", () => {
        const settings: ValidatedIdGeneratorSettings = {
            quantity: 2,
            idType: "uuid-v4",
            caseFormat: "uppercase",
            nanoidSize: 21,
            nanoidAlphabet: NANOID_DEFAULT_ALPHABET,
        }

        expect(generateIdBatch(settings, {
            uuidV4: () => "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
        })).toEqual([
            "AAAAAAAA-BBBB-4CCC-8DDD-EEEEEEEEEEEE",
            "AAAAAAAA-BBBB-4CCC-8DDD-EEEEEEEEEEEE",
        ])
    })

    it("rejects invalid batch settings before allocating or looping", () => {
        const settings: ValidatedIdGeneratorSettings = {
            quantity: Number.NaN,
            idType: "nanoid",
            caseFormat: "lowercase",
            nanoidSize: 21,
            nanoidAlphabet: NANOID_DEFAULT_ALPHABET,
        }

        expect(() => generateIdBatch(settings, { randomFill: zeroFill })).toThrow("Quantity")
    })
})
