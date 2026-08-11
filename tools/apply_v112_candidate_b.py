from __future__ import annotations

from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


def replace_required(path: str, old: str, new: str, expected: int | None = None) -> None:
    text = read(path)
    count = text.count(old)
    if count == 0:
        raise RuntimeError(f"{path}: required source fragment not found: {old[:100]!r}")
    if expected is not None and count != expected:
        raise RuntimeError(f"{path}: expected {expected} matches, found {count}: {old[:100]!r}")
    write(path, text.replace(old, new))


IMPORT_ANALYSIS_JS = r'''/* =====================================================
   Career Mode Showdown v1.1.2
   Candidate B — Import Analysis + Migration Preview
   Read-only. No restore writes are legal in this module.
===================================================== */

(function initializeImportAnalysisModule(){
    "use strict";

    const CAREER_MODE_IMPORT_MAX_BYTES = 5 * 1024 * 1024;
    const CURRENT_SHOWDOWN_IMPORT_SCHEMA = 2;
    const CURRENT_PREFERENCES_IMPORT_SCHEMA = 2;
    const ALLOWED_SHOWDOWN_ROUNDS = Object.freeze([1, 3, 5, 10]);
    const FORBIDDEN_STRUCTURE_KEYS = new Set(["__proto__", "prototype", "constructor"]);
    const MAX_IMPORT_STRUCTURE_DEPTH = 48;

    function isPlainImportObject(value){
        if(!value || typeof value !== "object" || Array.isArray(value)){ return false; }
        const prototype = Object.getPrototypeOf(value);
        return prototype === Object.prototype || prototype === null;
    }

    function cloneImportValue(value){
        if(value === null || value === undefined){ return value ?? null; }
        if(typeof structuredClone === "function"){
            try{ return structuredClone(value); }catch(error){ /* JSON fallback below. */ }
        }
        return JSON.parse(JSON.stringify(value));
    }

    function canonicalizeImportValue(value){
        if(Array.isArray(value)){
            return value.map(canonicalizeImportValue);
        }
        if(value && typeof value === "object"){
            return Object.keys(value).sort().reduce((result, key) => {
                result[key] = canonicalizeImportValue(value[key]);
                return result;
            }, Object.create(null));
        }
        return value;
    }

    function canonicalImportString(value){
        return JSON.stringify(canonicalizeImportValue(value));
    }

    function byteLengthOfImportText(text){
        if(typeof TextEncoder === "function"){
            return new TextEncoder().encode(String(text)).byteLength;
        }
        return new Blob([String(text)]).size;
    }

    function inspectImportStructure(value){
        const problems = [];
        const stack = [{ value, path: "$", depth: 0 }];
        let visited = 0;

        while(stack.length){
            const current = stack.pop();
            visited += 1;
            if(visited > 250000){
                problems.push("Backup structure contains too many nested values to analyze safely.");
                break;
            }
            if(current.depth > MAX_IMPORT_STRUCTURE_DEPTH){
                problems.push(`Backup structure exceeds the supported nesting depth near ${current.path}.`);
                break;
            }
            if(!current.value || typeof current.value !== "object"){ continue; }

            const keys = Object.keys(current.value);
            for(const key of keys){
                if(FORBIDDEN_STRUCTURE_KEYS.has(key)){
                    problems.push(`Backup contains a forbidden object key at ${current.path}.${key}.`);
                    continue;
                }
                const child = current.value[key];
                if(child && typeof child === "object"){
                    stack.push({ value: child, path: `${current.path}.${key}`, depth: current.depth + 1 });
                }
            }
        }

        return problems;
    }

    function getImportSchemaVersion(value, fallback = 1){
        if(value === null || value === undefined || value === ""){ return fallback; }
        const version = Number(value);
        return Number.isInteger(version) ? version : NaN;
    }

    function migrateShowdownSchema1To2(input){
        const showdown = cloneImportValue(input);
        showdown.schemaVersion = 2;
        showdown.name = typeof showdown.name === "string" && showdown.name.trim() ? showdown.name : "Unnamed Showdown";
        showdown.managers = isPlainImportObject(showdown.managers) ? showdown.managers : { playerOne: "Manager 1", playerTwo: "Manager 2" };
        showdown.managers.playerOne = showdown.managers.playerOne || "Manager 1";
        showdown.managers.playerTwo = showdown.managers.playerTwo || "Manager 2";
        const requestedRounds = Number(showdown.totalRounds) || 1;
        showdown.totalRounds = ALLOWED_SHOWDOWN_ROUNDS.includes(requestedRounds) ? requestedRounds : 1;
        showdown.currentRound = Math.max(1, Math.min(Number(showdown.currentRound) || 1, showdown.totalRounds));
        showdown.status = showdown.status || "Created";
        showdown.selectedLeague = showdown.selectedLeague || null;
        showdown.clubs = isPlainImportObject(showdown.clubs) ? showdown.clubs : { playerOne: null, playerTwo: null };
        showdown.clubs.playerOne = showdown.clubs.playerOne || null;
        showdown.clubs.playerTwo = showdown.clubs.playerTwo || null;
        showdown.score = isPlainImportObject(showdown.score) ? showdown.score : { playerOne: 0, playerTwo: 0 };
        showdown.score.playerOne = Number(showdown.score.playerOne) || 0;
        showdown.score.playerTwo = Number(showdown.score.playerTwo) || 0;
        showdown.transferChallenges = Array.isArray(showdown.transferChallenges) ? showdown.transferChallenges : [];
        showdown.rounds = Array.isArray(showdown.rounds) ? showdown.rounds : [];
        showdown.integrityWarnings = Array.isArray(showdown.integrityWarnings) ? showdown.integrityWarnings : [];
        showdown.createdAt = showdown.createdAt || null;
        showdown.updatedAt = showdown.updatedAt || null;
        showdown.completedAt = showdown.completedAt || null;
        showdown.archivedAt = showdown.archivedAt || null;
        return showdown;
    }

    function migratePreferencesSchema1To2(input){
        return {
            ...cloneImportValue(input),
            schemaVersion: 2,
            reducedMotion: Boolean(input && input.reducedMotion),
            menuFeedback: !input || input.menuFeedback !== false
        };
    }

    const IMPORT_MIGRATION_REGISTRY = Object.freeze({
        showdown: Object.freeze([
            Object.freeze({
                id: "showdown-schema-1-to-2",
                from: 1,
                to: 2,
                migrate: migrateShowdownSchema1To2
            })
        ]),
        preferences: Object.freeze([
            Object.freeze({
                id: "preferences-schema-1-to-2",
                from: 1,
                to: 2,
                migrate: migratePreferencesSchema1To2
            })
        ])
    });

    function getImportTargetSchema(type){
        if(type === "showdown"){ return CURRENT_SHOWDOWN_IMPORT_SCHEMA; }
        if(type === "preferences"){ return CURRENT_PREFERENCES_IMPORT_SCHEMA; }
        throw new Error(`Unknown import migration type: ${type}`);
    }

    function migrateCareerModeImportRecord(type, input){
        if(!isPlainImportObject(input)){
            return { ok: false, error: `${type} record is not an object.`, value: null, sourceVersion: null, targetVersion: getImportTargetSchema(type), steps: [] };
        }

        const structureProblems = inspectImportStructure(input);
        if(structureProblems.length){
            return { ok: false, error: structureProblems[0], value: null, sourceVersion: null, targetVersion: getImportTargetSchema(type), steps: [] };
        }

        const targetVersion = getImportTargetSchema(type);
        const sourceVersion = getImportSchemaVersion(input.schemaVersion, 1);
        if(!Number.isInteger(sourceVersion) || sourceVersion < 1){
            return { ok: false, error: `${type} schema version is invalid.`, value: null, sourceVersion, targetVersion, steps: [] };
        }
        if(sourceVersion > targetVersion){
            return { ok: false, error: `${type} schema v${sourceVersion} is newer than this app supports (v${targetVersion}).`, value: null, sourceVersion, targetVersion, steps: [], futureSchema: true };
        }

        let value = cloneImportValue(input);
        let version = sourceVersion;
        const steps = [];
        const registry = IMPORT_MIGRATION_REGISTRY[type] || [];

        while(version < targetVersion){
            const step = registry.find(candidate => candidate.from === version);
            if(!step){
                return { ok: false, error: `No supported ${type} migration exists from schema v${version}.`, value: null, sourceVersion, targetVersion, steps };
            }
            const before = canonicalImportString(value);
            const migrated = step.migrate(value);
            if(!isPlainImportObject(migrated) || Number(migrated.schemaVersion) !== step.to){
                return { ok: false, error: `Migration ${step.id} did not produce schema v${step.to}.`, value: null, sourceVersion, targetVersion, steps };
            }
            if(canonicalImportString(value) !== before){
                return { ok: false, error: `Migration ${step.id} mutated its input object.`, value: null, sourceVersion, targetVersion, steps };
            }
            value = migrated;
            version = step.to;
            steps.push(step.id);
        }

        return { ok: true, error: null, value, sourceVersion, targetVersion, steps };
    }

    function isFiniteNumber(value){
        return Number.isFinite(Number(value));
    }

    function isNullableString(value){
        return value === null || value === undefined || typeof value === "string";
    }

    function validateCurrentShowdownRecord(showdown){
        const errors = [];
        if(!isPlainImportObject(showdown)){ return ["Showdown record is not an object."]; }
        if(Number(showdown.schemaVersion) !== CURRENT_SHOWDOWN_IMPORT_SCHEMA){ errors.push(`Showdown schema must be v${CURRENT_SHOWDOWN_IMPORT_SCHEMA}.`); }
        if(showdown.id === null || showdown.id === undefined || String(showdown.id).trim() === ""){ errors.push("Showdown ID is missing."); }
        if(typeof showdown.name !== "string" || !showdown.name.trim()){ errors.push("Showdown name is missing."); }
        if(!isPlainImportObject(showdown.managers) || typeof showdown.managers.playerOne !== "string" || typeof showdown.managers.playerTwo !== "string"){ errors.push("Showdown managers are invalid."); }
        if(!ALLOWED_SHOWDOWN_ROUNDS.includes(Number(showdown.totalRounds))){ errors.push("Showdown length is unsupported."); }
        const currentRound = Number(showdown.currentRound);
        if(!Number.isInteger(currentRound) || currentRound < 1 || currentRound > Number(showdown.totalRounds)){ errors.push("Showdown current round is invalid."); }
        if(typeof showdown.status !== "string" || !showdown.status){ errors.push("Showdown status is invalid."); }
        if(showdown.selectedLeague !== null && showdown.selectedLeague !== undefined){
            if(!isPlainImportObject(showdown.selectedLeague) || typeof showdown.selectedLeague.id !== "string" || !showdown.selectedLeague.id){ errors.push("Selected league is invalid."); }
        }
        if(!isPlainImportObject(showdown.clubs) || !isNullableString(showdown.clubs.playerOne) || !isNullableString(showdown.clubs.playerTwo)){ errors.push("Showdown club assignment is invalid."); }
        if(!isPlainImportObject(showdown.score) || !isFiniteNumber(showdown.score.playerOne) || !isFiniteNumber(showdown.score.playerTwo)){ errors.push("Showdown score is invalid."); }
        if(!Array.isArray(showdown.transferChallenges)){ errors.push("Transfer Challenge history is invalid."); }
        if(!Array.isArray(showdown.rounds)){ errors.push("Season history is invalid."); }
        if(!Array.isArray(showdown.integrityWarnings)){ errors.push("Showdown integrity warnings are invalid."); }
        for(const field of ["createdAt", "updatedAt", "completedAt", "archivedAt"]){
            if(!isNullableString(showdown[field])){ errors.push(`${field} must be a string or null.`); }
        }
        if(Array.isArray(showdown.rounds)){
            showdown.rounds.forEach((round, index) => {
                if(!isPlainImportObject(round)){ errors.push(`Season ${index + 1} is not an object.`); return; }
                const roundNumber = Number(round.roundNumber);
                if(!Number.isInteger(roundNumber) || roundNumber < 1){ errors.push(`Season ${index + 1} has an invalid round number.`); }
                if(!isPlainImportObject(round.playerOne) || !isPlainImportObject(round.playerTwo)){ errors.push(`Season ${index + 1} manager results are incomplete.`); }
            });
        }
        if(Array.isArray(showdown.transferChallenges)){
            showdown.transferChallenges.forEach((challenge, index) => {
                if(!isPlainImportObject(challenge)){ errors.push(`Transfer Challenge ${index + 1} is not an object.`); }
            });
        }
        return errors;
    }

    function validateCurrentPreferencesRecord(preferences){
        const errors = [];
        if(!isPlainImportObject(preferences)){ return ["Preferences record is not an object."]; }
        if(Number(preferences.schemaVersion) !== CURRENT_PREFERENCES_IMPORT_SCHEMA){ errors.push(`Preferences schema must be v${CURRENT_PREFERENCES_IMPORT_SCHEMA}.`); }
        if(typeof preferences.reducedMotion !== "boolean"){ errors.push("Reduced-motion preference must be boolean."); }
        if(typeof preferences.menuFeedback !== "boolean"){ errors.push("Menu-feedback preference must be boolean."); }
        return errors;
    }

    function analyzeShowdownRecord(record, path){
        const migration = migrateCareerModeImportRecord("showdown", record);
        if(!migration.ok){
            return { ok: false, path, id: null, value: null, migration, errors: [migration.error] };
        }
        const errors = validateCurrentShowdownRecord(migration.value);
        return {
            ok: errors.length === 0,
            path,
            id: migration.value.id === null || migration.value.id === undefined ? null : String(migration.value.id),
            name: typeof migration.value.name === "string" ? migration.value.name : "Unnamed Showdown",
            value: migration.value,
            migration,
            errors
        };
    }

    function analyzePreferencesRecord(record, path){
        const migration = migrateCareerModeImportRecord("preferences", record);
        if(!migration.ok){
            return { ok: false, path, value: null, migration, errors: [migration.error] };
        }
        const errors = validateCurrentPreferencesRecord(migration.value);
        return { ok: errors.length === 0, path, value: migration.value, migration, errors };
    }

    function parseLocalRawValue(raw, label){
        if(raw === null){ return { state: "missing", value: null, warning: null }; }
        try{
            return { state: "parsed", value: JSON.parse(raw), warning: null };
        }catch(error){
            return { state: "corrupt", value: null, warning: `${label} currently contains unreadable bytes; preview will not modify or erase them.` };
        }
    }

    function buildLocalComparisonState(){
        const raw = typeof window.captureCareerModeRawBackupInputs === "function"
            ? window.captureCareerModeRawBackupInputs()
            : { activeShowdown: null, legacyShowdowns: null, preferences: null };
        const warnings = [];

        const activeRaw = parseLocalRawValue(raw.activeShowdown, "The active Showdown slot");
        const legacyRaw = parseLocalRawValue(raw.legacyShowdowns, "Legacy history");
        const preferencesRaw = parseLocalRawValue(raw.preferences, "Application preferences");
        [activeRaw, legacyRaw, preferencesRaw].forEach(item => { if(item.warning){ warnings.push(item.warning); } });

        let activeCandidate = activeRaw.value;
        let activeSource = activeRaw.state;
        if(typeof currentShowdown !== "undefined" && isPlainImportObject(currentShowdown)){
            activeCandidate = cloneImportValue(currentShowdown);
            activeSource = "runtime";
        }

        let active = null;
        if(activeCandidate !== null){
            const analyzed = analyzeShowdownRecord(activeCandidate, "local.activeShowdown");
            if(analyzed.ok){ active = analyzed.value; }
            else { warnings.push("The current active Showdown could not be used for exact conflict comparison."); }
        }

        const legacy = [];
        if(legacyRaw.state === "parsed"){
            if(Array.isArray(legacyRaw.value)){
                legacyRaw.value.forEach((record, index) => {
                    const analyzed = analyzeShowdownRecord(record, `local.legacyShowdowns[${index}]`);
                    if(analyzed.ok){ legacy.push(analyzed.value); }
                    else { warnings.push(`Local Legacy record ${index + 1} could not be used for exact conflict comparison.`); }
                });
            }else{
                warnings.push("Current Legacy history has an unsupported top-level shape; preview will leave it untouched.");
            }
        }

        let preferences = null;
        if(preferencesRaw.state === "parsed" && preferencesRaw.value !== null){
            const analyzed = analyzePreferencesRecord(preferencesRaw.value, "local.preferences");
            if(analyzed.ok){ preferences = analyzed.value; }
            else { warnings.push("Current preferences could not be used for exact comparison."); }
        }

        return {
            raw,
            active,
            activeSource,
            activeRawState: activeRaw.state,
            legacy,
            legacyRawState: legacyRaw.state,
            preferences,
            preferencesRawState: preferencesRaw.state,
            warnings
        };
    }

    function effectiveShowdownRevision(showdown){
        return `${String(showdown && showdown.updatedAt || "")}\u0000${String(showdown && showdown.completedAt || "")}`;
    }

    function classifyShowdownAgainstLocal(showdown, localRecords){
        const id = String(showdown.id);
        const matches = localRecords.filter(item => item && String(item.record.id) === id);
        if(!matches.length){ return { category: "new-record", matches: [] }; }

        const canonical = canonicalImportString(showdown);
        const exact = matches.filter(item => canonicalImportString(item.record) === canonical);
        if(exact.length){ return { category: "exact-duplicate", matches: exact.map(item => item.location) }; }

        const revision = effectiveShowdownRevision(showdown);
        const sameRevision = matches.filter(item => effectiveShowdownRevision(item.record) === revision);
        if(sameRevision.length){ return { category: "same-id-same-effective-revision", matches: sameRevision.map(item => item.location) }; }
        return { category: "same-id-different-revision", matches: matches.map(item => item.location) };
    }

    function importedCountsForEnvelope(payload){
        return {
            activeShowdowns: payload.activeShowdown ? 1 : 0,
            legacyShowdowns: Array.isArray(payload.legacyShowdowns) ? payload.legacyShowdowns.length : 0,
            preferenceRecords: payload.preferences ? 1 : 0
        };
    }

    function validateEnvelopeCounts(envelope, payload){
        const expected = importedCountsForEnvelope(payload);
        if(!isPlainImportObject(envelope.counts)){
            return ["Backup counts metadata is missing or invalid."];
        }
        const errors = [];
        for(const key of Object.keys(expected)){
            if(Number(envelope.counts[key]) !== expected[key]){
                errors.push(`Backup counts metadata does not match payload for ${key}.`);
            }
        }
        return errors;
    }

    function summarizeMigrations(items){
        return items
            .filter(item => item && item.migration && item.migration.ok)
            .map(item => ({
                path: item.path,
                type: item.path.includes("preferences") ? "preferences" : "showdown",
                sourceVersion: item.migration.sourceVersion,
                targetVersion: item.migration.targetVersion,
                steps: item.migration.steps.slice()
            }))
            .filter(item => item.steps.length > 0);
    }

    function createBlockedAnalysis(source, errors, warnings = []){
        return {
            ok: false,
            readyForRestore: false,
            status: "blocked",
            source,
            format: null,
            checksum: { verified: false, algorithm: null },
            migrations: [],
            preview: null,
            migratedPayload: null,
            warnings: warnings.slice(),
            errors: errors.slice()
        };
    }

    async function analyzeCareerModeBackupEnvelope(envelopeInput, options = {}){
        const source = {
            name: String(options.sourceName || "backup.json"),
            sizeBytes: Number(options.sourceSize) || 0
        };
        if(!isPlainImportObject(envelopeInput)){
            return createBlockedAnalysis(source, ["Backup root must be a JSON object."]);
        }

        const structureProblems = inspectImportStructure(envelopeInput);
        if(structureProblems.length){
            return createBlockedAnalysis(source, structureProblems);
        }

        const envelope = cloneImportValue(envelopeInput);
        const warnings = [];
        const errors = [];
        const expectedFormatId = window.CAREER_MODE_BACKUP_FORMAT_ID || "career-mode-showdown-backup";
        const expectedFormatVersion = Number(window.CAREER_MODE_BACKUP_FORMAT_VERSION || 1);

        if(envelope.formatId !== expectedFormatId){
            errors.push(`Unsupported backup format ID: ${String(envelope.formatId || "missing")}.`);
        }
        const formatVersion = Number(envelope.formatVersion);
        if(!Number.isInteger(formatVersion)){
            errors.push("Backup format version is missing or invalid.");
        }else if(formatVersion > expectedFormatVersion){
            errors.push(`Backup format v${formatVersion} is newer than this app supports (v${expectedFormatVersion}).`);
        }else if(formatVersion !== expectedFormatVersion){
            errors.push(`Backup format v${formatVersion} is not supported by this Candidate B analyzer.`);
        }
        if(errors.length){
            return createBlockedAnalysis(source, errors, warnings);
        }

        if(envelope.checksumAlgorithm !== "SHA-256" || typeof envelope.checksum !== "string" || !/^[a-f0-9]{64}$/i.test(envelope.checksum)){
            return createBlockedAnalysis(source, ["Backup checksum metadata is missing or invalid."], warnings);
        }
        if(typeof window.verifyCareerModeBackupEnvelopeChecksum !== "function"){
            return createBlockedAnalysis(source, ["Checksum verification authority is unavailable."], warnings);
        }

        let checksumVerified = false;
        try{
            checksumVerified = await window.verifyCareerModeBackupEnvelopeChecksum(envelope);
        }catch(error){
            return createBlockedAnalysis(source, [`Checksum verification could not run: ${error.message || String(error)}`], warnings);
        }
        if(!checksumVerified){
            return createBlockedAnalysis(source, ["Backup checksum does not match its contents. The file may be damaged or edited."], warnings);
        }

        if(!isPlainImportObject(envelope.payload)){
            return createBlockedAnalysis(source, ["Backup payload is missing or invalid."], warnings);
        }

        const payload = envelope.payload;
        errors.push(...validateEnvelopeCounts(envelope, payload));
        if(Array.isArray(envelope.warnings) && envelope.warnings.length){
            warnings.push(...envelope.warnings.map(message => `Backup export warning: ${String(message)}`));
        }
        if(envelope.recovery && isPlainImportObject(envelope.recovery)){
            warnings.push("This backup contains raw recovery bytes from unreadable source storage. Candidate B previews canonical payload only and never applies raw recovery bytes.");
        }

        let importedActive = null;
        if(payload.activeShowdown !== null && payload.activeShowdown !== undefined){
            importedActive = analyzeShowdownRecord(payload.activeShowdown, "payload.activeShowdown");
            if(!importedActive.ok){ errors.push(...importedActive.errors.map(message => `Active Showdown: ${message}`)); }
        }

        const importedLegacy = [];
        if(payload.legacyShowdowns !== null && payload.legacyShowdowns !== undefined){
            if(!Array.isArray(payload.legacyShowdowns)){
                errors.push("Legacy payload must be an array or null.");
            }else{
                payload.legacyShowdowns.forEach((record, index) => {
                    const analyzed = analyzeShowdownRecord(record, `payload.legacyShowdowns[${index}]`);
                    importedLegacy.push(analyzed);
                    if(!analyzed.ok){ errors.push(...analyzed.errors.map(message => `Legacy record ${index + 1}: ${message}`)); }
                });
            }
        }

        let importedPreferences = null;
        if(payload.preferences !== null && payload.preferences !== undefined){
            importedPreferences = analyzePreferencesRecord(payload.preferences, "payload.preferences");
            if(!importedPreferences.ok){ errors.push(...importedPreferences.errors.map(message => `Preferences: ${message}`)); }
        }

        const internalIdGroups = new Map();
        importedLegacy.filter(item => item.ok).forEach(item => {
            const key = item.id;
            if(!internalIdGroups.has(key)){ internalIdGroups.set(key, []); }
            internalIdGroups.get(key).push(item);
        });
        for(const [id, group] of internalIdGroups){
            if(group.length < 2){ continue; }
            const unique = new Set(group.map(item => canonicalImportString(item.value)));
            if(unique.size === 1){
                warnings.push(`Backup Legacy contains ${group.length} identical records with Showdown ID ${id}. Candidate B does not silently deduplicate them.`);
                group.forEach(item => { item.internalDuplicate = "exact"; });
            }else{
                errors.push(`Backup Legacy contains conflicting records with the same Showdown ID ${id}. Explicit resolution is required in a later restore stage.`);
                group.forEach(item => { item.internalDuplicate = "conflict"; });
            }
        }

        const local = buildLocalComparisonState();
        warnings.push(...local.warnings);
        const localShowdowns = [];
        if(local.active){ localShowdowns.push({ location: "active", record: local.active }); }
        local.legacy.forEach((record, index) => localShowdowns.push({ location: `legacy:${index}`, record }));

        let activePreview = { kind: "none", conflictCategory: null, matches: [], label: "Backup contains no active Showdown." };
        if(importedActive && importedActive.ok){
            if(local.active){
                const comparison = classifyShowdownAgainstLocal(importedActive.value, [{ location: "active", record: local.active }]);
                if(comparison.category === "exact-duplicate"){
                    activePreview = { kind: "no-change", conflictCategory: comparison.category, matches: comparison.matches, label: "Active Showdown is already identical." };
                }else if(comparison.category === "same-id-same-effective-revision" || comparison.category === "same-id-different-revision"){
                    activePreview = { kind: "conflict", conflictCategory: comparison.category, matches: comparison.matches, label: "Active Showdown uses the same ID but differs from the current active record." };
                }else{
                    activePreview = { kind: "replace", conflictCategory: comparison.category, matches: comparison.matches, label: "A different active Showdown is already stored; any later restore would require explicit replacement approval." };
                }
            }else if(local.activeRawState === "corrupt"){
                activePreview = { kind: "replace-uncertain", conflictCategory: "malformed-unresolvable", matches: [], label: "Current active bytes are unreadable. Candidate B will not overwrite them; a later restore would require explicit recovery handling." };
            }else{
                activePreview = { kind: "add", conflictCategory: "new-record", matches: [], label: "Backup would add an active Showdown if explicitly restored later." };
            }
        }

        const legacyRecords = importedLegacy.map(item => {
            if(!item.ok){
                return { path: item.path, id: item.id, name: item.name || "Invalid record", category: "malformed-unresolvable", matches: [], internalDuplicate: item.internalDuplicate || null };
            }
            const comparison = classifyShowdownAgainstLocal(item.value, localShowdowns);
            const category = item.internalDuplicate === "conflict" ? "malformed-unresolvable" : comparison.category;
            return { path: item.path, id: item.id, name: item.name, category, matches: comparison.matches, internalDuplicate: item.internalDuplicate || null };
        });
        const legacySummary = {
            total: legacyRecords.length,
            newRecords: legacyRecords.filter(item => item.category === "new-record").length,
            exactDuplicates: legacyRecords.filter(item => item.category === "exact-duplicate").length,
            sameEffectiveRevision: legacyRecords.filter(item => item.category === "same-id-same-effective-revision").length,
            differentRevision: legacyRecords.filter(item => item.category === "same-id-different-revision").length,
            malformedUnresolvable: legacyRecords.filter(item => item.category === "malformed-unresolvable").length,
            duplicateWithinBackup: legacyRecords.filter(item => item.internalDuplicate === "exact").length,
            records: legacyRecords
        };

        let preferencesPreview = { kind: "none", label: "Backup contains no application preferences." };
        if(importedPreferences && importedPreferences.ok){
            if(local.preferences){
                if(canonicalImportString(importedPreferences.value) === canonicalImportString(local.preferences)){
                    preferencesPreview = { kind: "no-change", label: "Application preferences are already identical." };
                }else{
                    preferencesPreview = { kind: "change", label: "Application preferences differ; a later restore must make preference replacement explicit." };
                }
            }else if(local.preferencesRawState === "corrupt"){
                preferencesPreview = { kind: "replace-uncertain", label: "Current preference bytes are unreadable and will remain untouched during preview." };
            }else{
                preferencesPreview = { kind: "add", label: "Backup contains preferences not currently stored." };
            }
        }

        const migrationItems = [importedActive, ...importedLegacy, importedPreferences].filter(Boolean);
        const migrations = summarizeMigrations(migrationItems);
        const migratedPayload = {
            activeShowdown: importedActive && importedActive.ok ? cloneImportValue(importedActive.value) : null,
            legacyShowdowns: Array.isArray(payload.legacyShowdowns)
                ? importedLegacy.map(item => item.ok ? cloneImportValue(item.value) : null)
                : null,
            preferences: importedPreferences && importedPreferences.ok ? cloneImportValue(importedPreferences.value) : null
        };

        const status = errors.length ? "blocked" : "ready";
        return {
            ok: errors.length === 0,
            readyForRestore: false,
            status,
            source,
            format: { id: envelope.formatId, version: formatVersion, appVersion: envelope.appVersion || null, runtimeRevision: envelope.runtimeRevision || null },
            checksum: { verified: true, algorithm: envelope.checksumAlgorithm, value: envelope.checksum },
            migrations,
            preview: {
                active: activePreview,
                legacy: legacySummary,
                preferences: preferencesPreview,
                localWarnings: local.warnings.length
            },
            migratedPayload,
            warnings,
            errors
        };
    }

    async function analyzeCareerModeBackupText(text, options = {}){
        const sourceName = String(options.sourceName || "backup.json");
        const measuredBytes = byteLengthOfImportText(text);
        const declaredBytes = Number(options.sourceSize);
        const sourceSize = Number.isFinite(declaredBytes) && declaredBytes >= 0 ? declaredBytes : measuredBytes;
        if(sourceSize > CAREER_MODE_IMPORT_MAX_BYTES || measuredBytes > CAREER_MODE_IMPORT_MAX_BYTES){
            return createBlockedAnalysis(
                { name: sourceName, sizeBytes: Math.max(sourceSize, measuredBytes) },
                [`Backup is too large to analyze safely. Maximum size is ${CAREER_MODE_IMPORT_MAX_BYTES} bytes.`]
            );
        }

        let parsed;
        try{
            parsed = JSON.parse(String(text));
        }catch(error){
            return createBlockedAnalysis(
                { name: sourceName, sizeBytes: measuredBytes },
                [`Backup is not valid JSON: ${error.message || String(error)}`]
            );
        }
        return analyzeCareerModeBackupEnvelope(parsed, { sourceName, sourceSize: measuredBytes });
    }

    async function analyzeCareerModeBackupFile(file){
        if(!file || typeof file.text !== "function"){
            return createBlockedAnalysis({ name: "unknown", sizeBytes: 0 }, ["Choose a readable JSON backup file first."]);
        }
        const sourceName = String(file.name || "backup.json");
        const sourceSize = Number(file.size) || 0;
        if(sourceSize > CAREER_MODE_IMPORT_MAX_BYTES){
            return createBlockedAnalysis(
                { name: sourceName, sizeBytes: sourceSize },
                [`${sourceName} is too large to analyze safely. Maximum size is ${CAREER_MODE_IMPORT_MAX_BYTES} bytes.`]
            );
        }
        let text;
        try{
            text = await file.text();
        }catch(error){
            return createBlockedAnalysis({ name: sourceName, sizeBytes: sourceSize }, [`The selected file could not be read: ${error.message || String(error)}`]);
        }
        return analyzeCareerModeBackupText(text, { sourceName, sourceSize });
    }

    function formatImportBytes(bytes){
        const value = Math.max(0, Number(bytes) || 0);
        if(value < 1024){ return `${value} B`; }
        if(value < 1024 * 1024){ return `${(value / 1024).toFixed(1)} KB`; }
        return `${(value / (1024 * 1024)).toFixed(2)} MB`;
    }

    function createImportElement(tagName, className = "", text = ""){
        const element = document.createElement(tagName);
        if(className){ element.className = className; }
        if(text){ element.textContent = text; }
        return element;
    }

    function renderImportAnalysisResult(target, analysis){
        target.replaceChildren();
        const verdict = createImportElement("div", `legacyImportVerdict ${analysis.ok ? "ready" : "blocked"}`);
        verdict.append(
            createImportElement("strong", "", analysis.ok ? "PREVIEW READY" : "ANALYSIS BLOCKED"),
            createImportElement("span", "", analysis.ok
                ? "Backup passed Candidate B analysis. Nothing has been restored or written."
                : "The file cannot advance to a later restore stage until the listed problems are resolved.")
        );
        target.appendChild(verdict);

        if(analysis.preview){
            const grid = createImportElement("div", "legacyImportPreviewGrid");
            const addCard = (label, value, detail) => {
                const card = createImportElement("div", "legacyImportPreviewCard");
                card.append(createImportElement("span", "", label), createImportElement("strong", "", value), createImportElement("small", "", detail));
                grid.appendChild(card);
            };
            addCard("CHECKSUM", analysis.checksum.verified ? "VERIFIED" : "FAILED", analysis.checksum.algorithm || "Unavailable");
            addCard("ACTIVE SHOWDOWN", String(analysis.preview.active.kind).replaceAll("-", " ").toUpperCase(), analysis.preview.active.label);
            const legacy = analysis.preview.legacy;
            addCard("LEGACY", `${legacy.newRecords} NEW · ${legacy.exactDuplicates} EXACT`, `${legacy.sameEffectiveRevision} same-revision · ${legacy.differentRevision} different-revision · ${legacy.malformedUnresolvable} unresolved`);
            addCard("PREFERENCES", String(analysis.preview.preferences.kind).replaceAll("-", " ").toUpperCase(), analysis.preview.preferences.label);
            target.appendChild(grid);

            if(analysis.migrations.length){
                const migration = createImportElement("div", "legacyImportMigrationSummary");
                migration.appendChild(createImportElement("strong", "", "MIGRATION PREVIEW"));
                analysis.migrations.slice(0, 10).forEach(item => {
                    migration.appendChild(createImportElement("span", "", `${item.path}: schema ${item.sourceVersion} → ${item.targetVersion} · ${item.steps.join(", ")}`));
                });
                if(analysis.migrations.length > 10){ migration.appendChild(createImportElement("span", "", `+ ${analysis.migrations.length - 10} additional migration record(s)`)); }
                target.appendChild(migration);
            }

            const notable = legacy.records.filter(item => item.category !== "exact-duplicate").slice(0, 10);
            if(notable.length){
                const conflicts = createImportElement("div", "legacyImportConflictList");
                conflicts.appendChild(createImportElement("strong", "", "LEGACY RECORD PREVIEW"));
                notable.forEach(item => conflicts.appendChild(createImportElement("span", "", `${item.name || "Record"} · ID ${item.id || "unresolved"} · ${item.category.replaceAll("-", " ")}`)));
                if(legacy.records.length > notable.length){ conflicts.appendChild(createImportElement("span", "", `Preview limited to 10 notable records; totals above include all ${legacy.records.length}.`)); }
                target.appendChild(conflicts);
            }
        }

        const appendMessages = (messages, className, heading) => {
            if(!messages.length){ return; }
            const block = createImportElement("div", className);
            block.appendChild(createImportElement("strong", "", heading));
            const list = document.createElement("ul");
            messages.slice(0, 12).forEach(message => {
                const item = document.createElement("li");
                item.textContent = String(message);
                list.appendChild(item);
            });
            if(messages.length > 12){
                const item = document.createElement("li");
                item.textContent = `+ ${messages.length - 12} additional message(s)`;
                list.appendChild(item);
            }
            block.appendChild(list);
            target.appendChild(block);
        };
        appendMessages(analysis.errors || [], "legacyImportMessages errors", "BLOCKING PROBLEMS");
        appendMessages(analysis.warnings || [], "legacyImportMessages warnings", "WARNINGS / REVIEW NOTES");
    }

    let selectedImportFile = null;
    let importAnalysisInProgress = false;

    function mountCareerModeImportAnalysisPanel(){
        const controls = document.querySelector("#legacy .legacyDataControls");
        if(!controls || controls.querySelector("#legacyImportAnalysis")){ return; }

        const panel = createImportElement("section", "legacyImportAnalysis");
        panel.id = "legacyImportAnalysis";
        panel.setAttribute("aria-labelledby", "legacyImportHeading");

        const eyebrow = createImportElement("span", "legacyImportEyebrow", "PREVIEW ONLY · NO RESTORE WRITES");
        const heading = createImportElement("h4", "", "IMPORT ANALYSIS & MIGRATION PREVIEW");
        heading.id = "legacyImportHeading";
        const intro = createImportElement("p", "", "Choose a Career Mode Showdown backup to verify its checksum, validate supported schemas, preview historical migrations and classify conflicts. Candidate B never changes active data, Legacy history or preferences.");

        const dropZone = createImportElement("div", "legacyImportDropZone");
        dropZone.tabIndex = 0;
        dropZone.setAttribute("role", "button");
        dropZone.setAttribute("aria-describedby", "legacyImportFileState");
        dropZone.setAttribute("aria-label", "Choose or drop a Career Mode Showdown JSON backup");
        dropZone.append(createImportElement("strong", "", "DROP BACKUP JSON HERE"), createImportElement("span", "", "or press Enter / Space to choose a file"));

        const input = document.createElement("input");
        input.id = "careerModeImportFile";
        input.className = "legacyImportNativeInput";
        input.type = "file";
        input.accept = ".json,application/json";
        input.setAttribute("aria-label", "Career Mode Showdown backup JSON file");

        const fileState = createImportElement("p", "legacyImportFileState", `No file selected · maximum ${formatImportBytes(CAREER_MODE_IMPORT_MAX_BYTES)}`);
        fileState.id = "legacyImportFileState";
        fileState.setAttribute("role", "status");
        fileState.setAttribute("aria-live", "polite");

        const actions = createImportElement("div", "legacyImportActions");
        const analyze = createImportElement("button", "compactButton primaryDataButton", "ANALYZE BACKUP");
        analyze.type = "button";
        analyze.disabled = true;
        const clear = createImportElement("button", "compactButton", "CLEAR PREVIEW");
        clear.type = "button";
        clear.disabled = true;
        actions.append(analyze, clear);

        const status = createImportElement("p", "legacyImportStatus", "Analysis is read-only. Restore is intentionally unavailable in Candidate B.");
        status.setAttribute("role", "status");
        status.setAttribute("aria-live", "polite");
        const result = createImportElement("div", "legacyImportResult");
        result.setAttribute("aria-live", "polite");

        const selectFile = file => {
            selectedImportFile = file || null;
            analyze.disabled = !selectedImportFile;
            clear.disabled = !selectedImportFile && result.childElementCount === 0;
            result.replaceChildren();
            if(!selectedImportFile){
                fileState.textContent = `No file selected · maximum ${formatImportBytes(CAREER_MODE_IMPORT_MAX_BYTES)}`;
                status.textContent = "Analysis is read-only. Restore is intentionally unavailable in Candidate B.";
                return;
            }
            fileState.textContent = `${selectedImportFile.name || "backup.json"} · ${formatImportBytes(selectedImportFile.size)}`;
            status.textContent = selectedImportFile.size > CAREER_MODE_IMPORT_MAX_BYTES
                ? "This file exceeds the safe analysis limit and will be rejected before its contents are read."
                : "File selected. Press Analyze Backup to run checksum, schema, migration and conflict preview.";
        };

        input.addEventListener("change", () => selectFile(input.files && input.files[0]));
        dropZone.addEventListener("click", () => input.click());
        dropZone.addEventListener("keydown", event => {
            if(event.key === "Enter" || event.key === " "){
                event.preventDefault();
                input.click();
            }
        });
        ["dragenter", "dragover"].forEach(type => dropZone.addEventListener(type, event => {
            event.preventDefault();
            dropZone.classList.add("dragActive");
        }));
        ["dragleave", "drop"].forEach(type => dropZone.addEventListener(type, event => {
            event.preventDefault();
            dropZone.classList.remove("dragActive");
        }));
        dropZone.addEventListener("drop", event => {
            const files = event.dataTransfer && event.dataTransfer.files;
            if(files && files.length){ selectFile(files[0]); }
        });

        analyze.addEventListener("click", async () => {
            if(importAnalysisInProgress || !selectedImportFile){ return; }
            importAnalysisInProgress = true;
            analyze.disabled = true;
            analyze.setAttribute("aria-busy", "true");
            analyze.textContent = "ANALYZING…";
            status.textContent = "Analyzing in memory. Browser storage will not be changed.";
            try{
                const analysis = await analyzeCareerModeBackupFile(selectedImportFile);
                renderImportAnalysisResult(result, analysis);
                status.textContent = analysis.ok
                    ? "Preview complete. No browser data was changed. Candidate C restore remains unavailable."
                    : "Preview found blocking problems. No browser data was changed.";
                clear.disabled = false;
            }catch(error){
                const analysis = createBlockedAnalysis(
                    { name: selectedImportFile.name || "backup.json", sizeBytes: selectedImportFile.size || 0 },
                    [`Import analysis failed safely: ${error.message || String(error)}`]
                );
                renderImportAnalysisResult(result, analysis);
                status.textContent = "Analysis failed safely. No browser data was changed.";
                clear.disabled = false;
            }finally{
                importAnalysisInProgress = false;
                analyze.disabled = !selectedImportFile;
                analyze.removeAttribute("aria-busy");
                analyze.textContent = "ANALYZE BACKUP";
            }
        });

        clear.addEventListener("click", () => {
            selectedImportFile = null;
            input.value = "";
            result.replaceChildren();
            analyze.disabled = true;
            clear.disabled = true;
            fileState.textContent = `No file selected · maximum ${formatImportBytes(CAREER_MODE_IMPORT_MAX_BYTES)}`;
            status.textContent = "Preview cleared. Browser storage was not changed.";
            dropZone.focus({ preventScroll: true });
        });

        panel.append(eyebrow, heading, intro, dropZone, input, fileState, actions, status, result);
        controls.appendChild(panel);
    }

    window.CAREER_MODE_IMPORT_MAX_BYTES = CAREER_MODE_IMPORT_MAX_BYTES;
    window.CAREER_MODE_IMPORT_MIGRATION_REGISTRY = Object.freeze({
        showdown: IMPORT_MIGRATION_REGISTRY.showdown.map(step => ({ id: step.id, from: step.from, to: step.to })),
        preferences: IMPORT_MIGRATION_REGISTRY.preferences.map(step => ({ id: step.id, from: step.from, to: step.to }))
    });
    window.migrateCareerModeImportRecord = migrateCareerModeImportRecord;
    window.analyzeCareerModeBackupEnvelope = analyzeCareerModeBackupEnvelope;
    window.analyzeCareerModeBackupText = analyzeCareerModeBackupText;
    window.analyzeCareerModeBackupFile = analyzeCareerModeBackupFile;
    window.mountCareerModeImportAnalysisPanel = mountCareerModeImportAnalysisPanel;
})();
'''

