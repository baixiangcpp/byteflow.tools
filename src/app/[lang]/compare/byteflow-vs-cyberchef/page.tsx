import { generateGrowthPageMetadata, renderGrowthPage } from "@/core/growth/growth-page-routes"

const PAGE_SLUG = "compare/byteflow-vs-cyberchef"

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    return generateGrowthPageMetadata({ params, slug: PAGE_SLUG })
}

export default async function ByteflowVsCyberChefPage({ params }: { params: Promise<{ lang: string }> }) {
    return renderGrowthPage({ params, slug: PAGE_SLUG })
}
