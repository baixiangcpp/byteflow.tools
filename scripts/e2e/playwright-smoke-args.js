const EXCLUSIVE_MODE_FLAGS = new Map([
    ["--pwa-only", "pwaOnly"],
    ["--first-load-only", "firstLoadOnly"],
    ["--input-intents-only", "inputIntentsOnly"],
    ["--mobile-only", "mobileOnly"],
]);

export function parsePlaywrightSmokeArgs(argv, { defaultPort = 4173 } = {}) {
    const args = {
        port: defaultPort,
        baseUrl: "",
        skipServer: false,
        includePwa: false,
        pwaOnly: false,
        firstLoadOnly: false,
        writeFirstLoadArtifacts: false,
        inputIntentsOnly: false,
        mobileOnly: false,
    };
    const activeExclusiveFlags = new Set();
    const unknownArgs = new Set();

    for (const arg of argv) {
        const exclusiveMode = EXCLUSIVE_MODE_FLAGS.get(arg);
        if (exclusiveMode) {
            args[exclusiveMode] = true;
            activeExclusiveFlags.add(arg);
            continue;
        }

        if (arg === "--skip-server") {
            args.skipServer = true;
            continue;
        }

        if (arg === "--pwa") {
            args.includePwa = true;
            continue;
        }

        if (arg === "--first-load-artifacts") {
            args.writeFirstLoadArtifacts = true;
            continue;
        }

        if (arg.startsWith("--port=")) {
            const parsed = Number(arg.slice("--port=".length));
            if (Number.isFinite(parsed) && parsed > 0) {
                args.port = parsed;
            }
            continue;
        }

        if (arg.startsWith("--base-url=")) {
            args.baseUrl = arg.slice("--base-url=".length).trim();
            continue;
        }

        unknownArgs.add(arg);
    }

    const validationErrors = [];
    if (unknownArgs.size > 0) {
        validationErrors.push(`Unknown argument(s): ${[...unknownArgs].join(", ")}`);
    }
    if (activeExclusiveFlags.size > 1) {
        validationErrors.push(`Conflicting --*-only flags: ${[...activeExclusiveFlags].join(", ")}`);
    }
    if (validationErrors.length > 0) {
        throw new Error(`[playwright-smoke] Invalid arguments:\n- ${validationErrors.join("\n- ")}`);
    }

    if (!args.baseUrl) {
        args.baseUrl = `http://127.0.0.1:${args.port}`;
    }

    args.baseUrl = args.baseUrl.replace(/\/+$/, "");
    return args;
}
