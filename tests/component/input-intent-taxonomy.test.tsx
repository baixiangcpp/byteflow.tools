import * as React from "react"
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { Input } from "@/components/ui/input"
import { INPUT_INTENTS, INPUT_INTENT_CLASS_NAMES, type InputIntent } from "@/components/ui/input-intent"
import { Textarea } from "@/components/ui/textarea"
import { LangProvider } from "@/core/i18n/lang-provider"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { TextOutputPanel } from "@/features/tool-shell/text-output-panel"

function expectIntentClasses(element: HTMLElement, intent: InputIntent, control: "input" | "textarea" | "output") {
    expect(element).toHaveAttribute("data-input-intent", intent)
    expect(element).toHaveClass(...INPUT_INTENT_CLASS_NAMES[intent][control].split(" "))
}

describe("input intent taxonomy", () => {
    it("keeps the five documented intent names stable", () => {
        expect(INPUT_INTENTS).toEqual(["scalar", "shortText", "payload", "workbench", "generatedOutput"])
    })

    it.each(INPUT_INTENTS)("applies %s sizing and a runtime marker to shared fields", (intent) => {
        render(
            <div>
                <Input data-testid={`${intent}-input`} intent={intent} />
                <Textarea data-testid={`${intent}-textarea`} intent={intent} />
            </div>,
        )

        expectIntentClasses(screen.getByTestId(`${intent}-input`), intent, "input")
        expectIntentClasses(screen.getByTestId(`${intent}-textarea`), intent, "textarea")
    })

    it("marks backward-compatible shared defaults without changing their legacy footprint", () => {
        render(
            <div>
                <Input aria-label="default input" />
                <Textarea aria-label="default textarea" />
            </div>,
        )

        expect(screen.getByLabelText("default input")).toHaveAttribute("data-input-intent", "shortText")
        expect(screen.getByLabelText("default input")).toHaveClass("h-11", "lg:h-9")
        expect(screen.getByLabelText("default textarea")).toHaveAttribute("data-input-intent", "payload")
        expect(screen.getByLabelText("default textarea")).toHaveClass("field-sizing-content", "min-h-16")
    })

    it("marks tool-shell text output as generated output", () => {
        render(
            <LangProvider lang="en" translations={getTranslation("en")}>
                <TextOutputPanel title="Result" value="done" />
            </LangProvider>,
        )

        expectIntentClasses(screen.getByLabelText("Result"), "generatedOutput", "output")
    })
})
