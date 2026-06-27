import { execFileSync, spawnSync } from "node:child_process"
import { describe, expect, it } from "vitest"

const CLI_PATH = "scripts/prototypes/byteflow-local-cli.mjs"

function runCli(args: string[], input: string) {
    return execFileSync(process.execPath, [CLI_PATH, ...args], {
        input,
        encoding: "utf8",
    })
}

describe("byteflow local CLI prototype", () => {
    it("formats and minifies JSON through stdin/stdout", () => {
        expect(runCli(["json-format"], "{\"b\":2,\"a\":1}")).toBe("{\n  \"b\": 2,\n  \"a\": 1\n}\n")
        expect(runCli(["json-minify"], "{\n  \"b\": 2,\n  \"a\": 1\n}")).toBe("{\"b\":2,\"a\":1}\n")
    })

    it("encodes and decodes Base64 locally", () => {
        expect(runCli(["base64-encode"], "hello")).toBe("aGVsbG8=\n")
        expect(runCli(["base64-decode"], "aGVsbG8=")).toBe("hello")
    })

    it("supports URL-safe Base64 mode", () => {
        expect(runCli(["base64-encode", "--url-safe"], "???")).toBe("Pz8_\n")
        expect(runCli(["base64-decode", "--url-safe"], "Pz8_")).toBe("???")
    })

    it("fails with a non-zero exit code for invalid input", () => {
        const result = spawnSync(process.execPath, [CLI_PATH, "json-format"], {
            input: "{bad json",
            encoding: "utf8",
        })

        expect(result.status).toBe(1)
        expect(result.stderr).toContain("JSON")
        expect(result.stdout).toBe("")
    })
})
