import { Input } from "@/components/ui/input"

export function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return (
        <label className="space-y-1.5 rounded-lg border bg-background/70 p-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
            <Input value={value} onChange={(event) => onChange(event.target.value)} spellCheck={false} />
        </label>
    )
}

export function RangeField({
    label,
    value,
    min,
    max,
    onChange,
    suffix,
}: {
    label: string
    value: number
    min: number
    max: number
    onChange: (value: number) => void
    suffix: string
}) {
    return (
        <div className="space-y-1.5 rounded-lg border bg-background/60 p-3">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span>{label}</span>
                <span>{value}{suffix}</span>
            </div>
            <Input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={(event) => onChange(Number(event.target.value))}
                className="cursor-pointer"
            />
        </div>
    )
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return (
        <label className="space-y-1.5 rounded-lg border bg-background/60 p-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
            <div className="flex items-center gap-2">
                <Input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-14 cursor-pointer p-1" />
                <Input value={value} onChange={(event) => onChange(event.target.value)} className="font-mono text-xs" spellCheck={false} />
            </div>
        </label>
    )
}
