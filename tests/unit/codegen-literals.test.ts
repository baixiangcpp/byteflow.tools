import { describe, expect, it } from "vitest"
import {
    goStringLiteral,
    jsStringLiteral,
    phpStringLiteral,
    pythonStringLiteral,
    rustStringLiteral,
    shellSingleQuote,
} from "@/core/codegen/literals"

describe("codegen literals", () => {
    it("escapes POSIX shell single-quoted arguments", () => {
        expect(shellSingleQuote("x' ; echo INJECTED ; #")).toBe("'x'\\'' ; echo INJECTED ; #'")
    })

    it("uses structured language string literals", () => {
        const value = "line1\n'\"\\${x}`\0"

        expect(JSON.parse(jsStringLiteral(value))).toBe(value)
        expect(JSON.parse(pythonStringLiteral(value))).toBe(value)
        expect(JSON.parse(goStringLiteral(value))).toBe(value)
        expect(phpStringLiteral("x'\\y")).toBe("'x\\'\\\\y'")
    })

    it("chooses a Rust raw string delimiter that cannot be closed by the input", () => {
        const literal = rustStringLiteral("body\"#; injected(); //")

        expect(literal).toBe('r##"body"#; injected(); //"##')
    })
})
