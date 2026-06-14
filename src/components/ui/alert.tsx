import * as React from "react"

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "destructive"
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
    ({ className, variant = "default", ...props }, ref) => {
        const variantClasses = variant === "destructive"
            ? "border-destructive/50 text-destructive dark:border-destructive"
            : "border-border"

        return (
            <div
                ref={ref}
                role="alert"
                className={`relative w-full rounded-lg border p-4 ${variantClasses} ${className || ""}`}
                {...props}
            />
        )
    }
)
Alert.displayName = "Alert"

export const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => {
        return (
            <h5
                ref={ref}
                className={`mb-1 font-medium leading-none tracking-tight ${className || ""}`}
                {...props}
            />
        )
    }
)
AlertTitle.displayName = "AlertTitle"

export const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={`text-sm [&_p]:leading-relaxed ${className || ""}`}
                {...props}
            />
        )
    }
)
AlertDescription.displayName = "AlertDescription"
