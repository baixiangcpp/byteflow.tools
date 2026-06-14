import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

describe("openapi mock source guard", () => {
    it("derives parsed endpoints without suppressing hook dependency checks", () => {
        const source = fs.readFileSync(path.join(process.cwd(), "src/features/tools/openapi-mock/page.tsx"), "utf8")

        expect(source).toContain("const { endpoints, error } = React.useMemo(() => {")
        expect(source).toContain("if (selected === null || selected >= endpoints.length) {")
        expect(source).not.toContain("eslint-disable-next-line react-hooks/exhaustive-deps")
    })
})
