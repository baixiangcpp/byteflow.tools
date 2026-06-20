"use client"

import type { KeyboardEvent } from "react"

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

    function selectOptionAt(index: number, event: KeyboardEvent<HTMLButtonElement>) {
        const option = options[index]
        if (!option) return

        event.preventDefault()
        onChange(option.value)
        event.currentTarget.parentElement
            ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
            .item(index)
            ?.focus()
    }

    function handleKeyDown(index: number, event: KeyboardEvent<HTMLButtonElement>) {
        switch (event.key) {
            case "ArrowRight":
            case "ArrowDown":
                selectOptionAt((index + 1) % options.length, event)
                break
            case "ArrowLeft":
            case "ArrowUp":
                selectOptionAt((index - 1 + options.length) % options.length, event)
                break
            case "Home":
                selectOptionAt(0, event)
                break
            case "End":
                selectOptionAt(options.length - 1, event)
                break
            default:
                break
        }
    }

    return (
        <div className={cn("space-y-2", className)}>
            <div className="text-xs font-semibold uppercase text-muted-foreground">{label}</div>
            <div role="radiogroup" aria-label={label} className="inline-flex w-full rounded-lg border bg-background/60 p-1 sm:w-auto">
                {options.map((option, index) => {
                    const active = option.value === value
                    return (
                        <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            tabIndex={active ? 0 : -1}
                            onClick={() => onChange(option.value)}
                            onKeyDown={(event) => handleKeyDown(index, event)}
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
