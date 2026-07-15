"use client"

import { HtmlCssBeautifierTool } from "@/features/tool-templates/html-css-beautifier-tool"
import { WideToolPageContainer } from "@/components/layout/page-container"

export function HtmlFormatterPage() {
    return (
        <WideToolPageContainer>
            <HtmlCssBeautifierTool toolKey="html_formatter" initialMode="html" availableModes={["html"]} />
        </WideToolPageContainer>
    )
}
