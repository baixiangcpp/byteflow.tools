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
    const trustCenterLabel = t.pages.trust_center_title
    const localDataControlsLabel = t.common.local_data_controls.title
    const distributionResearchLabel = t.pages.contact_distribution_research_link
    const offlineMatrixTitle = t.pages.trust_center_offline_matrix_title
    const offlineMatrixDescription = t.pages.trust_center_offline_matrix_install_desc
    const offlineMatrixLink = t.pages.trust_center_offline_matrix_link

    return (
        <InstallAppClient
            locale={locale}
            copy={copy}
            allToolsLabel={allToolsLabel}
            trustCenterLabel={trustCenterLabel}
            localDataControlsLabel={localDataControlsLabel}
            distributionResearchLabel={distributionResearchLabel}
            offlineMatrixTitle={offlineMatrixTitle}
            offlineMatrixDescription={offlineMatrixDescription}
            offlineMatrixLink={offlineMatrixLink}
        />
    )
}
