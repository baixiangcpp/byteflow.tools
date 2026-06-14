"use client"

import { buildToolTemplateModel, ToolContentTemplateSection } from "../core"
import { KO_FALLBACK_PACK } from "../packs/ko"
import type { LocaleTemplateProps } from "../types"

export default function KoToolContentTemplate(props: LocaleTemplateProps) {
    const model = buildToolTemplateModel({ ...props, pack: KO_FALLBACK_PACK })
    if (!model) return null
    return <ToolContentTemplateSection model={model} />
}
