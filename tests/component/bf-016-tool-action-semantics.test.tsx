import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { LangProvider } from "@/core/i18n/lang-provider"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { Base64Page } from "@/features/tools/base64-encode-decode/page"
import { ImageResizerPage } from "@/features/tools/image-resizer/page"
import { JsonFormatterPage } from "@/features/tools/json-formatter/page"
import { RegexTesterPage } from "@/features/tools/regex-tester/page"
import { YouTubeThumbnailGrabberPage } from "@/features/tools/youtube-thumbnail-grabber/page"
import { RegexTestWorkerMock } from "../helpers/regex-test-worker-mock"

const clipboardWriteMock = vi.fn()
const downloadJsonOutputMock = vi.fn()
const runImageResizeTaskMock = vi.fn()
const loadResizeImageFileMock = vi.fn()
const replaceObjectUrlMock = vi.fn()

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}))

vi.mock("next/navigation", () => ({
    usePathname: () => "/en/json-formatter",
}))

vi.mock("@/core/clipboard/clipboard", () => ({
    safeClipboardWrite: (value: string) => clipboardWriteMock(value),
}))

vi.mock("@/features/tools/json-formatter/browser-actions", () => ({
    downloadJsonOutput: (content: string, filename: string) => downloadJsonOutputMock(content, filename),
}))

vi.mock("@/features/tools/image-resizer/image-resize-task", () => ({
    runImageResizeTask: (input: unknown, options: unknown) => runImageResizeTaskMock(input, options),
}))

vi.mock("@/features/tools/image-resizer/browser-actions", () => ({
    loadResizeImageFile: (file: File) => loadResizeImageFileMock(file),
    replaceObjectUrl: (ref: { current: string | null }, nextUrl: string | null) => {
        ref.current = nextUrl
        replaceObjectUrlMock(ref, nextUrl)
    },
}))

vi.mock("sonner", () => ({
    toast: {
        error: vi.fn(),
        info: vi.fn(),
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

function installMemoryStorage() {
    const store = new Map<string, string>()
    Object.defineProperty(window, "localStorage", {
        configurable: true,
        value: {
            getItem: (key: string) => store.get(key) ?? null,
            setItem: (key: string, value: string) => store.set(key, value),
            removeItem: (key: string) => store.delete(key),
            key: (index: number) => [...store.keys()][index] ?? null,
            get length() {
                return store.size
            },
        },
    })
}

function installMobileMatchMedia() {
    Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: vi.fn(() => ({
            matches: true,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        })),
    })
}

function installCanvasMock() {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
        arc: vi.fn(),
        beginPath: vi.fn(),
        drawImage: vi.fn(),
        fill: vi.fn(),
        fillRect: vi.fn(),
        createLinearGradient: vi.fn(() => ({
            addColorStop: vi.fn(),
        })),
        getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4), height: 1, width: 1 })),
        globalAlpha: 1,
        fillStyle: "",
    })) as unknown as HTMLCanvasElement["getContext"]
    HTMLCanvasElement.prototype.toDataURL = vi.fn(() => "data:image/png;base64,byteflow-sample")
}

function textboxValue(name: string): string {
    const element = screen.getByRole("textbox", { name }) as HTMLTextAreaElement | HTMLInputElement
    return element.value
}

function outputValue(name: string): string {
    const textbox = screen.queryByRole("textbox", { name }) as HTMLTextAreaElement | HTMLInputElement | null
    return textbox?.value ?? screen.getByLabelText(name).textContent ?? ""
}

function queryOutputValue(name: string): string {
    const textbox = screen.queryByRole("textbox", { name }) as HTMLTextAreaElement | HTMLInputElement | null
    return textbox?.value ?? screen.queryByLabelText(name)?.textContent ?? ""
}

