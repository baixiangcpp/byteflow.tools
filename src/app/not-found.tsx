import type { Metadata } from "next"
import Link from "next/link"
import { AlertTriangle, Home, Layers, Search, ShieldAlert, Wrench } from "lucide-react"
import { getAllToolsHref } from "@/core/routing/all-tools-route"
import { MENU_GROUP_DEFS } from "@/core/registry/menu-groups"
import { DEFAULT_OG_IMAGE } from "@/core/seo/seo"
import { RouteViewportContainer, StaticPageContainer } from "@/components/layout/page-container"

const TITLE = "Page not found | byteflow.tools"
const DESCRIPTION = "The page does not exist. Choose a language and continue from the all-tools directory."
const EN_DATA_CODE_FORMATS_HREF = `/en/${MENU_GROUP_DEFS.find((item) => item.key === "data_code_formats")?.slug ?? "all-tools"}`
const EN_ENCODING_CRYPTO_HREF = `/en/${MENU_GROUP_DEFS.find((item) => item.key === "encoding_crypto")?.slug ?? "all-tools"}`
const EN_WEB_API_HREF = `/en/${MENU_GROUP_DEFS.find((item) => item.key === "web_api_network")?.slug ?? "all-tools"}`

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
        <RouteViewportContainer as="main" className="flex min-h-[60vh] items-center py-12">
            <StaticPageContainer>
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
                    <Link
                        href={`${getAllToolsHref("en")}#tool-discovery`}
                        className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:border-primary/35"
                    >
                        <Search className="h-4 w-4" />
                        Search tools
                    </Link>
                </div>
                <div className="mt-6 grid gap-2 sm:grid-cols-3">
                    <Link href={EN_DATA_CODE_FORMATS_HREF} className="inline-flex items-center gap-2 rounded-md border border-border/60 px-3 py-2 text-sm hover:border-primary/35">
                        <Wrench className="h-4 w-4 text-primary" />
                        Data & Code Formats
                    </Link>
                    <Link href={EN_ENCODING_CRYPTO_HREF} className="inline-flex items-center gap-2 rounded-md border border-border/60 px-3 py-2 text-sm hover:border-primary/35">
                        <Wrench className="h-4 w-4 text-primary" />
                        Encoding & Crypto
                    </Link>
                    <Link href={EN_WEB_API_HREF} className="inline-flex items-center gap-2 rounded-md border border-border/60 px-3 py-2 text-sm hover:border-primary/35">
                        <Wrench className="h-4 w-4 text-primary" />
                        Web & API
                    </Link>
                </div>
                <div className="mt-6 border-t border-border/60 pt-4 text-sm text-muted-foreground">
                    Need help with a broken link or security concern?{" "}
                    <Link href="/en/contact" className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary">
                        <ShieldAlert className="h-4 w-4" />
                        Contact or report it
                    </Link>
                    .
                </div>
                </section>
            </StaticPageContainer>
        </RouteViewportContainer>
    )
}
