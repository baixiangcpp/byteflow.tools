"use client"

import * as React from "react"
import { shouldNoindexAllToolsUrl } from "@/core/routing/seo-route-policy"

const META_SELECTOR = 'meta[name="robots"][data-byteflow-all-tools-query-robots="true"]'

export function AllToolsQueryRobots() {
    React.useEffect(() => {
        const shouldNoindex = shouldNoindexAllToolsUrl(window.location.href)
        const existing = document.head.querySelector<HTMLMetaElement>(META_SELECTOR)

        if (!shouldNoindex) {
            existing?.remove()
            return
        }

        const meta = existing ?? document.createElement("meta")
        meta.name = "robots"
        meta.content = "noindex,follow"
        meta.dataset.byteflowAllToolsQueryRobots = "true"
        if (!existing) document.head.append(meta)
    }, [])

    return null
}
