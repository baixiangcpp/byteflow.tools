"use client"

import { useLang } from "@/core/i18n/lang-provider"
import { SingleHashToolPage } from "@/features/tool-templates/single-hash-tool-page"
import { ToolPageContainer } from "@/components/layout/page-container"

export function Md5GeneratorPage() {
    const { t } = useLang()
    const toolT = t.tools["md5_generator"] as Record<string, string>

    return (
        <ToolPageContainer>
            <SingleHashToolPage
                algorithm="md5"
                title={toolT.title}
                description={toolT.description}
                inputLabel={toolT.input_text}
                inputPlaceholder={toolT.text_placeholder}
                outputLabel={toolT.md5_output}
                outputPlaceholder={toolT.output_placeholder}
                openFullHashLabel={toolT.open_full_hash}
            />
        </ToolPageContainer>
    )
}
