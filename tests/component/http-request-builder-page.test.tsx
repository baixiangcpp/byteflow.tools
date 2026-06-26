import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { LangProvider } from "@/core/i18n/lang-provider"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { RoutePageChrome } from "@/components/layout/route-page-chrome"
import { HttpRequestBuilderPage } from "@/features/tools/http-request-builder/page"

const clipboardWriteMock = vi.fn()
const readFavoriteToolKeysMock = vi.fn(() => [])
const toggleFavoriteToolKeyMock = vi.fn((toolKey: string) => {
    void toolKey
    return ["http_request_builder"]
})

vi.mock("next/navigation", () => ({
    usePathname: () => "/en/http-request-builder",
}))

vi.mock("@/core/clipboard/clipboard", () => ({
    safeClipboardWrite: (value: string) => clipboardWriteMock(value),
}))

vi.mock("@/core/storage/tool-discovery-state", async (importOriginal) => {
    const actual = await importOriginal() as typeof import("@/core/storage/tool-discovery-state")
    return {
        ...actual,
        readFavoriteToolKeys: () => readFavoriteToolKeysMock(),
        toggleFavoriteToolKey: (toolKey: string) => toggleFavoriteToolKeyMock(toolKey),
    }
})

vi.mock("sonner", () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    },
}))

function renderHttpBuilder() {
    return render(
        <LangProvider lang="en" translations={getTranslation("en")}>
            <HttpRequestBuilderPage />
        </LangProvider>,
    )
}

function renderHttpBuilderWithChrome() {
    return render(
        <LangProvider lang="en" translations={getTranslation("en")}>
            <RoutePageChrome pathname="/en/http-request-builder">
                <HttpRequestBuilderPage />
            </RoutePageChrome>
        </LangProvider>,
    )
}

describe("HttpRequestBuilderPage", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        clipboardWriteMock.mockResolvedValue({ ok: true })
        readFavoriteToolKeysMock.mockReturnValue([])
    })

    it("generates request code without sending a network request", () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network should not run"))
        const xhrOpenSpy = vi.spyOn(XMLHttpRequest.prototype, "open")
        const xhrSendSpy = vi.spyOn(XMLHttpRequest.prototype, "send")

        renderHttpBuilder()

        expect(screen.getByText("Code generation only")).toBeInTheDocument()
        expect(screen.getByText(/Editing this builder does not send the request/)).toBeInTheDocument()

        fireEvent.change(screen.getByRole("textbox", { name: "Request URL" }), {
            target: { value: "https://api.example.com/users?active=true" },
        })
        fireEvent.change(screen.getByRole("textbox", { name: "Header name" }), {
            target: { value: "Authorization" },
        })
        fireEvent.change(screen.getByRole("textbox", { name: "Value" }), {
            target: { value: "Bearer TOKEN_PLACEHOLDER" },
        })
        fireEvent.click(screen.getByRole("button", { name: "Add Query Param" }))
        fireEvent.change(screen.getByRole("textbox", { name: "Query name" }), {
            target: { value: "search" },
        })
        fireEvent.change(screen.getByRole("textbox", { name: "Query value" }), {
            target: { value: "a b" },
        })

        fireEvent.click(screen.getAllByRole("button", { name: "Copy" })[0])

        expect(clipboardWriteMock).toHaveBeenCalledWith(expect.stringContaining("https://api.example.com/users?active=true&search=a+b"))
        expect(clipboardWriteMock).toHaveBeenCalledWith(expect.stringContaining("Authorization: Bearer TOKEN_PLACEHOLDER"))
        expect(fetchSpy).not.toHaveBeenCalled()
        expect(xhrOpenSpy).not.toHaveBeenCalled()
        expect(xhrSendSpy).not.toHaveBeenCalled()

        fetchSpy.mockRestore()
        xhrOpenSpy.mockRestore()
        xhrSendSpy.mockRestore()
    })

    it("omits disabled headers and blocks copy for invalid URL states", async () => {
        renderHttpBuilder()

        const headerEnabled = screen.getByRole("checkbox", { name: "Enable header" })
        fireEvent.click(headerEnabled)
        expect(headerEnabled).not.toBeChecked()

        const generatedCode = screen.getByText((content) => content.includes("curl") && content.includes("api.example.com"))
        expect(generatedCode).not.toHaveTextContent("Accept")

        fireEvent.change(screen.getByRole("textbox", { name: "Request URL" }), {
            target: { value: "not a url" },
        })

        expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid absolute URL")
        expect(screen.getAllByRole("button", { name: /Copy/ })[0]).toBeDisabled()
        fireEvent.click(screen.getAllByRole("button", { name: /Copy/ })[1])
        await waitFor(() => expect(clipboardWriteMock).not.toHaveBeenCalled())
    })

    it("keeps favorite toggles separated from structured header entry", () => {
        renderHttpBuilderWithChrome()

        expect(screen.getByRole("group", { name: "Add to favorites / Remove from favorites" })).toHaveAttribute("data-tool-global-actions")
        expect(screen.getByRole("button", { name: "Add to favorites" })).toBeInTheDocument()
        expect(screen.getByRole("toolbar", { name: "Tool actions" })).toBeInTheDocument()

        fireEvent.click(screen.getByRole("button", { name: "Add Header" }))
        fireEvent.change(screen.getAllByRole("textbox", { name: "Header name" })[1], {
            target: { value: "Authorization" },
        })
        fireEvent.change(screen.getAllByRole("textbox", { name: "Value" })[1], {
            target: { value: "Bearer TOKEN_PLACEHOLDER" },
        })

        expect(toggleFavoriteToolKeyMock).not.toHaveBeenCalled()
    })
})
