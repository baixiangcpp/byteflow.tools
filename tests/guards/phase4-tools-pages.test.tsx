import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import Asn1DerInspectorPage from "@/app/[lang]/asn1-der-inspector/page"
import HexBytesWorkbenchPage from "@/app/[lang]/hex-bytes-workbench/page"
import SamlDecoderPage from "@/app/[lang]/saml-decoder/page"
import UnicodeInspectorPage from "@/app/[lang]/unicode-inspector/page"
import { LangProvider } from "@/core/i18n/lang-provider"
import type { Locale } from "@/core/i18n/i18n"
import { PHASE4_LIMITS } from "@/core/utils/phase4-inspector-limits"
import { getTranslation } from "@/core/i18n/translations/catalog"

vi.mock("next/navigation", () => ({
    usePathname: () => "/en/unicode-inspector",
}))

function renderWithEnglish(ui: React.ReactNode) {
    return render(
        <LangProvider lang="en" translations={getTranslation("en")}>
            {ui}
        </LangProvider>,
    )
}

function renderWithLocale(locale: Locale, ui: React.ReactNode) {
    return render(
        <LangProvider lang={locale} translations={getTranslation(locale)}>
            {ui}
        </LangProvider>,
    )
}

describe("Phase 4 tool pages", () => {
    it.each([
        ["en", "SAML Decoder"],
        ["zh-CN", "SAML 解码器"],
        ["zh-TW", "SAML 解碼器"],
        ["ja", "SAML デコーダー"],
        ["ko", "SAML 디코더"],
        ["de", "SAML-Dekoder"],
        ["fr", "Décodeur SAML"],
    ] satisfies Array<[Locale, string]>)("renders the localized SAML Decoder title for %s", (locale, title) => {
        renderWithLocale(locale, <SamlDecoderPage />)

        expect(screen.getByRole("heading", { name: title })).toBeInTheDocument()
    })

    it.each([
        ["en", "ASN.1/DER Inspector"],
        ["zh-CN", "ASN.1/DER 检查器"],
        ["zh-TW", "ASN.1/DER 檢查器"],
        ["ja", "ASN.1/DER インスペクター"],
        ["ko", "ASN.1/DER 인스펙터"],
        ["de", "ASN.1/DER-Inspektor"],
        ["fr", "Inspecteur ASN.1/DER"],
    ] satisfies Array<[Locale, string]>)("renders the localized ASN.1/DER Inspector title for %s", (locale, title) => {
        renderWithLocale(locale, <Asn1DerInspectorPage />)

        expect(screen.getByRole("heading", { name: title })).toBeInTheDocument()
    })

    it.each([
        ["en", "Hex/Bytes Workbench"],
        ["zh-CN", "Hex/Bytes 工作台"],
        ["zh-TW", "Hex/Bytes 工作台"],
        ["ja", "Hex/Bytes ワークベンチ"],
        ["ko", "Hex/Bytes 워크벤치"],
        ["de", "Hex/Bytes-Arbeitsbereich"],
        ["fr", "Atelier Hex/Bytes"],
    ] satisfies Array<[Locale, string]>)("renders the localized Hex/Bytes Workbench title for %s", (locale, title) => {
        renderWithLocale(locale, <HexBytesWorkbenchPage />)

        expect(screen.getByRole("heading", { name: title })).toBeInTheDocument()
    })

    it.each([
        ["en", "Unicode Inspector"],
        ["zh-CN", "Unicode 检查器"],
        ["zh-TW", "Unicode 檢查器"],
        ["ja", "Unicode インスペクター"],
        ["ko", "Unicode 인스펙터"],
        ["de", "Unicode-Inspektor"],
        ["fr", "Inspecteur Unicode"],
    ] satisfies Array<[Locale, string]>)("renders the localized Unicode Inspector title for %s", (locale, title) => {
        renderWithLocale(locale, <UnicodeInspectorPage />)

        expect(screen.getByRole("heading", { name: title })).toBeInTheDocument()
    })

    it("renders SAML Decoder controls", () => {
        renderWithEnglish(<SamlDecoderPage />)

        expect(screen.getByRole("heading", { name: "SAML Decoder" })).toBeInTheDocument()
        expect(screen.getByLabelText("SAML input")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /Decode SAML/i })).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /Copy XML/i })).toBeDisabled()
    })

    it("decodes the SAML example and shows summary fields", () => {
        renderWithEnglish(<SamlDecoderPage />)

        fireEvent.click(screen.getByRole("button", { name: /Try example/i }))
        fireEvent.click(screen.getByRole("button", { name: /Decode SAML/i }))

        expect(screen.getByText("https://idp.example.com")).toBeInTheDocument()
        expect(screen.getByText("https://sp.example.com")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /Copy XML/i })).toBeEnabled()
    })

    it("renders ASN.1/DER Inspector controls", () => {
        renderWithEnglish(<Asn1DerInspectorPage />)

        expect(screen.getByRole("heading", { name: "ASN.1/DER Inspector" })).toBeInTheDocument()
        expect(screen.getByLabelText("DER / PEM / Base64 / hex input")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /Inspect DER/i })).toBeInTheDocument()
    })

    it("inspects the ASN.1 example and renders tree nodes", () => {
        renderWithEnglish(<Asn1DerInspectorPage />)

        fireEvent.click(screen.getByRole("button", { name: /Try example/i }))
        fireEvent.click(screen.getByRole("button", { name: /Inspect DER/i }))

        expect(screen.getByText("SEQUENCE")).toBeInTheDocument()
        expect(screen.getByText("OBJECT IDENTIFIER")).toBeInTheDocument()
    })

    it("renders Hex/Bytes Workbench controls and mode switches", () => {
        renderWithEnglish(<HexBytesWorkbenchPage />)

        expect(screen.getByRole("heading", { name: "Hex/Bytes Workbench" })).toBeInTheDocument()
        expect(screen.getByLabelText("Input")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: "Text" })).toBeInTheDocument()
        expect(screen.getByRole("button", { name: "Hex" })).toBeInTheDocument()
        expect(screen.getByRole("button", { name: "Base64" })).toBeInTheDocument()
    })

    it("inspects hex mode input and shows grouped hex", () => {
        renderWithEnglish(<HexBytesWorkbenchPage />)

        fireEvent.click(screen.getByRole("button", { name: "Hex" }))
        fireEvent.change(screen.getByLabelText("Input"), { target: { value: "4869" } })
        fireEvent.click(screen.getByRole("button", { name: /Inspect bytes/i }))

        expect(screen.getByDisplayValue("48 69")).toBeInTheDocument()
    })

    it("renders Unicode Inspector and updates stats from input", () => {
        renderWithEnglish(<UnicodeInspectorPage />)

        expect(screen.getByRole("heading", { name: "Unicode Inspector" })).toBeInTheDocument()
        fireEvent.change(screen.getByLabelText("Text input"), { target: { value: "A\u200B🔒" } })

        expect(screen.getByText("U+200B")).toBeInTheDocument()
        expect(screen.getByText("U+01F512")).toBeInTheDocument()
    })

    it("shows a Unicode truncation warning for large input", () => {
        renderWithEnglish(<UnicodeInspectorPage />)

        fireEvent.change(screen.getByLabelText("Text input"), { target: { value: "A".repeat(PHASE4_LIMITS.maxUnicodeCharacters + 1) } })

        expect(screen.getByText(/Input exceeds the local inspection budget/i)).toBeInTheDocument()
    })
})
