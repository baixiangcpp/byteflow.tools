export const SAMPLE_INPUT = JSON.stringify(
    {
        user: {
            id: 1001,
            email: "alice@example.com",
            roles: ["admin", "billing"],
            active: true,
        },
        issuedAt: "2026-06-24T12:00:00Z",
    },
    null,
    2,
)

export const SAMPLE_SCHEMA = JSON.stringify(
    {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        required: ["user", "issuedAt"],
        properties: {
            user: {
                type: "object",
                required: ["id", "email", "roles", "active"],
                properties: {
                    id: { type: "integer" },
                    email: { type: "string" },
                    roles: { type: "array", items: { type: "string" } },
                    active: { type: "boolean" },
                },
            },
            issuedAt: { type: "string" },
        },
    },
    null,
    2,
)

