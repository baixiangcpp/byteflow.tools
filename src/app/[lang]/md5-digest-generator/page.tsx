import { notFound } from "next/navigation"
import { FocusedHashToolPage } from "@/features/tool-templates/focused-hash-tool-page"
import { isValidLocale } from "@/core/i18n/i18n"
import { getLocalizedMetaCopy } from "@/core/seo/localized-meta-copy"

const SLUG = "md5-digest-generator"
const FALLBACK_TITLE = "MD5 Digest Generator"
const FALLBACK_DESCRIPTION = "Generate MD5 digests in a focused workflow for checksum comparison, batch inputs, and file hashing."

export default async function Md5EncryptDecryptPage({
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
                algorithm="md5"
                title={meta.title}
                description={meta.description}
                enableFile
                enableBatch
                sampleText="sample_md5_001"
                relatedToolKey="hash_generator"
            />
        </>
    )
}
