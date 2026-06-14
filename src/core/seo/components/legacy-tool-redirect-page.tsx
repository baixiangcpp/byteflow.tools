type LegacyToolRedirectPageProps = {
    href: string
    title: string
    body: string
    cta: string
}

export function LegacyToolRedirectPage({ href, title, body, cta }: LegacyToolRedirectPageProps) {
    const escapedHref = JSON.stringify(href)

    return (
        <>
            <script
                dangerouslySetInnerHTML={{
                    __html: `
                    (function () {
                      var target = ${escapedHref};
                      if (window.location.pathname + window.location.search + window.location.hash !== target) {
                        window.location.replace(target);
                      }
                    })();
                `,
                }}
            />
            <main className="mx-auto max-w-xl px-6 py-16 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                <p className="mt-3 text-sm text-muted-foreground">
                    {body}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                    <a className="underline underline-offset-4" href={href}>
                        {cta}
                    </a>
                </p>
            </main>
        </>
    )
}
