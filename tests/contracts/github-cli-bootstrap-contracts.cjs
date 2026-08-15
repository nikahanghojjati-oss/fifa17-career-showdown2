const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const read = file => fs.readFileSync(file, "utf8");
const agents = read("AGENTS.md");
const start = read("00_DEVELOPER_START_HERE.md");
const protocol = read("00_WORK_ENVIRONMENT_CONTINUITY.md");
const ignore = read(".gitignore");
const source = read("scripts/bootstrap-github-cli.mjs");
const pkg = JSON.parse(read("package.json"));

assert.equal(
  pkg.scripts["work:gh:bootstrap"],
  "node scripts/bootstrap-github-cli.mjs",
  "package.json must expose the repository-owned GitHub CLI bootstrap."
);
assert.match(ignore, /^\.work-tools\/$/m, "Environment-local GitHub CLI binaries and credentials must stay ignored.");
assert.match(agents, /Mandatory GitHub tooling bootstrap/i);
assert.match(agents, /npm run work:gh:bootstrap/i);
assert.match(agents, /connected GitHub app[\s\S]+connector-first/i);
assert.match(agents, /gh auth status/i);
assert.match(agents, /Never extract, copy or repurpose connector credentials/i);
assert.match(start, /GitHub CLI bootstrap/i);
assert.match(start, /checksum verification/i);
assert.match(protocol, /GitHub tooling bootstrap/i);
assert.match(protocol, /before substantial work/i);

assert.match(source, /https:\/\/api\.github\.com\/repos\/cli\/cli\/releases\/latest/);
assert.match(source, /\/cli\/cli\/releases\/download\//);
assert.match(source, /sha256\(archiveBytes\)/);
assert.match(source, /actualChecksum !== expectedChecksum/);
assert.match(source, /--no-same-owner/);
assert.match(source, /GH_CONFIG_DIR/);
assert.match(source, /\["auth", "status"\]/);
assert.match(source, /Connector-first rule/i);

function bufferStream(){
  let value = "";
  return {
    stream: { write: chunk => { value += String(chunk); } },
    read: () => value
  };
}

function writeFakeGh(file, version){
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `#!/bin/sh
set -eu
if [ "\${1:-}" = "--version" ]; then
  printf '%s\\n' "gh version ${version} (contract fixture)"
  exit 0
fi
if [ "\${1:-}" = "auth" ] && [ "\${2:-}" = "status" ]; then
  test -n "\${GH_CONFIG_DIR:-}"
  printf '%s\\n' "fixture authentication active"
  exit 0
fi
exit 3
`, { mode: 0o755 });
  fs.chmodSync(file, 0o755);
}

