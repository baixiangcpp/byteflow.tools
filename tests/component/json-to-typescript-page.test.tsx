import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { LangProvider } from "@/core/i18n/lang-provider"
import JsonToTypeScriptPage from "@/app/[lang]/json-to-typescript/page"
import { getTranslation } from "@/core/i18n/translations/catalog"

const ROOT_NAME_STORAGE_KEY = "byteflow:json-to-typescript:root-name"

vi.mock("next/navigation", () => ({
    usePathname: () => "/zh-CN/json-to-typescript",
}))

describe("json to typescript page", () => {
    beforeEach(() => {
        const store = new Map<string, string>()
        Object.defineProperty(window, "localStorage", {
            configurable: true,
            value: {
                getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
                setItem: (key: string, value: string) => {
                    store.set(key, value)
                },
                removeItem: (key: string) => {
                    store.delete(key)
                },
            },
        })
    })

    it("migrates built-in saved root names to the current locale default", async () => {
        window.localStorage.setItem(ROOT_NAME_STORAGE_KEY, "Root")

        render(
            <LangProvider lang="zh-CN" translations={getTranslation("zh-CN")}>
                <JsonToTypeScriptPage />
            </LangProvider>,
        )

        await waitFor(() => {
            expect(screen.getByDisplayValue("根节点")).toBeInTheDocument()
            expect(window.localStorage.getItem(ROOT_NAME_STORAGE_KEY)).toBe("根节点")
        })

        expect(screen.queryByDisplayValue("Root")).not.toBeInTheDocument()
    })
})
