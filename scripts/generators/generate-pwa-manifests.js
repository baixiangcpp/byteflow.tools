#!/usr/bin/env node

import { writeAllPwaManifests } from "../lib/pwa-manifest-lib.js";

writeAllPwaManifests();
console.log("[generate:pwa-manifests] OK: localized manifest files refreshed in public/.");
