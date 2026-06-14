"use client"

import { buildToolTemplateModel, ToolContentTemplateSection } from "../core"
import { FR_FALLBACK_PACK } from "../packs/fr"
import type { LocaleTemplateProps } from "../types"

export default function FrToolContentTemplate(props: LocaleTemplateProps) {
    const model = buildToolTemplateModel({ ...props, pack: FR_FALLBACK_PACK })
    if (!model) return null
    return <ToolContentTemplateSection model={model} />
}
