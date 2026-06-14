/**
 * Tests for jq-examples
 */

import { describe, it, expect } from "vitest"
import { JQ_EXAMPLES, getExampleById, getExamplesByCategory, type JqExampleCategory } from "../../src/lib/jq-examples"

describe("JQ_EXAMPLES", () => {
    it("should have 12 examples", () => {
        expect(JQ_EXAMPLES).toHaveLength(12)
    })

    it("should have unique IDs", () => {
        const ids = JQ_EXAMPLES.map(ex => ex.id)
        const uniqueIds = new Set(ids)
        expect(uniqueIds.size).toBe(JQ_EXAMPLES.length)
    })

    it("should have all required fields", () => {
        JQ_EXAMPLES.forEach(example => {
            expect(example.id).toBeTruthy()
            expect(example.name).toBeTruthy()
            expect(example.category).toBeTruthy()
            expect(example.filter).toBeTruthy()
            expect(example.input).toBeDefined()
            expect(example.expectedOutput).toBeDefined()
            expect(example.description).toBeTruthy()
        })
    })

    it("should have valid categories", () => {
        const validCategories = ["basic", "filter", "transform", "aggregate"]

        JQ_EXAMPLES.forEach(example => {
            expect(validCategories).toContain(example.category)
        })
    })

    it("should cover all categories", () => {
        const categories = new Set(JQ_EXAMPLES.map(ex => ex.category))

        expect(categories.has("basic")).toBe(true)
        expect(categories.has("filter")).toBe(true)
        expect(categories.has("transform")).toBe(true)
        expect(categories.has("aggregate")).toBe(true)
    })
})

describe("getExampleById", () => {
    it("should return example by ID", () => {
        const example = getExampleById("identity")

        expect(example).toBeDefined()
        expect(example?.id).toBe("identity")
        expect(example?.filter).toBe(".")
    })

    it("should return undefined for non-existent ID", () => {
        const example = getExampleById("non-existent")

        expect(example).toBeUndefined()
    })

    it("should find all examples by their IDs", () => {
        const ids = ["identity", "field-access", "select-filter", "sort-by"]

        ids.forEach(id => {
            const example = getExampleById(id)
            expect(example).toBeDefined()
            expect(example?.id).toBe(id)
        })
    })
})

describe("getExamplesByCategory", () => {
    it("should return examples for basic category", () => {
        const examples = getExamplesByCategory("basic")

        expect(examples.length).toBeGreaterThan(0)
        examples.forEach(ex => {
            expect(ex.category).toBe("basic")
        })
    })

    it("should return examples for filter category", () => {
        const examples = getExamplesByCategory("filter")

        expect(examples.length).toBeGreaterThan(0)
        examples.forEach(ex => {
            expect(ex.category).toBe("filter")
        })
    })

    it("should return examples for transform category", () => {
        const examples = getExamplesByCategory("transform")

        expect(examples.length).toBeGreaterThan(0)
        examples.forEach(ex => {
            expect(ex.category).toBe("transform")
        })
    })

    it("should return examples for aggregate category", () => {
        const examples = getExamplesByCategory("aggregate")

        expect(examples.length).toBeGreaterThan(0)
        examples.forEach(ex => {
            expect(ex.category).toBe("aggregate")
        })
    })

    it("should return empty array for non-existent category", () => {
        const examples = getExamplesByCategory("non-existent" as JqExampleCategory)

        expect(examples).toEqual([])
    })

    it("should not overlap between categories", () => {
        const basicExamples = getExamplesByCategory("basic")
        const filterExamples = getExamplesByCategory("filter")

        const basicIds = new Set(basicExamples.map(ex => ex.id))
        const filterIds = new Set(filterExamples.map(ex => ex.id))

        const intersection = [...basicIds].filter(id => filterIds.has(id))
        expect(intersection).toEqual([])
    })
})

describe("Example data integrity", () => {
    it("identity example should return input unchanged", () => {
        const example = getExampleById("identity")

        expect(example?.input).toEqual(example?.expectedOutput)
    })

    it("field-access example should extract field", () => {
        const example = getExampleById("field-access")

        expect(example?.filter).toBe(".name")
        expect(example?.input).toHaveProperty("name")
    })

    it("select-filter example should filter array", () => {
        const example = getExampleById("select-filter")

        expect(Array.isArray(example?.input)).toBe(true)
        expect(Array.isArray(example?.expectedOutput)).toBe(true)
        if (Array.isArray(example?.input) && Array.isArray(example?.expectedOutput)) {
            expect(example.expectedOutput.length).toBeLessThan(example.input.length)
        }
    })

    it("sort-by example should sort array", () => {
        const example = getExampleById("sort-by")
        const output = example?.expectedOutput as Array<{ age: number }>

        expect(Array.isArray(output)).toBe(true)

        // Check if sorted by age
        for (let i = 1; i < output.length; i++) {
            expect(output[i].age).toBeGreaterThanOrEqual(output[i - 1].age)
        }
    })

    it("unique example should remove duplicates", () => {
        const example = getExampleById("unique")
        const input = example?.input as number[]
        const output = example?.expectedOutput as number[]

        expect(Array.isArray(input)).toBe(true)
        expect(Array.isArray(output)).toBe(true)

        // Check for duplicates in input
        const hasDuplicates = input.length !== new Set(input).size
        expect(hasDuplicates).toBe(true)

        // Check no duplicates in output
        const noDuplicates = output.length === new Set(output).size
        expect(noDuplicates).toBe(true)
    })
})
