import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultStatePath = "WORK_ENVIRONMENT_STATUS.json";

const requiredContinuityFiles = Object.freeze([
    "AGENTS.md",
    "00_HANDOFF_GOLDEN_RULE.md",
    "00_WORK_ENVIRONMENT_CONTINUITY.md",
    "WORK_ENVIRONMENT_STATUS.json",
    "WORK_ENVIRONMENT_HISTORY.md",
    "00_DEVELOPER_START_HERE.md",
    "00_CURRENT_HANDOFF.md",
    "PROJECT_STATE.md",
    "NEXT_TASK.md"
]);

const contextBaselines = Object.freeze({
    low: 15,
    moderate: 35,
    high: 60,
    "very-high": 80
});

const projectComplexityScores = Object.freeze({
    low: 25,
    moderate: 50,
    high: 75,
    "very-high": 90
});

const decisions = Object.freeze({
    CONTINUE: "CONTINUE",
    PREPARE_HANDOFF: "PREPARE_HANDOFF",
    HANDOFF_AT_CHECKPOINT: "HANDOFF_AT_CHECKPOINT",
    HANDOFF_NOW: "HANDOFF_NOW",
    FINISH_SAFE_BOUNDARY: "FINISH_SAFE_BOUNDARY"
});

function clamp(value, minimum = 0, maximum = 100){
    return Math.min(maximum, Math.max(minimum, value));
}

function round(value){
    return Math.round(value * 10) / 10;
}

function ensure(condition, message){
    if(!condition){
        throw new Error(message);
    }
}

function ensureString(value, field){
    ensure(typeof value === "string" && value.trim().length > 0, `${field} must be a non-empty string.`);
}

function ensureCount(value, field){
    ensure(Number.isInteger(value) && value >= 0, `${field} must be a non-negative integer.`);
}

function ensurePercent(value, field){
    ensure(Number.isFinite(value) && value >= 0 && value <= 100, `${field} must be between 0 and 100.`);
}

function validateState(state){
    ensure(state && typeof state === "object" && !Array.isArray(state), "Status must be a JSON object.");
    ensure(state.schemaVersion === 1, "schemaVersion must be 1.");
    ensureString(state.environmentId, "environmentId");
    ensure(["active", "transition-prepared", "closed"].includes(state.lifecycle), "lifecycle must be active, transition-prepared or closed.");
    ensureString(state.recordedAt, "recordedAt");
    ensure(!Number.isNaN(Date.parse(state.recordedAt)), "recordedAt must be an ISO-8601 date/time.");

    const repository = state.repository;
    ensure(repository && typeof repository === "object", "repository is required.");
    for(const field of ["name", "publicSite", "startingMainSha"]){
        ensureString(repository[field], `repository.${field}`);
    }
    ensure(/^[0-9a-f]{40}$/i.test(repository.startingMainSha), "repository.startingMainSha must be a full commit SHA.");

    const signals = state.signals;
    ensure(signals && typeof signals === "object", "signals is required.");
    ensure(Object.hasOwn(contextBaselines, signals.contextComplexity), "signals.contextComplexity is invalid.");
    ensure(Object.hasOwn(projectComplexityScores, signals.projectComplexity), "signals.projectComplexity is invalid.");
    for(const field of [
        "compactionCount",
        "majorPhasesCompleted",
        "largeEvidenceEvents",
        "toolRoutingErrors",
        "correctedFailures",
        "repeatedMistakes",
        "staleFactCorrections",
        "unresolvedFailures",
        "unrecordedDecisions"
    ]){
        ensureCount(signals[field], `signals.${field}`);
    }
    for(const field of ["newMilestoneNext", "usageWarning", "atomicOperation"]){
        ensure(typeof signals[field] === "boolean", `signals.${field} must be boolean.`);
    }
    ensurePercent(signals.handoffCompleteness, "signals.handoffCompleteness");
    if(signals.usageRemainingPercent !== null){
        ensurePercent(signals.usageRemainingPercent, "signals.usageRemainingPercent");
        ensure(["usage-dashboard", "cli-status", "user-reported"].includes(signals.usageSource), "A known usage percentage must name usage-dashboard, cli-status or user-reported as its source.");
    }else{
        ensure(signals.usageSource === "unavailable", "Unknown usage must use usageSource unavailable.");
    }

    const continuity = state.continuity;
    ensure(continuity && typeof continuity === "object", "continuity is required.");
    for(const field of ["currentTask", "lastSafeCheckpoint", "nextSafeAction"]){
        ensureString(continuity[field], `continuity.${field}`);
    }
    for(const field of ["unfinishedWork", "knownHazards", "evidenceNotes"]){
        ensure(Array.isArray(continuity[field]) && continuity[field].every(item => typeof item === "string" && item.trim()), `continuity.${field} must be an array of non-empty strings.`);
    }
    return state;
}

