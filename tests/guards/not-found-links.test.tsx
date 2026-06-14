import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import LangNotFound from "@/app/[lang]/not-found"
import RootNotFound from "@/app/not-found"
import { getAllToolsHref } from "@/core/routing/all-tools-route"

const mocks = vi.hoisted(() => ({
    lang: "en",
}))

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
    })

    it("uses all-tools anchor in localized not-found page", () => {
        mocks.lang = "zh-CN"
        render(<LangNotFound />)

        expect(screen.getByRole("link", { name: "All tools localized" })).toHaveAttribute("href", getAllToolsHref("zh-CN"))
    })
})
