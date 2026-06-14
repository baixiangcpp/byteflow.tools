import { notFound } from "next/navigation"
import { FocusedHashToolPage } from "@/features/tool-templates/focused-hash-tool-page"
import { isValidLocale } from "@/core/i18n/i18n"
import { getLocalizedMetaCopy } from "@/core/seo/localized-meta-copy"

const SLUG = "sha256-digest-generator"
const FALLBACK_TITLE = "SHA-256 Digest Generator"
const FALLBACK_DESCRIPTION = "Generate SHA-256 digests in text, file, and HMAC modes for integrity verification and API signature testing."

export default async function Sha256EncryptDecryptPage({
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
                algorithm="sha256"
                title={meta.title}
                description={meta.description}
                enableFile
                enableHmac
                sampleText="sample_sha256_001"
                relatedToolKey="hash_generator"
            />
        </>
    )
}
