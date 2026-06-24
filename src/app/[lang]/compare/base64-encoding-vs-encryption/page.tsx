import { generateGrowthPageMetadata, renderGrowthPage } from "@/core/growth/growth-page-routes"

const PAGE_SLUG = "compare/base64-encoding-vs-encryption"

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    return generateGrowthPageMetadata({ params, slug: PAGE_SLUG })
}

export default async function Base64EncodingVsEncryptionPage({ params }: { params: Promise<{ lang: string }> }) {
    return renderGrowthPage({ params, slug: PAGE_SLUG })
}
