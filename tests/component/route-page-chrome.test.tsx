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
                user_input_preview_message: "Localized preview message",
                hosts_label: "Hosts",
                purpose_label: "Purpose",
                data_sent_label: "Data sent",
                consent_required_message: "Runs only after consent",
                purposes: {
                    authorized_media_download: "Localized authorized media purpose",
                    thumbnail_preview: "Localized thumbnail purpose",
                },
                external_data: {
                    none: "No data sent",
                    user_provided_url: "User URL sent",
                    derived_url: "Derived URL sent",
                },
            },
            tool_trust_header: {
                title: "Tool trust status",
                browser_local_label: "Browser-local",
                browser_local_desc: "Local processing message",
                external_request_label: "External request",
                external_request_desc: "External request message",
                offline_label: "Offline capability",
                offline_desc: "Offline processing message",
                network_required_desc: "Network required message",
                sensitive_label: "Sensitive input",
                sensitive_desc: "Sensitive input message",
                standard_input_label: "Standard input",
                standard_input_desc: "Standard input message",
                devtools_label: "DevTools check",
                devtools_desc: "DevTools message",
                github_label: "Verify on GitHub",
                devtools_link: "How to verify",
                trust_center_link: "Trust Center",
                external_details: "External request details",
                endpoints_label: "Endpoints",
                sent_data_label: "Sent data",
                consent_label: "Consent message",
                privacy_link: "Privacy policy",
            },
            install_guide: "Install guide",
            install_inline_description: "Install description",
            install_inline_title: "Install Byteflow",
            add_favorite: "Add to favorites",
            remove_favorite: "Remove from favorites",
            favorites_local_only: "Favorite IDs stay local.",
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
    readFavoriteToolKeys: vi.fn(() => []),
    toggleFavoriteToolKey: vi.fn(() => ["json_formatter"]),
    TOOL_DISCOVERY_UPDATED_EVENT: "byteflow:tool-discovery-updated",
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

    it("shows manifest-driven trust status for user-requested network tools", () => {
        render(
            <RoutePageChrome pathname="/en/instagram-photo-downloader">
                <main>tool body</main>
            </RoutePageChrome>,
        )

        expect(screen.getByText("Tool trust status")).toBeInTheDocument()
        expect(screen.getByText("External request")).toBeInTheDocument()
        expect(screen.getAllByText("External request message")).toHaveLength(2)
        expect(screen.getByText("Network required message")).toBeInTheDocument()
        expect(screen.getByText("Sensitive input")).toBeInTheDocument()
        expect(screen.getByText("instagram.com")).toBeInTheDocument()
        expect(screen.getByText("Localized authorized media purpose")).toBeInTheDocument()
        expect(screen.getByText("User URL sent")).toBeInTheDocument()
        expect(screen.getByText("Requests the Instagram URL you provide only after you confirm rights and click Download.")).toBeInTheDocument()
        expect(screen.getByText("Consent message")).toBeInTheDocument()
        expect(screen.getAllByRole("link", { name: "Trust Center" })[0]).toHaveAttribute("href", "/en/trust-center")
    })

    it("shows local trust status for local-only tools", () => {
        render(
            <RoutePageChrome pathname="/en/json-formatter">
                <main>tool body</main>
            </RoutePageChrome>,
        )

        expect(screen.getByText("Tool trust status")).toBeInTheDocument()
        expect(screen.getByText("Browser-local")).toBeInTheDocument()
        expect(screen.getAllByText("Local processing message")).toHaveLength(2)
        expect(screen.getByText("Offline processing message")).toBeInTheDocument()
        expect(screen.getByText("Sensitive input")).toBeInTheDocument()
        expect(screen.queryByText("External request details")).not.toBeInTheDocument()
    })
})
