export const SAMPLE_INPUT = JSON.stringify(
    {
        before: {
            openapi: "3.0.3",
            info: { title: "Orders API", version: "1.0.0" },
            paths: {
                "/orders": {
                    get: {
                        operationId: "listOrders",
                        parameters: [{ name: "limit", in: "query", required: false }],
                        responses: { "200": { description: "Orders" } },
                    },
                },
                "/orders/{id}": {
                    get: {
                        operationId: "getOrder",
                        parameters: [{ name: "id", in: "path", required: true }],
                        responses: { "200": { description: "Order" }, "404": { description: "Missing" } },
                    },
                },
            },
        },
        after: {
            openapi: "3.0.3",
            info: { title: "Orders API", version: "1.1.0" },
            paths: {
                "/orders": {
                    get: {
                        operationId: "listOrders",
                        parameters: [{ name: "cursor", in: "query", required: false }],
                        responses: { "200": { description: "Orders" } },
                    },
                    post: {
                        operationId: "createOrder",
                        responses: { "201": { description: "Created" } },
                    },
                },
            },
        },
    },
    null,
    2,
)

export const SAMPLE_BEFORE = JSON.stringify(JSON.parse(SAMPLE_INPUT).before, null, 2)
export const SAMPLE_AFTER = JSON.stringify(JSON.parse(SAMPLE_INPUT).after, null, 2)

