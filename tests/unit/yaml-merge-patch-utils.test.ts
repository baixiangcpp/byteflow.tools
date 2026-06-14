import { describe, expect, it } from "vitest"
import { applyJsonMergePatch, deepMergeYamlValues, parseYamlDocuments, runYamlExplorer } from "../../src/lib/yaml-merge-patch-utils"

describe("yaml merge and patch utilities", () => {
    it("parses multi-document YAML", () => {
        const docs = parseYamlDocuments("a: 1\n---\nb: 2\n")

        expect(docs).toHaveLength(2)
        expect(docs[0]).toEqual({ a: 1 })
    })

    it("deep merges objects and appends arrays", () => {
        const merged = deepMergeYamlValues([
            { service: { ports: [80], env: { NODE_ENV: "dev" } } },
            { service: { ports: [443], env: { DEBUG: "1" } } },
        ])

        expect(merged).toEqual({
            service: {
                ports: [80, 443],
                env: { NODE_ENV: "dev", DEBUG: "1" },
            },
        })
    })

    it("applies JSON merge patch semantics", () => {
        const patched = applyJsonMergePatch(
            { service: { image: "nginx", debug: true } },
            { service: { debug: null, replicas: 2 } },
        )

        expect(patched).toEqual({ service: { image: "nginx", replicas: 2 } })
    })

    it("runs merge-document mode with change output", () => {
        const result = runYamlExplorer("a: 1\n---\nb: 2\n", "", "merge-documents")

        expect(result.error).toBeUndefined()
        expect(result.documentCount).toBe(2)
        expect(result.output).toContain("a: 1")
        expect(result.output).toContain("b: 2")
        expect(result.changes.some((change) => change.path === "$.b")).toBe(true)
    })

    it("returns parse errors without throwing", () => {
        const result = runYamlExplorer("a: [", "", "merge-documents")

        expect(result.error).toBeTruthy()
        expect(result.output).toBe("")
    })
})
