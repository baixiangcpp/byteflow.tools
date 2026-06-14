import { describe, expect, it } from "vitest"
import {
    computeEan13CheckDigit,
    isValidEan13,
    normalizeBarcodeValue,
} from "@/features/tools/barcode-generator/utils"

describe("barcode-utils", () => {
    it("computes and validates ean13 checksum", () => {
        expect(computeEan13CheckDigit("590123412345")).toBe("7")
        expect(isValidEan13("5901234123457")).toBe(true)
        expect(isValidEan13("5901234123458")).toBe(false)
    })

    it("normalizes ean13 from 12 digits", () => {
        const result = normalizeBarcodeValue("590123412345", "EAN13")
        expect(result.errorKey).toBeNull()
        expect(result.normalized).toBe("5901234123457")
    })

    it("validates code128 ASCII range", () => {
        expect(normalizeBarcodeValue("BYTEFLOW-2026", "CODE128").errorKey).toBeNull()
        expect(normalizeBarcodeValue("测试", "CODE128").errorKey).toBe("code128_ascii_only")
    })
})
