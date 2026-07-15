import { describe, expect, it } from "vitest"
import {
    MAX_HOTP_COUNTER,
    OtpValidationError,
    decodeBase32Strict,
    generateHOTP,
    generateRandomSecret,
    generateTOTP,
    parseHotpCounter,
    parseTotpPeriod,
} from "@/features/tools/totp-generator/logic"

const RFC_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"

describe("strict Base32 decoding", () => {
    it("decodes ASCII Base32 without silently changing the input", () => {
        const decoded = decodeBase32Strict("jbswy3dpehpk3pxp")
        expect(decoded).toMatchObject({ ok: true })
        if (decoded.ok) expect(Array.from(decoded.value)).toEqual([72, 101, 108, 108, 111, 33, 222, 173, 190, 239])
    })

    it.each([
        ["", "secret_required"],
        ["JBSWY3DPEHPK3PXP0", "secret_invalid_characters"],
        ["JBSWY3DPEHPK3PXP1", "secret_invalid_characters"],
        ["JBSWY3DP-EHPK3PXP", "secret_invalid_characters"],
        ["JBSWY3DP EHPK3PXP", "secret_invalid_characters"],
        ["JBSWY3DPEHPK3PXPß", "secret_invalid_characters"],
        ["JBSWY3DPEHPK3PXPı", "secret_invalid_characters"],
        ["MY======", "secret_padding_unsupported"],
        ["A", "secret_invalid_length"],
        ["MZ", "secret_invalid_padding_bits"],
    ])("rejects %j with %s", (input, errorCode) => {
        expect(decodeBase32Strict(input)).toEqual({ ok: false, errorCode })
    })
})

describe("OTP numeric validation", () => {
    it.each(["", "0", "14", "121", "30.5", "-30", "Infinity", " 30"])("rejects invalid TOTP period %j", (input) => {
        expect(parseTotpPeriod(input).ok).toBe(false)
    })

    it.each(["15", "30", "120"])("accepts TOTP period %s", (input) => {
        expect(parseTotpPeriod(input)).toEqual({ ok: true, value: Number(input) })
    })

    it.each(["", "-1", "1.5", "NaN", "Infinity", `${MAX_HOTP_COUNTER + 1}`])("rejects invalid HOTP counter %j", (input) => {
        expect(parseHotpCounter(input).ok).toBe(false)
    })

    it.each(["0", `${2 ** 32 - 1}`, `${2 ** 32}`, `${MAX_HOTP_COUNTER}`])("accepts HOTP counter %s", (input) => {
        expect(parseHotpCounter(input)).toEqual({ ok: true, value: Number(input) })
    })
})

describe("RFC-compatible OTP generation", () => {
    it("passes the RFC 4226 HOTP SHA-1 vectors", async () => {
        const expected = ["755224", "287082", "359152", "969429", "338314", "254676", "287922", "162583", "399871", "520489"]
        await expect(Promise.all(expected.map((_, counter) => generateHOTP(RFC_SECRET, counter)))).resolves.toEqual(expected)
    })

    it.each([
        [59, "94287082"],
        [1_111_111_109, "07081804"],
        [1_111_111_111, "14050471"],
        [1_234_567_890, "89005924"],
        [2_000_000_000, "69279037"],
        [20_000_000_000, "65353130"],
    ])("passes the RFC 6238 SHA-1 vector at %s", async (time, expected) => {
        await expect(generateTOTP(RFC_SECRET, time, 8, 30)).resolves.toBe(expected)
    })

    it("encodes counters across the 32-bit boundary and rejects unsafe counters", async () => {
        await expect(generateHOTP(RFC_SECRET, 2 ** 32)).resolves.toMatch(/^\d{6}$/)
        await expect(generateHOTP(RFC_SECRET, MAX_HOTP_COUNTER)).resolves.toMatch(/^\d{6}$/)
        await expect(generateHOTP(RFC_SECRET, MAX_HOTP_COUNTER + 1)).rejects.toMatchObject({
            code: "counter_out_of_range",
        } satisfies Partial<OtpValidationError>)
    })

    it("encodes random bytes as a canonical Base32 secret", () => {
        const secret = generateRandomSecret()
        expect(secret).toMatch(/^[A-Z2-7]{32}$/)
        expect(decodeBase32Strict(secret)).toMatchObject({ ok: true })
    })
})
