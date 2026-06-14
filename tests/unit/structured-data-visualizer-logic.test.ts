import { describe, expect, it } from "vitest"
import { visualizeStructuredData } from "../../src/lib/structured-data-visualizer-utils"

describe("structured data visualizer utilities", () => {
    it("builds a tree and graph edges for JSON", () => {
        const result = visualizeStructuredData('{"service":{"ports":[80,443],"enabled":true}}', "json")

        expect(result.error).toBeUndefined()
        expect(result.truncated).toBe(false)
        expect(result.root?.children[0].key).toBe("service")
        expect(result.stats.nodes).toBeGreaterThan(4)
        expect(result.stats.arrays).toBe(1)
        expect(result.edges.some((edge) => edge.label === "service")).toBe(true)
    })

    it("builds a tree for YAML", () => {
        const result = visualizeStructuredData("service:\n  image: nginx\n", "yaml")

        expect(result.error).toBeUndefined()
        expect(result.root?.children[0].path).toBe("$.service")
    })

    it("builds a tree for XML", () => {
        const result = visualizeStructuredData("<service><image>nginx</image><port value=\"80\" /></service>", "xml")

        expect(result.error).toBeUndefined()
        expect(result.root?.children[0].key).toBe("service")
        expect(result.stats.objects).toBeGreaterThan(0)
        expect(result.truncated).toBe(false)
    })

    it("returns parser errors without throwing", () => {
        const result = visualizeStructuredData("{", "json")

        expect(result.error).toBeTruthy()
        expect(result.root).toBeNull()
    })

    it("stops building deeply nested objects beyond maxDepth", () => {
        const result = visualizeStructuredData('{"a":{"b":{"c":{"d":true}}}}', "json", { maxDepth: 2, maxNodes: 100 })

        expect(result.error).toBeUndefined()
        expect(result.truncated).toBe(true)
        expect(result.maxDepthReached).toBe(true)
        expect(result.stats.maxDepth).toBeLessThanOrEqual(2)
        expect(result.root?.children[0].children[0].valuePreview).toContain("max depth")
    })

    it("stops building huge arrays beyond maxNodes", () => {
        const result = visualizeStructuredData(JSON.stringify([0, 1, 2, 3, 4, 5, 6]), "json", { maxDepth: 10, maxNodes: 4 })

        expect(result.error).toBeUndefined()
        expect(result.truncated).toBe(true)
        expect(result.maxNodesReached).toBe(true)
        expect(result.stats.nodes).toBeLessThanOrEqual(4)
        expect(result.root?.children).toHaveLength(3)
        expect(result.root?.valuePreview).toContain("max nodes")
    })

    it("keeps normal small objects untruncated with explicit limits", () => {
        const result = visualizeStructuredData('{"a":1,"b":[true]}', "json", { maxDepth: 5, maxNodes: 20 })

        expect(result.error).toBeUndefined()
        expect(result.truncated).toBe(false)
        expect(result.maxNodesReached).toBe(false)
        expect(result.maxDepthReached).toBe(false)
        expect(result.stats.nodes).toBe(4)
    })

    it("stops building deeply nested XML beyond maxDepth", () => {
        const result = visualizeStructuredData("<a><b><c><d>value</d></c></b></a>", "xml", { maxDepth: 2, maxNodes: 100 })

        expect(result.error).toBeUndefined()
        expect(result.truncated).toBe(true)
        expect(result.maxDepthReached).toBe(true)
        expect(result.stats.maxDepth).toBeLessThanOrEqual(2)
        expect(result.root?.children[0].children[0].valuePreview).toContain("max depth")
    })

    it("stops building wide XML beyond maxNodes", () => {
        const result = visualizeStructuredData("<root><item/><item/><item/><item/></root>", "xml", { maxDepth: 10, maxNodes: 4 })

        expect(result.error).toBeUndefined()
        expect(result.truncated).toBe(true)
        expect(result.maxNodesReached).toBe(true)
        expect(result.stats.nodes).toBeLessThanOrEqual(4)
        expect(result.root?.children[0].children).toHaveLength(2)
        expect(result.root?.children[0].valuePreview).toContain("max nodes")
    })

    it("keeps normal small XML untruncated with explicit limits", () => {
        const result = visualizeStructuredData("<service><image>nginx</image><port value=\"80\" /></service>", "xml", { maxDepth: 8, maxNodes: 20 })

        expect(result.error).toBeUndefined()
        expect(result.truncated).toBe(false)
        expect(result.maxNodesReached).toBe(false)
        expect(result.maxDepthReached).toBe(false)
        expect(result.root?.children[0].key).toBe("service")
    })
})
