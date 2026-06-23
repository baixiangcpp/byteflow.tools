"use client"

import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"

type JwtSecretFieldProps = {
    ariaLabel: string
    hideSecretLabel: string
    onChange: (value: string) => void
    onVisibilityChange: (value: boolean) => void
    placeholder: string
    revealSecretLabel: string
    secretVisible: boolean
    value: string
}

export function JwtSecretField({
    ariaLabel,
    hideSecretLabel,
    onChange,
    onVisibilityChange,
    placeholder,
    revealSecretLabel,
    secretVisible,
    value,
}: JwtSecretFieldProps) {
    return (
        <div className="flex gap-2">
            <Input
                type={secretVisible ? "text" : "password"}
                autoComplete="off"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="font-mono text-sm"
                aria-label={ariaLabel}
            />
            <button
                type="button"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border bg-background text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                onClick={() => onVisibilityChange(!secretVisible)}
                aria-pressed={secretVisible}
                aria-label={secretVisible ? hideSecretLabel : revealSecretLabel}
                title={secretVisible ? hideSecretLabel : revealSecretLabel}
            >
                {secretVisible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </button>
        </div>
    )
}
