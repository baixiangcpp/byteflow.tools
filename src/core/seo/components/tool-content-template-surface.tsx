import type { ReactNode } from "react"

const TEMPLATE_BASE_CLASS =
    "mt-10 w-full rounded-2xl border border-border/70 bg-card/55 p-5 backdrop-blur-sm sm:p-6"

export function ToolContentTemplateSurface({
    source,
    children,
}: {
    source: "client" | "server"
    children: ReactNode
}) {
    return (
        <section
            data-tool-content-template="full"
            data-tool-content-template-source={source}
            data-tool-content-template-width-sync="contract"
            className={TEMPLATE_BASE_CLASS}
        >
            {children}
        </section>
    )
}
