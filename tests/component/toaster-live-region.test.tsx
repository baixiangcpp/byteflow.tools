import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"

describe("Toaster live region", () => {
    beforeEach(() => {
        toast.dismiss()
    })

    it("announces the latest toast title and description for assistive technology", async () => {
        render(<Toaster />)

        toast.success("Copied", { description: "Output copied to clipboard." })

        await waitFor(() => {
            expect(screen.getByRole("status")).toHaveTextContent("Copied. Output copied to clipboard.")
        })

        toast.error("Copy failed")

        await waitFor(() => {
            expect(screen.getByRole("status")).toHaveTextContent("Copy failed")
        })
    })
})
