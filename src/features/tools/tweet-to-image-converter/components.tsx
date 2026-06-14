import { Input } from "@/components/ui/input"

export function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return (
        <label className="space-y-1.5 rounded-lg border bg-background/70 p-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
            <Input value={value} onChange={(event) => onChange(event.target.value)} spellCheck={false} />
        </label>
    )
}
