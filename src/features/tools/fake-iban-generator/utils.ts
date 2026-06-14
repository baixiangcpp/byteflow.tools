import { createOptionalSeededRandom, randomInt, type RandomFn } from "@/core/utils/seeded-random"

export type IbanCountry = "DE" | "FR" | "GB" | "ES" | "IT" | "NL"

type CountrySpec = {
    code: IbanCountry
    length: number
    label: string
    buildBban: (rng: RandomFn) => string
}

export type IbanValidationReasonKey =
    | "too_short"
    | "invalid_length"
    | "invalid_prefix"
    | "checksum_failed"

export type IbanValidationResult =
    | { valid: true; normalized: string }
    | {
        valid: false
        normalized: string
        reasonKey: IbanValidationReasonKey
        reasonParams?: Record<string, string | number>
    }

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const DIGITS = "0123456789"

function randomChars(length: number, alphabet: string, rng: RandomFn): string {
    let output = ""
    for (let i = 0; i < length; i += 1) {
        output += alphabet[randomInt(rng, 0, alphabet.length - 1)]
    }
    return output
}

function toIbanNumericString(input: string): string {
    let numeric = ""
    for (const char of input.toUpperCase()) {
        if (/[0-9]/.test(char)) {
            numeric += char
        } else if (/[A-Z]/.test(char)) {
            numeric += String(char.charCodeAt(0) - 55)
        }
    }
    return numeric
}

function mod97(value: string): number {
    let remainder = 0
    for (const digit of value) {
        remainder = (remainder * 10 + Number(digit)) % 97
    }
    return remainder
}

export const IBAN_COUNTRY_SPECS: CountrySpec[] = [
    {
        code: "DE",
        label: "Germany (DE)",
        length: 22,
        buildBban: (rng) => randomChars(18, DIGITS, rng),
    },
    {
        code: "FR",
        label: "France (FR)",
        length: 27,
        buildBban: (rng) => randomChars(23, DIGITS, rng),
    },
    {
        code: "GB",
        label: "United Kingdom (GB)",
        length: 22,
        buildBban: (rng) => `${randomChars(4, LETTERS, rng)}${randomChars(14, DIGITS, rng)}`,
    },
    {
        code: "ES",
        label: "Spain (ES)",
        length: 24,
        buildBban: (rng) => randomChars(20, DIGITS, rng),
    },
    {
        code: "IT",
        label: "Italy (IT)",
        length: 27,
        buildBban: (rng) => `${randomChars(1, LETTERS, rng)}${randomChars(22, DIGITS, rng)}`,
    },
    {
        code: "NL",
        label: "Netherlands (NL)",
        length: 18,
        buildBban: (rng) => `${randomChars(4, LETTERS, rng)}${randomChars(10, DIGITS, rng)}`,
    },
]

const IBAN_COUNTRY_LENGTHS = Object.fromEntries(IBAN_COUNTRY_SPECS.map((spec) => [spec.code, spec.length])) as Record<IbanCountry, number>

export function normalizeIbanInput(value: string): string {
    return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
}

export function computeIbanCheckDigits(country: IbanCountry, bban: string): string {
    const rearranged = `${bban}${country}00`
    const numeric = toIbanNumericString(rearranged)
    const check = 98 - mod97(numeric)
    return String(check).padStart(2, "0")
}

export function validateIban(ibanInput: string): IbanValidationResult {
    const normalized = normalizeIbanInput(ibanInput)
    if (normalized.length < 5) {
        return { valid: false, normalized, reasonKey: "too_short" }
    }

    const country = normalized.slice(0, 2) as IbanCountry
    const expectedLength = IBAN_COUNTRY_LENGTHS[country]
    if (expectedLength && normalized.length !== expectedLength) {
        return {
            valid: false,
            normalized,
            reasonKey: "invalid_length",
            reasonParams: {
                country,
                length: expectedLength,
            },
        }
    }

    if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(normalized)) {
        return { valid: false, normalized, reasonKey: "invalid_prefix" }
    }

    const rearranged = `${normalized.slice(4)}${normalized.slice(0, 4)}`
    const numeric = toIbanNumericString(rearranged)
    const isValid = mod97(numeric) === 1
    return isValid
        ? { valid: true, normalized }
        : { valid: false, normalized, reasonKey: "checksum_failed" }
}

export function generateFakeIban(country: IbanCountry, rng: RandomFn): string {
    const spec = IBAN_COUNTRY_SPECS.find((item) => item.code === country)
    if (!spec) throw new Error(`Unsupported country: ${country}`)

    const bban = spec.buildBban(rng)
    const check = computeIbanCheckDigits(country, bban)
    return `${country}${check}${bban}`
}

export function generateFakeIbans(country: IbanCountry, count: number, seed?: string): string[] {
    const safeCount = Math.max(1, Math.min(100, Math.floor(count)))
    const rng = createOptionalSeededRandom(seed)
    return Array.from({ length: safeCount }, () => generateFakeIban(country, rng))
}

export function formatIbanForDisplay(iban: string): string {
    const normalized = normalizeIbanInput(iban)
    return normalized.replace(/(.{4})/g, "$1 ").trim()
}