IMPORT_CONTRACTS = r'''const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const crypto = require("node:crypto");
const { performance } = require("node:perf_hooks");
const { webcrypto } = crypto;

const storageSource = fs.readFileSync("js/storage.js", "utf8");
const backupSource = fs.readFileSync("js/backup.js", "utf8");
const importSource = fs.readFileSync("js/importAnalysis.js", "utf8");
const schema1Showdown = JSON.parse(fs.readFileSync("tests/fixtures/import/showdown-schema1.json", "utf8"));
const schema2Showdown = JSON.parse(fs.readFileSync("tests/fixtures/import/showdown-schema2.json", "utf8"));
const schema1Preferences = JSON.parse(fs.readFileSync("tests/fixtures/import/preferences-schema1.json", "utf8"));
const schema2Preferences = JSON.parse(fs.readFileSync("tests/fixtures/import/preferences-schema2.json", "utf8"));

function canonicalize(value){
    if(Array.isArray(value)){ return value.map(canonicalize); }
    if(value && typeof value === "object"){
        return Object.keys(value).sort().reduce((result, key) => {
            result[key] = canonicalize(value[key]);
            return result;
        }, Object.create(null));
    }
    return value;
}

function signEnvelope(envelope){
    const copy = structuredClone(envelope);
    delete copy.checksum;
    envelope.checksum = crypto.createHash("sha256").update(JSON.stringify(canonicalize(copy))).digest("hex");
    return envelope;
}

function makeEnvelope({ active = null, legacy = [], preferences = null } = {}){
    return signEnvelope({
        formatId: "career-mode-showdown-backup",
        formatVersion: 1,
        appVersion: "1.1.1",
        runtimeRevision: "1.1.1-r1",
        exportedAt: "2026-08-11T12:00:00.000Z",
        checksumAlgorithm: "SHA-256",
        counts: {
            activeShowdowns: active ? 1 : 0,
            legacyShowdowns: Array.isArray(legacy) ? legacy.length : 0,
            preferenceRecords: preferences ? 1 : 0
        },
        relationships: { activeSource: active ? "storage" : "none", completedActiveMatchesLegacy: false, matchingLegacyIndex: -1 },
        storageState: { activeShowdown: active ? "valid" : "missing", legacyShowdowns: "valid", preferences: preferences ? "valid" : "missing" },
        payload: { activeShowdown: active, legacyShowdowns: legacy, preferences },
        warnings: [],
        recovery: null,
        checksum: ""
    });
}

function createRuntime(){
    const values = new Map();
    const counters = { set: 0, remove: 0 };
    const localStorage = {
        getItem(key){ return values.has(key) ? values.get(key) : null; },
        setItem(key, value){ counters.set += 1; values.set(key, String(value)); },
        removeItem(key){ counters.remove += 1; values.delete(key); }
    };
    const document = {
        documentElement: { dataset: {} },
        querySelector(selector){
            if(selector === 'meta[name="app-asset-revision"]'){ return { content: "1.1.2-r1" }; }
            return null;
        },
        getElementById(){ return null; },
        addEventListener(){},
        createElement(){ throw new Error("Contract analysis must not require Data Management DOM."); }
    };
    const CustomEvent = class CustomEvent { constructor(type, options = {}){ this.type = type; this.detail = options.detail; } };
    const window = {
        crypto: webcrypto,
        matchMedia(){ return { matches: false, addEventListener(){}, removeEventListener(){} }; },
        setTimeout,
        clearTimeout,
        addEventListener(){},
        dispatchEvent(){},
        showAppNotice(){},
        CustomEvent
    };
    window.window = window;
    const context = vm.createContext({
        console,
        localStorage,
        window,
        document,
        currentShowdown: null,
        structuredClone,
        CustomEvent,
        JSON,
        Date,
        TextEncoder,
        Blob,
        URL,
        Object,
        Array,
        Map,
        Set,
        Number,
        String,
        Boolean,
        RegExp,
        Error,
        setTimeout,
        clearTimeout
    });
    vm.runInContext(storageSource, context, { filename: "js/storage.js" });
    vm.runInContext(backupSource, context, { filename: "js/backup.js" });
    vm.runInContext(importSource, context, { filename: "js/importAnalysis.js" });
    return { context, window, values, counters };
}

function seedLocal(runtime, keys, { active, legacy, preferences }){
    runtime.values.clear();
    runtime.context.currentShowdown = null;
    if(active !== undefined){ runtime.values.set(keys.activeShowdown, typeof active === "string" ? active : JSON.stringify(active)); }
    if(legacy !== undefined){ runtime.values.set(keys.legacyShowdowns, typeof legacy === "string" ? legacy : JSON.stringify(legacy)); }
    if(preferences !== undefined){ runtime.values.set(keys.preferences, typeof preferences === "string" ? preferences : JSON.stringify(preferences)); }
}

(async () => {
    assert.ok(!importSource.includes("localStorage.setItem"), "Candidate B source must not own localStorage writes.");
    assert.ok(!importSource.includes("localStorage.removeItem"), "Candidate B source must not own localStorage removals.");
    assert.ok(!/\bfetch\s*\(/.test(importSource), "Candidate B analysis must not make network requests.");
    assert.ok(!/XMLHttpRequest/.test(importSource), "Candidate B analysis must not create network fallbacks.");

    const runtime = createRuntime();
    const keys = runtime.window.getCareerModeStorageKeys();
    seedLocal(runtime, keys, {
        active: { ...schema2Showdown, id: "active-local", name: "Current Active", updatedAt: "2026-08-11T12:00:00.000Z" },
        legacy: [
            { ...schema2Showdown, id: "legacy-exact", name: "Exact", updatedAt: "2026-08-10T12:00:00.000Z" },
            { ...schema2Showdown, id: "legacy-same-revision", name: "Local Same Revision", updatedAt: "2026-08-09T12:00:00.000Z" },
            { ...schema2Showdown, id: "legacy-different", name: "Local Different", updatedAt: "2026-08-08T12:00:00.000Z" }
        ],
        preferences: schema2Preferences
    });

    const migratedShowdown = runtime.window.migrateCareerModeImportRecord("showdown", schema1Showdown);
    assert.equal(migratedShowdown.ok, true);
    assert.equal(migratedShowdown.sourceVersion, 1);
    assert.equal(migratedShowdown.targetVersion, 2);
    assert.deepEqual(Array.from(migratedShowdown.steps), ["showdown-schema-1-to-2"]);
    assert.equal(migratedShowdown.value.schemaVersion, 2);
    assert.deepEqual(Array.from(migratedShowdown.value.integrityWarnings), []);
    const migratedAgain = runtime.window.migrateCareerModeImportRecord("showdown", migratedShowdown.value);
    assert.equal(migratedAgain.ok, true);
    assert.deepEqual(Array.from(migratedAgain.steps), []);
    assert.deepEqual(JSON.parse(JSON.stringify(migratedAgain.value)), JSON.parse(JSON.stringify(migratedShowdown.value)), "Showdown migration must be idempotent.");

    const migratedPreferences = runtime.window.migrateCareerModeImportRecord("preferences", schema1Preferences);
    assert.equal(migratedPreferences.ok, true);
    assert.deepEqual(Array.from(migratedPreferences.steps), ["preferences-schema-1-to-2"]);
    assert.deepEqual(JSON.parse(JSON.stringify(migratedPreferences.value)), { schemaVersion: 2, reducedMotion: true, menuFeedback: true });
    const preferencesAgain = runtime.window.migrateCareerModeImportRecord("preferences", migratedPreferences.value);
    assert.deepEqual(Array.from(preferencesAgain.steps), []);
    assert.deepEqual(JSON.parse(JSON.stringify(preferencesAgain.value)), JSON.parse(JSON.stringify(migratedPreferences.value)));

    const exact = { ...schema2Showdown, id: "legacy-exact", name: "Exact", updatedAt: "2026-08-10T12:00:00.000Z" };
    const sameRevision = { ...schema2Showdown, id: "legacy-same-revision", name: "Imported Same Revision", updatedAt: "2026-08-09T12:00:00.000Z" };
    const differentRevision = { ...schema2Showdown, id: "legacy-different", name: "Imported Newer", updatedAt: "2026-08-11T15:00:00.000Z" };
    const newRecord = { ...schema2Showdown, id: "legacy-new", name: "New Record", updatedAt: "2026-08-11T16:00:00.000Z" };
    const replacementActive = { ...schema1Showdown, id: "backup-active", name: "Imported Active" };
    const envelope = makeEnvelope({
        active: replacementActive,
        legacy: [exact, sameRevision, differentRevision, newRecord],
        preferences: { ...schema1Preferences, reducedMotion: false }
    });
    const envelopeBefore = JSON.stringify(envelope);
    const writesBefore = { ...runtime.counters };
    const analysis = await runtime.window.analyzeCareerModeBackupEnvelope(envelope, { sourceName: "matrix.json", sourceSize: 1200 });
    assert.equal(analysis.ok, true, analysis.errors.join(" | "));
    assert.equal(analysis.status, "ready");
    assert.equal(analysis.readyForRestore, false, "Candidate B must never claim to be the restore stage.");
    assert.equal(analysis.checksum.verified, true);
    assert.equal(analysis.preview.active.kind, "replace");
    assert.equal(analysis.preview.legacy.newRecords, 1);
    assert.equal(analysis.preview.legacy.exactDuplicates, 1);
    assert.equal(analysis.preview.legacy.sameEffectiveRevision, 1);
    assert.equal(analysis.preview.legacy.differentRevision, 1);
    assert.equal(analysis.preview.legacy.malformedUnresolvable, 0);
    assert.equal(analysis.preview.preferences.kind, "change");
    assert.equal(analysis.migrations.length, 2, "Schema-1 active and preferences should preview two migration operations.");
    assert.equal(JSON.stringify(envelope), envelopeBefore, "Candidate B must not mutate caller-owned parsed backup objects.");
    assert.equal(runtime.counters.set, writesBefore.set, "Candidate B analysis must not write localStorage.");
    assert.equal(runtime.counters.remove, writesBefore.remove, "Candidate B analysis must not remove localStorage data.");

    const text = JSON.stringify(envelope, null, 2);
    const textBefore = { ...runtime.counters };
    const textAnalysis = await runtime.window.analyzeCareerModeBackupText(text, { sourceName: "round-trip.json" });
    assert.equal(textAnalysis.ok, true);
    assert.equal(runtime.counters.set, textBefore.set);
    assert.equal(runtime.counters.remove, textBefore.remove);

    const tampered = structuredClone(envelope);
    tampered.payload.activeShowdown.name = "Changed without checksum";
    const tamperedAnalysis = await runtime.window.analyzeCareerModeBackupEnvelope(tampered);
    assert.equal(tamperedAnalysis.ok, false);
    assert.match(tamperedAnalysis.errors.join(" "), /checksum does not match/i);

    const futureFormat = structuredClone(envelope);
    futureFormat.formatVersion = 2;
    const futureFormatAnalysis = await runtime.window.analyzeCareerModeBackupEnvelope(futureFormat);
    assert.equal(futureFormatAnalysis.ok, false);
    assert.match(futureFormatAnalysis.errors.join(" "), /newer than this app supports/i);

    const futureSchema = makeEnvelope({ active: { ...schema2Showdown, schemaVersion: 3, id: "future" }, legacy: [], preferences: schema2Preferences });
    const futureSchemaAnalysis = await runtime.window.analyzeCareerModeBackupEnvelope(futureSchema);
    assert.equal(futureSchemaAnalysis.ok, false);
    assert.match(futureSchemaAnalysis.errors.join(" "), /schema v3 is newer/i);

    const wrongCounts = makeEnvelope({ active: schema2Showdown, legacy: [], preferences: schema2Preferences });
    wrongCounts.counts.legacyShowdowns = 99;
    signEnvelope(wrongCounts);
    const wrongCountsAnalysis = await runtime.window.analyzeCareerModeBackupEnvelope(wrongCounts);
    assert.equal(wrongCountsAnalysis.ok, false);
    assert.match(wrongCountsAnalysis.errors.join(" "), /counts metadata/i);

    const malformedJson = await runtime.window.analyzeCareerModeBackupText("{not-json", { sourceName: "broken.json" });
    assert.equal(malformedJson.ok, false);
    assert.match(malformedJson.errors.join(" "), /not valid JSON/i);

    let oversizedReads = 0;
    const oversized = await runtime.window.analyzeCareerModeBackupFile({
        name: "oversized.json",
        size: runtime.window.CAREER_MODE_IMPORT_MAX_BYTES + 1,
        async text(){ oversizedReads += 1; return "{}"; }
    });
    assert.equal(oversized.ok, false);
    assert.equal(oversizedReads, 0, "Oversized File objects must be rejected before File.text() is called.");
    assert.match(oversized.errors.join(" "), /too large/i);

    const dangerous = JSON.parse('{"formatId":"career-mode-showdown-backup","formatVersion":1,"checksumAlgorithm":"SHA-256","checksum":"' + '0'.repeat(64) + '","payload":{"__proto__":{"polluted":true}}}');
    const dangerousAnalysis = await runtime.window.analyzeCareerModeBackupEnvelope(dangerous);
    assert.equal(dangerousAnalysis.ok, false);
    assert.match(dangerousAnalysis.errors.join(" "), /forbidden object key/i);
    assert.equal({}.polluted, undefined, "Host Object prototype must remain unpolluted.");

    const duplicateExact = { ...schema2Showdown, id: "duplicate-inside", name: "Duplicate Inside" };
    const duplicateConflict = { ...duplicateExact, name: "Conflicting Duplicate", updatedAt: "2026-08-11T19:00:00.000Z" };
    const duplicateEnvelope = makeEnvelope({ legacy: [duplicateExact, structuredClone(duplicateExact), duplicateConflict], preferences: schema2Preferences });
    const duplicateAnalysis = await runtime.window.analyzeCareerModeBackupEnvelope(duplicateEnvelope);
    assert.equal(duplicateAnalysis.ok, false, "Same-ID different-content records inside one backup must block Candidate B readiness.");
    assert.match(duplicateAnalysis.errors.join(" "), /conflicting records with the same Showdown ID/i);
    assert.ok(duplicateAnalysis.warnings.some(message => /does not silently deduplicate/i.test(message)) || duplicateAnalysis.preview.legacy.duplicateWithinBackup >= 1);

    seedLocal(runtime, keys, { active: "{broken-active", legacy: "{broken-legacy", preferences: "{broken-preferences" });
    const corruptLocalBefore = new Map(runtime.values);
    const corruptLocalAnalysis = await runtime.window.analyzeCareerModeBackupEnvelope(makeEnvelope({ active: schema2Showdown, legacy: [], preferences: schema2Preferences }));
    assert.equal(corruptLocalAnalysis.ok, true, "Unreadable current local bytes should not corrupt a valid imported backup analysis.");
    assert.ok(corruptLocalAnalysis.warnings.length >= 3, "Unreadable current local records must be visible in preview warnings.");
    assert.deepEqual([...runtime.values.entries()], [...corruptLocalBefore.entries()], "Local corrupt bytes must remain exactly untouched.");

    const largeLegacy = Array.from({ length: 1500 }, (_, index) => ({
        ...schema2Showdown,
        id: `large-${index}`,
        name: `Large Fixture ${index}`,
        updatedAt: new Date(1700000000000 + index * 1000).toISOString()
    }));
    seedLocal(runtime, keys, { legacy: [], preferences: schema2Preferences });
    const largeEnvelope = makeEnvelope({ legacy: largeLegacy, preferences: schema2Preferences });
    const largeStarted = performance.now();
    const largeAnalysis = await runtime.window.analyzeCareerModeBackupEnvelope(largeEnvelope);
    const largeElapsed = performance.now() - largeStarted;
    assert.equal(largeAnalysis.ok, true, largeAnalysis.errors.join(" | "));
    assert.equal(largeAnalysis.preview.legacy.newRecords, 1500);
    assert.ok(largeElapsed < 2500, `1,500-record Candidate B analysis should remain responsive in contracts; took ${largeElapsed.toFixed(1)}ms.`);

    process.stdout.write("PASS  v1.1.2 Candidate B import-analysis contracts\n");
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
'''

