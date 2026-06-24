import { testRegexPattern } from "./utils"

type RegexTestWorkerInput = {
    pattern: string
    flags: string
    testString: string
    maxMatches?: number
}

self.onmessage = (event: MessageEvent<RegexTestWorkerInput>) => {
    const { pattern, flags, testString, maxMatches } = event.data

    try {
        self.postMessage({
            ok: true,
            value: testRegexPattern(pattern, flags, testString, maxMatches),
        })
    } catch (error) {
        self.postMessage({
            ok: false,
            error: {
                code: "REGEX_EVALUATION_FAILED",
                message: error instanceof Error ? error.message : "Regex evaluation failed.",
            },
        })
    }
}

export {}
