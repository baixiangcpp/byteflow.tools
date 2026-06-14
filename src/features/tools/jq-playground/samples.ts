/**
 * Example jq filters with sample data
 */

export type JqExampleCategory = "basic" | "filter" | "transform" | "aggregate"

export interface JqExample {
    id: string
    name: string
    category: JqExampleCategory
    filter: string
    input: unknown
    expectedOutput: unknown
    description: string
}

export const JQ_EXAMPLES: JqExample[] = [
    {
        id: "identity",
        name: "Identity",
        category: "basic",
        filter: ".",
        input: { name: "Alice", age: 30, city: "NYC" },
        expectedOutput: { name: "Alice", age: 30, city: "NYC" },
        description: "Return the input unchanged (identity filter)",
    },
    {
        id: "field-access",
        name: "Field Access",
        category: "basic",
        filter: ".name",
        input: { name: "Alice", age: 30 },
        expectedOutput: "Alice",
        description: "Get a specific field value",
    },
    {
        id: "array-first",
        name: "Array First",
        category: "basic",
        filter: ".[0]",
        input: ["apple", "banana", "cherry"],
        expectedOutput: "apple",
        description: "Get the first element of an array",
    },
    {
        id: "iterate-all",
        name: "Iterate All",
        category: "basic",
        filter: ".[]",
        input: [1, 2, 3, 4, 5],
        expectedOutput: [1, 2, 3, 4, 5],
        description: "Iterate over all array elements (returns multiple values)",
    },
    {
        id: "select-filter",
        name: "Select Filter",
        category: "filter",
        filter: ".[] | select(.age > 25)",
        input: [
            { name: "Alice", age: 30 },
            { name: "Bob", age: 20 },
            { name: "Charlie", age: 35 },
        ],
        expectedOutput: [
            { name: "Alice", age: 30 },
            { name: "Charlie", age: 35 },
        ],
        description: "Filter items based on a condition",
    },
    {
        id: "map-extract",
        name: "Map Extract",
        category: "transform",
        filter: ".[] | .name",
        input: [
            { name: "Alice", age: 30 },
            { name: "Bob", age: 25 },
        ],
        expectedOutput: ["Alice", "Bob"],
        description: "Extract a specific field from all items",
    },
    {
        id: "map-transform",
        name: "Map Transform",
        category: "transform",
        filter: "map({name, older: (.age + 1)})",
        input: [
            { name: "Alice", age: 30 },
            { name: "Bob", age: 25 },
        ],
        expectedOutput: [
            { name: "Alice", older: 31 },
            { name: "Bob", older: 26 },
        ],
        description: "Transform each item in an array",
    },
    {
        id: "keys",
        name: "Object Keys",
        category: "basic",
        filter: "keys",
        input: { name: "Alice", age: 30, city: "NYC" },
        expectedOutput: ["age", "city", "name"],
        description: "Get all keys of an object (sorted)",
    },
    {
        id: "length",
        name: "Length",
        category: "aggregate",
        filter: "length",
        input: [1, 2, 3, 4, 5],
        expectedOutput: 5,
        description: "Get the length of an array or string",
    },
    {
        id: "sort-by",
        name: "Sort By",
        category: "aggregate",
        filter: "sort_by(.age)",
        input: [
            { name: "Charlie", age: 35 },
            { name: "Alice", age: 30 },
            { name: "Bob", age: 25 },
        ],
        expectedOutput: [
            { name: "Bob", age: 25 },
            { name: "Alice", age: 30 },
            { name: "Charlie", age: 35 },
        ],
        description: "Sort array by a specific field",
    },
    {
        id: "group-by",
        name: "Group By",
        category: "aggregate",
        filter: "group_by(.category)",
        input: [
            { name: "Apple", category: "Fruit" },
            { name: "Carrot", category: "Vegetable" },
            { name: "Banana", category: "Fruit" },
        ],
        expectedOutput: [
            [
                { name: "Banana", category: "Fruit" },
                { name: "Apple", category: "Fruit" },
            ],
            [{ name: "Carrot", category: "Vegetable" }],
        ],
        description: "Group array items by a field value",
    },
    {
        id: "unique",
        name: "Unique",
        category: "aggregate",
        filter: "unique",
        input: [1, 2, 2, 3, 3, 3, 4],
        expectedOutput: [1, 2, 3, 4],
        description: "Remove duplicate values from an array",
    },
]

/**
 * Get example by ID
 */
export function getExampleById(id: string): JqExample | undefined {
    return JQ_EXAMPLES.find((ex) => ex.id === id)
}

/**
 * Get examples by category
 */
export function getExamplesByCategory(category: JqExampleCategory): JqExample[] {
    return JQ_EXAMPLES.filter((ex) => ex.category === category)
}
