#!/usr/bin/env node

import fs from "node:fs"
import { BASELINE_PATH, buildIaSnapshot } from "../lib/ia-stability-lib.js"

const snapshot = buildIaSnapshot()
const nextJson = `${JSON.stringify(snapshot, null, 2)}\n`
const previousJson = fs.existsSync(BASELINE_PATH) ? fs.readFileSync(BASELINE_PATH, "utf8") : null

if (previousJson === nextJson) {
    console.log("[ia-stability] OK: baseline already up to date.")
    process.exit(0)
}

fs.writeFileSync(BASELINE_PATH, nextJson, "utf8")
console.log(`[ia-stability] Updated baseline: ${BASELINE_PATH}`)
