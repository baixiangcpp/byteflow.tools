import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { getInstallPageCopy } from "@/core/utils/install-app-copy"
import { InstallAppClient } from "@/features/install-app/components/install-app-client"
import { notFound } from "next/navigation"

export default async function InstallAppPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const locale = lang
    const t = getTranslation(locale)
    const copy = getInstallPageCopy(locale)
    const allToolsLabel = t.common.all_tools

    return <InstallAppClient locale={locale} copy={copy} allToolsLabel={allToolsLabel} />
}
