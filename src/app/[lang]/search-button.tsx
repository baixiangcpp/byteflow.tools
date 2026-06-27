import { Search } from "lucide-react"

export function SearchButton({ label }: { label: string }) {
    return (
        <button
            type="button"
            data-command-palette-trigger
            className="group relative inline-flex min-h-12 w-full max-w-xl items-center gap-3 overflow-hidden rounded-2xl border border-border/70 bg-card/80 px-4 py-3 text-sm text-muted-foreground shadow-xl shadow-black/10 backdrop-blur-md transition-[transform,border-color,background-color,color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-primary/45 hover:bg-card hover:text-foreground hover:shadow-2xl hover:shadow-cyan-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 dark:shadow-black/35"
        >
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,hsl(189_94%_46%/0.1),transparent_50%,hsl(39_94%_56%/0.1))] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
            <Search aria-hidden="true" className="relative h-4 w-4 shrink-0 text-primary" />
            <span className="relative flex-1 text-left text-sm md:text-base">{label}</span>
            <kbd className="relative inline-flex items-center gap-1 rounded-md border border-border/80 bg-muted/70 px-2 py-1 text-[11px] font-medium uppercase text-muted-foreground">
                Cmd/Ctrl
                <span className="text-foreground">K</span>
            </kbd>
        </button>
    )
}
