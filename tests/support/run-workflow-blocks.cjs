const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "../..");
const workflowDirectory = path.join(root, ".github/workflows");
const workflowFiles = fs.readdirSync(workflowDirectory)
    .filter(name => name.endsWith(".yml") && name !== "validate-stability-lane.yml")
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

let executed = 0;
for(const workflowFile of workflowFiles){
    const source = fs.readFileSync(path.join(workflowDirectory, workflowFile), "utf8");
    const blocks = extractLiteralRunBlocks(source);
    blocks.forEach((block, blockIndex) => {
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

assert.equal(executed, 27, `Expected 27 permanent executable workflow blocks; ran ${executed}.`);
process.stdout.write(`All ${executed} permanent GitHub workflow blocks passed locally.\n`);
