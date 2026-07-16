export async function raceWithTimeout(
    promise,
    timeoutMs,
    timeoutMessage,
    timerApi = globalThis,
) {
    let timeoutId
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = timerApi.setTimeout(() => {
            reject(new Error(timeoutMessage))
        }, timeoutMs)
    })

    try {
        return await Promise.race([promise, timeoutPromise])
    } finally {
        if (timeoutId !== undefined) timerApi.clearTimeout(timeoutId)
    }
}
