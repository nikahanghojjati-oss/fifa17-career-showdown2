/* =====================================================
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
        return Boolean(value && typeof value === "object" && !Array.isArray(value)
            && Object.prototype.toString.call(value) === "[object Object]");
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
