import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import LangNotFound from "@/app/[lang]/not-found"
import RootNotFound from "@/app/not-found"
import { getAllToolsHref } from "@/core/routing/all-tools-route"
import { MENU_GROUP_DEFS } from "@/core/registry/menu-groups"

const mocks = vi.hoisted(() => ({
    lang: "en",
}))

const dataCodeFormatsSlug = MENU_GROUP_DEFS.find((item) => item.key === "data_code_formats")?.slug
const rootDataCodeFormatsHref = `/en/${MENU_GROUP_DEFS.find((item) => item.key === "data_code_formats")?.slug}`

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}))

vi.mock("@/core/i18n/lang-provider", () => ({
    useLang: () => ({
        lang: mocks.lang,
        t: {
            common: {
                not_found_title: "Not found",
                not_found_description: "Missing page",
                route_error_home: "Back to home",
                all_tools: "All tools localized",
                popular_tools: "Popular tools",
                install_app_label: "Install app",
            },
            nav: {
                search: "Search localized",
                data_code_formats: "Data formats localized",
                web_api_network: "Web API localized",
                encoding_crypto: "Encoding localized",
            },
            tools: {
                json_formatter: { title: "JSON Formatter" },
                base64_encode_decode: { title: "Base64 Encode/Decode" },
                url_encode_decode: { title: "URL Encode/Decode" },
                javascript_formatter: { title: "JavaScript Formatter" },
            },
        },
    }),
}))

describe("not-found all-tools links", () => {
    it("uses all-tools anchor in root not-found page", () => {
        render(<RootNotFound />)

        expect(screen.getByRole("link", { name: "Browse all tools" })).toHaveAttribute("href", getAllToolsHref("en"))
        expect(screen.getByRole("link", { name: "Search tools" })).toHaveAttribute("href", `${getAllToolsHref("en")}#tool-discovery`)
        expect(screen.getByRole("link", { name: "Data & Code Formats" })).toHaveAttribute("href", rootDataCodeFormatsHref)
    })

    it("uses all-tools anchor in localized not-found page", () => {
        mocks.lang = "zh-CN"
        render(<LangNotFound />)

        expect(screen.getByRole("link", { name: "All tools localized" })).toHaveAttribute("href", getAllToolsHref("zh-CN"))
        expect(screen.getByRole("button", { name: "Search localized" })).toHaveAttribute("data-command-palette-trigger")
        expect(screen.getByRole("link", { name: "Data formats localized" })).toHaveAttribute("href", `/zh-CN/${dataCodeFormatsSlug}`)
    })
})
