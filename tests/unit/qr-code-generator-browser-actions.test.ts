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

describe("qr code generator browser downloads", () => {
    let clickSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        document.body.innerHTML = ""
        vi.useFakeTimers()
        clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined)
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.restoreAllMocks()
        document.body.innerHTML = ""
    })

    it("downloads data URLs through a temporary attached anchor", () => {
        const result = downloadDataUrl("data:image/png;base64,abc", "qr-code.png")

        expect(result).toEqual({ ok: true })
        expect(clickSpy).toHaveBeenCalledTimes(1)
        expect(document.body.querySelector("a")).toBeNull()
    })

    it("downloads blobs and defers object URL revocation", () => {
        const { createObjectURL, revokeObjectURL } = stubObjectUrlApi()

        const result = downloadBlob(new Blob(["png"], { type: "image/png" }), "qr-code.png")

        expect(result).toEqual({ ok: true })
        expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
        expect(clickSpy).toHaveBeenCalledTimes(1)
        expect(revokeObjectURL).not.toHaveBeenCalled()

        vi.advanceTimersByTime(1_000)
        expect(revokeObjectURL).toHaveBeenCalledWith("blob:byteflow-test")
    })

    it("exports SVG through the same delayed-revoke path", () => {
        const { revokeObjectURL } = stubObjectUrlApi()

        const result = downloadSvg("<svg xmlns=\"http://www.w3.org/2000/svg\" />", "qr-code.svg")

        expect(result).toEqual({ ok: true })
        expect(clickSpy).toHaveBeenCalledTimes(1)
        expect(revokeObjectURL).not.toHaveBeenCalled()

        vi.advanceTimersByTime(1_000)
        expect(revokeObjectURL).toHaveBeenCalledWith("blob:byteflow-test")
    })
})
