"use client"

import { HtmlCssBeautifierTool } from "@/features/tool-templates/html-css-beautifier-tool"

export function HtmlFormatterPage() {
    return <HtmlCssBeautifierTool toolKey="html_formatter" initialMode="html" availableModes={["html"]} />
}
