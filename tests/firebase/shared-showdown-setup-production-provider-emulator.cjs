"use strict";

const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

// The two-manager provider harness reads the generated production Rules directly (r91 cut step 4 removed the
// unpublished candidate Rules file it used to read). This entry point stays as the production proof's name.
assert.ok(fs.existsSync("firestore.spark.generated.rules"),"Generated production Rules must exist before production provider emulator execution.");
require(path.join(__dirname,"shared-showdown-setup-provider-emulator.cjs"));
