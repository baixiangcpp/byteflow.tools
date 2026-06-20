import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

describe("csv json converter performance guard", () => {
    it("keeps page-level button and toast dependencies lazily loaded in the feature module", () => {
        const source = fs.readFileSync(
            path.join(process.cwd(), "src/features/tools/csv-json-converter/page.tsx"),
            "utf8",
        )
        const componentsSource = fs.readFileSync(
            path.join(process.cwd(), "src/features/tools/csv-json-converter/components.tsx"),
            "utf8",
        )

        expect(source).not.toContain('from "sonner"')
        expect(source).not.toContain('from "@/components/ui/button"')
        expect(componentsSource).not.toContain('from "@/components/ui/button"')
        expect(source).toContain('await import("sonner")')
        expect(componentsSource).toContain("function InlineButton(")
    })

    it("keeps conversion routed through the worker task", () => {
        const pageSource = fs.readFileSync(
            path.join(process.cwd(), "src/features/tools/csv-json-converter/page.tsx"),
            "utf8",
        )
        const taskSource = fs.readFileSync(
            path.join(process.cwd(), "src/features/tools/csv-json-converter/csv-json-task.ts"),
            "utf8",
        )
        const workerSource = fs.readFileSync(
            path.join(process.cwd(), "src/features/tools/csv-json-converter/csv-json-worker.ts"),
            "utf8",
        )

        expect(pageSource).toContain("runCsvJsonTask({")
        expect(pageSource).toContain("convertRequestIdRef")
        expect(pageSource).toContain("convertAbortControllerRef")
        expect(pageSource).toContain("convertAbortControllerRef.current?.abort()")
        expect(pageSource).not.toContain("csvToJson(")
        expect(pageSource).not.toContain("jsonToCsv(")
        expect(taskSource).toContain("new Worker(new URL(\"./csv-json-worker.ts\", import.meta.url)")
        expect(taskSource).toContain("signal: options.signal")
        expect(taskSource).toContain("runCsvJsonTaskSync(input)")
        expect(workerSource).toContain("runCsvJsonTaskSync(event.data)")
    })
})
