import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { FILE_INPUT_POLICIES } from "@/core/files/file-input-policy"
import { LangProvider } from "@/core/i18n/lang-provider"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { QrCodeGeneratorPage } from "@/features/tools/qr-code-generator/page"

const {
    readFileAsDataUrlMock,
    toastErrorMock,
    toastSuccessMock,
    toCanvasMock,
} = vi.hoisted(() => ({
    readFileAsDataUrlMock: vi.fn(),
    toastErrorMock: vi.fn(),
    toastSuccessMock: vi.fn(),
    toCanvasMock: vi.fn(),
}))

vi.mock("@/core/seo/components/related-tools", () => ({
    RelatedTools: () => null,
}))

vi.mock("next/navigation", () => ({
    usePathname: () => "/en/qr-code-generator",
}))

vi.mock("@/features/tools/qr-code-generator/browser-actions", () => ({
    buildQrSvg: vi.fn(),
    downloadDataUrl: vi.fn(),
    downloadSvg: vi.fn(),
    drawRoundedRect: vi.fn(),
    loadImage: vi.fn(),
    loadQRCode: async () => ({ toCanvas: toCanvasMock }),
    loadToast: async () => ({
        error: toastErrorMock,
        success: toastSuccessMock,
    }),
    readFileAsDataUrl: (file: File) => readFileAsDataUrlMock(file),
}))

function renderPage() {
    return render(
        <LangProvider lang="en" translations={getTranslation("en")}>
            <QrCodeGeneratorPage />
        </LangProvider>,
    )
}

describe("QR code generator logo uploads", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal("ResizeObserver", class {
            observe() {}
            unobserve() {}
            disconnect() {}
        })
        toCanvasMock.mockResolvedValue(undefined)
        HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as HTMLCanvasElement["getContext"]
        HTMLCanvasElement.prototype.toDataURL = vi.fn(() => "data:image/png;base64,qr-code")
    })

    it("limits the picker to raster logo formats and points SVG users to the converter", () => {
        const { container } = renderPage()
        const input = container.querySelector<HTMLInputElement>('input[type="file"]')

        expect(input).not.toBeNull()
        expect(input).toHaveAttribute("accept", FILE_INPUT_POLICIES["image-logo"].accept)
        expect(input).not.toHaveAttribute("accept", "image/*")
        expect(screen.getByText(/Convert SVG logos with the SVG to PNG tool first/i)).toBeInTheDocument()
    })

    it("reports strict raster validation failures without enabling a rejected SVG logo", async () => {
        const { container } = renderPage()
        const input = container.querySelector<HTMLInputElement>('input[type="file"]')
        const disguisedSvg = new File(["<svg></svg>"], "logo.png", { type: "image/png" })
        readFileAsDataUrlMock.mockRejectedValueOnce(new Error("File content does not match a supported raster image."))

        fireEvent.change(input!, { target: { files: [disguisedSvg] } })

        await waitFor(() => expect(readFileAsDataUrlMock).toHaveBeenCalledWith(disguisedSvg))
        await waitFor(() => expect(toastErrorMock).toHaveBeenCalledWith(
            "Please upload a valid PNG, JPEG, WebP, or GIF logo. SVG files are not supported here.",
        ))
        expect(screen.queryByText("logo.png")).not.toBeInTheDocument()
        expect(screen.getByRole("switch")).not.toBeChecked()
    })

    it("enables a logo only after raster content validation succeeds", async () => {
        const { container } = renderPage()
        const input = container.querySelector<HTMLInputElement>('input[type="file"]')
        const logo = new File(["png"], "logo.png", { type: "image/png" })
        readFileAsDataUrlMock.mockResolvedValueOnce("data:image/png;base64,logo")

        fireEvent.change(input!, { target: { files: [logo] } })

        expect(await screen.findByText("logo.png")).toBeInTheDocument()
        expect(screen.getByRole("switch")).toBeChecked()
        expect(toastErrorMock).not.toHaveBeenCalled()
    })
})
