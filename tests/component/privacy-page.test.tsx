import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import PrivacyPage from "@/app/[lang]/privacy/page"
import { LangProvider } from "@/core/i18n/lang-provider"
import { getTranslation } from "@/core/i18n/translations/catalog"

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}))

describe("PrivacyPage", () => {
    it("renders the manifest-generated external request tool list", () => {
        render(
            <LangProvider lang="en" translations={getTranslation("en")}>
                <PrivacyPage />
            </LangProvider>,
        )

        expect(screen.getByText("External request tools")).toBeInTheDocument()
        expect(screen.getByRole("link", { name: "Privacy and Trust Center" })).toHaveAttribute("href", "/en/trust-center")
        expect(screen.getByText("YouTube Thumbnail Grabber")).toBeInTheDocument()
        expect(screen.getByText("Vimeo Thumbnail Grabber")).toBeInTheDocument()
        expect(screen.getByText("Instagram Photo Downloader")).toBeInTheDocument()
        expect(screen.getByText("youtube.com, youtube-nocookie.com, youtu.be, i.ytimg.com")).toBeInTheDocument()
        expect(screen.getByText("instagram.com")).toBeInTheDocument()
    })
})
