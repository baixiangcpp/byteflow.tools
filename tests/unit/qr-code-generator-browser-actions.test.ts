import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { downloadBlob, downloadDataUrl, downloadSvg } from "@/features/tools/qr-code-generator/browser-actions"

function stubObjectUrlApi() {
    const createObjectURL = vi.fn(() => "blob:byteflow-test")
    const revokeObjectURL = vi.fn()
    Object.defineProperty(URL, "createObjectURL", {
        configurable: true,
        value: createObjectURL,
    })
    Object.defineProperty(URL, "revokeObjectURL", {
        configurable: true,
        value: revokeObjectURL,
    })
    return { createObjectURL, revokeObjectURL }
}

describe("qr code generator browser exports", () => {
    let clickCount = 0

    beforeEach(() => {
        clickCount = 0
        document.body.innerHTML = ""
        vi.useFakeTimers()
        vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {
            clickCount += 1
        })
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.restoreAllMocks()
        document.body.innerHTML = ""
    })

    it("exports data URLs through a temporary attached anchor", () => {
        const result = downloadDataUrl("data:image/png;base64,abc", "qr-code.png")

        expect(result).toEqual({ ok: true })
        expect(clickCount).toBe(1)
        expect(document.body.querySelector("a")).toBeNull()
    })

    it("exports blobs and defers object URL revocation", () => {
        const { createObjectURL, revokeObjectURL } = stubObjectUrlApi()

        const result = downloadBlob(new Blob(["png"], { type: "image/png" }), "qr-code.png")

        expect(result).toEqual({ ok: true })
        expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
        expect(clickCount).toBe(1)
        expect(revokeObjectURL).not.toHaveBeenCalled()

        vi.advanceTimersByTime(1_000)
        expect(revokeObjectURL).toHaveBeenCalledWith("blob:byteflow-test")
    })

    it("exports SVG through the same delayed-revoke path", () => {
        const { revokeObjectURL } = stubObjectUrlApi()

        const result = downloadSvg("<svg />", "qr-code.svg")

        expect(result).toEqual({ ok: true })
        expect(clickCount).toBe(1)
        expect(revokeObjectURL).not.toHaveBeenCalled()

        vi.advanceTimersByTime(1_000)
        expect(revokeObjectURL).toHaveBeenCalledWith("blob:byteflow-test")
    })
})
