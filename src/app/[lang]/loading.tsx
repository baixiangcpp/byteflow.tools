export default function LangLoading() {
    return (
        <div className="mx-auto w-full max-w-screen-2xl px-4 pb-10 pt-6 md:px-8 md:pt-8 lg:px-10">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <section className="rounded-2xl border border-border/70 bg-card/55 p-4 md:p-5">
                    <div className="h-5 w-36 animate-pulse rounded-md bg-muted/45" />
                    <div className="mt-4 h-64 animate-pulse rounded-xl border border-border/60 bg-background/55 md:h-80" />
                    <div className="mt-4 flex flex-wrap gap-2">
                        <div className="h-10 w-24 animate-pulse rounded-md bg-muted/40" />
                        <div className="h-10 w-24 animate-pulse rounded-md bg-muted/40" />
                        <div className="h-10 w-24 animate-pulse rounded-md bg-muted/40" />
                    </div>
                </section>

                <section className="rounded-2xl border border-border/70 bg-card/55 p-4 md:p-5">
                    <div className="h-5 w-28 animate-pulse rounded-md bg-muted/45" />
                    <div className="mt-4 h-64 animate-pulse rounded-xl border border-border/60 bg-background/55 md:h-80" />
                    <div className="mt-4 h-10 w-32 animate-pulse rounded-md bg-muted/40" />
                </section>
            </div>

            <div className="mt-6 rounded-2xl border border-border/60 bg-card/45 p-4 md:p-5">
                <div className="h-4 w-28 animate-pulse rounded bg-muted/40" />
                <div className="mt-3 space-y-2">
                    <div className="h-3 w-full animate-pulse rounded bg-muted/35" />
                    <div className="h-3 w-11/12 animate-pulse rounded bg-muted/35" />
                    <div className="h-3 w-10/12 animate-pulse rounded bg-muted/35" />
                </div>
            </div>
        </div>
    )
}