(async () => {
  const moduleUrl = pathToFileURL(path.resolve("scripts/bootstrap-github-cli.mjs")).href;
  const {
    bootstrapGithubCli,
    checksumForAsset,
    parseReleaseVersion,
    releasePlatform,
    sha256
  } = await import(moduleUrl);

  assert.deepEqual(releasePlatform("linux", "x64"), { operatingSystem: "linux", architecture: "amd64" });
  assert.deepEqual(releasePlatform("linux", "arm64"), { operatingSystem: "linux", architecture: "arm64" });
  assert.throws(() => releasePlatform("darwin", "x64"), /supports Linux Work environments/);
  assert.equal(parseReleaseVersion("v2.97.0"), "2.97.0");
  assert.throws(() => parseReleaseVersion("latest"), /invalid stable tag/);
  assert.equal(checksumForAsset(`${"a".repeat(64)}  fixture.tar.gz\n`, "fixture.tar.gz"), "a".repeat(64));
  assert.throws(() => checksumForAsset("", "fixture.tar.gz"), /exactly one SHA-256 entry/);

  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "cms-gh-contract-"));
  try{
    const existingGh = path.join(temporaryRoot, "existing", "gh");
    writeFakeGh(existingGh, "8.8.8");
    const existingOutput = bufferStream();
    const existingError = bufferStream();
    const existingResult = await bootstrapGithubCli({
      environment: {
        ...process.env,
        GH_BOOTSTRAP_GH: existingGh,
        GH_BOOTSTRAP_ROOT: path.join(temporaryRoot, "existing-tools"),
        GH_CONFIG_DIR: path.join(temporaryRoot, "existing-config")
      },
      output: existingOutput.stream,
      errorOutput: existingError.stream,
      fetchImplementation: async () => { throw new Error("Existing gh must prevent a download."); }
    });
    assert.equal(existingResult.installed, false);
    assert.equal(existingResult.authenticated, true);
    assert.equal(existingResult.ghPath, existingGh);
    assert.match(existingOutput.read(), /gh version 8\.8\.8/);
    assert.match(existingOutput.read(), /Connector-first rule/);
    assert.equal(existingError.read(), "");

    const fixtureVersion = "9.9.9";
    const releaseDirectoryName = `gh_${fixtureVersion}_linux_amd64`;
    const archiveName = `${releaseDirectoryName}.tar.gz`;
    const checksumName = `gh_${fixtureVersion}_checksums.txt`;
    const fixtureBuild = path.join(temporaryRoot, "fixture-build");
    const fixtureGh = path.join(fixtureBuild, releaseDirectoryName, "bin", "gh");
    writeFakeGh(fixtureGh, fixtureVersion);
    const archivePath = path.join(temporaryRoot, archiveName);
    const tar = spawnSync("tar", ["-czf", archivePath, "-C", fixtureBuild, releaseDirectoryName], { encoding: "utf8" });
    assert.equal(tar.status, 0, tar.stderr || "Fixture archive creation failed.");
    const archiveBytes = fs.readFileSync(archivePath);
    const archiveChecksum = sha256(archiveBytes);
    const release = {
      tag_name: `v${fixtureVersion}`,
      draft: false,
      prerelease: false,
      assets: [
        {
          name: archiveName,
          browser_download_url: `https://github.com/cli/cli/releases/download/v${fixtureVersion}/${archiveName}`
        },
        {
          name: checksumName,
          browser_download_url: `https://github.com/cli/cli/releases/download/v${fixtureVersion}/${checksumName}`
        }
      ]
    };

    const fixtureFetch = async url => {
      if(url === "https://api.github.com/repos/cli/cli/releases/latest"){
        return new Response(JSON.stringify(release), { status: 200, headers: { "content-type": "application/json" } });
      }
      if(String(url).endsWith(`/${archiveName}`)){
        return new Response(archiveBytes, { status: 200 });
      }
      if(String(url).endsWith(`/${checksumName}`)){
        return new Response(`${archiveChecksum}  ${archiveName}\n`, { status: 200 });
      }
      return new Response("not found", { status: 404 });
    };

    const installRoot = path.join(temporaryRoot, "installed-tools");
    const installOutput = bufferStream();
    const installError = bufferStream();
    const installResult = await bootstrapGithubCli({
      environment: {
        ...process.env,
        GH_BOOTSTRAP_FORCE_INSTALL: "1",
        GH_BOOTSTRAP_ROOT: installRoot,
        GH_CONFIG_DIR: path.join(installRoot, "config")
      },
      output: installOutput.stream,
      errorOutput: installError.stream,
      fetchImplementation: fixtureFetch,
      platform: "linux",
      architecture: "x64"
    });
    assert.equal(installResult.installed, true);
    assert.equal(installResult.authenticated, true);
    assert.equal(installResult.checksum, archiveChecksum);
    assert.ok(fs.existsSync(installResult.ghPath), "Verified install must expose a stable launcher.");
    assert.match(read(installResult.ghPath), /GH_CONFIG_DIR/);
    assert.match(installOutput.read(), /Installed verified GitHub CLI 9\.9\.9/);
    assert.equal(installError.read(), "");

    const mismatchRoot = path.join(temporaryRoot, "mismatch-tools");
    const mismatchFetch = async url => {
      const response = await fixtureFetch(url);
      if(String(url).endsWith(`/${checksumName}`)){
        return new Response(`${"0".repeat(64)}  ${archiveName}\n`, { status: 200 });
      }
      return response;
    };
    await assert.rejects(
      bootstrapGithubCli({
        environment: {
          ...process.env,
          GH_BOOTSTRAP_FORCE_INSTALL: "1",
          GH_BOOTSTRAP_ROOT: mismatchRoot,
          GH_CONFIG_DIR: path.join(mismatchRoot, "config")
        },
        output: bufferStream().stream,
        errorOutput: bufferStream().stream,
        fetchImplementation: mismatchFetch,
        platform: "linux",
        architecture: "x64"
      }),
      /archive checksum mismatch/
    );
    assert.equal(fs.existsSync(path.join(mismatchRoot, "bin", "gh")), false, "Checksum mismatch must not expose a launcher.");
  }finally{
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }

  process.stdout.write("PASS GitHub CLI bootstrap contracts: existing-tool reuse, official latest-release resolution, checksum enforcement, rootless extraction, workspace-local authentication and connector-first policy are protected.\n");
})().catch(error => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
