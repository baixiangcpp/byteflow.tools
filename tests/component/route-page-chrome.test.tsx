import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { RoutePageChrome } from "@/components/layout/route-page-chrome"

const mocks = vi.hoisted(() => {
    const translations = {
        common: {
            external_network_notice: {
                title: "Localized network notice",
                third_party_api_message: "Localized third-party API message",
                user_requested_message: "Localized user requested URL message",
            },
            install_guide: "Install guide",
            install_inline_description: "Install description",
            install_inline_title: "Install Byteflow",
        },
    }

    return {
        langValue: {
            lang: "en",
            t: translations,
        },
        translations,
    }
})

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}))

vi.mock("@/core/i18n/lang-provider", () => ({
    useLang: () => mocks.langValue,
}))

vi.mock("@/core/storage/tool-discovery-state", () => ({
    recordRecentToolKey: vi.fn(),
}))

vi.mock("@/core/seo/components/related-tools", () => ({
    RelatedTools: ({ toolKey }: { toolKey: string }) => <div data-testid="related-tools">{toolKey}</div>,
}))

describe("RoutePageChrome", () => {
    beforeEach(() => {
        mocks.langValue = {
            lang: "en",
            t: mocks.translations,
        }
    })

    it("shows an external network notice for user-requested network tools", () => {
        render(
            <RoutePageChrome pathname="/en/instagram-photo-downloader">
                <main>tool body</main>
            </RoutePageChrome>,
        )

        expect(screen.getByText("Localized network notice")).toBeInTheDocument()
        expect(screen.getByText("Localized user requested URL message")).toBeInTheDocument()
    })

    it("does not show an external network notice for local-only tools", () => {
        render(
            <RoutePageChrome pathname="/en/json-formatter">
                <main>tool body</main>
            </RoutePageChrome>,
        )

        expect(screen.queryByText("Localized network notice")).not.toBeInTheDocument()
    })
})
