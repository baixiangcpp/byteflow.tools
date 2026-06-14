"use client"

import { buildToolTemplateModel, ToolContentTemplateSection } from "../core"
import { ZH_TW_FALLBACK_PACK } from "../packs/zh-tw"
import type { LocaleTemplateProps } from "../types"

export default function ZhTwToolContentTemplate(props: LocaleTemplateProps) {
    const model = buildToolTemplateModel({ ...props, pack: ZH_TW_FALLBACK_PACK })
    if (!model) return null
    return <ToolContentTemplateSection model={model} />
}
