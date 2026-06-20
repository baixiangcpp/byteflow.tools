import type { ToolExternalDataSent, ToolMeta, ToolNetworkAccess, ToolPrivacyManifest } from "./types"

export type ToolPrivacyNetworkMetadata = Pick<
    ToolMeta,
    "networkAccess" | "networkHosts" | "networkPurposeKey" | "allowUserProvidedUrl" | "requiresExplicitUserAction" | "externalDataSent"
>

export function getToolPrivacyNetworkMetadata(privacy: ToolPrivacyManifest): ToolPrivacyNetworkMetadata {
    if (!privacy.externalRequest.required) {
        return {
            networkAccess: "none",
            networkHosts: [],
            networkPurposeKey: undefined,
            allowUserProvidedUrl: undefined,
            requiresExplicitUserAction: undefined,
            externalDataSent: undefined,
        }
    }

    const networkAccess: ToolNetworkAccess = privacy.externalRequest.endpointType === "third_party_api"
        ? "third_party_api"
        : "user_requested"

    return {
        networkAccess,
        networkHosts: privacy.externalRequest.domains ?? [],
        networkPurposeKey: privacy.externalRequest.purposeKey,
        allowUserProvidedUrl: privacy.externalRequest.endpointType === "user_provided_url",
        requiresExplicitUserAction: privacy.externalRequest.consentRequired,
        externalDataSent: privacy.externalRequest.userDataSent as ToolExternalDataSent | undefined,
    }
}
