import type { Metadata } from "next"
import Link from "next/link"
import { AlertTriangle, Home, Layers } from "lucide-react"
import { getAllToolsHref } from "@/core/routing/all-tools-route"
import { DEFAULT_OG_IMAGE } from "@/core/seo/seo"

const TITLE = "Page not found | byteflow.tools"
const DESCRIPTION = "The page does not exist. Choose a language and continue from the all-tools directory."

export const metadata: Metadata = {
    title: { absolute: TITLE },
    description: DESCRIPTION,
    keywords: ["Page not found", "404", "missing page", "byteflow.tools"],
    robots: {
        index: false,
        follow: false,
    },
    openGraph: {
        title: TITLE,
        description: DESCRIPTION,
        siteName: "byteflow.tools",
        type: "website",
        images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
        card: "summary_large_image",
        title: TITLE,
        description: DESCRIPTION,
        images: [DEFAULT_OG_IMAGE],
    },
}

export default function RootNotFound() {
    return (
        <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center px-6 py-12">
            <section className="w-full rounded-2xl border border-border/60 bg-card/45 px-6 py-12 md:px-10">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-amber-400/35 bg-amber-400/10 text-amber-500">
                    <AlertTriangle className="h-6 w-6" />
                </div>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight">Page not found</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    The page does not exist. Choose a language and continue from the all-tools directory.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                        href="/en"
                        className="inline-flex items-center gap-2 rounded-md border border-primary/50 bg-primary/10 px-4 py-2 text-sm font-medium hover:bg-primary/15"
                    >
                        <Home className="h-4 w-4" />
                        Go to Home
                    </Link>
                    <Link
                        href={getAllToolsHref("en")}
                        className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:border-primary/35"
                    >
                        <Layers className="h-4 w-4" />
                        Browse all tools
                    </Link>
                </div>
            </section>
        </main>
    )
}
