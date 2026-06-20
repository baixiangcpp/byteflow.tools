import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ModeSelector } from "@/features/tool-shell/mode-selector"

const options = [
    { value: "encode", label: "Encode" },
    { value: "decode", label: "Decode" },
    { value: "inspect", label: "Inspect" },
] as const

describe("ModeSelector", () => {
    it("exposes mutually exclusive radio semantics", () => {
        render(<ModeSelector label="Operation" value="decode" options={options} onChange={vi.fn()} />)

        expect(screen.getByRole("radiogroup", { name: "Operation" })).toBeInTheDocument()
        expect(screen.getByRole("radio", { name: "Encode" })).toHaveAttribute("aria-checked", "false")
        expect(screen.getByRole("radio", { name: "Decode" })).toHaveAttribute("aria-checked", "true")
        expect(screen.getByRole("radio", { name: "Inspect" })).toHaveAttribute("aria-checked", "false")
    })

    it("supports arrow, Home, and End keyboard selection", () => {
        const onChange = vi.fn()
        render(<ModeSelector label="Operation" value="decode" options={options} onChange={onChange} />)

        fireEvent.keyDown(screen.getByRole("radio", { name: "Decode" }), { key: "ArrowRight" })
        expect(onChange).toHaveBeenLastCalledWith("inspect")

        fireEvent.keyDown(screen.getByRole("radio", { name: "Decode" }), { key: "ArrowLeft" })
        expect(onChange).toHaveBeenLastCalledWith("encode")

        fireEvent.keyDown(screen.getByRole("radio", { name: "Decode" }), { key: "Home" })
        expect(onChange).toHaveBeenLastCalledWith("encode")

        fireEvent.keyDown(screen.getByRole("radio", { name: "Decode" }), { key: "End" })
        expect(onChange).toHaveBeenLastCalledWith("inspect")
    })
})
