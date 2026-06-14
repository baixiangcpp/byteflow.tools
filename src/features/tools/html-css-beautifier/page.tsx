"use client"

import { HtmlCssBeautifierTool } from "@/features/tool-templates/html-css-beautifier-tool"

export function HtmlCssBeautifierPage() {
    return <HtmlCssBeautifierTool toolKey="html_css_beautifier" initialMode="html" availableModes={["html", "css"]} />
}
