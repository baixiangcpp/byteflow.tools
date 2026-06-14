import { notFound } from "next/navigation"
import { FocusedHashToolPage } from "@/features/tool-templates/focused-hash-tool-page"
import { isValidLocale, type Locale } from "@/core/i18n/i18n"
import { getLocalizedMetaCopy } from "@/core/seo/localized-meta-copy"

const SLUG = "sha1-digest-generator"
const FALLBACK_TITLE = "SHA-1 Digest Generator"
const FALLBACK_DESCRIPTION = "Generate SHA-1 digests in a focused workflow for legacy interoperability checks and digest comparisons."
const WEAK_WARNING_BY_LOCALE: Record<Locale, string> = {
    en: "SHA-1 is considered weak for security use. Prefer SHA-256 or stronger algorithms for new systems.",
    "zh-CN": "SHA-1 已不适用于新的安全场景。请优先使用 SHA-256 或更强算法。",
    "zh-TW": "SHA-1 已不適用於新的安全情境。請優先使用 SHA-256 或更強演算法。",
    ja: "SHA-1 は安全性の面で弱いため、新規用途では SHA-256 以上を推奨します。",
    ko: "SHA-1은 보안 용도로 약하므로 신규 시스템에는 SHA-256 이상을 권장합니다.",
    de: "SHA-1 gilt für Sicherheitszwecke als schwach. Für neue Systeme werden SHA-256 oder stärkere Algorithmen empfohlen.",
    fr: "SHA-1 est considéré comme faible pour la sécurité. Préférez SHA-256 ou un algorithme plus robuste pour les nouveaux systèmes.",
}

export default async function Sha1EncryptDecryptPage({
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
            <FocusedHashToolPage
                algorithm="sha1"
                title={meta.title}
                description={meta.description}
                weakAlgorithmWarning={WEAK_WARNING_BY_LOCALE[lang]}
                enableFile
                sampleText="sample_sha1_001"
                relatedToolKey="hash_generator"
            />
        </>
    )
}
