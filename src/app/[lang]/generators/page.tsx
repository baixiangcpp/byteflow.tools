import { CategoryHub } from "@/core/seo/components/category-hub"
import { isValidLocale } from "@/core/i18n/i18n"
import { notFound } from "next/navigation"

export default async function GeneratorsPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }

    return <CategoryHub lang={lang} category="generators" titleKey="generators" descriptionKey="generators_desc" />
}
