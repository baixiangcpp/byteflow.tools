"use client"

import { HtmlCssBeautifierTool } from "@/features/tool-templates/html-css-beautifier-tool"
import { WideToolPageContainer } from "@/components/layout/page-container"

export function HtmlCssBeautifierPage() {
    return (
        <WideToolPageContainer>
            <HtmlCssBeautifierTool toolKey="html_css_beautifier" initialMode="html" availableModes={["html", "css"]} />
        </WideToolPageContainer>
    )
}
