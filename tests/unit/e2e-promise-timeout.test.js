import { describe, expect, it, vi } from "vitest"
import { raceWithTimeout } from "../../scripts/e2e/promise-timeout.js"

function createTimerApi() {
    let timeoutCallback = () => undefined
    const timerApi = {
        setTimeout: vi.fn((callback) => {
            timeoutCallback = callback
            return 42
        }),
        clearTimeout: vi.fn(),
    }

    return {
        fireTimeout: () => timeoutCallback(),
        timerApi,
    }
}

describe("Playwright promise timeout", () => {
    it("clears the timer when the guarded promise resolves", async () => {
        const { timerApi } = createTimerApi()

        await expect(raceWithTimeout(Promise.resolve("ready"), 20_000, "timed out", timerApi))
            .resolves.toBe("ready")
        expect(timerApi.clearTimeout).toHaveBeenCalledWith(42)
    })

    it("rejects with a diagnostic error and clears the timer on timeout", async () => {
        const { fireTimeout, timerApi } = createTimerApi()
        const pending = new Promise(() => undefined)
        const guarded = raceWithTimeout(pending, 20_000, "service worker ready timed out", timerApi)
        const assertion = expect(guarded).rejects.toThrow("service worker ready timed out")

        fireTimeout()

        await assertion
        expect(timerApi.clearTimeout).toHaveBeenCalledWith(42)
    })
})
