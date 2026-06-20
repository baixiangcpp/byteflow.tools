import { describe, expect, it } from "vitest"
import { TOOL_MANIFESTS } from "@/core/registry"
import type { ToolMeta } from "@/core/registry/types"

const SENSITIVE_TOOL_KEYS = [
    "json_formatter",
    "jwt_decoder",
    "jwt_workbench",
    "jwt_verifier",
    "saml_decoder",
    "certificate_decoder",
    "asn1_der_inspector",
    "csp_parser",
    "har_viewer_sanitizer",
    "log_scrubber",
    "password_generator",
    "security_header_analyzer",
    "totp_generator",
    "env_parser",
    "local_log_parser",
    "header_diff",
    "http_request_builder",
    "public_key_jwk_helper",
]

describe("sensitive tool persistence policy", () => {
    it("marks sensitive payload tools as non-persistent by default", () => {
        const manifests = new Map((TOOL_MANIFESTS as readonly ToolMeta[]).map((tool) => [tool.key, tool]))
        const offenders = SENSITIVE_TOOL_KEYS.flatMap((key) => {
            const tool = manifests.get(key)
            if (!tool) return [`${key}: missing manifest`]
            return tool.persistInput === false ? [] : [`${key}: persistInput must be false`]
        })

        expect(offenders).toEqual([])
    })

    it("requires every sensitive manifest to opt out of input persistence", () => {
        const offenders = (TOOL_MANIFESTS as readonly ToolMeta[])
            .filter((tool) => tool.privacy.sensitiveInput)
            .filter((tool) => tool.persistInput !== false)
            .map((tool) => tool.key)

        expect(offenders).toEqual([])
    })
})
