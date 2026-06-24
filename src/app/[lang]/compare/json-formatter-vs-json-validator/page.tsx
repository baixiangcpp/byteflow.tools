import { generateGrowthPageMetadata, renderGrowthPage } from "@/core/growth/growth-page-routes"

const PAGE_SLUG = "compare/json-formatter-vs-json-validator"

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    return generateGrowthPageMetadata({ params, slug: PAGE_SLUG })
}

export default async function JsonFormatterVsJsonValidatorPage({ params }: { params: Promise<{ lang: string }> }) {
    return renderGrowthPage({ params, slug: PAGE_SLUG })
}
