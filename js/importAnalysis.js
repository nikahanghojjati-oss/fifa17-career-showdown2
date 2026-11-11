/* =====================================================
   Career Mode Showdown Candidate B — protected read-only analysis
   Candidate B — Import Analysis + Migration Preview
   Read-only. Only the Showdown validator that remote reconciliation (js/restore.js) needs stays; backup-file analysis was cut in r91.
===================================================== */

(function initializeImportAnalysisModule(){
    "use strict";

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
        return typeof value === "number" && Number.isFinite(value);
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
        if(!Array.isArray(showdown.transferChallenges)){ errors.push("Transfer War history is invalid."); }
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
                if(!isPlainImportObject(challenge)){ errors.push(`Transfer War ${index + 1} is not an object.`); }
            });
        }
        return errors;
    }

    function validateCareerModeImportShowdownRecord(record){
        const migration = migrateCareerModeImportRecord("showdown", record);
        if(!migration.ok){
            return {
                ok: false,
                value: null,
                sourceVersion: migration.sourceVersion,
                targetVersion: migration.targetVersion,
                steps: migration.steps,
                errors: [migration.error]
            };
        }
        const errors = validateCurrentShowdownRecord(migration.value);
        return {
            ok: errors.length === 0,
            value: errors.length ? null : cloneImportValue(migration.value),
            sourceVersion: migration.sourceVersion,
            targetVersion: migration.targetVersion,
            steps: migration.steps.slice(),
            errors
        };
    }

    window.migrateCareerModeImportRecord = migrateCareerModeImportRecord;
    window.validateCareerModeImportShowdownRecord = validateCareerModeImportShowdownRecord;
})();
