import { notFound } from "next/navigation"
import { SingleHashToolPage } from "@/features/tool-templates/single-hash-tool-page"
import { isValidLocale, type Locale } from "@/core/i18n/i18n"
import { getLocalizedMetaCopy } from "@/core/seo/localized-meta-copy"

const SLUG = "sha384-digest-generator"
const FALLBACK_TITLE = "SHA-384 Digest Generator"
const FALLBACK_DESCRIPTION = "Generate SHA-384 digests in a focused workflow. SHA-384 is a one-way hash function and cannot be reversed."
const OUTPUT_LABEL_BY_LOCALE: Record<Locale, string> = {
    en: "SHA-384 Digest",
    "zh-CN": "SHA-384 摘要",
    "zh-TW": "SHA-384 摘要",
    ja: "SHA-384 ダイジェスト",
    ko: "SHA-384 다이제스트",
    de: "SHA-384-Digest",
    fr: "Empreinte SHA-384",
}
const OUTPUT_PLACEHOLDER_BY_LOCALE: Record<Locale, string> = {
    en: "SHA-384 digest will appear here",
    "zh-CN": "SHA-384 摘要将显示在这里",
    "zh-TW": "SHA-384 摘要將顯示在這裡",
    ja: "SHA-384 ダイジェストがここに表示されます",
    ko: "SHA-384 다이제스트가 여기에 표시됩니다",
    de: "SHA-384-Digest wird hier angezeigt",
    fr: "L'empreinte SHA-384 s'affichera ici",
}

export default async function Sha384EncryptDecryptPage({
    params,
}: {
    params: Promise<{ lang: string }>
}) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }

    const meta = getLocalizedMetaCopy({
        slug: SLUG,
        locale: lang,
        fallbackTitle: FALLBACK_TITLE,
        fallbackDescription: FALLBACK_DESCRIPTION,
    })

    return (
        <>
            <SingleHashToolPage
                algorithm="sha384"
                title={meta.title}
                description={meta.description}
                outputLabel={OUTPUT_LABEL_BY_LOCALE[lang]}
                outputPlaceholder={OUTPUT_PLACEHOLDER_BY_LOCALE[lang]}
                relatedToolKey="hash_generator"
            />
        </>
    )
}
