import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { LangProvider } from "@/core/i18n/lang-provider"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { TotpGeneratorPage } from "@/features/tools/totp-generator/page"

const mocks = vi.hoisted(() => ({
    clipboardWrite: vi.fn(),
    generateHOTP: vi.fn(),
    generateTOTP: vi.fn(),
}))

vi.mock("next/link", () => ({
    default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => <a href={href} {...props}>{children}</a>,
}))

vi.mock("@/core/seo/components/related-tools", () => ({
    RelatedTools: () => null,
}))

vi.mock("@/core/clipboard/clipboard", () => ({
    safeClipboardWrite: (value: string) => mocks.clipboardWrite(value),
}))

vi.mock("@/features/tools/totp-generator/logic", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/features/tools/totp-generator/logic")>()
    return {
        ...actual,
        generateHOTP: (...args: Parameters<typeof actual.generateHOTP>) => mocks.generateHOTP(...args),
        generateTOTP: (...args: Parameters<typeof actual.generateTOTP>) => mocks.generateTOTP(...args),
    }
})

vi.mock("sonner", () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    },
}))

function renderPage() {
    return render(
        <LangProvider lang="en" translations={getTranslation("en")}>
            <TotpGeneratorPage />
        </LangProvider>,
    )
}

describe("TotpGeneratorPage", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mocks.clipboardWrite.mockResolvedValue({ ok: true })
        mocks.generateTOTP.mockResolvedValue("123456")
        mocks.generateHOTP.mockResolvedValue("654321")
    })

    it("clears and disables generated output when the Base32 secret is invalid", async () => {
        renderPage()

        expect(await screen.findByText("123456")).toBeInTheDocument()
        const secretInput = screen.getByLabelText(/Secret Key/) as HTMLInputElement
        fireEvent.change(secretInput, { target: { value: "JBSWY3DPEHPK3PXP0" } })

        expect(await screen.findByText(/ASCII letters A-Z and digits 2-7/)).toHaveAttribute("role", "alert")
        expect(secretInput).toHaveAttribute("aria-invalid", "true")
        expect(screen.getByText("------")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: "Copy" })).toBeDisabled()
        expect(screen.getByRole("button", { name: "Refresh" })).toBeDisabled()
        expect(mocks.clipboardWrite).not.toHaveBeenCalled()
    })

    it("preserves blank and invalid numeric inputs instead of coercing them", async () => {
        renderPage()
        await screen.findByText("123456")

        const periodInput = screen.getByLabelText("Period (seconds)") as HTMLInputElement
        fireEvent.change(periodInput, { target: { value: "" } })
        expect(periodInput.value).toBe("")
        expect(await screen.findByText("Enter a TOTP period.")).toBeInTheDocument()
        expect(screen.getByText("------")).toBeInTheDocument()

        fireEvent.change(periodInput, { target: { value: "30" } })
        await waitFor(() => expect(screen.getByText("123456")).toBeInTheDocument())

        fireEvent.click(screen.getByRole("button", { name: "HOTP" }))
        const counterInput = screen.getByLabelText("Counter") as HTMLInputElement
        fireEvent.change(counterInput, { target: { value: "-1" } })
        expect(await screen.findByText(/HOTP counter must be a whole number/)).toBeInTheDocument()
        expect(screen.getByRole("button", { name: "Increment" })).toBeDisabled()
        expect(screen.getByRole("button", { name: "Copy" })).toBeDisabled()
    })

    it("does not let an earlier async result overwrite a newly invalid state", async () => {
        let resolveGeneration: ((value: string) => void) | undefined
        mocks.generateTOTP.mockImplementationOnce(() => new Promise((resolve) => {
            resolveGeneration = resolve
        }))
        renderPage()

        fireEvent.change(screen.getByLabelText(/Secret Key/), { target: { value: "invalid-0" } })
        expect(await screen.findByText(/ASCII letters A-Z and digits 2-7/)).toBeInTheDocument()

        await act(async () => {
            resolveGeneration?.("999999")
            await Promise.resolve()
        })

        expect(screen.queryByText("999999")).not.toBeInTheDocument()
        expect(screen.getByText("------")).toBeInTheDocument()
    })
})
