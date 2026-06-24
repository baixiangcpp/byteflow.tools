export const SAMPLE_INPUT = `query GetUser($id: ID!) { user(id: $id) { id name email roles { name } } }`

export const SAMPLE_VARIABLES = JSON.stringify({ id: "user_123" }, null, 2)

export const SAMPLE_INTROSPECTION = JSON.stringify(
    {
        data: {
            __schema: {
                types: [
                    { name: "Query", kind: "OBJECT" },
                    { name: "User", kind: "OBJECT" },
                    { name: "Role", kind: "OBJECT" },
                ],
            },
        },
    },
    null,
    2,
)

