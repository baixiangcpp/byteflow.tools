import { fireEvent, render, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { UuidGeneratorPage } from "@/features/tools/uuid-generator/page"

const mocks = vi.hoisted(() => ({
    copiedText: "",
    downloaded: [] as Array<{ content: string; filename: string; mimeType?: string }>,
}))

vi.mock("uuid", () => ({
    v1: vi.fn(() => "11111111-1111-1111-1111-111111111111"),
    v4: vi.fn(() => "44444444-4444-4444-4444-444444444444"),
}))

vi.mock("next/navigation", () => ({
    usePathname: () => "/en/uuid-generator",
}))

vi.mock("@/features/tools/uuid-generator/browser-actions", () => ({
    downloadTextFile: (content: string, filename: string, mimeType?: string) => {
        mocks.downloaded.push({ content, filename, mimeType })
    },
}))

vi.mock("@/core/clipboard/clipboard", () => ({
    safeClipboardWrite: async (value: string) => {
        mocks.copiedText = value
        return { ok: true }
    },
}))

vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}))

vi.mock("@/core/i18n/lang-provider", () => ({
    useLang: () => ({
        lang: "en",
        t: {
            common: {
                action_disabled_no_output: "No output.",
                copy_all: "Copy All",
                copy_failed: "Copy failed",
                copied: "Copied",
                downloaded_file: "Downloaded {filename}",
            },
            tools: {
                uuid_generator: {
                    title: "UUID Generator",
                    description: "Generate UUIDs.",
                    regenerate_action: "Regenerate",
                    settings_heading: "Settings",
                    quantity_label: "Quantity (1-1000)",
                    version_label: "Version",
                    version_placeholder: "Select version",
                    version_v4: "Version 4",
                    version_v1: "Version 1",
                    case_label: "Case",
                    case_placeholder: "Select case",
                    case_lowercase: "Lowercase",
                    case_uppercase: "Uppercase",
                    hyphens_label: "Hyphens",
                    hyphens_placeholder: "Select hyphen mode",
                    hyphens_include: "Include hyphens",
                    hyphens_remove: "Remove hyphens",
                    generated_heading: "Generated UUIDs",
                    copied_desc: "{count} UUID values copied.",
                    export_txt: "TXT",
                    export_csv: "CSV",
                    export_json: "JSON",
                    prefix_label: "Optional prefix",
                    prefix_placeholder: "e.g. user_",
                    suffix_label: "Optional suffix",
                    suffix_placeholder: "e.g. _active",
                    format_preview_label: "Format preview",
                    page_status: "Page {page} of {pages}",
                    page_size_label: "Rows per page",
                    pagination_hint: "Pagination only changes the visible list; Copy All and exports include every generated value.",
                    previous_page: "Previous",
                    next_page: "Next",
                },
            },
        },
    }),
}))

describe("UuidGeneratorPage", () => {
    beforeEach(() => {
        mocks.copiedText = ""
        mocks.downloaded = []
    })

    it("paginates large batches while copy and export use every formatted UUID", async () => {
        render(<UuidGeneratorPage />)

        fireEvent.change(screen.getByLabelText("Quantity (1-1000)"), { target: { value: "1000" } })
        fireEvent.change(screen.getByLabelText("Optional prefix"), { target: { value: "user_" } })
        fireEvent.change(screen.getByLabelText("Optional suffix"), { target: { value: "_active" } })
        fireEvent.click(screen.getByRole("button", { name: "Regenerate" }))

        expect(screen.getByText("Generated UUIDs (1000)")).toBeInTheDocument()
        expect(screen.getByText("Page 1 of 10")).toBeInTheDocument()
        const outputList = screen.getByRole("list")
        expect(within(outputList).getAllByText("user_44444444-4444-4444-4444-444444444444_active")).toHaveLength(100)

        fireEvent.click(screen.getByRole("button", { name: "Next" }))
        expect(screen.getByText("Page 2 of 10")).toBeInTheDocument()

        fireEvent.click(screen.getByRole("button", { name: "Copy All" }))
        expect(mocks.copiedText.split("\n")).toHaveLength(1000)
        expect(mocks.copiedText).toContain("user_44444444-4444-4444-4444-444444444444_active")

        fireEvent.click(screen.getByRole("button", { name: "JSON" }))
        expect(mocks.downloaded.at(-1)).toMatchObject({
            filename: "byteflow-uuids.json",
            mimeType: "application/json;charset=utf-8",
        })
        expect(JSON.parse(mocks.downloaded.at(-1)?.content ?? "[]")).toHaveLength(1000)
    })
})
