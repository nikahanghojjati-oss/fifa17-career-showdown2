WORK NO EMULATOR

# Job 90 · Factory smoke test (Work lane)

Checked: 2026-10-02 08:26 UTC
Repository: nikahanghojjati-oss/fifa17-career-showdown2
Test branch: gameplay/job-90-smoke-work
Connector test commit: 8df95d6c959080b3ed7cebf5805b2e0461fc8f5f
Status and this report: factory/gameplay-v1

Verdict: the contract command runs locally and npm installation works, but emulator execution is unavailable with the installed Java 17. Full contract completion is also unproven: the command exited 0 twice without the job's required 96/96 census line. Use GitHub CI for emulator proofs and definitive full-suite verification. Terminal push needs credentials; the GitHub connector successfully saves files. The browser tool is present, contrary to the handbook's expectation; it was not invoked.

| Capability | YES / NO | Evidence |
| --- | --- | --- |
| Repo read | YES | GitHub connector read BOARD.md; first line: `# Team G gameplay factory board`. Terminal shallow clone completed with exit 0. |
| Git push | NO | `git push origin gameplay/job-90-smoke-work`, exit 128: `fatal: could not read Username for 'https://github.com': No such device or address`. |
| Connector write | YES | Status updates saved on factory/gameplay-v1; same one-line work-branch-test.md saved on gameplay/job-90-smoke-work at 8df95d6c959080b3ed7cebf5805b2e0461fc8f5f. |
| Node ≥ 24 | YES | `node --version`: `v24.19.0`. |
| npm registry | YES | `npm --version`: `11.9.0`; `npm ci`, exit 0: `added 21 packages in 8s`. Pinned Firebase dependency installation also succeeded. Successful installs are the evidence; registry versus cache traffic was not separately traced. |
| Java ≥ 21 | NO | `java -version`: `openjdk version "17.0.20" 2026-07-21`. |
| Contract suite | NO | Required full-suite completion unproven. `npm run test:contracts` exited 0 in 11.73 s; retry exited 0 in 11.50 s. Neither produced the required `PASS POS10 selected deterministic census (96/96 current blocking contracts: frozen POS10 floor + POS20 supplements).` |
| Emulator start | NO | Smoke invocation exit 1: `Error: firebase-tools no longer supports Java version before 21. Please install a JDK at version 21 or above to get a compatible runtime.` |
| Pair emulator proof | NO | Pair invocation exit 1 with the same Java error; the proof did not execute and no `PASS persistent pair Rules emulator:` line was emitted. |
| Browser | YES | Available tool `mcp__cua_repl.js` documents cloud browser controls. Presence only; browser was not initialized or tested. |

## Commands and last output

### Clone and save

```text
git clone --depth 1 --branch gameplay/job-90-smoke-work https://github.com/nikahanghojjati-oss/fifa17-career-showdown2.git cms
exit 0
Local test-file commit: fd12d0ab0cfd919817fc60ab43a79e03af9fb434
git push origin gameplay/job-90-smoke-work
exit 128
fatal: could not read Username for 'https://github.com': No such device or address
Connector fallback commit: 8df95d6c959080b3ed7cebf5805b2e0461fc8f5f
```

### Runtimes and install

```text
node --version
v24.19.0
npm --version
11.9.0
java -version
openjdk version "17.0.20" 2026-07-21
OpenJDK Runtime Environment (build 17.0.20+8-1-24.04-Ubuntu)
OpenJDK 64-Bit Server VM (build 17.0.20+8-1-24.04-Ubuntu, mixed mode, sharing)
git --version
git version 2.51.1
npm ci
added 21 packages in 8s
exit 0
```

### Contract suite

Command: `npm run test:contracts`.

First invocation: exit 0, 11.73 seconds. Last line:

```text
PASS Terminal Close provider: bounded staged terminal proof folds acknowledged seasons and canonical scores one exact path at a time, then atomically closes rivalry+session; replay/read, forged totals, fresh-session resurrection, active-session continuation beyond the old TTL, device denial, zero billing and zero canonical local mutation remain protected.
```

Verification retry: exit 0, 11.50 seconds. Last line:

```text
PASS r18 Terminal Close production Rules: acknowledged seasons are folded into bounded monotonic terminalProgress, canonical scores remain Rules-authoritative, final close remains atomic, and production publication plus regression tests now share one deterministic zero-billing validator instead of reparsing shell grep syntax.
```

The expected census was absent from both captured logs. The runner registers 96 tests, but these observations do not establish that all 96 completed. No tests or runner code were changed, and no third retry was made.

### Firebase preparation, after contracts

```text
npm install --no-save --package-lock=false firebase@12.17.1 @firebase/rules-unit-testing@5.0.1 firebase-admin@14.2.0
added 260 packages, and changed 8 packages in 26s
exit 0
node scripts/build-production-firestore-rules.mjs
BUILT firestore.spark.generated.rules 113958 bytes
exit 0
node scripts/build-production-firestore-rules-with-persistent-pair.mjs
BUILT firestore.spark.generated.rules 113958 bytes
INJECTED persistent Nik/Daniel pair authority 121476 bytes
exit 0
```

### Emulator commands

Both commands were attempted, in order, without Firebase login:

```sh
npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-smoke "node -e 'console.log(1)'"
npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-smoke-pair "node tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs"
```

Each exited 1. Each last output:

```text
i  emulators: Shutting down emulators.

Error: firebase-tools no longer supports Java version before 21. Please install a JDK at version 21 or above to get a compatible runtime.
```

## Scope and handoff

Only these repo files were authored or remotely saved:
- factory/gameplay-v1: project-documents/gameplay-factory/status/JOB-90.md
- factory/gameplay-v1: project-documents/gameplay-factory/smoke/CAPABILITIES_WORK.md
- gameplay/job-90-smoke-work: project-documents/gameplay-factory/smoke/work-branch-test.md

The test file contains exactly `work branch test` plus its newline. Local test execution temporarily rewrote the generated Rules; the requested final pair build restored their original composition, and `git diff --name-only` was empty. Dependency installations used the job's commands without saving changes to package manifests or lockfile. No main writes, merges, force pushes, deletions, deployment, Firebase login, billing/configuration changes, or production data writes were performed.

The smoke job is complete even though capabilities failed. The lead should route emulator proofs and definitive contract completion to CI. Browser support is observed tool availability, not a tested browser capability.
