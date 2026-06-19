import type { Metadata } from "next"
import { LOCALES } from "@/core/i18n/i18n"

const SITE_URL = "https://byteflow.tools"

const ROOT_ALTERNATES = Object.fromEntries(
    LOCALES.map((locale) => [locale, `${SITE_URL}/${locale}`]),
) as Record<string, string>

ROOT_ALTERNATES["x-default"] = SITE_URL

export const metadata: Metadata = {
    title: {
        absolute: "byteflow.tools | Privacy-first Developer Tools",
    },
    alternates: {
        canonical: SITE_URL,
        languages: ROOT_ALTERNATES,
    },
    robots: {
        index: true,
        follow: true,
    },
}

export default function RootPage() {
    return (
        <>
            <script src="/runtime/root-locale-redirect.js" />
            <main className="mx-auto max-w-xl px-6 py-16 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">byteflow.tools</h1>
                <p className="mt-3 text-sm text-muted-foreground">
                    Choose your language. You will be redirected automatically.
                </p>
                <ul className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
                    {LOCALES.map((locale) => (
                        <li key={locale}>
                            <a
                                href={`/${locale}`}
                                className="inline-flex rounded-md border border-border px-3 py-1.5 hover:border-primary/50"
                            >
                                {locale}
                            </a>
                        </li>
                    ))}
                </ul>
            </main>
        </>
    )
}
