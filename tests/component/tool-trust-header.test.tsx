import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { LangProvider } from "@/core/i18n/lang-provider"
import { getTranslation } from "@/core/i18n/translations/catalog"
import type { ToolPrivacyManifest } from "@/core/registry/types"
import { ToolTrustHeader } from "@/features/tool-shell/tool-trust-header"

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}))

const localPrivacy: ToolPrivacyManifest = {
    executionMode: "browser-local",
    offlineCapable: true,
    sensitiveInput: false,
    externalRequest: {
        required: false,
        endpointType: "none",
    },
}

const externalPrivacy: ToolPrivacyManifest = {
    executionMode: "external-request",
    offlineCapable: false,
    sensitiveInput: true,
    externalRequest: {
        required: true,
        endpointType: "user_provided_url",
        domains: ["instagram.com"],
        purposeKey: "authorized_media_download",
        userDataSent: "user_provided_url",
        disclosure: "Requests the Instagram URL you provide only after you confirm rights and click Download.",
        consentRequired: true,
    },
}

function renderTrustHeader(privacy: ToolPrivacyManifest, slug = "url-encode-decode") {
    return render(
        <LangProvider lang="en" translations={getTranslation("en")}>
            <ToolTrustHeader
                slug={slug}
                sourceUrl={`https://github.com/baixiangcpp/byteflow.tools/blob/main/src/features/tools/${slug}/page.tsx`}
                privacy={privacy}
                networkAccess={privacy.externalRequest.required ? "user_requested" : "none"}
                networkHosts={privacy.externalRequest.domains ?? []}
                networkPurposeKey={privacy.externalRequest.purposeKey ?? null}
                externalDataSent={privacy.externalRequest.userDataSent ?? null}
            />
        </LangProvider>,
    )
}

describe("ToolTrustHeader", () => {
    it("shows browser-local, offline, GitHub, and DevTools status for URL Encode/Decode", () => {
        renderTrustHeader(localPrivacy)

        expect(screen.getByText("Tool trust status")).toBeInTheDocument()
        expect(screen.getByText("Browser-local")).toBeInTheDocument()
        expect(screen.getByText("Core processing works without network after the app has loaded.")).toBeInTheDocument()
        expect(screen.getByRole("link", { name: "Verify on GitHub" })).toHaveAttribute(
            "href",
            "https://github.com/baixiangcpp/byteflow.tools/blob/main/src/features/tools/url-encode-decode/page.tsx",
        )
        expect(screen.getByRole("link", { name: "How to verify" })).toHaveAttribute("href", "/en/about#privacy")
        expect(screen.queryByText("External request details")).not.toBeInTheDocument()
    })

    it("shows external request endpoints, sent data, sensitive input, and privacy link", () => {
        renderTrustHeader(externalPrivacy, "instagram-photo-downloader")

        expect(screen.getByText("External request")).toBeInTheDocument()
        expect(screen.getByText("Sensitive input")).toBeInTheDocument()
        expect(screen.getByText("instagram.com")).toBeInTheDocument()
        expect(screen.getByText("The URL you provide may be requested by your browser.")).toBeInTheDocument()
        expect(screen.getByText("Requests the Instagram URL you provide only after you confirm rights and click Download.")).toBeInTheDocument()
        expect(screen.getByRole("link", { name: "Privacy policy" })).toHaveAttribute("href", "/en/privacy")
    })
})
