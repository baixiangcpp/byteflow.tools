import { Copy, Download, ListTree, Maximize2, Minimize2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OutputWrapModeControl, type OutputWrapMode } from "@/features/tool-shell/text-output-panel"
import type { ViewMode } from "./types"

type JsonOutputToolbarProps = {
    canCopy: boolean
    hasTreeData: boolean
    isSearchOpen: boolean
    labels: {
        collapseAll: string
        downloadJson: string
        copyOutput: string
        disabledNoOutput: string
        expandAll: string
        output: string
        search: string
        viewText: string
        viewTree: string
    }
    onCollapseAll: () => void
    onCopy: () => void
    onDownload: () => void
    onExpandAll: () => void
    onToggleSearch: () => void
    onWrapModeChange: (mode: OutputWrapMode) => void
    onViewModeChange: (mode: ViewMode) => void
    viewMode: ViewMode
    wrapMode: OutputWrapMode
}

export function JsonOutputToolbar({
    canCopy,
    hasTreeData,
    isSearchOpen,
    labels,
    onCollapseAll,
    onCopy,
    onDownload,
    onExpandAll,
    onToggleSearch,
    onWrapModeChange,
    onViewModeChange,
    viewMode,
    wrapMode,
}: JsonOutputToolbarProps) {
    return (
        <div className="tool-pane-header tool-pane-header-between">
            <div className="flex items-center gap-2">
                <span>{labels.output}</span>
                <div className="flex items-center rounded-md border bg-muted p-0.5">
                    <button
                        type="button"
                        onClick={() => onViewModeChange("text")}
                        className={`min-h-11 rounded px-3 text-sm transition-colors lg:min-h-7 lg:px-2 lg:text-[11px] ${viewMode === "text" ? "bg-background text-foreground" : "text-muted-foreground"}`}
                    >
                        {labels.viewText}
                    </button>
                    <button
                        type="button"
                        onClick={() => onViewModeChange("tree")}
                        className={`min-h-11 rounded px-3 text-sm transition-colors lg:min-h-7 lg:px-2 lg:text-[11px] ${viewMode === "tree" ? "bg-background text-foreground" : "text-muted-foreground"}`}
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
                            title={labels.expandAll}
                            aria-label={labels.expandAll}
                            onClick={onExpandAll}
                            disabled={!hasTreeData}
                        >
                            <Maximize2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            title={labels.collapseAll}
                            aria-label={labels.collapseAll}
                            onClick={onCollapseAll}
                            disabled={!hasTreeData}
                        >
                            <Minimize2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={isSearchOpen ? "bg-accent text-accent-foreground" : ""}
                            title={labels.search}
                            aria-label={labels.search}
                            onClick={onToggleSearch}
                            disabled={!hasTreeData}
                        >
                            <Search className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                ) : null}

                {viewMode === "text" ? (
                    <OutputWrapModeControl value={wrapMode} onChange={onWrapModeChange} />
                ) : null}

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onCopy}
                    disabled={!canCopy}
                    aria-label={canCopy ? labels.copyOutput : `${labels.copyOutput}: ${labels.disabledNoOutput}`}
                    title={canCopy ? labels.copyOutput : labels.disabledNoOutput}
                >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">{labels.copyOutput}</span>
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDownload}
                    disabled={!canCopy}
                    aria-label={canCopy ? labels.downloadJson : `${labels.downloadJson}: ${labels.disabledNoOutput}`}
                    title={canCopy ? labels.downloadJson : labels.disabledNoOutput}
                >
                    <Download className="h-4 w-4" />
                    <span className="sr-only">{labels.downloadJson}</span>
                </Button>
            </div>
        </div>
    )
}