function readState(statePath = defaultStatePath){
    const absolutePath = path.resolve(repositoryRoot, statePath);
    return validateState(JSON.parse(fs.readFileSync(absolutePath, "utf8")));
}

function runGit(args){
    const result = spawnSync("git", args, { cwd: repositoryRoot, encoding: "utf8" });
    if(result.status !== 0){
        return "";
    }
    return result.stdout.trim();
}

function parseGitStatusPaths(output){
    return output
        .replace(/\r/g, "")
        .split("\n")
        .filter(Boolean)
        .map(line => line.length >= 4 ? line.slice(3).trim() : line.trim());
}

function collectRepositoryState(){
    const statusResult = spawnSync("git", ["status", "--porcelain"], { cwd: repositoryRoot, encoding: "utf8" });
    const changedFiles = statusResult.status === 0 ? parseGitStatusPaths(statusResult.stdout) : [];
    const missingContinuityFiles = requiredContinuityFiles.filter(file => !fs.existsSync(path.join(repositoryRoot, file)));
    const divergence = runGit(["rev-list", "--left-right", "--count", "origin/main...HEAD"]);
    const counts = divergence ? divergence.split(/\s+/).map(Number) : [];
    return {
        branch: runGit(["branch", "--show-current"]) || "unknown",
        head: runGit(["rev-parse", "HEAD"]) || "unknown",
        originMain: runGit(["rev-parse", "origin/main"]) || "unknown",
        behindOriginMain: Number.isFinite(counts[0]) ? counts[0] : null,
        aheadOfOriginMain: Number.isFinite(counts[1]) ? counts[1] : null,
        dirty: changedFiles.length > 0,
        changedFiles,
        missingContinuityFiles
    };
}

function withOverrides(state, overrides = {}){
    const copy = structuredClone(state);
    if(overrides.usageRemainingPercent !== undefined){
        copy.signals.usageRemainingPercent = overrides.usageRemainingPercent;
        copy.signals.usageSource = overrides.usageSource || "user-reported";
    }
    if(overrides.usageWarning !== undefined){
        copy.signals.usageWarning = overrides.usageWarning;
    }
    return validateState(copy);
}