IMPORT_BROWSER_AUDIT = r'''const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");

const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");
const axePath = require.resolve("axe-core/axe.min.js");
const runLabel = process.env.CMS_AUDIT_RUN || "import-analysis";
const resultsDirectory = path.resolve(process.env.CMS_TEST_RESULTS || "test-results");
const keys = {
    active: "careerModeShowdown.activeShowdown",
    legacy: "careerModeShowdown.legacyShowdowns",
    preferences: "careerModeShowdown.preferences"
};

async function waitForApp(page){
    await page.goto(baseUrl.href, { waitUntil: "domcontentloaded" });
    await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 12000 });
    await page.locator("#mainMenu").waitFor({ state: "visible", timeout: 5000 });
}

async function openDataManagement(page){
    const opened = await page.evaluate(async () => window.openOptionalModule("legacy"));
    assert.equal(opened, true);
    await page.locator("#legacy").waitFor({ state: "visible", timeout: 12000 });
    await page.locator("#legacyImportAnalysis").waitFor({ state: "visible", timeout: 5000 });
    assert.equal(await page.getByRole("button", { name: "ANALYZE BACKUP" }).isEnabled(), false);
    assert.equal(await page.getByRole("button", { name: /restore|apply import/i }).count(), 0, "Candidate B must expose no restore/apply action.");
}

async function seedSourceAndCreateEnvelope(page){
    return page.evaluate(async ({ keys }) => {
        const active = {
            id: "source-active",
            name: "Schema One Source",
            managers: { playerOne: "Alex", playerTwo: "Jordan" },
            totalRounds: 1,
            currentRound: 1,
            status: "Created",
            selectedLeague: null,
            clubs: { playerOne: null, playerTwo: null },
            score: { playerOne: 0, playerTwo: 0 },
            transferChallenges: [],
            rounds: [],
            createdAt: "2026-08-10T10:00:00.000Z",
            updatedAt: "2026-08-10T10:00:00.000Z",
            completedAt: null,
            archivedAt: null
        };
        const legacy = [{ ...active, schemaVersion: 2, integrityWarnings: [], id: "shared-legacy", name: "Shared Legacy", status: "Completed", updatedAt: "2026-08-10T11:00:00.000Z", completedAt: "2026-08-10T11:00:00.000Z" }];
        localStorage.setItem(keys.active, JSON.stringify(active));
        localStorage.setItem(keys.legacy, JSON.stringify(legacy));
        localStorage.setItem(keys.preferences, JSON.stringify({ schemaVersion: 1, reducedMotion: true }));
        currentShowdown = null;
        return window.createCareerModeBackupEnvelope();
    }, { keys });
}

async function seedTarget(page){
    await page.evaluate(({ keys }) => {
        const current = {
            schemaVersion: 2,
            id: "target-active",
            name: "Current Active",
            managers: { playerOne: "Alex", playerTwo: "Jordan" },
            totalRounds: 1,
            currentRound: 1,
            status: "Created",
            selectedLeague: null,
            clubs: { playerOne: null, playerTwo: null },
            score: { playerOne: 0, playerTwo: 0 },
            transferChallenges: [],
            rounds: [],
            integrityWarnings: [],
            createdAt: "2026-08-11T10:00:00.000Z",
            updatedAt: "2026-08-11T10:00:00.000Z",
            completedAt: null,
            archivedAt: null
        };
        const shared = { ...current, id: "shared-legacy", name: "Shared Legacy", status: "Completed", updatedAt: "2026-08-10T11:00:00.000Z", completedAt: "2026-08-10T11:00:00.000Z" };
        localStorage.setItem(keys.active, JSON.stringify(current));
        localStorage.setItem(keys.legacy, JSON.stringify([shared]));
        localStorage.setItem(keys.preferences, JSON.stringify({ schemaVersion: 2, reducedMotion: false, menuFeedback: true }));
        currentShowdown = null;
    }, { keys });
}

async function installWriteAudit(page){
    await page.evaluate(() => {
        window.__importWriteAudit = { set: 0, remove: 0 };
        const originalSet = Storage.prototype.setItem;
        const originalRemove = Storage.prototype.removeItem;
        Storage.prototype.setItem = function(key, value){ window.__importWriteAudit.set += 1; return originalSet.call(this, key, value); };
        Storage.prototype.removeItem = function(key){ window.__importWriteAudit.remove += 1; return originalRemove.call(this, key); };
        window.__restoreImportWriteAudit = () => {
            Storage.prototype.setItem = originalSet;
            Storage.prototype.removeItem = originalRemove;
        };
    });
}

async function storageSnapshot(page){
    return page.evaluate(({ keys }) => ({
        active: localStorage.getItem(keys.active),
        legacy: localStorage.getItem(keys.legacy),
        preferences: localStorage.getItem(keys.preferences)
    }), { keys });
}

async function runAxe(page, label){
    await page.addScriptTag({ path: axePath });
    const violations = await page.evaluate(async () => {
        const result = await window.axe.run(document.getElementById("legacy"), { resultTypes: ["violations"], rules: { region: { enabled: false } } });
        return result.violations.map(item => ({ id: item.id, impact: item.impact, targets: item.nodes.map(node => node.target) }));
    });
    assert.deepEqual(violations, [], `${label}: Candidate B Data Management accessibility violations.`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 1, `${label}: Candidate B introduced horizontal overflow (${overflow}px).`);
}

async function assertDesktopMatrix(browser){
    const context = await browser.newContext({ viewport: { width: 940, height: 700 } });
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    try{
        await waitForApp(page);
        await page.evaluate(() => window.openOptionalModule("legacy"));
        await page.locator("#legacy").waitFor({ state: "visible", timeout: 12000 });
        const envelope = await seedSourceAndCreateEnvelope(page);
        await seedTarget(page);
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 12000 });
        await openDataManagement(page);
        await runAxe(page, "desktop");

        const before = await storageSnapshot(page);
        await installWriteAudit(page);
        await page.locator("#careerModeImportFile").setInputFiles({ name: "candidate-b-valid.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(envelope, null, 2)) });
        const analyze = page.getByRole("button", { name: "ANALYZE BACKUP" });
        assert.ok(await analyze.isEnabled());
        await analyze.focus();
        await page.keyboard.press("Enter");
        await page.locator(".legacyImportVerdict.ready").waitFor({ state: "visible", timeout: 8000 });
        const after = await storageSnapshot(page);
        const audit = await page.evaluate(() => ({ ...window.__importWriteAudit }));
        assert.deepEqual(after, before, "Candidate B preview must leave all three canonical storage values byte-for-byte unchanged.");
        assert.equal(audit.set, 0, "Candidate B preview UI must perform zero localStorage writes.");
        assert.equal(audit.remove, 0, "Candidate B preview UI must perform zero localStorage removals.");

        const resultText = await page.locator("#legacyImportAnalysis").innerText();
        assert.match(resultText, /PREVIEW READY/);
        assert.match(resultText, /REPLACE/);
        assert.match(resultText, /MIGRATION PREVIEW/);
        assert.match(resultText, /EXACT/);
        assert.match(resultText, /Candidate C restore remains unavailable/i);

        const tampered = structuredClone(envelope);
        tampered.payload.activeShowdown.name = "Tampered after checksum";
        await page.locator("#careerModeImportFile").setInputFiles({ name: "checksum-mismatch.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(tampered)) });
        await analyze.click();
        await page.locator(".legacyImportVerdict.blocked").waitFor({ state: "visible", timeout: 8000 });
        assert.match(await page.locator("#legacyImportAnalysis").innerText(), /checksum does not match/i);
        assert.deepEqual(await storageSnapshot(page), before);

        await page.locator("#careerModeImportFile").setInputFiles({ name: "broken.json", mimeType: "application/json", buffer: Buffer.from("{broken-json") });
        await analyze.click();
        await page.locator(".legacyImportVerdict.blocked").waitFor({ state: "visible", timeout: 8000 });
        assert.match(await page.locator("#legacyImportAnalysis").innerText(), /not valid JSON/i);

        const future = structuredClone(envelope);
        future.formatVersion = 2;
        await page.locator("#careerModeImportFile").setInputFiles({ name: "future-format.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(future)) });
        await analyze.click();
        await page.locator(".legacyImportVerdict.blocked").waitFor({ state: "visible", timeout: 8000 });
        assert.match(await page.locator("#legacyImportAnalysis").innerText(), /newer than this app supports/i);

        const tooLarge = Buffer.alloc((5 * 1024 * 1024) + 64, 0x20);
        await page.locator("#careerModeImportFile").setInputFiles({ name: "oversized.json", mimeType: "application/json", buffer: tooLarge });
        await analyze.click();
        await page.locator(".legacyImportVerdict.blocked").waitFor({ state: "visible", timeout: 8000 });
        assert.match(await page.locator("#legacyImportAnalysis").innerText(), /too large/i);
        assert.deepEqual(await storageSnapshot(page), before);

        await page.evaluate(() => window.__restoreImportWriteAudit());
        assert.deepEqual(pageErrors, [], "Candidate B desktop audit emitted page errors.");
        await page.screenshot({ path: path.join(resultsDirectory, `candidate-b-import-desktop-${runLabel}.png`), fullPage: true });
    }finally{
        await context.close();
    }
}

async function assertDropAndMobile(browser){
    const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        reducedMotion: "reduce"
    });
    const page = await context.newPage();
    try{
        await waitForApp(page);
        await page.evaluate(() => window.openOptionalModule("legacy"));
        await page.locator("#legacy").waitFor({ state: "visible", timeout: 12000 });
        const envelope = await seedSourceAndCreateEnvelope(page);
        await seedTarget(page);
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 12000 });
        await openDataManagement(page);
        await runAxe(page, "mobile reduced-motion");
        const before = await storageSnapshot(page);
        await installWriteAudit(page);

        await page.evaluate(serialized => {
            const file = new File([serialized], "dropped-backup.json", { type: "application/json" });
            const transfer = new DataTransfer();
            transfer.items.add(file);
            document.querySelector(".legacyImportDropZone").dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
        }, JSON.stringify(envelope));
        const analyze = page.getByRole("button", { name: "ANALYZE BACKUP" });
        await analyze.tap();
        await page.locator(".legacyImportVerdict.ready").waitFor({ state: "visible", timeout: 8000 });
        assert.deepEqual(await storageSnapshot(page), before);
        const audit = await page.evaluate(() => ({ ...window.__importWriteAudit }));
        assert.deepEqual(audit, { set: 0, remove: 0 });

        for(const selector of [".legacyImportDropZone", "#careerModeImportFile", ".legacyImportActions .primaryDataButton"]){
            const box = await page.locator(selector).boundingBox();
            assert.ok(box && box.height >= 44, `${selector} must retain a >=44px mobile interaction height; got ${box?.height}.`);
        }
        await page.evaluate(() => window.__restoreImportWriteAudit());
        await page.screenshot({ path: path.join(resultsDirectory, `candidate-b-import-mobile-${runLabel}.png`), fullPage: true });
    }finally{
        await context.close();
    }
}

(async () => {
    await fs.mkdir(resultsDirectory, { recursive: true });
    const runtime = await resolveChromiumRuntime();
    for(const scenario of [assertDesktopMatrix, assertDropAndMobile]){
        const browser = await chromium.launch({ executablePath: runtime.executablePath, args: runtime.args, headless: true });
        try{ await scenario(browser); }
        finally{ if(browser.isConnected()){ await browser.close(); } }
    }
    process.stdout.write("PASS  v1.1.2 Candidate B import-analysis browser audit\n");
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
'''

