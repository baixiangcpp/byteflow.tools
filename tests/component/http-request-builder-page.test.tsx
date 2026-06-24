import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { LangProvider } from "@/core/i18n/lang-provider"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { HttpRequestBuilderPage } from "@/features/tools/http-request-builder/page"

vi.mock("next/navigation", () => ({
    usePathname: () => "/en/http-request-builder",
}))

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

describe("HttpRequestBuilderPage", () => {
    beforeEach(() => {
        Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: { writeText: vi.fn().mockResolvedValue(undefined) },
        })
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
        fireEvent.click(screen.getByRole("button", { name: "Copy" }))

        const generatedCode = screen.getByText((content) => content.includes("curl") && content.includes("https://api.example.com/users?active=true"))
        expect(generatedCode).toHaveTextContent("https://api.example.com/users?active=true")
        expect(generatedCode).toHaveTextContent("Authorization")
        expect(generatedCode).toHaveTextContent("Bearer TOKEN_PLACEHOLDER")
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining("curl"))
        expect(fetchSpy).not.toHaveBeenCalled()
        expect(xhrOpenSpy).not.toHaveBeenCalled()
        expect(xhrSendSpy).not.toHaveBeenCalled()

        fetchSpy.mockRestore()
        xhrOpenSpy.mockRestore()
        xhrSendSpy.mockRestore()
    })
})