function assessState(state, repositoryState = collectRepositoryState()){
    validateState(state);
    const signals = state.signals;
    const contextPressure = clamp(
        contextBaselines[signals.contextComplexity]
        + Math.min(20, signals.compactionCount * 12)
        + Math.min(15, Math.max(0, signals.majorPhasesCompleted - 1) * 4)
        + Math.min(10, signals.largeEvidenceEvents * 2)
    );
    const qualityRisk = clamp(
        signals.toolRoutingErrors * 6
        + signals.correctedFailures * 4
        + signals.repeatedMistakes * 18
        + signals.staleFactCorrections * 12
        + signals.unresolvedFailures * 8
    );
    const nextTaskSeparation = signals.newMilestoneNext ? 80 : 20;
    let quotaRisk = signals.usageRemainingPercent === null
        ? null
        : clamp(100 - signals.usageRemainingPercent);
    if(signals.usageWarning){
        quotaRisk = Math.max(90, quotaRisk ?? 0);
    }

    const missingPenalty = repositoryState.missingContinuityFiles.length ? 25 : 0;
    const handoffReadiness = clamp(
        signals.handoffCompleteness
        - Math.min(40, signals.unrecordedDecisions * 12)
        - missingPenalty
    );
    const unrecordedKnowledge = clamp(signals.unrecordedDecisions * 20);
    const atomicRisk = signals.atomicOperation ? 100 : (repositoryState.dirty ? 35 : 0);

    const continuationFactors = [
        [contextPressure, 0.35],
        [qualityRisk, 0.30],
        [nextTaskSeparation, 0.15]
    ];
    if(quotaRisk !== null){
        continuationFactors.push([quotaRisk, 0.20]);
    }
    const continuationWeight = continuationFactors.reduce((total, factor) => total + factor[1], 0);
    const continuationRisk = continuationFactors.reduce((total, factor) => total + factor[0] * factor[1], 0) / continuationWeight;
    const transitionCost =
        (100 - handoffReadiness) * 0.45
        + unrecordedKnowledge * 0.25
        + projectComplexityScores[signals.projectComplexity] * 0.15
        + atomicRisk * 0.15;
    const transitionAdvantage = continuationRisk - transitionCost;

    const hardTransition = signals.usageWarning
        || (signals.usageRemainingPercent !== null && signals.usageRemainingPercent <= 10)
        || qualityRisk >= 80;
    const transitionRecommended = hardTransition || continuationRisk >= 70 || transitionAdvantage >= 25;

    let decision = decisions.CONTINUE;
    if(signals.atomicOperation && transitionRecommended){
        decision = decisions.FINISH_SAFE_BOUNDARY;
    }else if(hardTransition){
        decision = decisions.HANDOFF_NOW;
    }else if(transitionRecommended){
        decision = decisions.HANDOFF_AT_CHECKPOINT;
    }else if(continuationRisk >= 50 || transitionAdvantage >= 10){
        decision = decisions.PREPARE_HANDOFF;
    }

    const reasons = [];
    if(contextPressure >= 70){ reasons.push(`observable context pressure is high (${round(contextPressure)}/100)`); }
    if(qualityRisk >= 50){ reasons.push(`quality-risk signals are elevated (${round(qualityRisk)}/100)`); }
    if(signals.newMilestoneNext){ reasons.push("the next substantial task is a distinct milestone or investigation"); }
    if(handoffReadiness >= 80){ reasons.push(`repository handoff readiness is strong (${round(handoffReadiness)}/100)`); }
    if(signals.usageWarning){ reasons.push("an explicit product usage warning was observed"); }
    if(signals.usageRemainingPercent !== null && signals.usageRemainingPercent <= 10){ reasons.push("reported usage remaining is at or below 10 percent"); }
    if(signals.atomicOperation){ reasons.push("an atomic or unsafe-to-interrupt operation is in progress"); }
    if(repositoryState.dirty){ reasons.push("the working tree contains uncommitted changes"); }
    if(repositoryState.missingContinuityFiles.length){ reasons.push(`continuity files are missing: ${repositoryState.missingContinuityFiles.join(", ")}`); }
    if(!reasons.length){ reasons.push("observable risk remains lower than the verified transition cost"); }

    return {
        environmentId: state.environmentId,
        lifecycle: state.lifecycle,
        decision,
        scores: {
            contextPressure: round(contextPressure),
            qualityRisk: round(qualityRisk),
            quotaRisk: quotaRisk === null ? null : round(quotaRisk),
            nextTaskSeparation: round(nextTaskSeparation),
            handoffReadiness: round(handoffReadiness),
            atomicRisk: round(atomicRisk),
            continuationRisk: round(continuationRisk),
            transitionCost: round(transitionCost),
            transitionAdvantage: round(transitionAdvantage)
        },
        reasons,
        repository: repositoryState
    };
}

