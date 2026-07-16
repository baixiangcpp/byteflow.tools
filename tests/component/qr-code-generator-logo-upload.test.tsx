import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { FILE_INPUT_POLICIES } from "@/core/files/file-input-policy"
import { LangProvider } from "@/core/i18n/lang-provider"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { QrCodeGeneratorPage } from "@/features/tools/qr-code-generator/page"
import { SAMPLE_QR_TEXT } from "@/features/tools/qr-code-generator/constants"

const {
    readFileAsDataUrlMock,
    decodeQrImageFileMock,
    toastErrorMock,
    toastSuccessMock,
    toCanvasMock,
} = vi.hoisted(() => ({
    readFileAsDataUrlMock: vi.fn(),
    decodeQrImageFileMock: vi.fn(),
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
    decodeQrImageFile: (file: File) => decodeQrImageFileMock(file),
    downloadCanvasPng: vi.fn(),
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
        decodeQrImageFileMock.mockResolvedValue({ ok: false, error: "no_qr" })
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

    it("starts empty and keeps sample content behind explicit Sample and Clear actions", async () => {
        const { container } = renderPage()
        const content = container.querySelector<HTMLTextAreaElement>("textarea")

        expect(content).not.toBeNull()
        expect(content).toHaveValue("")

        fireEvent.click(screen.getByRole("button", { name: "Sample" }))
        await waitFor(() => expect(content).toHaveValue(SAMPLE_QR_TEXT))

        fireEvent.click(screen.getByRole("button", { name: "Clear" }))
        await waitFor(() => expect(content).toHaveValue(""))
    })

    it("resets QR settings without deleting user-owned content", async () => {
        const { container } = renderPage()
        const content = container.querySelector<HTMLTextAreaElement>("textarea")

        fireEvent.change(content!, { target: { value: "user-owned QR payload" } })
        fireEvent.click(screen.getByRole("button", { name: "Print" }))
        await waitFor(() => expect(screen.getByText(/Size:\s*320px/)).toBeInTheDocument())

        fireEvent.click(screen.getByRole("button", { name: "Reset" }))
        expect(content).toHaveValue("user-owned QR payload")
        expect(screen.getByText(/Size:\s*256px/)).toBeInTheDocument()
    })

    it("decodes an uploaded QR image without opening URL payloads automatically", async () => {
        const open = vi.spyOn(window, "open")
        decodeQrImageFileMock.mockResolvedValueOnce({
            ok: true,
            payload: "https://byteflow.tools/decoded",
            width: 256,
            height: 256,
        })
        const { container } = renderPage()

        fireEvent.click(screen.getByRole("tab", { name: "Decode image" }))
        const input = container.querySelector<HTMLInputElement>('input[accept*=".png"]')
        const qrImage = new File(["png"], "qr.png", { type: "image/png" })
        fireEvent.change(input!, { target: { files: [qrImage] } })

        expect(await screen.findByTestId("qr-decoded-output")).toHaveTextContent("https://byteflow.tools/decoded")
        expect(open).not.toHaveBeenCalled()

        expect(screen.getByRole("link", { name: "Open" })).toHaveAttribute("href", "https://byteflow.tools/decoded")
        expect(open).not.toHaveBeenCalled()
    })

    it("localizes decode failures", async () => {
        decodeQrImageFileMock.mockResolvedValueOnce({ ok: false, error: "no_qr" })
        const { container } = renderPage()

        fireEvent.click(screen.getByRole("tab", { name: "Decode image" }))
        const input = container.querySelector<HTMLInputElement>('input[accept*=".png"]')
        fireEvent.change(input!, { target: { files: [new File(["blank"], "blank.png", { type: "image/png" })] } })

        expect(await screen.findByRole("alert")).toHaveTextContent("No QR code was found in this image.")
    })
})
