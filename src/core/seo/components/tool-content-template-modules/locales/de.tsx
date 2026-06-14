"use client"

import { buildToolTemplateModel, ToolContentTemplateSection } from "../core"
import { DE_FALLBACK_PACK } from "../packs/de"
import type { LocaleTemplateProps } from "../types"

export default function DeToolContentTemplate(props: LocaleTemplateProps) {
    const model = buildToolTemplateModel({ ...props, pack: DE_FALLBACK_PACK })
    if (!model) return null
    return <ToolContentTemplateSection model={model} />
}
