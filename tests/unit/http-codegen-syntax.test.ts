import { spawnSync } from "node:child_process"
import { describe, expect, it } from "vitest"
import { generateFetch, generatePythonRequests } from "@/features/tools/http-request-builder/logic"
import { parseCurl, toGo, toJavaScript, toPhp, toPython, toRust } from "@/features/tools/curl-to-code/logic"

function commandAvailable(command: string, args: string[] = ["--version"]): boolean {
    const result = spawnSync(command, args, { encoding: "utf8" })
    return !result.error && result.status === 0
}

function parsedFixture() {
    const result = parseCurl(`curl -X POST https://api.example.com/items -H 'Content-Type: application/json' -d '{"name":"Ada"}'`)
    if (!result.ok) throw new Error(JSON.stringify(result.diagnostics))
    return result.request
}

const HAS_PYTHON = commandAvailable("python", ["--version"])
const HAS_GOFMT = commandAvailable("gofmt", [])
const HAS_PHP = commandAvailable("php", ["--version"])
const HAS_RUSTFMT = commandAvailable("rustfmt", ["--version"])

describe("generated HTTP code syntax", () => {
    it("parses JavaScript snippets from both request tools", () => {
        const builderCode = generateFetch("POST", "https://api.example.com/items", [], "json", '{"name":"Ada"}')
        const curlCode = toJavaScript(parsedFixture())

        expect(() => new Function(`return async function generated() {\n${builderCode}\n}`)).not.toThrow()
        expect(() => new Function(`return async function generated() {\n${curlCode}\n}`)).not.toThrow()
    })

    it.runIf(HAS_PYTHON)("compiles Python snippets from both request tools", () => {
        for (const code of [
            generatePythonRequests("POST", "https://api.example.com/items", [], "json", '{"name":"Ada"}'),
            toPython(parsedFixture()),
        ]) {
            const result = spawnSync("python", ["-c", "import sys; compile(sys.stdin.read(), '<generated>', 'exec')"], {
                input: code,
                encoding: "utf8",
            })
            expect(result.stderr).toBe("")
            expect(result.status).toBe(0)
        }
    })

    it.runIf(HAS_GOFMT)("parses generated Go with gofmt", () => {
        const result = spawnSync("gofmt", [], { input: toGo(parsedFixture()), encoding: "utf8" })
        expect(result.stderr).toBe("")
        expect(result.status).toBe(0)
    })

    it.runIf(HAS_PHP)("parses generated PHP with the PHP linter", () => {
        const result = spawnSync("php", ["-l"], { input: toPhp(parsedFixture()), encoding: "utf8" })
        expect(result.stderr).toBe("")
        expect(result.status).toBe(0)
    })

    it.runIf(HAS_RUSTFMT)("parses generated Rust with rustfmt", () => {
        const result = spawnSync("rustfmt", ["--edition", "2021", "--emit", "stdout"], {
            input: toRust(parsedFixture()),
            encoding: "utf8",
        })
        expect(result.stderr).toBe("")
        expect(result.status).toBe(0)
    })
})