CANDIDATE_B_CSS = r'''

/* =====================================================
   v1.1.2 Candidate B — Import Analysis + Migration Preview
===================================================== */
.legacyImportAnalysis{
    margin-top:18px;
    padding:16px;
    color:var(--f17-ink);
    background:#eef3f5;
    border-left:5px solid var(--f17-blue);
}
.legacyImportEyebrow{
    display:block;
    margin-bottom:5px;
    color:#49606d;
    font:900 10px/1 var(--f17-display);
    letter-spacing:1.2px;
}
.legacyImportAnalysis h4{
    margin:0 0 7px;
    color:var(--f17-ink);
    font:900 16px/1.05 var(--f17-display);
    letter-spacing:.7px;
}
.legacyImportAnalysis>p{
    margin:0 0 12px!important;
}
.legacyImportDropZone{
    min-height:72px;
    display:flex;
    flex-direction:column;
    justify-content:center;
    align-items:center;
    gap:5px;
    padding:13px 16px;
    text-align:center;
    color:#f4f8fa;
    background:linear-gradient(112deg,#26343e,#255173);
    border:2px dashed rgba(142,217,239,.72);
    cursor:pointer;
}
.legacyImportDropZone.dragActive,
.legacyImportDropZone:focus-visible{
    border-color:var(--f17-yellow);
    outline:3px solid rgba(255,233,30,.45);
    outline-offset:2px;
}
.legacyImportDropZone strong{
    color:var(--f17-yellow);
    font:900 13px/1 var(--f17-display);
    letter-spacing:1px;
}
.legacyImportDropZone span{font-size:11px;color:#d9e5ea;}
.legacyImportNativeInput{
    width:100%;
    min-height:44px;
    margin-top:8px;
    padding:7px 8px;
    color:#26343e;
    background:#fff;
    border:1px solid #aab8c0;
    font-size:12px;
}
.legacyImportFileState,.legacyImportStatus{
    min-height:18px;
    margin:8px 0 0!important;
    color:#425762!important;
    font-size:11px!important;
    font-weight:700;
    overflow-wrap:anywhere;
}
.legacyImportActions{
    display:flex;
    flex-wrap:wrap;
    gap:7px;
    margin-top:10px;
}
.legacyImportActions .compactButton{min-height:46px;}
.legacyImportResult{margin-top:12px;}
.legacyImportVerdict{
    display:grid;
    grid-template-columns:auto minmax(0,1fr);
    gap:8px 14px;
    align-items:center;
    padding:11px 12px;
    background:#fff;
    border-left:4px solid #9aa8b1;
}
.legacyImportVerdict.ready{border-left-color:#2d7d62;}
.legacyImportVerdict.blocked{border-left-color:#a3444d;}
.legacyImportVerdict strong{font:900 12px/1 var(--f17-display);letter-spacing:.8px;}
.legacyImportVerdict.ready strong{color:#286d58;}
.legacyImportVerdict.blocked strong{color:#8a3037;}
.legacyImportVerdict span{font-size:11px;line-height:1.4;color:#52616b;}
.legacyImportPreviewGrid{
    display:grid;
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:7px;
    margin-top:8px;
}
.legacyImportPreviewCard{
    min-width:0;
    padding:10px 11px;
    background:#fff;
    border-top:3px solid #8ed9ef;
}
.legacyImportPreviewCard span,.legacyImportPreviewCard small{display:block;color:#5c6b74;font-size:10px;line-height:1.35;overflow-wrap:anywhere;}
.legacyImportPreviewCard strong{display:block;margin:4px 0;color:#24323b;font:900 13px/1 var(--f17-display);overflow-wrap:anywhere;}
.legacyImportMigrationSummary,.legacyImportConflictList,.legacyImportMessages{
    display:flex;
    flex-direction:column;
    gap:5px;
    margin-top:8px;
    padding:10px 12px;
    background:#fff;
    border-left:3px solid #8ed9ef;
}
.legacyImportMigrationSummary strong,.legacyImportConflictList strong,.legacyImportMessages strong{font:900 11px/1 var(--f17-display);letter-spacing:.7px;}
.legacyImportMigrationSummary span,.legacyImportConflictList span{font-size:10px;line-height:1.4;color:#52616b;overflow-wrap:anywhere;}
.legacyImportMessages.errors{border-left-color:#a3444d;background:#f8ecee;}
.legacyImportMessages.warnings{border-left-color:#b59d16;background:#fbf8df;}
.legacyImportMessages ul{margin:3px 0 0;padding-left:18px;color:#455760;font-size:10px;line-height:1.45;}
@media(max-width:800px){
    .legacyImportPreviewGrid{grid-template-columns:1fr;}
    .legacyImportActions{flex-direction:column;}
    .legacyImportActions .compactButton{width:100%;}
    .legacyImportVerdict{grid-template-columns:1fr;}
}
'''

