"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"
import { MARKDOWN_SANITIZE_SCHEMA } from "@/core/security/sanitize"

const MARKDOWN_RENDER_COMPONENTS = {
    h1: (props: React.HTMLAttributes<HTMLHeadingElement> & { node?: unknown }) => {
        const { children, node, ...headingProps } = props
        void node
        return <h2 {...headingProps}>{children}</h2>
    },
    img: (props: React.ImgHTMLAttributes<HTMLImageElement> & { node?: unknown }) => {
        const { node, src: _src, alt } = props
        void node
        void _src

        return (
            <span className="inline-flex rounded border border-border/70 bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
                {alt ? `Image blocked: ${alt}` : "Image blocked"}
            </span>
        )
    },
} as const

type MarkdownPreviewRendererProps = {
    markdown: string
    className?: string
    ariaLabelledby?: string
}

export function MarkdownPreviewRenderer({ markdown, className, ariaLabelledby }: MarkdownPreviewRendererProps) {
    return (
        <div id="markdown-preview" role="region" aria-labelledby={ariaLabelledby} className={className}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, [rehypeSanitize, MARKDOWN_SANITIZE_SCHEMA]]}
                components={MARKDOWN_RENDER_COMPONENTS}
            >
                {markdown}
            </ReactMarkdown>
        </div>
    )
}
