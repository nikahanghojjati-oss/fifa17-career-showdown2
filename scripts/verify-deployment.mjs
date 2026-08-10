import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const deploymentUrl = new URL(
    process.env.CMS_DEPLOY_URL || "https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/"
);
const timeoutMs = Number(process.env.CMS_DEPLOY_TIMEOUT_MS || 360000);
const retryMs = Number(process.env.CMS_DEPLOY_RETRY_MS || 10000);
const runtimeRoots = ["index.html", "css", "js", "data", "assets"];

function digest(bytes){
    return crypto.createHash("sha256").update(bytes).digest("hex");
}

function delay(milliseconds){
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function listFiles(relativePath){
    const absolutePath = path.join(repositoryRoot, relativePath);
    const stats = await fs.stat(absolutePath);
    if(stats.isFile()){
        return [relativePath.replaceAll(path.sep, "/")];
    }

    const entries = await fs.readdir(absolutePath, { withFileTypes: true });
    const nested = await Promise.all(entries
        .filter(entry => !entry.name.startsWith("."))
        .sort((one, two) => one.name.localeCompare(two.name))
        .map(entry => listFiles(path.join(relativePath, entry.name))));
    return nested.flat();
}

function readRevision(html){
    return (html.match(/<meta\s+name="app-asset-revision"\s+content="([^"]+)"/i) || [])[1] || "";
}

async function fetchBytes(relativePath, nonce){
    const target = new URL(relativePath, deploymentUrl);
    target.searchParams.set("deployment-check", nonce);
    const response = await fetch(target, {
        cache: "no-store",
        headers: { "cache-control": "no-cache" },
        signal: AbortSignal.timeout(30000)
    });
    assert.equal(response.status, 200, `${relativePath} returned HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
}

async function waitForRevision(expectedRevision){
    const deadline = Date.now() + timeoutMs;
    let lastRevision = "";
    let lastError = null;

    while(Date.now() <= deadline){
        try{
            const bytes = await fetchBytes("index.html", String(Date.now()));
            lastRevision = readRevision(bytes.toString("utf8"));
            if(lastRevision === expectedRevision){
                return bytes;
            }
            lastError = null;
        }catch(error){
            lastError = error;
        }

        if(Date.now() + retryMs > deadline){
            break;
        }
        process.stdout.write(`Waiting for deployed revision ${expectedRevision}; currently ${lastRevision || "unavailable"}.\n`);
        await delay(retryMs);
    }

    if(lastError){
        throw new Error(`Deployment never became readable: ${lastError.message}`);
    }
    throw new Error(`Deployment remained on ${lastRevision || "an unknown revision"}; expected ${expectedRevision}.`);
}

const localIndex = await fs.readFile(path.join(repositoryRoot, "index.html"));
const expectedRevision = readRevision(localIndex.toString("utf8"));
assert.ok(expectedRevision, "Local index.html does not expose an app asset revision.");

await waitForRevision(expectedRevision);

const runtimeFiles = (await Promise.all(runtimeRoots.map(listFiles))).flat().sort();
const nonce = `${expectedRevision}-${Date.now()}`;
const failures = [];

for(let index = 0; index < runtimeFiles.length; index += 6){
    const batch = runtimeFiles.slice(index, index + 6);
    const results = await Promise.all(batch.map(async relativePath => {
        try{
            const [localBytes, deployedBytes] = await Promise.all([
                fs.readFile(path.join(repositoryRoot, relativePath)),
                fetchBytes(relativePath, nonce)
            ]);
            return {
                relativePath,
                localHash: digest(localBytes),
                deployedHash: digest(deployedBytes),
                localBytes: localBytes.length,
                deployedBytes: deployedBytes.length
            };
        }catch(error){
            return { relativePath, error: error.message };
        }
    }));

    results.forEach(result => {
        if(result.error || result.localHash !== result.deployedHash || result.localBytes !== result.deployedBytes){
            failures.push(result);
        }
    });
}

assert.deepEqual(failures, [], `Deployment mismatch:\n${JSON.stringify(failures, null, 2)}`);
process.stdout.write(
    `Deployment verified: ${runtimeFiles.length} runtime files match ${expectedRevision} byte for byte at ${deploymentUrl.href}\n`
);
