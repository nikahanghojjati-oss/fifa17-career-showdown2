"use strict";
// The published site, built the way the Pages workflow builds it: runs the "Stage static runtime surface" step's own
// mkdir and cp lines from .github/workflows/deploy-github-pages.yml against a folder of our choosing. A file the step
// forgets is missing here exactly as it is missing online (2.3.0: device-check.html was a 404).
//   stage(outDir, {root})  -> the list of staged top-level names
//   stagedNames({root})    -> the same list, without copying (for contracts)
// CLI: node tests/support/stage-pages-artifact.cjs <outDir>
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "../..");
const WORKFLOW = ".github/workflows/deploy-github-pages.yml";

function stageLines(root){
  const text = fs.readFileSync(path.join(root || ROOT, WORKFLOW), "utf8");
  const step = /- name: Stage static runtime surface\n([\s\S]*?)\n\s*- name: /.exec(text);
  if(!step) throw new Error("The Pages workflow has no 'Stage static runtime surface' step.");
  const run = /run: \|\n([\s\S]*)$/.exec(step[1]);
  if(!run) throw new Error("The staging step has no run block.");
  return run[1].split("\n").map(line => line.trim()).filter(line => line && !line.startsWith("#") && line !== "set -euo pipefail");
}
// Each line is "mkdir -p <dir>" or "cp [-R] <sources...> <target>/"; anything else is a change this replica must learn.
function parse(root){
  const copies = [];
  for(const line of stageLines(root)){
    if(/^mkdir -p \.pages-artifact(?:\/[\w./-]+)?$/.test(line)) continue;
    const m = /^cp (-R )?(.+) (\.pages-artifact\/(?:[\w.-]+\/)*)$/.exec(line);
    if(!m) throw new Error(`Unrecognised staging line (teach tests/support/stage-pages-artifact.cjs): ${line}`);
    for(const source of m[2].split(/\s+/)) copies.push({source, into: m[3].slice(".pages-artifact/".length), recursive: Boolean(m[1])});
  }
  return copies;
}
function stagedNames(opts){
  return parse(opts && opts.root).filter(c => !c.into).map(c => c.source);
}
function stage(outDir, opts){
  const root = (opts && opts.root) || ROOT;
  fs.mkdirSync(outDir, {recursive: true});
  for(const c of parse(root)){
    const from = path.join(root, c.source), to = path.join(outDir, c.into, path.basename(c.source));
    if(!fs.existsSync(from)) throw new Error(`The staging step copies a file that does not exist: ${c.source}`);
    if(fs.statSync(from).isDirectory() && !c.recursive) throw new Error(`cp without -R on a folder: ${c.source}`);
    fs.mkdirSync(path.dirname(to), {recursive: true});
    fs.cpSync(from, to, {recursive: true});
  }
  return stagedNames({root});
}
module.exports = {stage, stagedNames, WORKFLOW};

if(require.main === module){
  const out = process.argv[2];
  if(!out){ console.error("usage: node tests/support/stage-pages-artifact.cjs <outDir>"); process.exit(2); }
  const names = stage(path.resolve(out));
  console.log(`Staged ${names.length} top-level entries into ${path.resolve(out)}: ${names.join(", ")}`);
}
