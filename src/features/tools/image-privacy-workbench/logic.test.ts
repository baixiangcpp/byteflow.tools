import { describe, expect, it } from "vitest"
import { scanImageMetadata } from "./logic"

describe("image-privacy-workbench logic", () => {
    it("detects EXIF and GPS markers in image bytes", () => {
        const bytes = new TextEncoder().encode("JPEG Exif GPSLatitude Camera")
        const scan = scanImageMetadata(bytes, "image/jpeg")
        expect(scan.hasExif).toBe(true)
        expect(scan.hasGpsHint).toBe(true)
        expect(scan.hints.length).toBeGreaterThan(1)
    })

    it("reports clean re-encoded style bytes", () => {
        const scan = scanImageMetadata(new Uint8Array([137, 80, 78, 71]), "image/png")
        expect(scan.hasExif).toBe(false)
        expect(scan.hints).toEqual([])
    })
})
