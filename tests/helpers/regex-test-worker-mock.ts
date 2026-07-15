import { testRegexPattern } from "@/features/tools/regex-tester/utils"

type RegexWorkerInput = {
    pattern: string
    flags: string
    testString: string
    maxMatches?: number
}

export class RegexTestWorkerMock {
    onmessage: ((event: MessageEvent<unknown>) => void) | null = null
    onerror: ((event: ErrorEvent) => void) | null = null
    onmessageerror: ((event: MessageEvent<unknown>) => void) | null = null
    private terminated = false

    postMessage(input: RegexWorkerInput) {
        queueMicrotask(() => {
            if (this.terminated) return
            this.onmessage?.({
                data: {
                    ok: true,
                    value: testRegexPattern(input.pattern, input.flags, input.testString, input.maxMatches),
                },
            } as MessageEvent)
        })
    }

    terminate() {
        this.terminated = true
    }
}
