export type DevopsYamlIssue = {
    path: string
    severity: "error" | "warning"
    message: string
    fix: string
}

export type DevopsYamlReport = {
    documentCount: number
    dockerComposeServices: number
    kubernetesResources: number
    issues: DevopsYamlIssue[]
}