SCHEMA1_SHOWDOWN = {
    "id": "schema-one-showdown",
    "name": "Schema One Derby",
    "managers": {"playerOne": "Manager One", "playerTwo": "Manager Two"},
    "totalRounds": 1,
    "currentRound": 1,
    "status": "Created",
    "selectedLeague": None,
    "clubs": {"playerOne": None, "playerTwo": None},
    "score": {"playerOne": 0, "playerTwo": 0},
    "transferChallenges": [],
    "rounds": [],
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "completedAt": None,
    "archivedAt": None,
}
SCHEMA2_SHOWDOWN = {**SCHEMA1_SHOWDOWN, "schemaVersion": 2, "id": "schema-two-showdown", "name": "Schema Two Derby", "integrityWarnings": []}
SCHEMA1_PREFS = {"schemaVersion": 1, "reducedMotion": True}
SCHEMA2_PREFS = {"schemaVersion": 2, "reducedMotion": False, "menuFeedback": True}

NEXT_TASK = r'''# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-11

Application version: v1.1.2

Runtime asset revision: `1.1.2-r1`

## Current baseline: v1.1.2 Candidate B — Import Analysis + Migration Preview

Candidate A — Versioned Backup Envelope + Non-Mutating Export — remains complete, deployed and protected.

Candidate B is the current substantive Data Safety and Recovery build. It reads a selected local backup in isolation, validates it, previews supported migrations and classifies conflicts without changing canonical browser data.

Candidate C — Atomic Restore + Recovery UX — remains blocked and is explicitly out of scope for this build.

## Golden handoff rule

Read `00_HANDOFF_GOLDEN_RULE.md` before implementation. Every meaningful action, decision, failure, correction, gate result, merge, deployment and owner-acceptance state must be recorded continuously in the active public handoff.

Current handoff:

`CAREER_MODE_SHOWDOWN_V1.1.2_CANDIDATE_B_HANDOFF.md`

## Candidate B release contract

Candidate B must prove all of the following before merge:

- maximum import size is enforced before `File.text()` for oversized File objects;
- strict JSON parse;
- exact backup format ID/version validation;
- SHA-256 checksum verification;
- dangerous object-key / excessive-depth rejection before checksum canonicalization;
- current schema validation;
- supported historical schema migrations through one ordered registry;
- migration determinism, input non-mutation and idempotence;
- future backup/data schemas fail closed;
- duplicate/conflict classification uses current Showdown IDs as strings;
- exact duplicate, same-ID/same-effective-revision, same-ID/different-revision, new and malformed/unresolvable categories are visible;
- duplicate IDs inside one backup are surfaced rather than silently deduplicated;
- active Showdown impact is explicit;
- Legacy merge impact is previewed only;
- preference impact is explicit;
- corrupt current local bytes are preserved and surfaced as warnings;
- Candidate A export can round-trip directly into Candidate B analysis;
- analysis performs zero canonical `localStorage.setItem()` and zero canonical `localStorage.removeItem()` operations;
- no restore/apply control exists;
- no network request occurs;
- keyboard, drag/drop, touch, reduced-motion, Chromebook/windowed/mobile and accessibility paths pass;
- startup budgets remain protected because Candidate B stays inside the lazy Data Management module;
- existing gameplay, visual, storage and route gates remain green.

## Release process

1. implement and test on a focused branch from current `main`;
2. keep the public handoff current throughout the build;
3. run Candidate B changed-surface contracts/browser evidence;
4. run every permanent workstream/release family on one frozen candidate SHA;
5. do not weaken a threshold to obtain green status;
6. merge with exact expected-head protection only after the frozen candidate is green;
7. verify GitHub Pages serves exact merge bytes;
8. repeat Candidate B analysis and the full deployed Stability journey on the public site;
9. record all production evidence in the public handoff.

## Protected systems

Do not change:

- max-11 scoring or 0–0-only tiebreak logic;
- exactly-two-manager model;
- League/Club assignment semantics;
- Transfer Challenge state machine;
- Season Review persistence boundary;
- Statistics/Legacy/Trophy calculations;
- current storage keys/schema as a restore target;
- `js/screens.js` route authority;
- `js/storage.js` persistence authority;
- Candidate A export semantics;
- owner-protected Reus and accepted football-player source authority;
- the dependency reservation of v1.2.0 for Installable Offline App.

## Next legal task after Candidate B

Only after Candidate B is merged, deployed and proven may Candidate C — Atomic Restore + Recovery UX — begin.

Candidate C alone may write imported canonical state, and all writes must remain behind `js/storage.js` with exact raw snapshots, rollback and rollback verification.

Do not jump to PWA, profiles/save registry, cloud, accounts, QR pairing or two-device work before their dependency gates are reached.
'''

