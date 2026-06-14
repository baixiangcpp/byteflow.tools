"use client"

import { HtmlCssBeautifierTool } from "@/features/tool-templates/html-css-beautifier-tool"

export default function CssFormatterPage() {
    return <HtmlCssBeautifierTool toolKey="html_css_beautifier" initialMode="css" availableModes={["css"]} />
}
