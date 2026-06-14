"use client"

import { buildToolTemplateModel, ToolContentTemplateSection } from "../core"
import { JA_FALLBACK_PACK } from "../packs/ja"
import type { LocaleTemplateProps } from "../types"

export default function JaToolContentTemplate(props: LocaleTemplateProps) {
    const model = buildToolTemplateModel({ ...props, pack: JA_FALLBACK_PACK })
    if (!model) return null
    return <ToolContentTemplateSection model={model} />
}
