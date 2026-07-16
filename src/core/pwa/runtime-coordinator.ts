type WaitingServiceWorker = Pick<ServiceWorker, "postMessage">

export type PwaUpdateCoordinator = {
    activateWaitingWorker: (worker: WaitingServiceWorker | null) => boolean
    handleControllerChange: () => boolean
}

export function createPwaUpdateCoordinator(reload: () => void): PwaUpdateCoordinator {
    let activationRequested = false
    let reloadStarted = false

    return {
        activateWaitingWorker(worker) {
            if (!worker) return false
            try {
                worker.postMessage({ type: "SKIP_WAITING" })
            } catch {
                return false
            }
            activationRequested = true
            return true
        },
        handleControllerChange() {
            if (!activationRequested || reloadStarted) return false
            reloadStarted = true
            reload()
            return true
        },
    }
}
