import * as React from "react"

const BUTTON_BASE_CLASS =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"

const BUTTON_VARIANT_CLASS = {
    default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
    outline: "border border-border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
    ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
} as const

const BUTTON_SIZE_CLASS = {
    sm: "h-9 px-3",
    icon: "h-9 w-9",
} as const

function joinClasses(...values: Array<string | null | undefined | false>) {
    return values.filter(Boolean).join(" ")
}


type InlineButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: keyof typeof BUTTON_VARIANT_CLASS
    size?: keyof typeof BUTTON_SIZE_CLASS
}

export function InlineButton({
    className,
    size = "sm",
    type = "button",
    variant = "outline",
    ...props
}: InlineButtonProps) {
    return (
        <button
            type={type}
            className={joinClasses(BUTTON_BASE_CLASS, BUTTON_VARIANT_CLASS[variant], BUTTON_SIZE_CLASS[size], className)}
            {...props}
        />
    )
}

