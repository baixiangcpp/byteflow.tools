import { jwtDecode } from "jwt-decode"

export type JwtDecodeResult = {
    header: unknown
    payload: unknown
}

export function decodeJwtParts(token: string): JwtDecodeResult {
    return {
        header: jwtDecode(token, { header: true }),
        payload: jwtDecode(token),
    }
}
