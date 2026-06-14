import { Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ChannelField({
    label,
    value,
    onChange,
}: {
    label: string
    value: number
    onChange: (value: string) => void
}) {
    return (
        <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
            <Input
                type="number"
                min={0}
                max={255}
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        </div>
    )
}

export function ModeButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded px-3 py-1.5 text-sm transition-colors ${
                active ? "bg-primary text-primary-foreground" : "border bg-background text-muted-foreground hover:text-foreground"
            }`}
        >
            {label}
        </button>
    )
}

export function FormatBox({
    label,
    value,
    onCopy,
    disabled,
    waiting,
    copyLabel,
}: {
    label: string
    value: string
    onCopy: () => void
    disabled: boolean
    waiting: string
    copyLabel: string
}) {
    return (
        <div className={`flex flex-col space-y-1.5 rounded-md border bg-muted/20 p-3 transition-opacity ${disabled ? "opacity-50" : "opacity-100"}`}>
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-muted-foreground">{label}</span>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-[22px] w-[22px]"
                    onClick={onCopy}
                    disabled={disabled}
                    aria-label={copyLabel}
                    title={copyLabel}
                >
                    <Copy className="h-3 w-3" />
                    <span className="sr-only">{copyLabel}</span>
                </Button>
            </div>
            <div className="flex h-6 items-center break-all font-mono text-base text-foreground">
                {disabled ? <span className="text-sm text-muted-foreground/30">{waiting}</span> : value}
            </div>
        </div>
    )
}
