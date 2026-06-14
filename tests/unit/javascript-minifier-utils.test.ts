import { describe, expect, it } from "vitest"
import { minifyJavascript } from "@/features/tools/javascript-minifier/utils"

describe("minifyJavascript", () => {
    it("minifies javascript and reduces output size", async () => {
        const input = "function add ( a , b ) { return a + b; } console.log(add(1, 2));"
        const output = await minifyJavascript(input)

        expect(output.length).toBeLessThan(input.length)
        expect(output).toContain("console.log")
    })

    it("returns empty string for blank input", async () => {
        await expect(minifyJavascript("   \n\t")).resolves.toBe("")
    })

    it("throws for invalid javascript syntax", async () => {
        await expect(minifyJavascript("function bad( {")).rejects.toBeTruthy()
    })
})
