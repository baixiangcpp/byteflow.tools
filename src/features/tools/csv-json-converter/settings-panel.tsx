import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Direction } from "./types"

type CsvSettingsPanelProps = {
    delimiter: string
    direction: Direction
    hasHeader: boolean
    setDelimiter: (value: string) => void
    setHasHeader: (value: boolean) => void
    setTypeInference: (value: boolean) => void
    toolT: Record<string, string>
    typeInference: boolean
}

export function CsvSettingsPanel({
    delimiter,
    direction,
    hasHeader,
    setDelimiter,
    setHasHeader,
    setTypeInference,
    toolT,
    typeInference,
}: CsvSettingsPanelProps) {
    return (
        <div className="p-4 border rounded-lg bg-card space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{toolT.settings_title}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">{toolT.delimiter_label}</label>
                    <Select value={delimiter} onValueChange={setDelimiter}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="auto">{toolT.delimiter_auto_label}</SelectItem>
                            <SelectItem value=",">{toolT.delimiter_comma_label}</SelectItem>
                            <SelectItem value=";">{toolT.delimiter_semicolon_label}</SelectItem>
                            <SelectItem value="\t">{toolT.delimiter_tab_label}</SelectItem>
                            <SelectItem value="|">{toolT.delimiter_pipe_label}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <label className="flex items-start gap-2 text-sm font-medium">
                    <input
                        type="checkbox"
                        data-input-intent="scalar"
                        checked={hasHeader}
                        onChange={(event) => setHasHeader(event.target.checked)}
                        className="rounded border-input"
                    />
                    <span>{direction === "csv-to-json" ? toolT.csv_has_header_label : toolT.json_include_header_label}</span>
                </label>
                {direction === "csv-to-json" ? (
                    <label className="flex items-start gap-2 text-sm font-medium">
                        <input
                            type="checkbox"
                            data-input-intent="scalar"
                            checked={typeInference}
                            onChange={(event) => setTypeInference(event.target.checked)}
                            className="rounded border-input"
                        />
                        <span>{toolT.type_inference_label}</span>
                    </label>
                ) : null}
            </div>
        </div>
    )
}