function actionFor(decision){
    switch(decision){
        case decisions.PREPARE_HANDOFF:
            return "Update the status and rolling handoff, finish the current bounded checkpoint, and reassess before starting another milestone.";
        case decisions.HANDOFF_AT_CHECKPOINT:
            return "Finish or safely revert only the current bounded operation, freeze exact repository evidence, give the owner the generated prompt, and transition before another substantial task.";
        case decisions.HANDOFF_NOW:
            return "Do not start more work. Verify the repository boundary, update the public handoff, give the owner the generated prompt, and transition now.";
        case decisions.FINISH_SAFE_BOUNDARY:
            return "Do not abandon the atomic operation. Complete or safely revert the minimum required to restore a coherent boundary, then hand off immediately.";
        default:
            return "Continue the currently authorized bounded task and reassess at the next meaningful checkpoint.";
    }
}

function formatAssessment(state, assessment){
    const usage = assessment.scores.quotaRisk === null
        ? "unknown — not estimated"
        : `${assessment.scores.quotaRisk}/100 risk from ${state.signals.usageSource}`;
    const changed = assessment.repository.changedFiles.length
        ? assessment.repository.changedFiles.join(", ")
        : "none";
    return [
        "Work Environment Continuity Assessment",
        `Environment: ${assessment.environmentId}`,
        `Lifecycle: ${assessment.lifecycle}`,
        `Decision: ${assessment.decision}`,
        `Context pressure: ${assessment.scores.contextPressure}/100`,
        `Quality risk: ${assessment.scores.qualityRisk}/100`,
        `Usage risk: ${usage}`,
        `Handoff readiness: ${assessment.scores.handoffReadiness}/100`,
        `Continuation risk: ${assessment.scores.continuationRisk}/100`,
        `Transition cost: ${assessment.scores.transitionCost}/100`,
        `Transition advantage: ${assessment.scores.transitionAdvantage}`,
        `Git branch: ${assessment.repository.branch}`,
        `Git HEAD: ${assessment.repository.head}`,
        `Observed origin/main: ${assessment.repository.originMain}`,
        `Uncommitted files: ${changed}`,
        "Reasons:",
        ...assessment.reasons.map(reason => `  - ${reason}`),
        `Required action: ${actionFor(assessment.decision)}`
    ].join("\n");
}

function promptList(items){
    return items.length ? items.map(item => `- ${item}`).join("\n") : "- None recorded.";
}