RELEASE_V112 = r'''# Career Mode Showdown v1.1.2 — Candidate B Import Analysis + Migration Preview

Status: candidate until exact PR/main/Pages evidence is complete.

## Purpose

Add the read-only half of import safety before any restore write is allowed.

Candidate B analyzes one local Career Mode Showdown backup in memory and tells the user what a later restore would encounter. It does not apply, merge, replace or remove browser data.

## Runtime boundary

Application: `v1.1.2`
Runtime revision: `1.1.2-r1`

Included:

- 5 MiB pre-parse File size ceiling;
- JSON/format/checksum/schema validation;
- hostile object-key and excessive nesting rejection;
- schema-1 → schema-2 Showdown migration preview;
- preference schema-1 → schema-2 migration preview;
- deterministic ordered migration registry;
- duplicate/conflict classification using Showdown IDs as strings;
- active/Legacy/preferences dry-run impact;
- accessible file picker and drag/drop Data Management UI;
- explicit Preview Only / No Restore Writes messaging;
- golden historical fixtures;
- zero-write, large-input, tamper, future-schema and browser tests.

Excluded:

- restore/apply writes;
- automatic Legacy merge;
- automatic active replacement;
- profile/save-registry identity changes;
- PWA/service worker;
- cloud/network upload.

## Data-safety invariants

Candidate B never calls canonical localStorage write/remove APIs. It uses `js/storage.js` read-only raw snapshot authority only for conflict comparison.

Checksum verification remains corruption detection, not authentication. Import UI must not describe SHA-256 as a signature or proof of trusted origin.

Future backup/data schemas fail closed.

Same-ID/different-content conflicts are previewed, never silently resolved.

Candidate C remains the first legal restore-write stage.

## Gate additions

A new permanent Import Analysis workflow protects:

- contracts and migration fixtures;
- two browser executions per workflow run;
- desktop/windowed and DPR2 touch/mobile Data Management evidence;
- axe/overflow/touch-target checks;
- checksum/future-format/malformed/oversized paths;
- exact storage-byte non-mutation.

Stability and five-way Release Burn-In also include Candidate B browser analysis.

No existing startup/performance/accessibility threshold is raised to accommodate this build.
'''