class MockImage {
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
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

describe("BF-016 shared tool action semantics", () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    beforeEach(() => {
        vi.clearAllMocks()
        installMemoryStorage()
        installMobileMatchMedia()
        window.history.replaceState(null, "", "/en/json-formatter")
        clipboardWriteMock.mockResolvedValue({ ok: true })
        downloadJsonOutputMock.mockReturnValue(undefined)
        runImageResizeTaskMock.mockResolvedValue({
            dataUrl: "data:image/webp;base64,resized",
            outputHeight: 675,
            outputWidth: 1200,
            sourceHeight: 720,
            sourceWidth: 1280,
        })
        loadResizeImageFileMock.mockResolvedValue({
            bytes: new ArrayBuffer(8),
            height: 720,
            mime: "image/png",
            name: "local.png",
            objectUrl: "blob:local-image",
            width: 1280,
        })
        Object.defineProperty(window.navigator, "onLine", {
            configurable: true,
            value: true,
        })
        vi.stubGlobal("Image", MockImage)
        installCanvasMock()
        URL.createObjectURL = vi.fn(() => "blob:byteflow-test")
        URL.revokeObjectURL = vi.fn()
    })

    it("keeps JSON Formatter Sample and Clear scoped to example/input/output/error state", async () => {
        renderEnglish(<JsonFormatterPage />)

        fireEvent.click(screen.getByRole("button", { name: "Sample" }))

        await waitFor(() => {
            expect(textboxValue("Input")).toContain('"Alice Chen"')
            expect(outputValue("Output")).toContain('"Alice Chen"')
        })

        fireEvent.change(screen.getByRole("textbox", { name: "Input" }), { target: { value: "{\"ok\":}" } })
        fireEvent.click(screen.getByRole("button", { name: "Format" }))

        await waitFor(() => {
            expect(screen.getByRole("alert")).toHaveTextContent(/Invalid JSON|Unexpected token|Expected/)
        })
        expect(textboxValue("Input")).not.toContain('"Alice Chen"')
        expect(queryOutputValue("Output")).not.toContain('"Alice Chen"')

        fireEvent.click(screen.getByRole("button", { name: "Clear" }))
        expect(screen.getByRole("textbox", { name: "Input" })).toHaveValue("")
        expect(screen.queryByRole("alert")).not.toBeInTheDocument()
        expect(screen.getByRole("button", {
            name: "Download JSON",
            description: "Run the tool first to create output.",
        })).toBeDisabled()
        expect(window.localStorage.getItem("byteflow:json-formatter:input")).toBeNull()
    })

    it("keeps Base64 Sample, Clear, and mode changes from carrying stale output or file state", async () => {
        window.history.replaceState(null, "", "/en/base64-encode-decode")
        renderEnglish(<Base64Page />)

        fireEvent.click(screen.getByRole("button", { name: "Sample" }))
        expect(screen.getByRole("textbox", { name: "Input" })).toHaveValue("user_001|zh-CN|text")

        fireEvent.click(screen.getByRole("button", { name: "Encode Base64" }))
        await waitFor(() => expect(outputValue("Output")).toContain("dXNlcl8wMDF8emgtQ058dGV4dA=="))

        fireEvent.click(screen.getByRole("radio", { name: "File" }))
        expect(screen.getByRole("textbox", { name: "Input" })).toHaveValue("")
        expect(outputValue("Output")).toContain("Result will appear here...")

        fireEvent.click(screen.getByRole("button", { name: "Sample" }))
        expect(await screen.findByText("Select a file to try file encoding.")).toBeInTheDocument()
        expect(screen.getByRole("textbox", { name: "Input" })).toHaveValue("")

        fireEvent.click(screen.getByRole("radio", { name: "Decode" }))
        fireEvent.click(screen.getByRole("button", { name: "Sample" }))
        expect(screen.getByRole("textbox", { name: "Input" })).toHaveValue("AAECAwQFBgcICQ==")
        expect(screen.queryByText("Select a file to try file encoding.")).not.toBeInTheDocument()

        fireEvent.click(screen.getByRole("button", { name: "Clear" }))
        expect(screen.getByRole("textbox", { name: "Input" })).toHaveValue("")
        expect(outputValue("Output")).toContain("Result will appear here...")
        expect(screen.queryByText("Select a file to try file encoding.")).not.toBeInTheDocument()
    })

    it("keeps Regex Tester Sample and Clear deterministic after invalid and valid states", async () => {
        vi.stubGlobal("Worker", RegexTestWorkerMock)
        renderEnglish(<RegexTesterPage />)

        expect(screen.getByRole("button", { name: "Sample" })).toHaveAttribute(
            "title",
            "Restore the default regex pattern, flags, and test string.",
        )
        expect(screen.getByRole("button", { name: "Clear" })).toHaveAttribute(
            "title",
            "Clear the pattern and test string while keeping safe default flags.",
        )

        fireEvent.change(screen.getByLabelText("Expression Pattern"), { target: { value: "(" } })
        await waitFor(() => expect(screen.getByText(/Invalid regular expression|Unterminated group/i)).toBeInTheDocument())

        fireEvent.click(screen.getByRole("button", { name: "Sample" }))
        expect(screen.getByLabelText("Expression Pattern")).toHaveValue("[A-Z][a-z]+")
        expect(screen.getByLabelText("Flags")).toHaveValue("g")
        expect(screen.getByRole("textbox", { name: "Test String" })).toHaveValue("Ab1 Cd2 Ef3 Gh4.")
        await waitFor(() => expect(screen.getByText("Match 1")).toBeInTheDocument())
        expect(screen.queryByText(/Invalid regular expression|Unterminated group/i)).not.toBeInTheDocument()

        fireEvent.click(screen.getByRole("button", { name: "Clear" }))
        expect(screen.getByLabelText("Expression Pattern")).toHaveValue("")
        expect(screen.getByLabelText("Flags")).toHaveValue("g")
        expect(screen.getByRole("textbox", { name: "Test String" })).toHaveValue("")
        expect(screen.queryByText("Match 1")).not.toBeInTheDocument()
    })

    it("keeps Image Resizer Sample, Clear, and Reset semantics separate", async () => {
        renderEnglish(<ImageResizerPage />)

        const widthInput = screen.getByLabelText("Width")
        const heightInput = screen.getByLabelText("Height")

        fireEvent.change(widthInput, { target: { value: "800" } })
        expect(widthInput).toHaveValue(800)

        fireEvent.click(screen.getByRole("button", { name: "Sample" }))
        await waitFor(() => expect(widthInput).toHaveValue(1200))
        expect(heightInput).toHaveValue(675)
        await waitFor(() => expect(runImageResizeTaskMock).toHaveBeenCalled())
        expect(outputValue("Output")).toContain("Format: WEBP")

        const file = new File(["image"], "local.png", { type: "image/png" })
        fireEvent.change(screen.getByLabelText(/Image files up to 12 MB and 24 MP/i), { target: { files: [file] } })
        await waitFor(() => expect(loadResizeImageFileMock).toHaveBeenCalledWith(file))
        expect(await screen.findByText(/local\.png/)).toBeInTheDocument()

        fireEvent.click(screen.getByRole("button", { name: "Clear" }))
        expect(screen.queryByText(/local\.png/)).not.toBeInTheDocument()
        expect(outputValue("Output")).toContain("Source: - x -")
        expect(widthInput).toHaveValue(1280)
        expect(heightInput).toHaveValue(720)

        fireEvent.change(widthInput, { target: { value: "640" } })
        fireEvent.click(screen.getByRole("button", { name: "Reset" }))
        expect(widthInput).toHaveValue(1280)
        expect(heightInput).toHaveValue(720)
        expect(screen.queryByText(/local\.png/)).not.toBeInTheDocument()
    })

    it("keeps external-request media Sample and Clear from preserving confirmation or preview state", async () => {
        window.history.replaceState(null, "", "/en/youtube-thumbnail-grabber")
        renderEnglish(<YouTubeThumbnailGrabberPage />)

        fireEvent.click(screen.getByRole("button", { name: "Sample" }))
        expect(screen.getByDisplayValue("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBeInTheDocument()
        expect(screen.getByRole("button", {
            name: "Preview",
            description: "Confirm the external request before previewing or downloading.",
        })).toBeDisabled()

        fireEvent.click(screen.getByLabelText("I understand this action may request the disclosed external asset from my browser."))
        fireEvent.click(screen.getByRole("button", { name: "Preview" }))

        await waitFor(() => {
            expect(screen.getByRole("img", { name: /YouTube Thumbnail Grabber Preview/i })).toBeInTheDocument()
        })

        act(() => {
            fireEvent.click(screen.getByRole("button", { name: "Clear" }))
        })

        expect(screen.getByRole("textbox", { name: "Video URL" })).toHaveValue("")
        expect(screen.queryByRole("img", { name: /YouTube Thumbnail Grabber Preview/i })).not.toBeInTheDocument()
        expect(screen.getByLabelText("I understand this action may request the disclosed external asset from my browser.")).not.toBeChecked()
        expect(screen.getByRole("button", {
            name: "Preview",
            description: "Add input before running this action.",
        })).toBeDisabled()
        expect(outputValue("Output")).toContain("Video ID: (none)")
    })
})
