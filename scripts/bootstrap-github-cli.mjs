#!/usr/bin/env node

import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const latestReleaseApi = "https://api.github.com/repos/cli/cli/releases/latest";
const officialReleaseHost = "github.com";
const officialReleasePrefix = "/cli/cli/releases/download/";

function writeLine(stream, message = ""){
  stream.write(`${message}\n`);
}

function shellQuote(value){
  return `'${String(value).replaceAll("'", `'\"'\"'`)}'`;
}

function commandResult(executable, args, options = {}){
  return spawnSync(executable, args, {
    encoding: "utf8",
    shell: false,
    ...options
  });
}

function requireSuccessfulCommand(result, description){
  if(result.error){
    throw new Error(`${description} could not start: ${result.error.message}`);
  }
  if(result.status !== 0){
    const detail = `${result.stderr || ""}\n${result.stdout || ""}`.trim();
    throw new Error(`${description} failed${detail ? `: ${detail}` : ` with exit code ${result.status}`}`);
  }
  return result;
}

async function isExecutable(candidate){
  try{
    await fs.access(candidate, fsConstants.X_OK);
    return true;
  }catch{
    return false;
  }
}

export function releasePlatform(platform = process.platform, architecture = process.arch){
  if(platform !== "linux"){
    throw new Error(`Portable GitHub CLI bootstrap currently supports Linux Work environments; received ${platform}.`);
  }

  const architectures = {
    x64: "amd64",
    arm64: "arm64",
    ia32: "386"
  };
  const releaseArchitecture = architectures[architecture];
  if(!releaseArchitecture){
    throw new Error(`Unsupported Linux architecture for GitHub CLI bootstrap: ${architecture}.`);
  }

  return { operatingSystem: "linux", architecture: releaseArchitecture };
}

export function parseReleaseVersion(tagName){
  const match = /^v(\d+\.\d+\.\d+)$/.exec(String(tagName || ""));
  if(!match){
    throw new Error(`GitHub CLI latest release returned an invalid stable tag: ${tagName || "missing"}.`);
  }
  return match[1];
}

export function checksumForAsset(checksumText, assetName){
  const matches = String(checksumText)
    .split(/\r?\n/)
    .map(line => line.trim().split(/\s+/))
    .filter(parts => parts.length === 2 && parts[1] === assetName);

  if(matches.length !== 1 || !/^[a-f0-9]{64}$/.test(matches[0][0])){
    throw new Error(`Official checksum file must contain exactly one SHA-256 entry for ${assetName}.`);
  }
  return matches[0][0];
}