def patch_runtime() -> None:
    write("js/importAnalysis.js", IMPORT_ANALYSIS_JS)

    # Candidate A checksum canonicalization now receives untrusted files through Candidate B.
    backup = read("js/backup.js")
    old = '''        return Object.keys(value).sort().reduce((result, key) => {\n            result[key] = canonicalizeBackupValue(value[key]);\n            return result;\n        }, {});'''
    new = '''        return Object.keys(value).sort().reduce((result, key) => {\n            result[key] = canonicalizeBackupValue(value[key]);\n            return result;\n        }, Object.create(null));'''
    if old not in backup:
        raise RuntimeError("backup.js canonicalization guard source not found")
    backup = backup.replace(old, new)
    backup = backup.replace('return typeof APP_VERSION === "string" ? APP_VERSION : "1.1.1";', 'return typeof APP_VERSION === "string" ? APP_VERSION : "1.1.2";')
    write("js/backup.js", backup)

    optional = read("js/optionalModules.js")
    old_optional = '''    await loadRuntimeScript(\n        "backup-engine",\n        "js/backup.js",\n        () => typeof window.createCareerModeBackupEnvelope === "function"\n            && typeof window.verifyCareerModeBackupEnvelopeChecksum === "function"\n            && typeof window.exportCareerModeBackup === "function"\n    );\n    await loadRuntimeScript(\n        "legacy-ui",'''
    new_optional = '''    await loadRuntimeScript(\n        "backup-engine",\n        "js/backup.js",\n        () => typeof window.createCareerModeBackupEnvelope === "function"\n            && typeof window.verifyCareerModeBackupEnvelopeChecksum === "function"\n            && typeof window.exportCareerModeBackup === "function"\n    );\n    await loadRuntimeScript(\n        "import-analysis",\n        "js/importAnalysis.js",\n        () => typeof window.analyzeCareerModeBackupFile === "function"\n            && typeof window.analyzeCareerModeBackupEnvelope === "function"\n            && typeof window.mountCareerModeImportAnalysisPanel === "function"\n    );\n    await loadRuntimeScript(\n        "legacy-ui",'''
    if old_optional not in optional:
        raise RuntimeError("optionalModules.js Legacy loader source not found")
    optional = optional.replace(old_optional, new_optional)
    write("js/optionalModules.js", optional)

    legacy = read("js/legacy.js")
    old_legacy = '''    fragment.appendChild(createLegacyDataControls(history));\n    container.replaceChildren(fragment);\n    lastLegacyRenderedRevision = revision;'''
    new_legacy = '''    fragment.appendChild(createLegacyDataControls(history));\n    container.replaceChildren(fragment);\n    if(typeof window.mountCareerModeImportAnalysisPanel === "function"){\n        window.mountCareerModeImportAnalysisPanel();\n    }\n    lastLegacyRenderedRevision = revision;'''
    if old_legacy not in legacy:
        raise RuntimeError("legacy.js render mount source not found")
    legacy = legacy.replace(old_legacy, new_legacy)
    write("js/legacy.js", legacy)

    legacy_css = read("css/legacy.css")
    if "v1.1.2 Candidate B — Import Analysis" not in legacy_css:
        legacy_css += CANDIDATE_B_CSS
    write("css/legacy.css", legacy_css)

    # Runtime cache identity. Import remains lazy, so initial eager asset count is unchanged.
    for path in [Path("index.html"), *sorted((ROOT / "js").glob("*.js")), *sorted((ROOT / "data").glob("*.js"))]:
        text = path.read_text(encoding="utf-8")
        if "1.1.1-r1" in text:
            path.write_text(text.replace("1.1.1-r1", "1.1.2-r1"), encoding="utf-8")

    app = read("js/app.js")
    app = app.replace('const APP_VERSION = "1.1.1";', 'const APP_VERSION = "1.1.2";')
    write("js/app.js", app)

    settings = read("js/settings.js")
    settings = settings.replace("Career Mode Showdown v1.1.1", "Career Mode Showdown v1.1.2")
    settings = settings.replace('return typeof APP_VERSION === "string" ? APP_VERSION : "1.1.1";', 'return typeof APP_VERSION === "string" ? APP_VERSION : "1.1.2";')
    write("js/settings.js", settings)

    index = read("index.html")
    index = index.replace("v1.1.1 · Stable", "v1.1.2 · Stable")
    write("index.html", index)

    package = json.loads(read("package.json"))
    package["version"] = "1.1.2"
    package["scripts"]["test:import-contracts"] = "node tests/contracts/import-analysis-contracts.cjs"
    package["scripts"]["test:import-browser"] = "node tests/browser/import-analysis-audit.cjs"
    package["scripts"]["test:contracts"] = "node tests/contracts/stability-contracts.cjs && node tests/contracts/backup-contracts.cjs && node tests/contracts/import-analysis-contracts.cjs && node tests/contracts/final-release-hardening.cjs"
    write("package.json", json.dumps(package, indent=2) + "\n")

    lock = json.loads(read("package-lock.json"))
    lock["version"] = "1.1.2"
    if "" in lock.get("packages", {}):
        lock["packages"][""]["version"] = "1.1.2"
    write("package-lock.json", json.dumps(lock, indent=2) + "\n")


def write_tests_and_fixtures() -> None:
    write("tests/contracts/import-analysis-contracts.cjs", IMPORT_CONTRACTS)
    write("tests/browser/import-analysis-audit.cjs", IMPORT_BROWSER_AUDIT)
    write("tests/fixtures/import/showdown-schema1.json", json.dumps(SCHEMA1_SHOWDOWN, indent=2) + "\n")
    write("tests/fixtures/import/showdown-schema2.json", json.dumps(SCHEMA2_SHOWDOWN, indent=2) + "\n")
    write("tests/fixtures/import/preferences-schema1.json", json.dumps(SCHEMA1_PREFS, indent=2) + "\n")
    write("tests/fixtures/import/preferences-schema2.json", json.dumps(SCHEMA2_PREFS, indent=2) + "\n")

    backup_contract = read("tests/contracts/backup-contracts.cjs").replace("1.1.1-r1", "1.1.2-r1").replace('assert.equal(full.appVersion, "1.1.1");', 'assert.equal(full.appVersion, "1.1.2");').replace('assert.equal(full.runtimeRevision, "1.1.1-r1");', 'assert.equal(full.runtimeRevision, "1.1.2-r1");')
    write("tests/contracts/backup-contracts.cjs", backup_contract)

    stability = read("tests/contracts/stability-contracts.cjs")
    anchor = 'assert.ok(workflow.includes("npm run test:backup-browser"), "Stability workflow must run Candidate A backup export QA.");\n'
    if anchor not in stability:
        raise RuntimeError("stability-contracts Candidate A workflow assertion not found")
    stability = stability.replace(anchor, anchor + 'assert.ok(workflow.includes("npm run test:import-browser"), "Stability workflow must run Candidate B import analysis QA.");\n')
    handoff_anchor = 'const changelog = read("CHANGELOG.md");\n'
    stability = stability.replace(handoff_anchor, handoff_anchor + 'const handoffGoldenRule = read("00_HANDOFF_GOLDEN_RULE.md");\n')
    release_anchor = 'assert.ok(changelog.includes(`# v${appVersion}`), "CHANGELOG has no current release entry.");\n'
    stability = stability.replace(release_anchor, release_anchor + 'assert.ok(handoffGoldenRule.includes("Every developer or ChatGPT session") && handoffGoldenRule.includes("continuously"), "The owner-mandated continuous public handoff golden rule is missing.");\n')
    write("tests/contracts/stability-contracts.cjs", stability)

    workflow = read(".github/workflows/validate-stability-lane.yml")
    workflow = workflow.replace(
        'Run two consecutive complete browser, backup, provenance, Home and crop-safe photo audits',
        'Run two consecutive complete browser, backup, import-preview, provenance, Home and crop-safe photo audits'
    )
    workflow = workflow.replace(
        '            CMS_AUDIT_RUN="ci-${attempt}" npm run test:backup-browser\n            CMS_AUDIT_RUN="ci-${attempt}" npm run test:browser',
        '            CMS_AUDIT_RUN="ci-${attempt}" npm run test:backup-browser\n            CMS_AUDIT_RUN="ci-${attempt}" npm run test:import-browser\n            CMS_AUDIT_RUN="ci-${attempt}" npm run test:browser'
    )
    workflow = workflow.replace(
        '      - name: Run complete journey against deployed Pages\n',
        '      - name: Run Candidate B import analysis against deployed Pages\n        env:\n          CMS_AUDIT_RUN: deployed-main\n          CMS_BASE_URL: https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/\n        run: npm run test:import-browser\n\n      - name: Run complete journey against deployed Pages\n'
    )
    workflow = workflow.replace("Candidate A Data Management screenshots", "Candidate A/B Data Management screenshots")
    workflow = workflow.replace("candidate-a-backup-browser-${{ github.run_id }}", "candidate-ab-data-management-${{ github.run_id }}")
    workflow = workflow.replace("path: test-results/backup-data-management-*.png", "path: |\n            test-results/backup-data-management-*.png\n            test-results/candidate-b-import-*.png")
    write(".github/workflows/validate-stability-lane.yml", workflow)

    burnin = read("tests/support/run-release-burnin-pass.sh")
    burnin = burnin.replace("v1.1.1 release burn-in", "v1.1.2 release burn-in")
    burnin = burnin.replace('printf \'\\n=== pass %s: complete journey ===\\n\' "$pass"\nnpm run test:browser', 'printf \'\\n=== pass %s: Candidate B import analysis ===\\n\' "$pass"\nnpm run test:import-browser\nprintf \'\\n=== pass %s: complete journey ===\\n\' "$pass"\nnpm run test:browser')
    write("tests/support/run-release-burnin-pass.sh", burnin)

    burnin_workflow = read(".github/workflows/validate-v110-release-burnin.yml")
    burnin_workflow = burnin_workflow.replace("Validate v1.1.1 Release Burn-In", "Validate v1.1.2 Release Burn-In")
    burnin_workflow = burnin_workflow.replace("v110-burnin", "v112-burnin")
    write(".github/workflows/validate-v110-release-burnin.yml", burnin_workflow)

    import_workflow = '''name: Validate Candidate B Import Analysis\n\non:\n  pull_request:\n  push:\n    branches: [main]\n  workflow_dispatch:\n\npermissions:\n  contents: read\n\nconcurrency:\n  group: import-analysis-${{ github.workflow }}-${{ github.ref }}\n  cancel-in-progress: true\n\njobs:\n  import-contracts:\n    runs-on: ubuntu-latest\n    timeout-minutes: 8\n    steps:\n      - uses: actions/checkout@v5\n      - uses: actions/setup-node@v5\n        with:\n          node-version: 24\n          cache: npm\n      - run: npm ci\n      - name: Run Candidate B deterministic import, migration, conflict and no-write contracts\n        run: npm run test:import-contracts\n\n  import-browser:\n    needs: import-contracts\n    runs-on: ubuntu-latest\n    timeout-minutes: 18\n    steps:\n      - uses: actions/checkout@v5\n      - uses: actions/setup-node@v5\n        with:\n          node-version: 24\n          cache: npm\n      - run: npm ci\n      - name: Run Candidate B browser analysis twice\n        shell: bash\n        run: |\n          set -euo pipefail\n          npm run serve:test > /tmp/cms-import-analysis.log 2>&1 &\n          server_pid=$!\n          trap 'kill "$server_pid" 2>/dev/null || true' EXIT\n          for attempt in 1 2; do\n            CMS_AUDIT_RUN="candidate-b-${attempt}" npm run test:import-browser\n          done\n      - name: Upload Candidate B Data Management evidence\n        if: always()\n        uses: actions/upload-artifact@v7\n        with:\n          name: candidate-b-import-analysis-${{ github.sha }}\n          path: test-results/candidate-b-import-*.png\n          if-no-files-found: error\n          retention-days: 14\n'''
    write(".github/workflows/validate-import-analysis.yml", import_workflow)


