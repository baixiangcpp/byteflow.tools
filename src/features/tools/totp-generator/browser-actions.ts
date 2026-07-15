export function startTotpTicker(onTick: () => void): () => void {
    const intervalId = window.setInterval(onTick, 1_000)
    return () => window.clearInterval(intervalId)
}
