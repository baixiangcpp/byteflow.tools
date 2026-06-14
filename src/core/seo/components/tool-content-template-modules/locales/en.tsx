"use client"

import { buildToolTemplateModel, ToolContentTemplateSection } from "../core"
import { TOP_TOOL_CONTENT_TEMPLATES } from "../top-templates"
import { EN_FALLBACK_PACK } from "../packs/en"
import type { LocaleTemplateProps } from "../types"

export default function EnToolContentTemplate(props: LocaleTemplateProps) {
    const model = buildToolTemplateModel({
        ...props,
        pack: EN_FALLBACK_PACK,
        topTemplates: TOP_TOOL_CONTENT_TEMPLATES,
    })

    if (!model) return null
    return <ToolContentTemplateSection model={model} />
}
