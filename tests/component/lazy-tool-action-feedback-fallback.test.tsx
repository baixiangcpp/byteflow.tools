import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { createRoot } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { drainQueuedToastFeedback, setToastLiveRegionReady } from "@/core/feedback/toast-live-region-state"
import { InlineToolActionFeedback, useInlineToolActionFeedback } from "@/features/tool-shell/inline-tool-action-feedback"
import { copyTextWithLazyToolFeedback } from "@/features/tool-shell/lazy-tool-action-feedback"

vi.mock("sonner", () => {
    throw new Error("simulated toast chunk load failure")
})

describe("lazy tool action feedback fallback", () => {
    afterEach(() => {
        setToastLiveRegionReady(false)
        drainQueuedToastFeedback()
    })

    it("keeps copy success visible and announced when the toast chunk cannot load", async () => {
        const writeText = vi.fn().mockResolvedValue(undefined)
        Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: { writeText },
        })
        setToastLiveRegionReady(true)
        drainQueuedToastFeedback()
        const translations = getTranslation("en")

        function CopyHarness() {
            const { feedback, run } = useInlineToolActionFeedback()
            return (
                <>
                    <button
                        type="button"
                        onClick={() => void run(() => copyTextWithLazyToolFeedback(
                            translations,
                            "offline output",
                            "Output",
                            "Output copied.",
                        ))}
                    >
                        Copy output
                    </button>
                    <InlineToolActionFeedback feedback={feedback} />
                </>
            )
        }

        render(<CopyHarness />)
        fireEvent.click(screen.getByRole("button", { name: "Copy output" }))

        await waitFor(() => expect(writeText).toHaveBeenCalledWith("offline output"))
        const status = await screen.findByRole("status")
        expect(status).toBeVisible()
        expect(status).toHaveTextContent("Copied to clipboard. Output copied.")
        expect(status).toHaveClass("max-w-full", "break-words", "[overflow-wrap:anywhere]")
        const viewport = document.querySelector("[data-inline-tool-action-feedback-viewport]")
        expect(viewport).toHaveClass("fixed", "inset-0", "z-[100]")
        expect(viewport?.parentElement).toBe(document.body)
    })

    it("dismisses successful fallback feedback and resets the timer after repeated actions", async () => {
        vi.useFakeTimers()

        try {
            function FeedbackHarness() {
                const { feedback, run } = useInlineToolActionFeedback()
                return (
                    <>
                        <button
                            type="button"
                            onClick={() => void run(async () => ({
                                status: "success",
                                message: "Copied",
                                announce: true,
                            }))}
                        >
                            Copy
                        </button>
                        <InlineToolActionFeedback feedback={feedback} />
                    </>
                )
            }

            render(<FeedbackHarness />)
            await act(async () => fireEvent.click(screen.getByRole("button", { name: "Copy" })))
            expect(screen.getByRole("status")).toBeVisible()

            act(() => vi.advanceTimersByTime(4999))
            expect(screen.getByRole("status")).toBeVisible()

            await act(async () => fireEvent.click(screen.getByRole("button", { name: "Copy" })))
            act(() => vi.advanceTimersByTime(1))
            expect(screen.getByRole("status")).toBeVisible()

            act(() => vi.advanceTimersByTime(4999))
            expect(screen.queryByRole("status")).not.toBeInTheDocument()
        } finally {
            vi.useRealTimers()
        }
    })

    it("anchors fallback feedback to the visual viewport", async () => {
        const originalVisualViewport = Object.getOwnPropertyDescriptor(window, "visualViewport")
        const viewport = {
            offsetTop: 20,
            offsetLeft: 0,
            width: 390,
            height: 844,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        }
        Object.defineProperty(window, "visualViewport", {
            configurable: true,
            value: viewport,
        })

        const view = render(
            <InlineToolActionFeedback
                feedback={{
                    id: 1,
                    result: {
                        status: "success",
                        message: "Copied",
                        announce: true,
                    },
                }}
            />,
        )

        try {
            const feedbackViewport = await waitFor(() => {
                const element = document.querySelector<HTMLElement>("[data-inline-tool-action-feedback-viewport]")
                expect(element).toHaveStyle({ top: "20px", left: "0px", width: "390px", height: "844px" })
                return element!
            })
            expect(feedbackViewport).not.toHaveClass("inset-0")
            expect(viewport.addEventListener).toHaveBeenCalledWith("resize", expect.any(Function))
            expect(viewport.addEventListener).toHaveBeenCalledWith("scroll", expect.any(Function))
        } finally {
            view.unmount()
            if (originalVisualViewport) {
                Object.defineProperty(window, "visualViewport", originalVisualViewport)
            } else {
                Reflect.deleteProperty(window, "visualViewport")
            }
        }
    })

    it("does not create a dismissal timer when an action finishes after unmount", async () => {
        vi.useFakeTimers()
        let resolveAction: ((result: {
            status: "success"
            message: string
            announce: true
        }) => void) | undefined

        try {
            function DeferredFeedbackHarness() {
                const { run } = useInlineToolActionFeedback()
                return (
                    <button
                        type="button"
                        onClick={() => void run(() => new Promise((resolve) => {
                            resolveAction = resolve
                        }))}
                    >
                        Copy later
                    </button>
                )
            }

            const view = render(<DeferredFeedbackHarness />)
            fireEvent.click(screen.getByRole("button", { name: "Copy later" }))
            expect(resolveAction).toBeTypeOf("function")
            view.unmount()

            await act(async () => resolveAction?.({
                status: "success",
                message: "Copied",
                announce: true,
            }))

            expect(vi.getTimerCount()).toBe(0)
        } finally {
            vi.useRealTimers()
        }
    })

    it("keeps feedback for a click between commit and passive effects", async () => {
        const container = document.createElement("div")
        document.body.appendChild(container)
        const root = createRoot(container)
        const reactEnvironment = globalThis as typeof globalThis & {
            IS_REACT_ACT_ENVIRONMENT?: boolean
        }
        const previousActEnvironment = reactEnvironment.IS_REACT_ACT_ENVIRONMENT
        reactEnvironment.IS_REACT_ACT_ENVIRONMENT = false
        const observerRef: { current: MutationObserver | null } = { current: null }

        function CommitWindowHarness() {
            const { feedback, run } = useInlineToolActionFeedback()
            return (
                <button
                    type="button"
                    onClick={() => void run(async () => ({
                        status: "success",
                        message: "Copied before passive effects",
                        announce: true,
                    }))}
                >
                    {feedback?.result.message || "Copy now"}
                </button>
            )
        }

        try {
            const clickedAfterCommit = new Promise<void>((resolve) => {
                observerRef.current = new MutationObserver(() => {
                    const button = container.querySelector("button")
                    if (!button) return
                    observerRef.current?.disconnect()
                    button.dispatchEvent(new window.MouseEvent("click", { bubbles: true }))
                    resolve()
                })
                observerRef.current.observe(container, { childList: true, subtree: true })
            })

            root.render(<CommitWindowHarness />)
            await clickedAfterCommit
            await waitFor(() => {
                expect(container.querySelector("button")).toHaveTextContent("Copied before passive effects")
            })
        } finally {
            observerRef.current?.disconnect()
            root.unmount()
            container.remove()
            reactEnvironment.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment
        }
    })
})
