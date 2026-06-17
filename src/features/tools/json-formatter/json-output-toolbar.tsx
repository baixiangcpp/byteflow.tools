import { Copy, ListTree, Maximize2, Minimize2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ViewMode } from "./types"

type JsonOutputToolbarProps = {
    canCopy: boolean
    hasTreeData: boolean
    isSearchOpen: boolean
    labels: {
        collapseAll: string
        copyOutput: string
        expandAll: string
        output: string
        search: string
        viewText: string
        viewTree: string
    }
    onCollapseAll: () => void
    onCopy: () => void
    onExpandAll: () => void
    onToggleSearch: () => void
    onViewModeChange: (mode: ViewMode) => void
    viewMode: ViewMode
}

export function JsonOutputToolbar({
    canCopy,
    hasTreeData,
    isSearchOpen,
    labels,
    onCollapseAll,
    onCopy,
    onExpandAll,
    onToggleSearch,
    onViewModeChange,
    viewMode,
}: JsonOutputToolbarProps) {
    return (
        <div className="tool-pane-header tool-pane-header-between">
            <div className="flex items-center gap-2">
                <span>{labels.output}</span>
                <div className="flex items-center rounded-md border bg-muted p-0.5">
                    <button
                        type="button"
                        onClick={() => onViewModeChange("text")}
                        className={`rounded px-2 py-1 text-[11px] transition-colors ${viewMode === "text" ? "bg-background text-foreground" : "text-muted-foreground"}`}
                    >
                        {labels.viewText}
                    </button>
                    <button
                        type="button"
                        onClick={() => onViewModeChange("tree")}
                        className={`rounded px-2 py-1 text-[11px] transition-colors ${viewMode === "tree" ? "bg-background text-foreground" : "text-muted-foreground"}`}
                    >
                        <span className="inline-flex items-center gap-1">
                            <ListTree className="h-3.5 w-3.5" />
                            {labels.viewTree}
                        </span>
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-1">
                {viewMode === "tree" ? (
                    <div className="mr-1 flex items-center gap-1 border-r pr-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title={labels.expandAll}
                            onClick={onExpandAll}
                            disabled={!hasTreeData}
                        >
                            <Maximize2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title={labels.collapseAll}
                            onClick={onCollapseAll}
                            disabled={!hasTreeData}
                        >
                            <Minimize2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`h-7 w-7 ${isSearchOpen ? "bg-accent text-accent-foreground" : ""}`}
                            title={labels.search}
                            onClick={onToggleSearch}
                            disabled={!hasTreeData}
                        >
                            <Search className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                ) : null}

                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCopy} disabled={!canCopy}>
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">{labels.copyOutput}</span>
                </Button>
            </div>
        </div>
    )
}
