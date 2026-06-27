#!/usr/bin/env node

const COMMANDS = new Set([
    "json-format",
    "json-minify",
    "base64-encode",
    "base64-decode",
])

function printUsage() {
    process.stderr.write([
        "Usage: node scripts/prototypes/byteflow-local-cli.mjs <command> [--url-safe]",
        "",
        "Commands:",
        "  json-format      Pretty-print JSON from stdin",
        "  json-minify      Minify JSON from stdin",
        "  base64-encode    Encode UTF-8 stdin as Base64",
        "  base64-decode    Decode Base64 stdin as UTF-8",
        "",
        "Options:",
        "  --url-safe       Use Base64URL alphabet for base64 commands",
        "",
    ].join("\n"))
}

function readStdin() {
    return new Promise((resolve, reject) => {
        let input = ""
        process.stdin.setEncoding("utf8")
        process.stdin.on("data", (chunk) => {
            input += chunk
        })
        process.stdin.on("end", () => resolve(input))
        process.stdin.on("error", reject)
    })
}

function toUrlSafeBase64(value) {
    return value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function fromUrlSafeBase64(value) {
    if (/\s/.test(value)) {
        throw new Error("Base64URL input must not contain whitespace.")
    }
    if (/[+/]/.test(value)) {
        throw new Error("Base64URL input must not use the standard Base64 alphabet.")
    }
    if (!/^[A-Za-z0-9\-_]*={0,2}$/.test(value) || /=.*[^=]/.test(value)) {
        throw new Error("Invalid Base64URL input.")
    }
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
    const unpaddedLength = normalized.replace(/=+$/g, "").length
    if (unpaddedLength % 4 === 1) {
        throw new Error("Invalid Base64URL length.")
    }
    const padding = normalized.length % 4
    return padding === 0 ? normalized : `${normalized}${"=".repeat(4 - padding)}`
}

function normalizeBase64Input(value, urlSafe) {
    const trimmed = value.trim()
    return urlSafe ? fromUrlSafeBase64(trimmed) : trimmed
}

function assertValidBase64(value) {
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(value) || /=.*[^=]/.test(value) || value.length % 4 === 1) {
        throw new Error("Invalid Base64 input.")
    }
}

async function main() {
    const args = process.argv.slice(2)
    const command = args.find((arg) => !arg.startsWith("--"))
    const urlSafe = args.includes("--url-safe")

    if (!command || !COMMANDS.has(command) || args.includes("--help") || args.includes("-h")) {
        printUsage()
        process.exitCode = command ? 1 : 0
        return
    }

    const input = await readStdin()

    try {
        if (command === "json-format") {
            process.stdout.write(`${JSON.stringify(JSON.parse(input), null, 2)}\n`)
            return
        }
        if (command === "json-minify") {
            process.stdout.write(`${JSON.stringify(JSON.parse(input))}\n`)
            return
        }
        if (command === "base64-encode") {
            const encoded = Buffer.from(input, "utf8").toString("base64")
            process.stdout.write(`${urlSafe ? toUrlSafeBase64(encoded) : encoded}\n`)
            return
        }
        if (command === "base64-decode") {
            const normalized = normalizeBase64Input(input, urlSafe)
            assertValidBase64(normalized)
            process.stdout.write(Buffer.from(normalized, "base64").toString("utf8"))
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Transformation failed."
        process.stderr.write(`${message}\n`)
        process.exitCode = 1
    }
}

await main()
