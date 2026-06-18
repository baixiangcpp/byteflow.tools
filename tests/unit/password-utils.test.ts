import { describe, expect, it } from "vitest"
import {
    DEFAULT_PASSPHRASE_OPTIONS,
    DEFAULT_RANDOM_OPTIONS,
    estimateStrength,
    generatePassphrase,
    generatePasswordBatch,
    generateRandomPassword,
    secureRandomInt,
} from "@/features/tools/password-generator/utils"

const zeroRandom = () => 0

describe("password-utils", () => {
    it("generates random passwords with required character classes", () => {
        const password = generateRandomPassword({
            ...DEFAULT_RANDOM_OPTIONS,
            length: 20,
            includeUppercase: true,
            includeLowercase: true,
            includeNumbers: true,
            includeSymbols: true,
            excludeSimilar: false,
        })

        expect(password.length).toBe(20)
        expect(/[A-Z]/.test(password)).toBe(true)
        expect(/[a-z]/.test(password)).toBe(true)
        expect(/[0-9]/.test(password)).toBe(true)
        expect(/[^A-Za-z0-9]/.test(password)).toBe(true)
    })

    it("removes similar characters when excludeSimilar is enabled", () => {
        const password = generateRandomPassword({
            ...DEFAULT_RANDOM_OPTIONS,
            length: 48,
            includeUppercase: true,
            includeLowercase: true,
            includeNumbers: true,
            includeSymbols: false,
            excludeSimilar: true,
        })

        expect(/[ilLI|`oO01]/.test(password)).toBe(false)
    })

    it("generates passphrase with deterministic suffixes", () => {
        const phrase = generatePassphrase({
            ...DEFAULT_PASSPHRASE_OPTIONS,
            wordCount: 3,
            separator: "-",
            capitalizeWords: true,
            appendNumber: true,
            appendSymbol: true,
        }, zeroRandom)

        expect(phrase).toBe("Amber-Amber-Amber00!")
    })

    it("generates batch output with clamped count", () => {
        const rows = generatePasswordBatch({
            mode: "passphrase",
            random: DEFAULT_RANDOM_OPTIONS,
            passphrase: {
                ...DEFAULT_PASSPHRASE_OPTIONS,
                wordCount: 2,
                separator: "_",
                appendNumber: false,
                appendSymbol: false,
            },
            count: 120,
            randomInt: zeroRandom,
        })

        expect(rows.length).toBe(100)
        expect(rows[0]).toBe("amber_amber")
    })

    it("estimates stronger entropy for high-security random policy", () => {
        const low = estimateStrength({
            mode: "random",
            random: { ...DEFAULT_RANDOM_OPTIONS, length: 8, includeSymbols: false },
            passphrase: DEFAULT_PASSPHRASE_OPTIONS,
        })
        const high = estimateStrength({
            mode: "random",
            random: { ...DEFAULT_RANDOM_OPTIONS, length: 24, includeSymbols: true },
            passphrase: DEFAULT_PASSPHRASE_OPTIONS,
        })

        expect(high.entropy).toBeGreaterThan(low.entropy)
        expect(high.fraction).toBeGreaterThanOrEqual(low.fraction)
    })

    it("fails closed when Web Crypto is unavailable", () => {
        const originalCrypto = globalThis.crypto
        Object.defineProperty(globalThis, "crypto", {
            configurable: true,
            value: undefined,
        })

        try {
            expect(() => secureRandomInt(10)).toThrow("Web Crypto is required")
        } finally {
            Object.defineProperty(globalThis, "crypto", {
                configurable: true,
                value: originalCrypto,
            })
        }
    })

    it("uses rejection sampling instead of modulo-biased random values", () => {
        const originalCrypto = globalThis.crypto
        const maxExclusive = 10
        const values = [4_294_967_295, 12]
        Object.defineProperty(globalThis, "crypto", {
            configurable: true,
            value: {
                getRandomValues(array: Uint32Array) {
                    array[0] = values.shift() ?? 0
                    return array
                },
            },
        })

        try {
            expect(secureRandomInt(maxExclusive)).toBe(2)
        } finally {
            Object.defineProperty(globalThis, "crypto", {
                configurable: true,
                value: originalCrypto,
            })
        }
    })
})
