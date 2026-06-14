import type { FallbackIntentFamily } from "./types"

export function resolveFallbackIntentFamily(toolKey: string, toolSlug: string, category: string): FallbackIntentFamily {
    const source = `${toolKey} ${toolSlug}`.toLowerCase()

    const converterSignal = source.includes("converter")
        || source.includes("-to-")
        || source.includes("_to_")
        || source.includes("encode_decode")
        || source.includes("encode-decode")
    if (converterSignal) return "converter"

    if (source.includes("generator")) return "generator"

    const formatterSignal = source.includes("formatter")
        || source.includes("minifier")
        || source.includes("beautifier")
    if (formatterSignal) return "formatter"

    const analyzerSignal = source.includes("analyzer")
        || source.includes("checker")
        || source.includes("validator")
        || source.includes("parser")
        || source.includes("lookup")
        || source.includes("viewer")
        || source.includes("diff")
        || source.includes("counter")
        || source.includes("inspector")
        || source.includes("tester")
        || source.includes("preview")
        || source.includes("decoder")
        || source.includes("encoder")
        || source.includes("workbench")
        || source.includes("calculator")
        || source.includes("extractor")
        || source.includes("optimizer")
        || source.includes("visualizer")
    if (analyzerSignal) return "analyzer"

    if (category === "formatters") return "formatter"
    if (category === "generators") return "generator"
    return "analyzer"
}
