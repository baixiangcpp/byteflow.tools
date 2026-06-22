import { generateGrowthIndexMetadata, renderGrowthIndex } from "@/core/growth/growth-page-routes"

const INDEX_SLUG = "fix"

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    return generateGrowthIndexMetadata({ params, slug: INDEX_SLUG })
}

export default async function FixIndexPage({ params }: { params: Promise<{ lang: string }> }) {
    return renderGrowthIndex({ params, slug: INDEX_SLUG })
}
