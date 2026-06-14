"use client"

import * as React from "react"
import { Grid3X3, Maximize2 } from "lucide-react"
import { cn } from "@/core/utils/utils"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useHasMounted } from "@/hooks/use-has-mounted"

export type ToolPreviewAreaProps = {
    children: React.ReactNode
    title?: string
    metadata?: string
    allowBackgroundToggle?: boolean
    allowFullscreen?: boolean
    className?: string
}

type BackgroundType = "transparent" | "checkerboard" | "white" | "black"

export function ToolPreviewArea({
    children,
    title,
    metadata,
    allowBackgroundToggle = true,
    allowFullscreen = true,
    className,
}: ToolPreviewAreaProps) {
    const [bgType, setBgType] = React.useState<BackgroundType>("checkerboard")
    const hasMounted = useHasMounted()

    const toggleBackground = () => {
        const sequence: BackgroundType[] = ["transparent", "checkerboard", "white", "black"]
        const currentIndex = sequence.indexOf(bgType)
        setBgType(sequence[(currentIndex + 1) % sequence.length])
    }

    const bgClass = React.useMemo(() => {
        switch (bgType) {
            case "checkerboard":
                return "bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjODA4MDgwMWEiLz48cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzgwODA4MDFhIi8+PC9zdmc+')] bg-repeat"
            case "white":
                return "bg-white"
            case "black":
                return "bg-black"
            default:
                return "bg-background"
        }
    }, [bgType])

    const toolbar = (
        <div className="flex items-center gap-1">
            {allowBackgroundToggle && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={toggleBackground}
                    title="Toggle background"
                >
                    <Grid3X3 className="h-3.5 w-3.5" />
                </Button>
            )}
            {allowFullscreen && (
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Fullscreen">
                            <Maximize2 className="h-3.5 w-3.5" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden border-none shadow-2xl">
                        <DialogHeader className="sr-only">
                            <DialogTitle>{title || "Preview"}</DialogTitle>
                        </DialogHeader>
                        <div className={cn("relative flex items-center justify-center min-h-[60vh] w-full p-8 overflow-auto", bgClass)}>
                            <div className="max-w-full max-h-full drop-shadow-2xl">
                                {children}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )

    return (
        <div className={cn("flex flex-col overflow-hidden rounded-lg border bg-card", className)}>
            {(title || metadata || (allowBackgroundToggle || allowFullscreen)) && (
                <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2">
                    <div className="flex items-center gap-3">
                        {title && <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>}
                        {metadata && <span className="text-[10px] font-medium text-muted-foreground/60">{metadata}</span>}
                    </div>
                    {hasMounted && toolbar}
                </div>
            )}
            <div className={cn("relative flex-1 min-h-[200px] flex items-center justify-center p-6 overflow-auto", bgClass)}>
                <div className="max-w-full transition-all duration-300 ease-in-out">
                    {children}
                </div>
            </div>
        </div>
    )
}
