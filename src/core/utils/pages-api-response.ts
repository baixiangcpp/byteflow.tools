const DEFAULT_API_HEADERS = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
}

export function pagesJsonResponse(data: unknown, init?: ResponseInit): Response {
    return new Response(JSON.stringify(data), {
        ...init,
        headers: {
            ...DEFAULT_API_HEADERS,
            ...(init?.headers || {}),
        },
    })
}

export function pagesMethodNotAllowedResponse(): Response {
    return pagesJsonResponse(
        { ok: false, code: "METHOD_NOT_ALLOWED", message: "Method not allowed." },
        { status: 405, headers: { allow: "POST" } },
    )
}
