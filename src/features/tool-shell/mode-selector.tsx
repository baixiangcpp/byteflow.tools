"use client"

import { cn } from "@/core/utils/utils"

export type ModeSelectorOption<TValue extends string> = {
    value: TValue
    label: string
}

type ModeSelectorProps<TValue extends string> = {
    label: string
    value: TValue
    options: readonly ModeSelectorOption<TValue>[]
    onChange: (value: TValue) => void
    className?: string
    size?: "sm" | "md"
}

export function ModeSelector<TValue extends string>({
    label,
    value,
    options,
    onChange,
    className,
    size = "md",
}: ModeSelectorProps<TValue>) {
    const buttonClassName = size === "sm"
        ? "min-h-8 px-3 py-1.5 text-xs"
        : "min-h-10 px-4 py-2 text-sm"

    return (
        <div className={cn("space-y-2", className)}>
            <div className="text-xs font-semibold uppercase text-muted-foreground">{label}</div>
            <div role="tablist" aria-label={label} className="inline-flex w-full rounded-lg border bg-background/60 p-1 sm:w-auto">
                {options.map((option) => {
                    const active = option.value === value
                    return (
                        <button
                            key={option.value}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => onChange(option.value)}
                            className={cn(
                                "flex-1 rounded-md font-medium transition-colors sm:flex-none",
                                buttonClassName,
                                active
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            {option.label}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
