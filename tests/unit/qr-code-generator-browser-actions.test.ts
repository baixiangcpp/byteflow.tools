import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
    downloadBlob,
    downloadCanvasPng,
    downloadSvg,
    downloadUrl,
} from "@/features/tools/qr-code-generator/browser-actions"

const ORIGINAL_CREATE_OBJECT_URL_DESCRIPTOR = Object.getOwnPropertyDescriptor(URL, "createObjectURL")
const ORIGINAL_REVOKE_OBJECT_URL_DESCRIPTOR = Object.getOwnPropertyDescriptor(URL, "revokeObjectURL")

function restoreUrlProperty(name: "createObjectURL" | "revokeObjectURL", descriptor: PropertyDescriptor | undefined) {
    if (descriptor) {
        Object.defineProperty(URL, name, descriptor)
    } else {
        delete (URL as unknown as Record<string, unknown>)[name]
    }
}

function stubObjectUrlApi() {
    const createObjectURL = vi.fn(() => "blob:byteflow-test")
    const revokeObjectURL = vi.fn()
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL })
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectURL })
    return { createObjectURL, revokeObjectURL }
}

describe("QR code generator browser downloads", () => {
    beforeEach(() => {
        document.body.innerHTML = ""
        vi.useFakeTimers()
    })

    afterEach(() => {
        restoreUrlProperty("createObjectURL", ORIGINAL_CREATE_OBJECT_URL_DESCRIPTOR)
        restoreUrlProperty("revokeObjectURL", ORIGINAL_REVOKE_OBJECT_URL_DESCRIPTOR)
        vi.useRealTimers()
        vi.restoreAllMocks()
        document.body.innerHTML = ""
    })

    it("clicks an attached temporary anchor and removes it afterward", () => {
        const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
            expect(document.body.contains(this)).toBe(true)
            expect(this.rel).toBe("noopener")
            expect(this.download).toBe("qr-code.png")
        })

        expect(downloadUrl("data:image/png;base64,abc", "qr-code.png")).toEqual({ ok: true })
        expect(click).toHaveBeenCalledOnce()
        expect(document.body.querySelector("a")).toBeNull()
    })

    it("reports click failures and still removes the temporary anchor", () => {
        vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {
            throw new Error("blocked")
        })

        expect(downloadUrl("data:image/png;base64,abc", "qr-code.png")).toEqual({
            ok: false,
            error: "download_failed",
        })
        expect(document.body.querySelector("a")).toBeNull()
    })

    it("downloads non-empty blobs and defers object URL revocation", () => {
        const { createObjectURL, revokeObjectURL } = stubObjectUrlApi()
        vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined)
        const blob = new Blob(["png"], { type: "image/png" })

        expect(downloadBlob(blob, "qr-code.png")).toEqual({ ok: true })
        expect(createObjectURL).toHaveBeenCalledWith(blob)
        expect(revokeObjectURL).not.toHaveBeenCalled()

        vi.advanceTimersByTime(999)
        expect(revokeObjectURL).not.toHaveBeenCalled()
        vi.advanceTimersByTime(1)
        expect(revokeObjectURL).toHaveBeenCalledWith("blob:byteflow-test")
    })

    it("prefers canvas.toBlob for PNG downloads", async () => {
        const { createObjectURL } = stubObjectUrlApi()
        vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined)
        const canvas = document.createElement("canvas")
        const png = new Blob(["png"], { type: "image/png" })
        const toDataURL = vi.spyOn(canvas, "toDataURL")
        const toBlob = vi.spyOn(canvas, "toBlob").mockImplementation((callback) => callback(png))

        await expect(downloadCanvasPng(canvas, "qr-code.png")).resolves.toEqual({ ok: true })
        expect(toBlob).toHaveBeenCalledWith(expect.any(Function), "image/png")
        expect(toDataURL).not.toHaveBeenCalled()
        expect(createObjectURL).toHaveBeenCalledWith(png)
    })

    it("uses a local data URL fallback when canvas.toBlob produces no file", async () => {
        vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined)
        const canvas = document.createElement("canvas")
        vi.spyOn(canvas, "toBlob").mockImplementation((callback) => callback(null))
        const toDataURL = vi.spyOn(canvas, "toDataURL").mockReturnValue("data:image/png;base64,abc")

        await expect(downloadCanvasPng(canvas, "qr-code.png")).resolves.toEqual({ ok: true })
        expect(toDataURL).toHaveBeenCalledWith("image/png")
    })

    it("exports SVG through the delayed object URL path", () => {
        const { createObjectURL, revokeObjectURL } = stubObjectUrlApi()
        vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined)

        expect(downloadSvg("<svg xmlns=\"http://www.w3.org/2000/svg\" />", "qr-code.svg")).toEqual({ ok: true })
        expect(createObjectURL).toHaveBeenCalledWith(expect.objectContaining({ type: "image/svg+xml" }))
        expect(revokeObjectURL).not.toHaveBeenCalled()
    })
})
