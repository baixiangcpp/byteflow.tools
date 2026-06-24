#!/usr/bin/env node

import { spawnSync } from "node:child_process"

const result = spawnSync(process.execPath, ["scripts/generators/generate-llms-txt.js", "--check"], {
    stdio: "inherit",
})

process.exit(result.status ?? 1)
