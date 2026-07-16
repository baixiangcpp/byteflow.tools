export const INPUT_INTENTS = [
    "scalar",
    "shortText",
    "payload",
    "workbench",
    "generatedOutput",
] as const

export type InputIntent = (typeof INPUT_INTENTS)[number]

type InputIntentControl = "input" | "textarea" | "editor" | "output"

export const INPUT_INTENT_CLASS_NAMES: Record<InputIntent, Record<InputIntentControl, string>> = {
    scalar: {
        input: "h-11 lg:h-9",
        textarea: "min-h-11 resize-y",
        editor: "min-h-44",
        output: "min-h-44",
    },
    shortText: {
        input: "min-h-11",
        textarea: "min-h-36 resize-y",
        editor: "min-h-56",
        output: "min-h-56",
    },
    payload: {
        input: "min-h-11",
        textarea: "min-h-64 resize-y",
        editor: "min-h-80",
        output: "min-h-80",
    },
    workbench: {
        input: "min-h-11",
        textarea: "min-h-[22rem] resize-y lg:resize-none",
        editor: "min-h-[22rem]",
        output: "min-h-[22rem]",
    },
    generatedOutput: {
        input: "min-h-11",
        textarea: "min-h-64 resize-y",
        editor: "min-h-80",
        output: "min-h-64",
    },
}

export function inputIntentClassName(intent: InputIntent, control: InputIntentControl) {
    return INPUT_INTENT_CLASS_NAMES[intent][control]
}
