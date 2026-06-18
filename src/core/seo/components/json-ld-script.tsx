import type { ScriptHTMLAttributes } from "react"

type JsonLdScriptProps = Omit<ScriptHTMLAttributes<HTMLScriptElement>, "children" | "dangerouslySetInnerHTML" | "type"> & {
    jsonLd: unknown
}

export function serializeJsonLd(jsonLd: unknown): string {
    return JSON.stringify(jsonLd).replace(/</g, "\\u003c")
}

export function JsonLdScript({ jsonLd, ...props }: JsonLdScriptProps) {
    return (
        <script
            {...props}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
    )
}
