import { Switch } from "@/components/ui/switch"

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

export function OptionSwitch({
    label,
    checked,
    onCheckedChange,
}: {
    label: string
    checked: boolean
    onCheckedChange: (checked: boolean) => void
}) {
    return (
        <div className="flex items-center justify-between rounded-md border p-3">
            <label className="text-sm">{label}</label>
            <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
        </div>
    )
}
