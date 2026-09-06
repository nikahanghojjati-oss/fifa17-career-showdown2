"use strict";

const assert=require("node:assert/strict");
const fs=require("node:fs");
const Module=require("node:module");
const path=require("node:path");

const sourcePath=path.join(__dirname,"shared-showdown-setup-provider-emulator.cjs");
const source=fs.readFileSync(sourcePath,"utf8");
const candidatePattern=/fs\.readFileSync\(["']firestore\.shared-setup-candidate\.rules["'],["']utf8["']\)/g;
const matches=source.match(candidatePattern)||[];

assert.equal(matches.length,1,"Provider emulator must expose exactly one reviewed candidate-Rules source seam.");
assert.ok(fs.existsSync("firestore.spark.generated.rules"),"Generated production Rules must exist before production provider emulator execution.");

const transformed=source.replace(candidatePattern,'fs.readFileSync("firestore.spark.generated.rules","utf8")');
const child=new Module(sourcePath,module);
child.filename=sourcePath;
child.paths=Module._nodeModulePaths(path.dirname(sourcePath));
child._compile(transformed,sourcePath);
