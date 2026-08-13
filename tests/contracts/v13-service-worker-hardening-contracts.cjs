const assert = require("node:assert/strict");
const fs = require("node:fs");

const worker = fs.readFileSync("service-worker.js", "utf8");
const fetchHandler = (worker.match(/self\.addEventListener\("fetch"[\s\S]*?self\.__CMS_SERVICE_WORKER_DIAGNOSTICS__/) || [""])[0];

assert.ok(fetchHandler.includes('if(!requestedRevision){ return; }'), "Unversioned shell requests must fall through instead of matching an empty previous-revision sentinel.");
assert.ok(fetchHandler.includes('(!PREVIOUS_RUNTIME_REVISION || requestedRevision !== PREVIOUS_RUNTIME_REVISION)'), "Previous-revision matching must require a real previous revision.");

console.log("PASS  v1.3 service-worker hardening contract: unversioned shell requests fall through safely.");