def harden_deployment_verifier() -> None:
    source = read("scripts/verify-deployment.mjs")
    old = '''async function fetchBytes(relativePath, nonce){\n    const target = new URL(relativePath, deploymentUrl);\n    target.searchParams.set("deployment-check", nonce);\n    const response = await fetch(target, {\n        cache: "no-store",\n        headers: { "cache-control": "no-cache" },\n        signal: AbortSignal.timeout(30000)\n    });\n    assert.equal(response.status, 200, `${relativePath} returned HTTP ${response.status}`);\n    return Buffer.from(await response.arrayBuffer());\n}'''
    new = '''async function fetchBytes(relativePath, nonce){\n    const target = new URL(relativePath, deploymentUrl);\n    target.searchParams.set("deployment-check", nonce);\n    let lastError = null;\n    for(let attempt = 1; attempt <= 3; attempt += 1){\n        try{\n            const response = await fetch(target, {\n                cache: "no-store",\n                headers: { "cache-control": "no-cache" },\n                signal: AbortSignal.timeout(30000)\n            });\n            if(response.status >= 500 && attempt < 3){\n                await delay(750 * attempt);\n                continue;\n            }\n            assert.equal(response.status, 200, `${relativePath} returned HTTP ${response.status}`);\n            return Buffer.from(await response.arrayBuffer());\n        }catch(error){\n            lastError = error;\n            if(attempt >= 3){ break; }\n            await delay(750 * attempt);\n        }\n    }\n    throw lastError || new Error(`${relativePath} could not be fetched from the deployment.`);\n}'''
    if old not in source:
        raise RuntimeError("deployment verifier fetchBytes source not found")
    write("scripts/verify-deployment.mjs", source.replace(old, new))


def update_docs() -> None:
    write("NEXT_TASK.md", NEXT_TASK)
    write("RELEASE_V1.1.2.md", RELEASE_V112)

    state = read("PROJECT_STATE.md")
    state = state.replace("**Application version:** v1.1.1 — Maintenance Candidate", "**Application version:** v1.1.2 — Maintenance Candidate", 1)
    state = state.replace("**Runtime asset revision:** `1.1.1-r1`", "**Runtime asset revision:** `1.1.2-r1`", 1)
    state = state.replace("**Current milestone:** v1.1.1 — James Rodríguez Real Madrid Source Refresh", "**Current milestone:** v1.1.2 — Candidate B Import Analysis + Migration Preview", 1)
    state = state.replace("**Current activity:** replace only the Create Showdown James source with a different Real Madrid-authored licensed image, deepen changed-surface gates, and require two independent executions of every permanent gate on one frozen candidate", "**Current activity:** analyze local backup files read-only with checksum/schema/migration/conflict preview and zero canonical storage writes", 1)
    state = state.replace("**Runtime change class:** licensed James visual/source + coherent v1.1.1 cache/release authority only; gameplay, scoring, routes, storage schema/keys, Candidate A semantics and state-machine rules remain locked", "**Runtime change class:** lazy Data Management import-analysis module + migration/conflict preview + validation gates; gameplay, scoring, routes, storage schema/keys, Candidate A export semantics and state-machine rules remain locked", 1)
    state = state.replace("**Next roadmap candidate after v1.1.1 maintenance closure:** Candidate B — Import Analysis + Migration Preview (read-only)", "**Next roadmap candidate after Candidate B production proof:** Candidate C — Atomic Restore + Recovery UX", 1)
    marker = "# v1.1.1 — James Rodríguez Real Madrid source refresh"
    section = '''# v1.1.2 — Candidate B Import Analysis + Migration Preview\n\nCandidate B is the read-only second stage of v1.1 Data Safety and Recovery. It verifies a selected Candidate A backup, validates current and supported historical schemas, previews deterministic migrations, classifies duplicate/conflicting Showdown identities, and explains active/Legacy/preference effects without restoring anything.\n\nCandidate B is lazy inside the existing Legacy/Data Management surface. It performs zero canonical localStorage writes/removals and makes no network request. Oversized files are rejected before File.text(), unsupported future formats/schemas fail closed, hostile object keys/depth are rejected, and exact current storage bytes are preserved during preview.\n\nCandidate C remains the first stage allowed to write imported state and stays blocked behind Candidate B release evidence.\n\n'''
    if marker not in state:
        raise RuntimeError("PROJECT_STATE v1.1.1 marker not found")
    state = state.replace(marker, section + marker, 1)
    write("PROJECT_STATE.md", state)

    readme = read("README.md")
    readme = readme.replace("**Application version:** v1.1.1 — Maintenance Candidate", "**Application version:** v1.1.2 — Maintenance Candidate", 1)
    readme = readme.replace("**Runtime asset revision:** `1.1.1-r1`", "**Runtime asset revision:** `1.1.2-r1`", 1)
    readme = re.sub(r"\*\*Current phase:\*\*.*", "**Current phase:** Candidate B — read-only Import Analysis + Migration Preview; Candidate A remains protected and Candidate C restore remains blocked", readme, count=1)
    readme = re.sub(r"\*\*Next roadmap candidate.*", "**Next roadmap candidate after Candidate B production proof:** Candidate C — Atomic Restore + Recovery UX", readme, count=1)
    marker = "## v1.1.1 — James Rodríguez Real Madrid source refresh"
    section = '''## v1.1.2 — Candidate B Import Analysis + Migration Preview\n\nCandidate B adds a preview-only import workflow to the existing lazy Data Management surface. A local backup is size-gated, parsed, checked against the Candidate A format, SHA-256 verified, schema validated and passed through explicit ordered migrations before any conflict preview is shown. Existing Showdown IDs remain strings for comparison. New, exact duplicate, same-effective-revision, different-revision and malformed/unresolvable outcomes are surfaced instead of silently merged.\n\nThe feature performs zero canonical localStorage writes/removals and exposes no restore/apply action. Candidate C remains the only future stage allowed to commit imported data. Historical schema fixtures, hostile JSON structure, oversized files, tampering, corrupt local bytes, large imports, keyboard/drop/touch/mobile accessibility and exact deployed-site behavior are permanently gated.\n\nSee `RELEASE_V1.1.2.md` and `CAREER_MODE_SHOWDOWN_V1.1.2_CANDIDATE_B_HANDOFF.md`.\n\n'''
    if marker not in readme:
        raise RuntimeError("README v1.1.1 marker not found")
    readme = readme.replace(marker, section + marker, 1)
    readme = readme.replace("1. `00_DEVELOPER_START_HERE.md`", "1. `00_HANDOFF_GOLDEN_RULE.md` — permanent owner-mandated continuous public handoff protocol.\n2. `00_DEVELOPER_START_HERE.md`", 1)
    write("README.md", readme)

    start = read("00_DEVELOPER_START_HERE.md")
    new_zero = '''## 0. Sixty-second project state\n\nApplication: `v1.1.2`\n\nRuntime asset revision: `1.1.2-r1`.\n\nCandidate A backup/export is complete, deployed and protected. Candidate B — Import Analysis + Migration Preview — is the current substantive Data Safety and Recovery build. Candidate C restore remains blocked.\n\nCandidate B is preview-only: local backup file size, JSON, format, checksum, schemas, historical migrations and ID conflicts are analyzed in memory with zero canonical localStorage writes/removals. The existing Legacy/Data Management surface remains the UI owner and the feature stays lazy so startup budgets remain protected.\n\nThe owner-mandated `00_HANDOFF_GOLDEN_RULE.md` is permanent operating policy: every meaningful action/failure/decision/gate/merge/deployment state must be recorded continuously in the active public handoff.\n\nAfter Candidate B is merged/deployed/proven, Candidate C — Atomic Restore + Recovery UX — becomes the next legal v1.1.x step. v1.2.0 remains reserved for Installable Offline App.\n\n## 1.'''
    start, count = re.subn(r"## 0\. Sixty-second project state[\s\S]*?## 1\.", new_zero, start, count=1)
    if count != 1:
        raise RuntimeError("00_DEVELOPER_START_HERE current-state section not replaced")
    start = start.replace("1. Fetch current `main` and record its SHA.", "1. Read `00_HANDOFF_GOLDEN_RULE.md` and identify/create the active public handoff.\n2. Fetch current `main` and record its SHA.", 1)
    write("00_DEVELOPER_START_HERE.md", start)

    changelog = read("CHANGELOG.md")
    entry = '''# v1.1.2 — Candidate B Import Analysis + Migration Preview\n\n- Adds preview-only local backup import analysis to Data Management.\n- Enforces a 5 MiB pre-read File ceiling, strict JSON/format/checksum/schema validation and future-format rejection.\n- Adds ordered schema-1→2 Showdown/preferences migration preview with deterministic/idempotent golden fixtures.\n- Classifies new/exact/same-revision/different-revision/malformed conflicts using persisted Showdown IDs as strings.\n- Preserves corrupt current raw bytes and performs zero canonical localStorage writes/removals.\n- Adds keyboard, drag/drop, touch, DPR2 mobile, axe, overflow, hostile JSON, tamper, large-input and export→analysis round-trip evidence.\n- Adds a permanent Candidate B workflow and integrates import analysis into Stability and five-way Release Burn-In.\n- Hardens deployed-byte verification with bounded transport retries while retaining exact hash/length equality as authority.\n- Makes continuous public handoff logging a permanent owner-mandated repository rule.\n\n'''
    if not changelog.startswith("# v1.1.2"):
        changelog = entry + changelog
    write("CHANGELOG.md", changelog)

    handoff = read("CAREER_MODE_SHOWDOWN_V1.1.2_CANDIDATE_B_HANDOFF.md")
    handoff += '''\n## Implementation design checkpoint\n\nCandidate B architecture selected:\n\n- `js/importAnalysis.js` is a new lazy, read-only analysis/migration/UI module loaded only with Legacy/Data Management.\n- `js/backup.js` remains Candidate A checksum authority; its canonical object accumulator is hardened to a null-prototype object because Candidate B now verifies user-supplied JSON. Valid checksum bytes remain unchanged.\n- `js/storage.js` remains untouched as persistence authority; Candidate B reads only through `captureCareerModeRawBackupInputs()`.\n- one explicit ordered migration registry owns Showdown schema 1→2 and preferences schema 1→2; no scattered import normalization is allowed.\n- migration functions clone input, are tested non-mutating and idempotent, and fail closed on unsupported future schemas.\n- conflict comparison follows current storage precedent: Showdown IDs are compared as strings and effective revision uses `updatedAt` + `completedAt`.\n- the Data Management UI contains no Restore/Apply action and explicitly states Preview Only / No Restore Writes.\n- file size ceiling is 5 MiB and oversized File objects are rejected before `File.text()`.\n- Candidate B performs no network request.\n- exact deployment verifier hash/length authority is retained; only bounded retry for transient fetch transport is added after the v1.1.1 recorded transport-noise incident.\n\nNew permanent evidence includes golden schema fixtures, deterministic import contracts, dedicated real-browser Candidate B audit, a dedicated permanent workflow, integration into two-cycle Stability, and integration into every five-way Release Burn-In pass.\n\nCurrent implementation status after generator application: source/test generation pending workflow execution.\n'''
    write("CAREER_MODE_SHOWDOWN_V1.1.2_CANDIDATE_B_HANDOFF.md", handoff)


def verify_no_candidate_c_writes() -> None:
    source = read("js/importAnalysis.js")
    banned = ["localStorage.setItem", "localStorage.removeItem", "saveCurrentShowdown(", "saveLegacyShowdowns(", "saveApplicationPreferences("]
    found = [item for item in banned if item in source]
    if found:
        raise RuntimeError(f"Candidate B write boundary violation in importAnalysis.js: {found}")


def main() -> None:
    patch_runtime()
    write_tests_and_fixtures()
    harden_deployment_verifier()
    update_docs()
    verify_no_candidate_c_writes()
    print("Candidate B v1.1.2 guarded integration generated successfully.")


if __name__ == "__main__":
    main()
