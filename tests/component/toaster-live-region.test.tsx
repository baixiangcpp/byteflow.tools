import { StrictMode } from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { toast } from "sonner"
import { AppToaster } from "@/components/ui/app-toaster"
import { Toaster } from "@/components/ui/sonner"
import { drainQueuedToastFeedback, isToastLiveRegionReady, setToastLiveRegionReady } from "@/core/feedback/toast-live-region-state"
import { LangProvider } from "@/core/i18n/lang-provider"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { InlineToolActionFeedback, useInlineToolActionFeedback } from "@/features/tool-shell/inline-tool-action-feedback"
import { copyTextWithLazyToolFeedback } from "@/features/tool-shell/lazy-tool-action-feedback"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { notifyToolActionSuccess } from "@/features/tool-shell/tool-action-feedback"

vi.mock("next/navigation", () => ({
    usePathname: () => "/en/json-formatter",
}))

describe("Toaster live region", () => {
    beforeEach(() => {
        toast.dismiss()
        setToastLiveRegionReady(false)
        drainQueuedToastFeedback()
    })

    it("announces the latest toast title and description for assistive technology", async () => {
        render(<Toaster />)

        toast.success("Copied", { description: "Output copied to clipboard." })

        const liveRegion = await waitFor(() => {
            const region = document.querySelector<HTMLElement>('section[aria-live="polite"]')
            expect(region).toHaveTextContent(/Copied\s*Output copied to clipboard\./)
            return region!
        })
        expect(document.querySelector("[data-toast-live-region]")).not.toBeInTheDocument()

        toast.error("Copy failed")

        await waitFor(() => {
            expect(liveRegion).toHaveTextContent("Copy failed")
        })
    })

    it("replays pre-mount feedback visually without duplicating the toolbar announcement", async () => {
        const translations = getTranslation("en")
        const actions: ToolAction[] = [{
            id: "copy",
            label: "Copy",
            onClick: () => notifyToolActionSuccess(translations, {
                kind: "copy",
                label: "Output",
                description: "Output copied to clipboard.",
            }),
        }]
        const view = render(
            <StrictMode>
                <LangProvider lang="en" translations={translations}>
                    <ToolActionBar actions={actions} />
                </LangProvider>
            </StrictMode>,
        )

        fireEvent.click(screen.getByRole("button", { name: "Copy" }))
        expect(screen.getByRole("status")).toHaveTextContent("Copied to clipboard. Output copied to clipboard.")

        const replayLiveModes = new Set<string | null>()
        const observer = new MutationObserver((records) => {
            for (const record of records) {
                for (const addedNode of record.addedNodes) {
                    if (!(addedNode instanceof Element)) continue
                    const toastNode = addedNode.matches("[data-sonner-toast]")
                        ? addedNode
                        : addedNode.querySelector("[data-sonner-toast]")
                    if (toastNode) replayLiveModes.add(toastNode.closest("section")?.getAttribute("aria-live") ?? null)
                }
            }
        })
        observer.observe(document.body, { childList: true, subtree: true })

        view.rerender(
            <StrictMode>
                <LangProvider lang="en" translations={translations}>
                    <ToolActionBar actions={actions} />
                    <AppToaster />
                </LangProvider>
            </StrictMode>,
        )

        await waitFor(() => {
            expect(document.querySelector('section[aria-live="polite"]')).toHaveTextContent(/Copied to clipboard\s*Output copied to clipboard\./)
        })
        observer.disconnect()
        expect(replayLiveModes).toEqual(new Set(["off"]))
        expect(screen.getAllByRole("status")).toHaveLength(1)
    })

    it("uses inline feedback before toaster mount and toast feedback afterward", async () => {
        const translations = getTranslation("en")
        const writeText = vi.fn().mockResolvedValue(undefined)
        Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: { writeText },
        })

        function NativeCopyAction() {
            const { feedback, run } = useInlineToolActionFeedback()
            return (
                <>
                    <button
                        type="button"
                        onClick={() => void run(() => copyTextWithLazyToolFeedback(
                            translations,
                            "native output",
                            "Output",
                            "Output copied.",
                        ))}
                    >
                        Copy native output
                    </button>
                    <InlineToolActionFeedback feedback={feedback} />
                </>
            )
        }

        const view = render(<NativeCopyAction />)
        fireEvent.click(screen.getByRole("button", { name: "Copy native output" }))
        await waitFor(() => expect(writeText).toHaveBeenCalledWith("native output"))
        const immediateFeedback = await screen.findByRole("status")
        expect(immediateFeedback).toHaveAttribute("data-inline-tool-action-feedback")
        expect(immediateFeedback).toHaveTextContent("Copied to clipboard. Output copied.")

        const replayLiveModes = new Set<string | null>()
        const observer = new MutationObserver((records) => {
            for (const record of records) {
                for (const addedNode of record.addedNodes) {
                    if (!(addedNode instanceof Element)) continue
                    const toastNode = addedNode.matches("[data-sonner-toast]")
                        ? addedNode
                        : addedNode.querySelector("[data-sonner-toast]")
                    if (toastNode) replayLiveModes.add(toastNode.closest("section")?.getAttribute("aria-live") ?? null)
                }
            }
        })
        observer.observe(document.body, { childList: true, subtree: true })

        view.rerender(
            <>
                <NativeCopyAction />
                <AppToaster />
            </>,
        )

        await waitFor(() => {
            expect(isToastLiveRegionReady()).toBe(true)
        })
        expect(document.querySelector("[data-sonner-toast]")).not.toBeInTheDocument()
        expect(document.querySelector("[data-inline-tool-action-feedback]")).toBeInTheDocument()

        fireEvent.click(screen.getByRole("button", { name: "Copy native output" }))
        await waitFor(() => expect(writeText).toHaveBeenCalledTimes(2))
        await waitFor(() => {
            expect(document.querySelector('section[aria-live="polite"]')).toHaveTextContent(/Copied to clipboard\s*Output copied\./)
        })
        await waitFor(() => {
            expect(document.querySelector("[data-inline-tool-action-feedback]")).not.toBeInTheDocument()
        })
        observer.disconnect()
        expect(replayLiveModes).toEqual(new Set(["polite"]))
    })

    it("shows an accessible inline fallback when toast feedback cannot load", async () => {
        function FallbackAction() {
            const { feedback, run } = useInlineToolActionFeedback()
            return (
                <>
                    <button
                        type="button"
                        onClick={() => void run(async () => ({
                            status: "success",
                            message: "Copied to clipboard",
                            description: "Output copied.",
                            announce: true,
                        }))}
                    >
                        Copy with fallback
                    </button>
                    <InlineToolActionFeedback feedback={feedback} />
                </>
            )
        }

        render(<FallbackAction />)
        fireEvent.click(screen.getByRole("button", { name: "Copy with fallback" }))

        const status = await screen.findByRole("status")
        expect(status).toBeVisible()
        expect(status).toHaveTextContent("Copied to clipboard. Output copied.")
        expect(status).toHaveAttribute("data-inline-tool-action-feedback")
    })
})
