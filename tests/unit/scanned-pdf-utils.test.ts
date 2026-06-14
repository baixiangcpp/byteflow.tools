import { describe, expect, it } from "vitest"
import { applyThresholdToRgba, buildScanFilterString, dataUrlToUint8Array } from "@/features/tools/scanned-pdf-converter/utils"

describe("scanned-pdf-utils", () => {
    it("builds scan filter string with clamped values", () => {
        const filter = buildScanFilterString({
            brightness: 120,
            contrast: 140,
            grayscale: 100,
            thresholdEnabled: true,
            threshold: 160,
        })
        expect(filter).toBe("brightness(120%) contrast(140%) grayscale(100%)")
    })

    it("applies binary threshold to rgba data", () => {
        const input = new Uint8ClampedArray([
            250, 250, 250, 255,
            40, 40, 40, 255,
        ])
        const output = applyThresholdToRgba(input, 128)
        expect(Array.from(output)).toEqual([
            255, 255, 255, 255,
            0, 0, 0, 255,
        ])
    })

    it("converts data URL to bytes", () => {
        const bytes = dataUrlToUint8Array("data:image/png;base64,AAEC")
        expect(Array.from(bytes)).toEqual([0, 1, 2])
    })
})
