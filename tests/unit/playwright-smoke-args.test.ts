import { spawnSync } from "node:child_process"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { parsePlaywrightSmokeArgs } from "../../scripts/e2e/playwright-smoke-args.js"

const SMOKE_SCRIPT = path.join(process.cwd(), "scripts/e2e/run-playwright-smoke.js")

describe("playwright smoke CLI arguments", () => {
    it.each([
        ["--pwa-only", "pwaOnly"],
        ["--first-load-only", "firstLoadOnly"],
        ["--input-intents-only", "inputIntentsOnly"],
    ] as const)("accepts the single exclusive mode %s", (flag, property) => {
        const args = parsePlaywrightSmokeArgs([flag])

        expect(args[property]).toBe(true)
    })

    it("preserves first-load artifact, server, port, and URL combinations", () => {
        expect(parsePlaywrightSmokeArgs([
            "--first-load-only",
            "--first-load-artifacts",
            "--skip-server",
            "--pwa",
            "--port=4300",
            "--base-url=http://localhost:4300/",
        ])).toMatchObject({
            baseUrl: "http://localhost:4300",
            firstLoadOnly: true,
            includePwa: true,
            port: 4300,
            skipServer: true,
            writeFirstLoadArtifacts: true,
        })
    })

    it("rejects and lists conflicting exclusive modes", () => {
        const parse = () => parsePlaywrightSmokeArgs(["--pwa-only", "--input-intents-only"])

        expect(parse).toThrow("Conflicting --*-only flags")
        expect(parse).toThrow("--pwa-only, --input-intents-only")
    })

    it("rejects and lists every unknown argument", () => {
        const parse = () => parsePlaywrightSmokeArgs(["--mobile-onyl", "unexpected-mode"])

        expect(parse).toThrow("Unknown argument(s)")
        expect(parse).toThrow("--mobile-onyl, unexpected-mode")
    })

    it("exits non-zero before running smoke for invalid CLI arguments", () => {
        const result = spawnSync(process.execPath, [
            SMOKE_SCRIPT,
            "--pwa-only",
            "--input-intents-only",
            "--unknown-mode",
        ], {
            cwd: process.cwd(),
            encoding: "utf8",
        })

        expect(result.status).toBe(1)
        expect(result.stderr).toContain("Unknown argument(s): --unknown-mode")
        expect(result.stderr).toContain("Conflicting --*-only flags: --pwa-only, --input-intents-only")
        expect(result.stdout).not.toContain("PASS")
    })
})
