const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "../..");
const workflowDirectory = path.join(root, ".github/workflows");
const workflowFiles = fs.readdirSync(workflowDirectory)
    .filter(name => name.endsWith(".yml") && ![
        "validate-stability-lane.yml",
        "deploy-github-pages.yml",
        "prove-production-pages-rollback.yml"
    ].includes(name))
    .sort();

function extractLiteralRunBlocks(source){
    const lines = source.split(/\r?\n/);
    const blocks = [];

    for(let index = 0; index < lines.length; index += 1){
        const marker = lines[index].match(/^(\s*)run:\s*\|\s*$/);
        if(!marker){ continue; }
        const markerIndent = marker[1].length;
        const collected = [];
        index += 1;

        while(index < lines.length){
            const line = lines[index];
            if(line.trim() && line.match(/^\s*/)[0].length <= markerIndent){
                index -= 1;
                break;
            }
            collected.push(line.length > markerIndent + 2 ? line.slice(markerIndent + 2) : "");
            index += 1;
        }
        blocks.push(collected.join("\n").trimEnd());
    }
    return blocks;
}

function localJavaMajor(){
    const result = spawnSync("java", ["-version"], { encoding: "utf8" });
    const output = `${result.stdout || ""}\n${result.stderr || ""}`;
    const match = output.match(/version\s+"(?:1\.)?(\d+)/i);
    return match ? Number(match[1]) : null;
}

const javaMajor = localJavaMajor();
let executed = 0;
let deferred = 0;
for(const workflowFile of workflowFiles){
    const source = fs.readFileSync(path.join(workflowDirectory, workflowFile), "utf8");
    const blocks = extractLiteralRunBlocks(source);
    blocks.forEach((block, blockIndex) => {
        if(workflowFile === "deploy-firestore-rules-zero-billing.yml"){
            process.stdout.write(`DEFER ${workflowFile} block ${blockIndex + 1}/${blocks.length}: production provider deployment is CI-only and must never run from the local validation harness.\n`);
            deferred += 1;
            return;
        }
        if(/firebase\s+emulators:exec/.test(block) && (!Number.isInteger(javaMajor) || javaMajor < 21)){
            process.stdout.write(`DEFER ${workflowFile} block ${blockIndex + 1}/${blocks.length}: Firebase CLI requires Java 21; exact workflow CI owns this provider gate (local Java ${javaMajor || "unavailable"}).\n`);
            deferred += 1;
            return;
        }
        process.stdout.write(`RUN   ${workflowFile} block ${blockIndex + 1}/${blocks.length}\n`);
        const result = spawnSync("bash", ["-lc", block], {
            cwd: root,
            env: process.env,
            encoding: "utf8",
            maxBuffer: 16 * 1024 * 1024
        });
        if(result.stdout){ process.stdout.write(result.stdout); }
        if(result.stderr){ process.stderr.write(result.stderr); }
        assert.equal(result.status, 0, `${workflowFile} block ${blockIndex + 1} failed.`);
        executed += 1;
    });
}

assert.equal(executed + deferred, 34, `Expected 34 permanent executable workflow blocks; accounted for ${executed + deferred}.`);
if(deferred){
    process.stdout.write(`PASS  ${executed} permanent workflow blocks passed locally; ${deferred} provider-owned blocks deferred explicitly to exact workflow CI. Production Pages deployment is accounted separately.\n`);
}else{
    process.stdout.write(`All ${executed} permanent GitHub workflow blocks passed locally. Production Pages deployment is accounted separately from validation topology.\n`);
}
