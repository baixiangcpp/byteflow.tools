import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { FILE_INPUT_POLICIES } from "@/core/files/file-input-policy"
import { LangProvider } from "@/core/i18n/lang-provider"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { ImageResizerPage } from "@/features/tools/image-resizer/page"

const loadResizeImageFileMock = vi.fn()
const replaceObjectUrlMock = vi.fn()
const runImageResizeTaskMock = vi.fn()

vi.mock("next/navigation", () => ({
    usePathname: () => "/en/image-resizer",
}))

vi.mock("@/features/tools/image-resizer/browser-actions", () => ({
    loadResizeImageFile: (file: File) => loadResizeImageFileMock(file),
    replaceObjectUrl: (ref: { current: string | null }, nextUrl: string | null) => {
        ref.current = nextUrl
        replaceObjectUrlMock(ref, nextUrl)
    },
}))

vi.mock("@/features/tools/image-resizer/image-resize-task", () => ({
    runImageResizeTask: (input: unknown, options: unknown) => runImageResizeTaskMock(input, options),
}))

vi.mock("sonner", () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    },
}))

function renderEnglish(ui: React.ReactNode) {
    return render(
        <LangProvider lang="en" translations={getTranslation("en")}>
            {ui}
        </LangProvider>,
    )
}

function fileInput(): HTMLInputElement {
    return screen.getByLabelText(/Image files up to 12 MB and 24 MP/i) as HTMLInputElement
}

function outputValue(): string {
    return (screen.getByRole("textbox", { name: "Output" }) as HTMLTextAreaElement).value
}

class MockImage {
    onload: (() => void) | null = null
    width = 1280
    height = 720
    #src = ""

    get src() {
        return this.#src
    }

    set src(value: string) {
        this.#src = value
        queueMicrotask(() => this.onload?.())
    }
}

function installCanvasMock() {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
        arc: vi.fn(),
        beginPath: vi.fn(),
        fill: vi.fn(),
        fillRect: vi.fn(),
        createLinearGradient: vi.fn(() => ({
            addColorStop: vi.fn(),
        })),
        globalAlpha: 1,
        fillStyle: "",
    })) as unknown as HTMLCanvasElement["getContext"]
    HTMLCanvasElement.prototype.toDataURL = vi.fn(() => "data:image/png;base64,byteflow-sample")
}

describe("BF-025/BF-031 image file safety", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal("Image", MockImage)
        installCanvasMock()
        URL.createObjectURL = vi.fn(() => "blob:byteflow-image")
        URL.revokeObjectURL = vi.fn()
        runImageResizeTaskMock.mockResolvedValue({
            dataUrl: "data:image/webp;base64,resized",
            outputHeight: 720,
            outputWidth: 1280,
            sourceHeight: 720,
            sourceWidth: 1280,
        })
        loadResizeImageFileMock.mockResolvedValue({
            bytes: new ArrayBuffer(8),
            height: 720,
            mime: "image/png",
            name: "safe.png",
            objectUrl: "blob:safe-image",
            width: 1280,
        })
        window.history.replaceState(null, "", "/en/image-resizer")
    })

    it("shows shared limits, rejects invalid files before resize work, and keeps output actions disabled", async () => {
        renderEnglish(<ImageResizerPage />)

        expect(screen.getByText(/Accepted input: image\/\*/)).toBeInTheDocument()
        expect(screen.getByText(/Max file size: 12 MB/)).toBeInTheDocument()
        expect(screen.getByText(/Max resolution: 24 MP/)).toBeInTheDocument()

        loadResizeImageFileMock.mockRejectedValueOnce(new Error("The selected file is empty."))
        fireEvent.change(fileInput(), { target: { files: [new File([], "empty.png", { type: "image/png" })] } })
        expect(await screen.findByText("The selected file is empty.")).toBeInTheDocument()
        expect(runImageResizeTaskMock).not.toHaveBeenCalled()
        expect(screen.getByRole("button", {
            name: "Download",
            description: "Run the tool first to create output.",
        })).toBeDisabled()

        loadResizeImageFileMock.mockRejectedValueOnce(new Error("Unsupported file type. Supported input: Image files up to 12 MB and 24 MP."))
        fireEvent.change(fileInput(), { target: { files: [new File(["bad"], "payload.exe", { type: "application/octet-stream" })] } })
        expect(await screen.findByText("Unsupported file type. Supported input: Image files up to 12 MB and 24 MP.")).toBeInTheDocument()
        expect(runImageResizeTaskMock).not.toHaveBeenCalled()

        loadResizeImageFileMock.mockRejectedValueOnce(new Error("File is too large. Max supported size is 12 MB."))
        fireEvent.change(fileInput(), {
            target: {
                files: [new File([new Uint8Array(FILE_INPUT_POLICIES["image-standard"].maxBytes + 1)], "huge.png", { type: "image/png" })],
            },
        })
        expect(await screen.findByText("File is too large. Max supported size is 12 MB.")).toBeInTheDocument()
        expect(runImageResizeTaskMock).not.toHaveBeenCalled()

        loadResizeImageFileMock.mockRejectedValueOnce(new Error("Image is too large for local processing. Max supported resolution is 24 MP."))
        fireEvent.change(fileInput(), { target: { files: [new File(["image"], "too-wide.png", { type: "image/png" })] } })
        expect(await screen.findByText("Image is too large for local processing. Max supported resolution is 24 MP.")).toBeInTheDocument()
        expect(runImageResizeTaskMock).not.toHaveBeenCalled()
    })

    it("loads valid files with progress, allows cancellation, and runs resize only after policy checks pass", async () => {
        renderEnglish(<ImageResizerPage />)

        const file = new File(["safe"], "safe.png", { type: "image/png" })
        fireEvent.change(fileInput(), { target: { files: [file] } })

        await waitFor(() => expect(loadResizeImageFileMock).toHaveBeenCalledWith(file))
        expect(await screen.findByText(/safe\.png/)).toBeInTheDocument()
        expect(screen.getByRole("progressbar", { name: /file/i })).toBeInTheDocument()

        await waitFor(() => expect(runImageResizeTaskMock).toHaveBeenCalled())
        expect(outputValue()).toContain("Source: 1280 x 720")
        expect(screen.getByRole("button", { name: "Download" })).not.toBeDisabled()

        runImageResizeTaskMock.mockReturnValueOnce(new Promise(() => undefined))
        fireEvent.click(screen.getByRole("button", { name: "Sample" }))
        await waitFor(() => expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument())
        fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
        expect(screen.getByText("Processing cancelled.")).toBeInTheDocument()
        expect(screen.getByRole("button", {
            name: "Download",
            description: "Run the tool first to create output.",
        })).toBeDisabled()
    })
})
