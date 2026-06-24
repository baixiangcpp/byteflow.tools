import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { LangProvider } from "@/core/i18n/lang-provider"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { InstagramPhotoDownloaderPage } from "@/features/tools/instagram-photo-downloader/page"
import { VimeoThumbnailGrabberPage } from "@/features/tools/vimeo-thumbnail-grabber/page"
import { YouTubeThumbnailGrabberPage } from "@/features/tools/youtube-thumbnail-grabber/page"

const toastErrorMock = vi.fn()
const toastSuccessMock = vi.fn()
const toastInfoMock = vi.fn()

vi.mock("next/navigation", () => ({
    usePathname: () => "/en/youtube-thumbnail-grabber",
}))

vi.mock("sonner", () => ({
    toast: {
        error: (...args: unknown[]) => toastErrorMock(...args),
        success: (...args: unknown[]) => toastSuccessMock(...args),
        info: (...args: unknown[]) => toastInfoMock(...args),
    },
}))

class MockImage {
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    src = ""
}

function renderEnglish(ui: React.ReactNode) {
    return render(
        <LangProvider lang="en" translations={getTranslation("en")}>
            {ui}
        </LangProvider>,
    )
}

describe("external request media tools", () => {
    beforeEach(() => {
        toastErrorMock.mockClear()
        toastSuccessMock.mockClear()
        toastInfoMock.mockClear()
        vi.stubGlobal("Image", MockImage)
        vi.stubGlobal("fetch", vi.fn())
        vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined)
        window.history.replaceState(null, "", "/en/youtube-thumbnail-grabber")
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    it("keeps YouTube thumbnail requests behind explicit confirmation", async () => {
        renderEnglish(<YouTubeThumbnailGrabberPage />)

        fireEvent.click(screen.getByRole("button", { name: "Sample" }))

        expect(screen.getByText("Confirm external request")).toBeInTheDocument()
        expect(screen.getByText("youtube.com, youtube-nocookie.com, youtu.be, i.ytimg.com")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: "Preview", description: ": Confirm the external request before previewing or downloading." })).toBeDisabled()
        expect(globalThis.fetch).not.toHaveBeenCalled()

        fireEvent.click(screen.getByLabelText("I understand this action may request the disclosed external asset from my browser."))
        fireEvent.click(screen.getByRole("button", { name: "Preview" }))

        await waitFor(() => {
            expect(screen.queryByRole("button", { name: "Preview", description: ": Confirm the external request before previewing or downloading." })).not.toBeInTheDocument()
        })
        expect(globalThis.fetch).not.toHaveBeenCalled()
    })

    it("keeps Vimeo thumbnail requests behind explicit confirmation", () => {
        renderEnglish(<VimeoThumbnailGrabberPage />)

        fireEvent.click(screen.getByRole("button", { name: "Sample" }))

        expect(screen.getByText("Confirm external request")).toBeInTheDocument()
        expect(screen.getByText("vimeo.com, player.vimeo.com, vumbnail.com")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: "Preview", description: ": Confirm the external request before previewing or downloading." })).toBeDisabled()

        fireEvent.click(screen.getByLabelText("I understand this action may request the disclosed external asset from my browser."))

        expect(screen.getByRole("button", { name: "Preview" })).not.toBeDisabled()
        expect(globalThis.fetch).not.toHaveBeenCalled()
    })

    it("requires Instagram rights confirmation and external request confirmation before fetch download", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            blob: () => Promise.resolve(new Blob(["image"], { type: "image/jpeg" })),
        })
        vi.stubGlobal("fetch", fetchMock)
        URL.createObjectURL = vi.fn(() => "blob:byteflow-test")
        URL.revokeObjectURL = vi.fn()

        renderEnglish(<InstagramPhotoDownloaderPage />)

        fireEvent.change(screen.getByPlaceholderText("https://…"), { target: { value: "https://cdn.instagram.com/public/photo.jpg" } })
        fireEvent.click(screen.getByLabelText("I confirm this media URL is mine or I have explicit permission to download and use it."))

        expect(screen.getByRole("button", { name: "Download", description: ": Confirm the external request before previewing or downloading." })).toBeDisabled()
        expect(fetchMock).not.toHaveBeenCalled()

        fireEvent.click(screen.getByLabelText("I understand this action may request the disclosed external asset from my browser."))
        fireEvent.click(screen.getByRole("button", { name: "Download" }))

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith("https://cdn.instagram.com/public/photo.jpg")
        })
    })
})