function buildHandoffPrompt(state, assessment){
    return [
        "===== BEGIN READY-TO-PASTE WORK ENVIRONMENT HANDOFF =====",
        "Treat this handoff as orientation, never as implementation authority. Current source and live GitHub state override every recorded SHA, branch, PR, release, workflow, deployment and historical statement.",
        "",
        `Repository: ${state.repository.name}`,
        `Public site: ${state.repository.publicSite}`,
        `Prior environment: ${state.environmentId}`,
        `Recorded transition decision: ${assessment.decision}`,
        `Recorded local HEAD: ${assessment.repository.head}`,
        `Recorded origin/main: ${assessment.repository.originMain}`,
        "",
        "Before making any change:",
        "1. Fetch live main, recent commits, tags, releases, open pull requests and active branches.",
        "2. Inspect the deployed site, current tests and repository authority documents.",
        "3. Read AGENTS.md, 00_HANDOFF_GOLDEN_RULE.md, 00_WORK_ENVIRONMENT_CONTINUITY.md, WORK_ENVIRONMENT_STATUS.json, WORK_ENVIRONMENT_HISTORY.md, 00_DEVELOPER_START_HERE.md, 00_CURRENT_HANDOFF.md, PROJECT_STATE.md and NEXT_TASK.md.",
        "4. Run npm run work:continuity:validate against the inherited status record before changing it.",
        "5. If that record belongs to an earlier environment, archive its final facts, replace it with a new unique environment ID, reset every per-environment observation and record live main as repository.startingMainSha.",
        "6. Only after the current environment owns WORK_ENVIRONMENT_STATUS.json, run npm run work:assess and obey that new environment's decision. Never treat the predecessor's transition decision as the successor's starting decision.",
        "7. Reconstruct the exact newest production boundary. Do not trust this prompt over current source.",
        "",
        "Current bounded task at the prior checkpoint:",
        state.continuity.currentTask,
        "",
        "Last safe checkpoint:",
        state.continuity.lastSafeCheckpoint,
        "",
        "Unfinished or conditional work:",
        promptList(state.continuity.unfinishedWork),
        "",
        "Known hazards and rejected assumptions:",
        promptList(state.continuity.knownHazards),
        "",
        "IMMEDIATE NEXT TASK AFTER FULL STUDY",
        state.continuity.nextSafeAction,
        "",
        "Do not ask the owner to reconstruct prior chats. Do not infer implementation authority from roadmap order, an old branch, an old PR or this handoff. Do not invent an exact usage percentage: use the product usage dashboard, CLI /status or an explicit user report; otherwise record usage as unknown.",
        "",
        "Maintain the same continuity system recursively. At each meaningful checkpoint update the machine-readable status and rolling handoff. If the assessment says PREPARE_HANDOFF, HANDOFF_AT_CHECKPOINT, HANDOFF_NOW or FINISH_SAFE_BOUNDARY, obey the corresponding safe-boundary action and provide the next ready-to-paste prompt.",
        "===== END READY-TO-PASTE WORK ENVIRONMENT HANDOFF ====="
    ].join("\n");
}

function parseArguments(argv){
    const options = { command: "assess", statePath: defaultStatePath, json: false };
    const args = [...argv];
    if(args[0] && !args[0].startsWith("--")){
        options.command = args.shift();
    }
    while(args.length){
        const flag = args.shift();
        if(flag === "--state"){
            options.statePath = args.shift();
        }else if(flag === "--json"){
            options.json = true;
        }else if(flag === "--usage-remaining"){
            options.usageRemainingPercent = Number(args.shift());
        }else if(flag === "--usage-source"){
            options.usageSource = args.shift();
        }else if(flag === "--usage-warning"){
            options.usageWarning = true;
        }else{
            throw new Error(`Unknown argument: ${flag}`);
        }
    }
    ensure(["assess", "handoff", "validate"].includes(options.command), "Command must be assess, handoff or validate.");
    return options;
}

function main(){
    const options = parseArguments(process.argv.slice(2));
    const state = withOverrides(readState(options.statePath), {
        usageRemainingPercent: options.usageRemainingPercent,
        usageSource: options.usageSource,
        usageWarning: options.usageWarning
    });
    const assessment = assessState(state);

    if(options.command === "validate"){
        ensure(!assessment.repository.missingContinuityFiles.length, `Missing continuity files: ${assessment.repository.missingContinuityFiles.join(", ")}`);
        process.stdout.write(`PASS Work Environment Continuity schema and repository integration for ${state.environmentId}.\n`);
        return;
    }
    if(options.json){
        process.stdout.write(`${JSON.stringify(assessment, null, 2)}\n`);
        return;
    }
    process.stdout.write(`${formatAssessment(state, assessment)}\n`);
    if(options.command === "handoff"){
        process.stdout.write(`\n${buildHandoffPrompt(state, assessment)}\n`);
    }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if(invokedPath === fileURLToPath(import.meta.url)){
    try{
        main();
    }catch(error){
        process.stderr.write(`Work Environment Continuity error: ${error.message}\n`);
        process.exitCode = 1;
    }
}

export {
    assessState,
    buildHandoffPrompt,
    collectRepositoryState,
    decisions,
    formatAssessment,
    parseGitStatusPaths,
    readState,
    requiredContinuityFiles,
    validateState,
    withOverrides
};
