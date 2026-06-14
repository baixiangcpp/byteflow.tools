import { MenuGroupHub } from "@/core/seo/components/menu-group-hub"
import { isValidLocale } from "@/core/i18n/i18n"
import { notFound } from "next/navigation"

export default async function ConvertEncodePage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }

    return <MenuGroupHub lang={lang} groupKey="convert_encode" />
}
