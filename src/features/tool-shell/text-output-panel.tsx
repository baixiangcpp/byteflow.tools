"use client"

import * as React from "react"
import { AlignLeft, ListMinus } from "lucide-react"
import { useLang } from "@/core/i18n/lang-provider"
import { cn } from "@/core/utils/utils"

export type OutputWrapMode = "wrap" | "scroll"

export function OutputWrapModeControl({
    value,
    onChange,
    className,
}: {
    value: OutputWrapMode
    onChange: (value: OutputWrapMode) => void
    className?: string
}) {
    const { t } = useLang()
    const labels = t.common.output_overflow
    const optionRefs = React.useRef<Array<HTMLButtonElement | null>>([])
    const options = [
        { value: "wrap" as const, label: labels.wrap, icon: AlignLeft },
        { value: "scroll" as const, label: labels.scroll, icon: ListMinus },
    ]
    const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value))

    const selectOption = (index: number) => {
        const nextIndex = (index + options.length) % options.length
        const nextOption = options[nextIndex]
        onChange(nextOption.value)
        optionRefs.current[nextIndex]?.focus()
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        switch (event.key) {
            case "ArrowRight":
            case "ArrowDown":
                event.preventDefault()
                selectOption(selectedIndex + 1)
                break
            case "ArrowLeft":
            case "ArrowUp":
                event.preventDefault()
                selectOption(selectedIndex - 1)
                break
            case "Home":
                event.preventDefault()
                selectOption(0)
                break
            case "End":
                event.preventDefault()
                selectOption(options.length - 1)
                break
            default:
                break
        }
    }

    return (
        <div
            role="radiogroup"
            aria-label={labels.mode_label}
            className={cn("inline-flex rounded-md border bg-background/70 p-0.5", className)}
        >
            {options.map((option, index) => {
                const Icon = option.icon
                const active = option.value === value
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        tabIndex={active ? 0 : -1}
                        title={option.label}
                        ref={(node) => {
                            optionRefs.current[index] = node
                        }}
                        onClick={() => onChange(option.value)}
                        onKeyDown={handleKeyDown}
                        className={cn(
                            "inline-flex min-h-11 items-center gap-1 rounded px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 lg:min-h-8 lg:px-2 lg:text-xs",
                            active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                        )}
                    >
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                        <span>{option.label}</span>
                    </button>
                )
            })}
        </div>
    )
}

export function TextOutputPanel({
    title,
    value,
    ariaLabel,
    metadata,
    actions,
    emptyText,
    className,
    bodyClassName,
    defaultMode = "wrap",
    minHeightClassName = "min-h-[260px]",
}: {
    title: string
    value: string
    ariaLabel?: string
    metadata?: React.ReactNode
    actions?: React.ReactNode
    emptyText?: React.ReactNode
    className?: string
    bodyClassName?: string
    defaultMode?: OutputWrapMode
    minHeightClassName?: string
}) {
    const [mode, setMode] = React.useState<OutputWrapMode>(defaultMode)
    const { t } = useLang()
    const hasValue = value.length > 0

    return (
        <section className={cn("flex h-full min-w-0 flex-col overflow-hidden rounded-lg border bg-card", className)}>
            <div className="tool-pane-header tool-pane-header-between sticky top-0 z-10 gap-2">
                <div className="min-w-0">
                    <span>{title}</span>
                    {metadata ? (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">{metadata}</span>
                    ) : null}
                </div>
                <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
                    <OutputWrapModeControl value={mode} onChange={setMode} />
                    {actions}
                </div>
            </div>
            <pre
                tabIndex={0}
                aria-label={ariaLabel || title}
                data-output-overflow-mode={mode}
                className={cn(
                    "flex-1 select-all overflow-auto border-t bg-background p-4 font-mono text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    minHeightClassName,
                    mode === "wrap" ? "whitespace-pre-wrap break-words" : "whitespace-pre",
                    bodyClassName,
                )}
            >
                {hasValue ? value : <span className="text-muted-foreground">{emptyText || t.common.result_placeholder}</span>}
            </pre>
        </section>
    )
}
