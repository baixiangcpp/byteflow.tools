import { render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { LangProvider, useLang } from "@/core/i18n/lang-provider"
import { getTranslation } from "@/core/i18n/translations/catalog"

function LangConsumer() {
    const { lang, t } = useLang()
    return (
        <div>
            {lang}:{t.nav.home}
        </div>
    )
}

function MissingProviderConsumer() {
    useLang()
    return null
}

describe("lang provider", () => {
    it("fails fast when useLang is called outside LangProvider", () => {
        expect(() => render(<MissingProviderConsumer />)).toThrow("[i18n] useLang must be used within LangProvider")
    })

    it("provides locale translations without falling back to an implicit English context", async () => {
        render(
            <LangProvider lang="fr" translations={getTranslation("fr")}>
                <LangConsumer />
            </LangProvider>,
        )

        expect(screen.getByText("fr:Accueil")).toBeInTheDocument()
        await waitFor(() => expect(document.documentElement.lang).toBe("fr"))
    })
})
