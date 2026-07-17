export type QueuedToastFeedback = {
    id: string | number
    type: "success" | "error"
    message: string
    description?: string
}

let liveRegionReady = false
const queuedFeedback = new Map<string | number, QueuedToastFeedback>()

export function isToastLiveRegionReady() {
    return liveRegionReady
}

export function setToastLiveRegionReady(ready: boolean) {
    if (liveRegionReady === ready) return
    liveRegionReady = ready
}

export function queueToastFeedback(feedback: QueuedToastFeedback) {
    queuedFeedback.set(feedback.id, feedback)
}

export function drainQueuedToastFeedback() {
    const feedback = [...queuedFeedback.values()]
    queuedFeedback.clear()
    return feedback
}
