import { describe, expect, it } from "vitest"
import { runYqQuery } from "../../src/lib/yq-playground-utils"

describe("yq playground utilities", () => {
    it("selects nested YAML properties", () => {
        const result = runYqQuery("service:\n  image: nginx\n  ports:\n    - 80\n", ".service.image", {
            inputFormat: "yaml",
            outputFormat: "yaml",
        })

        expect(result.error).toBeUndefined()
        expect(result.value).toBe("nginx")
        expect(result.output).toContain("nginx")
    })

    it("supports array indexes and wildcard flattening", () => {
        const result = runYqQuery("items:\n  - name: api\n  - name: worker\n", ".items[*].name | to_json", {
            inputFormat: "yaml",
            outputFormat: "yaml",
        })

        expect(result.format).toBe("json")
        expect(result.value).toEqual(["api", "worker"])
        expect(result.output).toContain("\"api\"")
    })

    it("supports keys and length helpers", () => {
        const keys = runYqQuery("a: 1\nb: 2\n", "keys", { inputFormat: "yaml", outputFormat: "json" })
        const length = runYqQuery("a: 1\nb: 2\n", "length", { inputFormat: "yaml", outputFormat: "json" })

        expect(keys.value).toEqual(["a", "b"])
        expect(length.value).toBe(2)
    })

    it("returns parse errors without throwing", () => {
        const result = runYqQuery("a: [", ".", { inputFormat: "yaml", outputFormat: "yaml" })

        expect(result.error).toBeTruthy()
        expect(result.output).toBe("")
    })
})

