import { describe, expect, it, vi } from "vitest"
import { createPwaUpdateCoordinator } from "@/core/pwa/runtime-coordinator"

describe("PWA update coordinator", () => {
    it("ignores controller changes until this tab explicitly activates an update", () => {
        const reload = vi.fn()
        const coordinator = createPwaUpdateCoordinator(reload)

        expect(coordinator.handleControllerChange()).toBe(false)
        expect(reload).not.toHaveBeenCalled()
    })

    it("reloads exactly once after activating a waiting worker", () => {
        const reload = vi.fn()
        const postMessage = vi.fn()
        const coordinator = createPwaUpdateCoordinator(reload)

        expect(coordinator.activateWaitingWorker({ postMessage })).toBe(true)
        expect(postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" })
        expect(coordinator.handleControllerChange()).toBe(true)
        expect(coordinator.handleControllerChange()).toBe(false)
        expect(reload).toHaveBeenCalledTimes(1)
    })

    it("does not arm a reload when the waiting worker disappeared", () => {
        const reload = vi.fn()
        const coordinator = createPwaUpdateCoordinator(reload)

        expect(coordinator.activateWaitingWorker(null)).toBe(false)
        expect(coordinator.handleControllerChange()).toBe(false)
        expect(reload).not.toHaveBeenCalled()
    })

    it("does not arm a reload when worker activation fails", () => {
        const reload = vi.fn()
        const coordinator = createPwaUpdateCoordinator(reload)
        const postMessage = vi.fn(() => {
            throw new DOMException("Worker is no longer active", "InvalidStateError")
        })

        expect(coordinator.activateWaitingWorker({ postMessage })).toBe(false)
        expect(postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" })
        expect(coordinator.handleControllerChange()).toBe(false)
        expect(reload).not.toHaveBeenCalled()
    })
})
