import { generateGrowthPageMetadata, renderGrowthPage } from "@/core/growth/growth-page-routes"

const PAGE_SLUG = "compare/md5-vs-sha256"

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    return generateGrowthPageMetadata({ params, slug: PAGE_SLUG })
}

export default async function Md5VsSha256Page({ params }: { params: Promise<{ lang: string }> }) {
    return renderGrowthPage({ params, slug: PAGE_SLUG })
}
