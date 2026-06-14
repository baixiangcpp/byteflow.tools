"use client"

import { buildToolTemplateModel, ToolContentTemplateSection } from "../core"
import { ZH_CN_FALLBACK_PACK } from "../packs/zh-cn"
import type { LocaleTemplateProps } from "../types"

export default function ZhCnToolContentTemplate(props: LocaleTemplateProps) {
    const model = buildToolTemplateModel({ ...props, pack: ZH_CN_FALLBACK_PACK })
    if (!model) return null
    return <ToolContentTemplateSection model={model} />
}