export function sha256(bytes){
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function assertOfficialAssetUrl(value, tagName, assetName){
  const target = new URL(value);
  const expectedPath = `${officialReleasePrefix}${tagName}/${assetName}`;
  if(target.protocol !== "https:" || target.hostname !== officialReleaseHost || target.pathname !== expectedPath){
    throw new Error(`Refusing non-official GitHub CLI release URL for ${assetName}: ${target.href}`);
  }
  return target.href;
}

async function fetchResponse(url, fetchImplementation){
  const response = await fetchImplementation(url, {
    cache: "no-store",
    headers: {
      accept: "application/vnd.github+json",
      "user-agent": "career-mode-showdown-gh-bootstrap"
    },
    redirect: "follow",
    signal: AbortSignal.timeout(30000)
  });
  if(!response.ok){
    throw new Error(`${url} returned HTTP ${response.status}.`);
  }
  return response;
}

async function latestStableRelease(fetchImplementation){
  const response = await fetchResponse(latestReleaseApi, fetchImplementation);
  const release = await response.json();
  if(release.draft || release.prerelease){
    throw new Error("GitHub CLI latest release endpoint did not return a stable published release.");
  }
  if(!Array.isArray(release.assets)){
    throw new Error("GitHub CLI latest release metadata is missing its asset list.");
  }
  return release;
}

async function executableVersion(ghPath, environment){
  const result = requireSuccessfulCommand(
    commandResult(ghPath, ["--version"], { env: environment }),
    `GitHub CLI version check for ${ghPath}`
  );
  const firstLine = String(result.stdout || result.stderr || "").split(/\r?\n/).find(Boolean) || "";
  if(!/^gh version \d+\.\d+\.\d+/.test(firstLine)){
    throw new Error(`Unexpected GitHub CLI version output from ${ghPath}: ${firstLine || "empty"}.`);
  }
  return firstLine;
}

async function findExistingGh(environment, toolsRoot){
  if(environment.GH_BOOTSTRAP_FORCE_INSTALL === "1"){
    return null;
  }

  const candidates = [];
  if(environment.GH_BOOTSTRAP_GH){
    candidates.push(path.resolve(environment.GH_BOOTSTRAP_GH));
  }
  candidates.push(path.join(toolsRoot, "bin", "gh"));
  for(const directory of String(environment.PATH || "").split(path.delimiter).filter(Boolean)){
    candidates.push(path.join(directory, "gh"));
  }

  for(const candidate of [...new Set(candidates)]){
    if(await isExecutable(candidate)){
      return candidate;
    }
  }
  return null;
}

function releaseAsset(release, name){
  const matches = release.assets.filter(asset => asset && asset.name === name);
  if(matches.length !== 1 || !matches[0].browser_download_url){
    throw new Error(`GitHub CLI release must contain exactly one ${name} asset.`);
  }
  return assertOfficialAssetUrl(matches[0].browser_download_url, release.tag_name, name);
}

function launcherSource(binaryPath, configDirectory){
  return [
    "#!/bin/sh",
    "set -eu",
    'if [ -z "${GH_CONFIG_DIR:-}" ]; then',
    `  GH_CONFIG_DIR=${shellQuote(configDirectory)}`,
    "fi",
    "export GH_CONFIG_DIR",
    `exec ${shellQuote(binaryPath)} \"$@\"`,
    ""
  ].join("\n");
}

async function writeLauncher(launcherPath, binaryPath, configDirectory){
  await fs.mkdir(path.dirname(launcherPath), { recursive: true });
  const temporaryLauncher = `${launcherPath}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(temporaryLauncher, launcherSource(binaryPath, configDirectory), {
    encoding: "utf8",
    mode: 0o755,
    flag: "wx"
  });
  await fs.chmod(temporaryLauncher, 0o755);
  await fs.rename(temporaryLauncher, launcherPath);
}

export async function installGithubCli({
  toolsRoot,
  configDirectory,
  environment,
  fetchImplementation = globalThis.fetch,
  platform = process.platform,
  architecture = process.arch
}){
  const release = await latestStableRelease(fetchImplementation);
  const version = parseReleaseVersion(release.tag_name);
  const target = releasePlatform(platform, architecture);
  const archiveName = `gh_${version}_${target.operatingSystem}_${target.architecture}.tar.gz`;
  const checksumName = `gh_${version}_checksums.txt`;
  const archiveUrl = releaseAsset(release, archiveName);
  const checksumUrl = releaseAsset(release, checksumName);

  const [archiveResponse, checksumResponse] = await Promise.all([
    fetchResponse(archiveUrl, fetchImplementation),
    fetchResponse(checksumUrl, fetchImplementation)
  ]);
  const [archiveBytes, checksumText] = await Promise.all([
    archiveResponse.arrayBuffer().then(bytes => Buffer.from(bytes)),
    checksumResponse.text()
  ]);
  const expectedChecksum = checksumForAsset(checksumText, archiveName);
  const actualChecksum = sha256(archiveBytes);
  if(actualChecksum !== expectedChecksum){
    throw new Error(`GitHub CLI archive checksum mismatch for ${archiveName}: expected ${expectedChecksum}, received ${actualChecksum}.`);
  }

  const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cms-gh-bootstrap-"));
  let stagedVersionDirectory = null;
  try{
    const archivePath = path.join(temporaryRoot, archiveName);
    await fs.writeFile(archivePath, archiveBytes, { mode: 0o600 });
    const extraction = requireSuccessfulCommand(
      commandResult("tar", ["--no-same-owner", "-xzf", archivePath, "-C", temporaryRoot], { env: environment }),
      "GitHub CLI archive extraction"
    );
    void extraction;

    const extractedBinary = path.join(temporaryRoot, `gh_${version}_${target.operatingSystem}_${target.architecture}`, "bin", "gh");
    if(!(await isExecutable(extractedBinary))){
      throw new Error(`Verified GitHub CLI archive did not contain executable ${extractedBinary}.`);
    }

    const versionsRoot = path.join(toolsRoot, "github-cli");
    const finalVersionDirectory = path.join(versionsRoot, version);
    const finalBinary = path.join(finalVersionDirectory, "bin", "gh");
    await fs.mkdir(versionsRoot, { recursive: true });

    if(await isExecutable(finalBinary)){
      await executableVersion(finalBinary, environment);
    }else{
      try{
        const existing = await fs.stat(finalVersionDirectory);
        if(existing){
          throw new Error(`Refusing to overwrite incomplete GitHub CLI directory ${finalVersionDirectory}.`);
        }
      }catch(error){
        if(error && error.code !== "ENOENT"){
          throw error;
        }
      }

      stagedVersionDirectory = await fs.mkdtemp(path.join(versionsRoot, ".stage-"));
      const stagedBinaryDirectory = path.join(stagedVersionDirectory, "bin");
      const stagedBinary = path.join(stagedBinaryDirectory, "gh");
      await fs.mkdir(stagedBinaryDirectory, { recursive: true });
      await fs.copyFile(extractedBinary, stagedBinary);
      await fs.chmod(stagedBinary, 0o755);
      await executableVersion(stagedBinary, environment);
      await fs.rename(stagedVersionDirectory, finalVersionDirectory);
      stagedVersionDirectory = null;
    }

    const launcherPath = path.join(toolsRoot, "bin", "gh");
    await writeLauncher(launcherPath, finalBinary, configDirectory);
    return {
      ghPath: launcherPath,
      installedVersion: version,
      archiveName,
      checksum: actualChecksum
    };
  }finally{
    if(stagedVersionDirectory){
      await fs.rm(stagedVersionDirectory, { recursive: true, force: true });
    }
    await fs.rm(temporaryRoot, { recursive: true, force: true });
  }
}

export async function bootstrapGithubCli({
  environment = process.env,
  output = process.stdout,
  errorOutput = process.stderr,
  fetchImplementation = globalThis.fetch,
  platform = process.platform,
  architecture = process.arch
} = {}){
  const toolsRoot = path.resolve(environment.GH_BOOTSTRAP_ROOT || path.join(repositoryRoot, ".work-tools"));
  const configDirectory = path.resolve(environment.GH_CONFIG_DIR || path.join(toolsRoot, "gh-config"));
  await fs.mkdir(configDirectory, { recursive: true, mode: 0o700 });
  await fs.chmod(configDirectory, 0o700);

  let ghPath = await findExistingGh(environment, toolsRoot);
  let installed = false;
  let installation = null;
  if(!ghPath){
    writeLine(output, "GitHub CLI was not found; resolving the current official stable release.");
    installation = await installGithubCli({
      toolsRoot,
      configDirectory,
      environment,
      fetchImplementation,
      platform,
      architecture
    });
    ghPath = installation.ghPath;
    installed = true;
    writeLine(output, `Installed verified GitHub CLI ${installation.installedVersion} (${installation.checksum}).`);
  }

  const ghEnvironment = { ...environment, GH_CONFIG_DIR: configDirectory };
  const versionLine = await executableVersion(ghPath, ghEnvironment);
  writeLine(output, `${versionLine} at ${ghPath}`);
  writeLine(output, `GH_CONFIG_DIR=${configDirectory}`);

  const auth = commandResult(ghPath, ["auth", "status"], { env: ghEnvironment });
  if(auth.stdout){
    output.write(auth.stdout);
  }
  if(auth.stderr){
    errorOutput.write(auth.stderr);
  }
  const authenticated = !auth.error && auth.status === 0;
  if(authenticated){
    writeLine(output, "PASS GitHub CLI authentication status.");
  }else{
    writeLine(output, "GitHub CLI is installed but is not authenticated in this Work environment.");
    writeLine(output, "Use GitHub's supported user-directed device flow, then rerun this bootstrap:");
    writeLine(output, `  GH_CONFIG_DIR=${shellQuote(configDirectory)} ${shellQuote(ghPath)} auth login --hostname github.com --git-protocol https --web`);
  }

  writeLine(output, "Connector-first rule: use the connected GitHub app for repository, PR and issue authority; use gh only for local workflow gaps such as authentication checks and Actions evidence.");
  if(installed){
    writeLine(output, `For this shell, add the verified launcher with: export PATH=${shellQuote(path.dirname(ghPath))}:\"$PATH\"`);
  }

  return {
    ghPath,
    configDirectory,
    installed,
    authenticated,
    versionLine,
    checksum: installation?.checksum || null
  };
}

async function main(){
  try{
    await bootstrapGithubCli();
  }catch(error){
    process.stderr.write(`GitHub CLI bootstrap failed: ${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
}

if(process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)){
  await main();
}
