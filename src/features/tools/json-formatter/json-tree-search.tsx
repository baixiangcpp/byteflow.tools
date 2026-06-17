import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type JsonTreeSearchProps = {
    closeLabel: string
    onClose: () => void
    onQueryChange: (query: string) => void
    placeholder: string
    query: string
}

export function JsonTreeSearch({
    closeLabel,
    onClose,
    onQueryChange,
    placeholder,
    query,
}: JsonTreeSearchProps) {
    return (
        <div className="absolute right-4 top-2 z-10 flex items-center gap-2 rounded-lg border bg-background/95 p-1 shadow-lg backdrop-blur-md animate-in fade-in zoom-in duration-200">
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                    autoFocus
                    className="h-8 w-48 pl-8 text-xs focus-visible:ring-1 focus-visible:ring-primary/50"
                    placeholder={placeholder}
                    value={query}
                    onChange={(event) => onQueryChange(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Escape") {
                            onClose()
                        }
                    }}
                />
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onClose}
                aria-label={closeLabel}
            >
                <X className="h-3.5 w-3.5" />
            </Button>
        </div>
    )
}
