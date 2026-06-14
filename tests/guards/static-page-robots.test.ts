import { describe, expect, it } from "vitest"
import { generateMetadata as generateAboutMetadata } from "@/app/[lang]/about/layout"
import { generateMetadata as generatePricingMetadata } from "@/app/[lang]/pricing/layout"
import { generateMetadata as generatePrivacyMetadata } from "@/app/[lang]/privacy/layout"
import { generateMetadata as generateTermsMetadata } from "@/app/[lang]/terms/layout"

describe("static page robots metadata", () => {
    it("marks about page as noindex", async () => {
        const metadata = await generateAboutMetadata({ params: Promise.resolve({ lang: "en" }) })

        expect(metadata.robots).toMatchObject({
            index: false,
            follow: true,
        })
    })

    it("marks pricing page as noindex", async () => {
        const metadata = await generatePricingMetadata({ params: Promise.resolve({ lang: "en" }) })

        expect(metadata.robots).toMatchObject({
            index: false,
            follow: true,
        })
    })

    it("keeps privacy page indexable", async () => {
        const metadata = await generatePrivacyMetadata({ params: Promise.resolve({ lang: "zh-CN" }) })

        expect(metadata.robots).toBeUndefined()
    })

    it("marks terms page as noindex", async () => {
        const metadata = await generateTermsMetadata({ params: Promise.resolve({ lang: "fr" }) })

        expect(metadata.robots).toMatchObject({
            index: false,
            follow: true,
        })
    })
})
