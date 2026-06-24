import { describe, expect, it } from "vitest"
import { formatGraphqlQuery, inspectGraphql } from "./logic"

describe("graphql-workbench logic", () => {
    it("formats compact GraphQL queries", () => {
        expect(formatGraphqlQuery("query GetUser { user { id name } }")).toContain("user {")
        expect(formatGraphqlQuery("query GetUser { user { id name } }")).toContain("  id name")
    })

    it("validates variables JSON and reports errors", () => {
        const result = inspectGraphql("query X { viewer { id } }", "[1]")
        expect(result.variablesValid).toBe(false)
        expect(result.diagnostics[0].fix).toContain("Wrap variables")
    })

    it("extracts pasted introspection types", () => {
        const result = inspectGraphql("{ viewer { id } }", "{}", '{"data":{"__schema":{"types":[{"name":"Query","kind":"OBJECT"}]}}}')
        expect(result.introspectionTypes).toEqual(["Query (OBJECT)"])
    })
})
