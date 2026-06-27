import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getPipelineAdapter } from "@/features/pipeline/adapter-registry"
import type { RecipeStep } from "@/features/pipeline/recipe-types"
import { getOptionValue } from "./logic"
import type { OptionValue } from "./types"

export function StepOptions({
    step,
    updateOption,
    text,
}: {
    step: RecipeStep
    updateOption: (key: string, value: OptionValue) => void
    text: (key: string) => string
}) {
    const adapter = getPipelineAdapter(step.toolKey)
    if (!adapter || adapter.publicOptionKeys.length === 0) {
        return <p className="text-sm text-muted-foreground">{text("no_options")}</p>
    }

    return (
        <div className="space-y-3">
            {adapter.publicOptionKeys.map((key) => {
                const value = getOptionValue(step.options[key] ?? adapter.defaultOptions[key])
                if (typeof adapter.defaultOptions[key] === "boolean") {
                    return (
                        <label key={key} className="flex items-center gap-2 text-sm">
                            <Checkbox
                                checked={Boolean(value)}
                                onCheckedChange={(checked) => updateOption(key, checked === true)}
                            />
                            <span>{text(`option_${key}`)}</span>
                        </label>
                    )
                }

                if (typeof adapter.defaultOptions[key] === "number") {
                    return (
                        <div key={key}>
                            <Label htmlFor={`${step.id}-${key}`}>{text(`option_${key}`)}</Label>
                            <Input
                                id={`${step.id}-${key}`}
                                type="number"
                                value={Number(value)}
                                min={0}
                                max={8}
                                onChange={(event) => updateOption(key, Number(event.target.value))}
                            />
                        </div>
                    )
                }

                const choices = getOptionChoices(step.toolKey, key)
                if (choices.length > 0) {
                    return (
                        <div key={key}>
                            <Label htmlFor={`${step.id}-${key}`}>{text(`option_${key}`)}</Label>
                            <select
                                id={`${step.id}-${key}`}
                                className="mt-1 h-11 w-full rounded-md border bg-background px-2 text-sm lg:h-9"
                                value={String(value)}
                                onChange={(event) => updateOption(key, event.target.value)}
                            >
                                {choices.map((choice) => (
                                    <option key={choice} value={choice}>{text(`choice_${choice}`)}</option>
                                ))}
                            </select>
                        </div>
                    )
                }

                return (
                    <div key={key}>
                        <Label htmlFor={`${step.id}-${key}`}>{text(`option_${key}`)}</Label>
                        <Input
                            id={`${step.id}-${key}`}
                            value={String(value)}
                            onChange={(event) => updateOption(key, event.target.value)}
                        />
                    </div>
                )
            })}
        </div>
    )
}

function getOptionChoices(toolKey: string, key: string): string[] {
    if (key === "operation") return ["encode", "decode"]
    if (toolKey === "json_formatter" && key === "mode") return ["pretty", "minify"]
    if (toolKey === "url_encode_decode" && key === "mode") return ["component", "full", "reserved"]
    if (toolKey === "yaml_json_converter" && key === "mode") return ["yaml-to-json", "json-to-yaml"]
    if (toolKey === "csv_json_converter" && key === "direction") return ["csv-to-json", "json-to-csv"]
    if (toolKey === "csv_json_converter" && key === "delimiter") return ["auto", ",", ";", "\t", "|"]
    if (toolKey === "ndjson_formatter" && key === "mode") return ["format", "to-ndjson", "to-array"]
    if (toolKey === "slugify_case_converter" && key === "style") return ["slug", "camel", "pascal", "snake", "kebab", "constant", "dot", "title", "sentence"]
    if (toolKey === "hash_generator" && key === "algorithm") return ["md5", "sha1", "sha224", "sha256", "sha384", "sha512"]
    if (toolKey === "jwt_decoder" && key === "part") return ["payload", "header", "both"]
    if (toolKey === "unix_timestamp" && key === "output") return ["iso", "json"]
    if (toolKey === "env_parser" && key === "format") return ["json", "yaml", "docker-args"]
    return []
}
