import { describe, expect, it } from "vitest"
import { formatJavascript } from "@/features/tools/javascript-formatter/utils"

describe("formatJavascript", () => {
  it("formats compact javascript into readable output", () => {
    const input = "const a={x:1,y:[2,3]};console.log(a)"
    const output = formatJavascript(input)

    expect(output).toContain("const a = {")
    expect(output).toContain("x: 1")
    expect(output.endsWith("\n")).toBe(true)
  })

  it("returns empty string for blank input", () => {
    expect(formatJavascript("   \n\t")).toBe("")
  })

  it("keeps existing line breaks readable", () => {
    const input = "function test(){\nreturn 1\n}"
    const output = formatJavascript(input)

    expect(output).toContain("function test()")
    expect(output).toContain("return 1")
  })

  it("breaks compact long statements into multiline output", () => {
    const input = "const rows=[{id:1,code:'u_001',enabled:true},{id:2,code:'u_002',enabled:false}];console.log(rows.filter((row)=>row.enabled).map((row)=>row.code).join(','))"
    const output = formatJavascript(input)

    expect(output.split("\n").length).toBeGreaterThan(2)
    expect(output).toContain("const rows = [")
    expect(output).toContain("console.log(")
  })
})
