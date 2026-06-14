import { describe, expect, it } from "vitest"
import { calculateResizeDrawBox, getOutputMimeType, normalizeResizeDimension } from "@/features/tools/image-resizer/utils"

describe("image-resize-utils", () => {
    it("normalizes target dimensions", () => {
        expect(normalizeResizeDimension(0, 640)).toBe(1)
        expect(normalizeResizeDimension(5000, 640)).toBe(4096)
        expect(normalizeResizeDimension(720.4, 640)).toBe(720)
    })

    it("calculates contain draw box", () => {
        const result = calculateResizeDrawBox(1200, 600, 600, 600, "contain")
        expect(result).toEqual({
            canvasWidth: 600,
            canvasHeight: 600,
            drawWidth: 600,
            drawHeight: 300,
            offsetX: 0,
            offsetY: 150,
        })
    })

    it("calculates cover draw box", () => {
        const result = calculateResizeDrawBox(1200, 600, 600, 600, "cover")
        expect(result.drawWidth).toBe(1200)
        expect(result.drawHeight).toBe(600)
        expect(result.offsetX).toBe(-300)
        expect(result.offsetY).toBe(0)
    })

    it("maps output MIME types", () => {
        expect(getOutputMimeType("png")).toBe("image/png")
        expect(getOutputMimeType("jpeg")).toBe("image/jpeg")
        expect(getOutputMimeType("webp")).toBe("image/webp")
    })
})
