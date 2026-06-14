import { describe, expect, it } from "vitest"
import {
    computeIbanCheckDigits,
    formatIbanForDisplay,
    generateFakeIbans,
    validateIban,
} from "@/features/tools/fake-iban-generator/utils"

describe("fake-iban-utils", () => {
    it("computes known check digits", () => {
        expect(computeIbanCheckDigits("DE", "370400440532013000")).toBe("89")
    })

    it("generates deterministic valid IBANs with seed", () => {
        const first = generateFakeIbans("GB", 3, "stable")
        const second = generateFakeIbans("GB", 3, "stable")
        expect(first).toEqual(second)
        expect(first.every((item) => validateIban(item).valid)).toBe(true)
    })

    it("validates and formats iban text", () => {
        const known = "DE89370400440532013000"
        expect(validateIban(known).valid).toBe(true)
        expect(formatIbanForDisplay(known)).toBe("DE89 3704 0044 0532 0130 00")
    })

    it("returns stable reason keys for invalid input", () => {
        expect(validateIban("DE89")).toMatchObject({ valid: false, reasonKey: "too_short" })
        expect(validateIban("DE123")).toMatchObject({ valid: false, reasonKey: "invalid_length" })
        expect(validateIban("1E123456")).toMatchObject({ valid: false, reasonKey: "invalid_prefix" })
        expect(validateIban("DE89370400440532013001")).toMatchObject({ valid: false, reasonKey: "checksum_failed" })
    })
})
