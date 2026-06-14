import { notFound } from "next/navigation"
import { FocusedHashToolPage } from "@/features/tool-templates/focused-hash-tool-page"
import { isValidLocale } from "@/core/i18n/i18n"
import { getLocalizedMetaCopy } from "@/core/seo/localized-meta-copy"

const SLUG = "sha512-digest-generator"
const FALLBACK_TITLE = "SHA-512 Digest Generator"
const FALLBACK_DESCRIPTION = "Generate SHA-512 digests with text, file, HMAC, and batch export workflows for large-scale verification tasks."

export default async function Sha512EncryptDecryptPage({
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
                algorithm="sha512"
                title={meta.title}
                description={meta.description}
                enableFile
                enableHmac
                enableBatch
                sampleText="sample_sha512_001"
                relatedToolKey="hash_generator"
            />
        </>
    )
}
