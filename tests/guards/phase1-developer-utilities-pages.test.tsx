import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { LangProvider } from "@/core/i18n/lang-provider"
import GzipBrotliLabPage from "@/app/[lang]/gzip-brotli-lab/page"
import InvisibleCharsDetectorPage from "@/app/[lang]/invisible-characters-detector/page"
import LogScrubberPage from "@/app/[lang]/log-scrubber/page"
import YamlMergePatchExplorerPage from "@/app/[lang]/yaml-merge-patch-explorer/page"
import { getTranslation } from "@/core/i18n/translations/catalog"

vi.mock("next/navigation", () => ({
    usePathname: () => "/en/log-scrubber",
}))

function renderWithEnglish(ui: React.ReactNode) {
    return render(
        <LangProvider lang="en" translations={getTranslation("en")}>
            {ui}
        </LangProvider>,
    )
}

describe("phase 1 developer utility pages", () => {
    it("renders Log Scrubber inputs and primary actions", () => {
        renderWithEnglish(<LogScrubberPage />)

        expect(screen.getByRole("heading", { name: "Log Scrubber" })).toBeInTheDocument()
        expect(screen.getByPlaceholderText("Paste logs, stack traces, env dumps, or config snippets that may contain secrets...")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /Try example/i })).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /Scrub log/i })).toBeInTheDocument()
    })

    it("renders Gzip/Brotli Lab controls and browser support note", () => {
        renderWithEnglish(<GzipBrotliLabPage />)

        expect(screen.getByRole("heading", { name: "Gzip/Brotli Lab" })).toBeInTheDocument()
        expect(screen.getByText("Mode")).toBeInTheDocument()
        expect(screen.getByText("Format")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /Run/i })).toBeInTheDocument()
        expect(screen.getByText(/Brotli is only available when this browser supports/i)).toBeInTheDocument()
    })

    it("renders YAML Merge/Patch Explorer inputs and primary actions", () => {
        renderWithEnglish(<YamlMergePatchExplorerPage />)

        expect(screen.getByRole("heading", { name: "YAML Merge/Patch Explorer" })).toBeInTheDocument()
        expect(screen.getByText("Mode")).toBeInTheDocument()
        expect(screen.getByPlaceholderText("Paste multiple YAML documents separated by ---")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /Try example/i })).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /Run/i })).toBeInTheDocument()
    })

    it("shows the cleaned invisible-character output without mutating the input", () => {
        renderWithEnglish(<InvisibleCharsDetectorPage />)

        fireEvent.click(screen.getByRole("button", { name: /Try example/i }))
        const input = screen.getByPlaceholderText("Paste text to scan for invisible characters...")
        expect((input as HTMLTextAreaElement).value).toContain(String.fromCodePoint(0x200b))

        fireEvent.click(screen.getByRole("button", { name: /Generate cleaned text/i }))

        expect(screen.getByRole("status")).toHaveTextContent("The original input is unchanged")
        expect((input as HTMLTextAreaElement).value).toContain(String.fromCodePoint(0x200b))
        expect(screen.getByText("Cleaned Text")).toBeInTheDocument()
        const cleanedOutput = screen.getByDisplayValue(/HelloWorld Test/)
        expect((cleanedOutput as HTMLTextAreaElement).value).not.toContain(String.fromCodePoint(0x200b))
    })
})
