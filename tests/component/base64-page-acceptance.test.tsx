import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { LangProvider } from "@/core/i18n/lang-provider"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { Base64Page } from "@/features/tools/base64-encode-decode/page"

const clipboardWriteMock = vi.fn()
const downloadTextFileMock = vi.fn()

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}))

vi.mock("next/navigation", () => ({
    usePathname: () => "/en/base64-encode-decode",
}))

vi.mock("sonner", () => ({
    toast: {
        error: vi.fn(),
        info: vi.fn(),
        success: vi.fn(),
    },
}))

vi.mock("@/core/clipboard/clipboard", () => ({
    safeClipboardWrite: (value: string) => clipboardWriteMock(value),
}))

vi.mock("@/features/tools/base64-encode-decode/browser-actions", () => ({
    downloadBlob: vi.fn(),
    downloadTextFile: (content: string, filename: string) => downloadTextFileMock(content, filename),
}))

function installMemoryStorage() {
    const store = new Map<string, string>()
    Object.defineProperty(window, "localStorage", {
        configurable: true,
        value: {
            getItem: (key: string) => store.get(key) ?? null,
            setItem: (key: string, value: string) => store.set(key, value),
            removeItem: (key: string) => store.delete(key),
            key: (index: number) => [...store.keys()][index] ?? null,
            clear: () => store.clear(),
            get length() {
                return store.size
            },
        },
    })
}

function renderBase64Page() {
    return render(
        <LangProvider lang="en" translations={getTranslation("en")}>
            <Base64Page />
        </LangProvider>,
    )
}

function input() {
    return screen.getByRole("textbox", { name: "Input" })
}

function outputText() {
    return screen.getByLabelText("Output").textContent ?? ""
}

describe("Base64Page acceptance coverage", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        installMemoryStorage()
        clipboardWriteMock.mockResolvedValue({ ok: true })
    })

    it("encodes and decodes standard Base64 without persisting payloads", async () => {
        renderBase64Page()

        expect(screen.getByText("Standard Base64")).toBeInTheDocument()
        expect(screen.getByText("URL-safe Base64")).toBeInTheDocument()
        expect(screen.getByText("File mode")).toBeInTheDocument()

        fireEvent.change(input(), { target: { value: "Hello world!" } })
        fireEvent.click(screen.getByRole("button", { name: "Encode Base64" }))

        await waitFor(() => expect(outputText()).toContain("SGVsbG8gd29ybGQh"))
        fireEvent.click(screen.getByRole("button", { name: "Copy" }))
        await waitFor(() => expect(clipboardWriteMock).toHaveBeenLastCalledWith("SGVsbG8gd29ybGQh"))

        fireEvent.click(screen.getByRole("button", { name: "Download" }))
        expect(downloadTextFileMock).toHaveBeenLastCalledWith("SGVsbG8gd29ybGQh", "base64-output.txt")

        fireEvent.click(screen.getByRole("radio", { name: "Decode" }))
        fireEvent.change(input(), { target: { value: "SGVsbG8gd29ybGQh" } })
        fireEvent.click(screen.getByRole("button", { name: "Decode Base64" }))

        await waitFor(() => expect(outputText()).toContain("Hello world!"))
        expect(window.localStorage.getItem("Hello world!")).toBeNull()
        expect([...Array(window.localStorage.length)].map((_, index) => window.localStorage.key(index))).not.toContain("SGVsbG8gd29ybGQh")
    })

    it("handles URL-safe output, padded decode, unpadded decode, and unicode round trips", async () => {
        renderBase64Page()

        fireEvent.click(screen.getByRole("radio", { name: "URL-safe" }))
        fireEvent.change(input(), { target: { value: "????" } })
        fireEvent.click(screen.getByRole("button", { name: "Encode Base64" }))

        await waitFor(() => expect(outputText()).toContain("Pz8_Pw"))
        expect(outputText()).not.toContain("/")
        expect(screen.getByText(/uses - and _ instead of \+ and \//i)).toBeInTheDocument()

        fireEvent.click(screen.getByRole("radio", { name: "Decode" }))
        fireEvent.change(input(), { target: { value: "Pz8_Pw" } })
        fireEvent.click(screen.getByRole("button", { name: "Decode Base64" }))
        await waitFor(() => expect(outputText()).toContain("????"))

        fireEvent.change(input(), { target: { value: "Pz8_Pw==" } })
        fireEvent.click(screen.getByRole("button", { name: "Decode Base64" }))
        await waitFor(() => expect(outputText()).toContain("????"))

        fireEvent.click(screen.getByRole("radio", { name: "Encode" }))
        fireEvent.change(input(), { target: { value: "Hello byteflow! 你好" } })
        fireEvent.click(screen.getByRole("button", { name: "Encode Base64" }))
        await waitFor(() => expect(outputText()).toMatch(/SGVsbG8gYnl0ZWZsb3ch/))

        const encoded = outputText().trim()
        fireEvent.click(screen.getByRole("radio", { name: "Decode" }))
        fireEvent.change(input(), { target: { value: encoded } })
        fireEvent.click(screen.getByRole("button", { name: "Decode Base64" }))
        await waitFor(() => expect(outputText()).toContain("Hello byteflow! 你好"))
    })

    it("shows clear invalid-input errors and clears stale output", async () => {
        renderBase64Page()

        fireEvent.change(input(), { target: { value: "Hello world!" } })
        fireEvent.click(screen.getByRole("button", { name: "Encode Base64" }))
        await waitFor(() => expect(outputText()).toContain("SGVsbG8gd29ybGQh"))

        fireEvent.click(screen.getByRole("radio", { name: "Decode" }))
        fireEvent.change(input(), { target: { value: "not valid ###" } })
        fireEvent.click(screen.getByRole("button", { name: "Decode Base64" }))

        await waitFor(() => {
            expect(screen.getByRole("alert")).toHaveTextContent("Invalid Base64 input. Check padding and characters, then retry.")
        })
        expect(outputText()).toContain("Result will appear here...")
        expect(outputText()).not.toContain("SGVsbG8gd29ybGQh")
    })

    it("encodes file input locally and does not persist file contents", async () => {
        renderBase64Page()

        fireEvent.click(screen.getByRole("radio", { name: "File" }))
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
        const file = new File([new Uint8Array([72, 105])], "hi.bin", { type: "application/octet-stream" })

        fireEvent.change(fileInput, { target: { files: [file] } })
        await screen.findByText(/hi\.bin/)

        fireEvent.click(screen.getByRole("button", { name: "Encode Base64" }))

        await waitFor(() => expect(outputText()).toContain("SGk="))
        expect([...Array(window.localStorage.length)].map((_, index) => window.localStorage.key(index))).toEqual([
            "byteflow:base64:mode",
            "byteflow:base64:operation",
        ])
        expect([...Array(window.localStorage.length)].map((_, index) => window.localStorage.getItem(window.localStorage.key(index) ?? ""))).not.toContain("Hi")
        expect([...Array(window.localStorage.length)].map((_, index) => window.localStorage.getItem(window.localStorage.key(index) ?? ""))).not.toContain("SGk=")
    })
})
