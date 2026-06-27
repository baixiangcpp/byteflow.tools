import * as React from "react"
import { cn } from "@/core/utils/utils"

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
    onCheckedChange?: (checked: boolean) => void
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, onCheckedChange, ...props }, ref) => {
        return (
            <input
                type="checkbox"
                ref={ref}
                className={cn(
                    "h-11 w-11 rounded border border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 lg:h-4 lg:w-4",
                    className,
                )}
                onChange={(e) => {
                    if (onCheckedChange) {
                        onCheckedChange(e.target.checked)
                    }
                    props.onChange?.(e)
                }}
                {...props}
            />
        )
    }
)
Checkbox.displayName = "Checkbox"
