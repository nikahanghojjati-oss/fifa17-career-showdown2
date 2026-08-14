(function initializeSaveLibraryRuntime(root){
    "use strict";

    const SAVE_LIBRARY_KEY="careerModeShowdown.saveLibrary";
    const SINGLETON_KEY="careerModeShowdown.activeShowdown";
    const LEGACY_KEY="careerModeShowdown.legacyShowdowns";
    const PREFERENCES_KEY="careerModeShowdown.preferences";
    const RUNTIME_ORDER=Object.freeze(["saveLibrary","activeShowdown"]);
    const ARCHIVE_ORDER=Object.freeze(["legacyShowdowns","saveLibrary","activeShowdown"]);
    const CLEAR_ORDER=Object.freeze(["legacyShowdowns","saveLibrary","preferences","activeShowdown"]);

    let authorityReady=false;
    let activationPromise=null;
    let ownedLibraryRaw=null;
    let seasonIdentityByRound=new Map();
    let storageListenerBound=false;

    function runtimeCloneValue(value){
        if(value===undefined)return undefined;
        if(value===null)return null;
        if(typeof structuredClone==="function"){
            try{return structuredClone(value);}catch(error){/* JSON fallback below. */}
        }
        return JSON.parse(JSON.stringify(value));
    }

    function runtimeGetFoundation(){
        const foundation=root&&root.CareerModeSaveLibraryFoundation;
        if(!foundation||typeof foundation.buildSingletonMigrationPlan!=="function"||typeof foundation.migrateShowdownIdentity!=="function"||typeof foundation.validateSaveLibrary!=="function"){
            throw new Error("Save Library identity foundation is unavailable.");
        }
        return foundation;
    }

    function runtimeGetPersistence(){
        const persistence=root&&root.CareerModeSaveLibraryPersistence;
        if(!persistence||typeof persistence.migrate!=="function")throw new Error("Save Library persistence transition authority is unavailable.");
        return persistence;
    }

    function runtimeCaptureExactRaw(){
        if(typeof root.captureCareerModeRawSaveLibraryMigrationSnapshot!=="function")throw new Error("Exact Save Library raw snapshot authority is unavailable.");
        const snapshot=root.captureCareerModeRawSaveLibraryMigrationSnapshot();
        if(!snapshot||snapshot.ok!==true||!snapshot.raw){
            const failed=snapshot&&Array.isArray(snapshot.failedKeys)?snapshot.failedKeys.join(", "):"unknown storage";
            throw new Error(`Exact Save Library raw snapshot failed: ${failed}.`);
        }
        return snapshot.raw;
    }

    function runtimeParseLibrary(raw){
        if(raw===null)throw new Error("Save Library storage is absent.");
        let library;
        try{library=JSON.parse(raw);}catch(error){throw new Error("Save Library storage contains unreadable JSON.");}
        const errors=runtimeGetFoundation().validateSaveLibrary(library);
        if(errors.length)throw new Error(`Save Library storage is invalid: ${errors.join(" ")}`);
        return library;
    }

    function runtimeParseLegacy(raw){
        if(raw===null)return [];
        let history;
        try{history=JSON.parse(raw);}catch(error){throw new Error("Legacy storage contains unreadable JSON.");}
        if(!Array.isArray(history)||history.some(item=>!item||typeof item!=="object"||Array.isArray(item)))throw new Error("Legacy storage is not a valid Showdown array.");
        return history;
    }

    function runtimeGetActiveEntry(library){
        if(!library||library.activeSaveId===null)return null;
        const matches=library.saves.filter(entry=>entry&&entry.saveId===library.activeSaveId);
        if(matches.length!==1)throw new Error("Save Library active identity does not resolve to exactly one save.");
        const entry=matches[0];
        if(!entry.showdown||!entry.showdown.identity||entry.showdown.identity.saveId!==entry.saveId)throw new Error("Save Library active Showdown identity is inconsistent.");
        return entry;
    }

    function runtimeGetSaveEntry(library,saveId){
        if(typeof saveId!=="string"||!/^save_[a-f0-9]{32}$/.test(saveId))throw new Error("A stable Save Library identity is required.");
        const matches=library.saves.filter(entry=>entry&&entry.saveId===saveId);
        if(matches.length!==1)throw new Error(`Save identity ${saveId} does not resolve to exactly one Save Library entry.`);
        return matches[0];
    }

    function runtimeMergeProfiles(existing,incoming){
        const merged=(Array.isArray(existing)?existing:[]).map(runtimeCloneValue);
        const byId=new Map(merged.map(profile=>[profile&&profile.profileId,profile]));
        for(const profile of Array.isArray(incoming)?incoming:[]){
            if(!profile||typeof profile.profileId!=="string")throw new Error("Save Library profile identity is invalid.");
            const known=byId.get(profile.profileId);
            if(known){
                const canonical=runtimeGetFoundation().canonicalString;
                if(typeof canonical!=="function"||canonical(known)!==canonical(profile))throw new Error(`Profile identity ${profile.profileId} conflicts with an existing stable profile.`);
                continue;
            }
            const copy=runtimeCloneValue(profile);
            merged.push(copy);
            byId.set(copy.profileId,copy);
        }
        return merged;
    }

    function runtimeReplaceActiveEntry(library,newEntry,newProfiles,newActiveId){
        const oldActiveId=library.activeSaveId;
        const retained=library.saves.filter(entry=>!entry||entry.saveId!==oldActiveId).map(runtimeCloneValue);
        if(newEntry){
            if(retained.some(entry=>entry&&entry.saveId===newEntry.saveId))throw new Error(`Save identity ${newEntry.saveId} already belongs to a non-active Save Library entry.`);
            retained.push(runtimeCloneValue(newEntry));
        }
        const next={...library,activeSaveId:newActiveId,profiles:runtimeMergeProfiles(library.profiles,newProfiles),saves:retained};
        const errors=runtimeGetFoundation().validateSaveLibrary(next);
        if(errors.length)throw new Error(`Save Library active transition is invalid: ${errors.join(" ")}`);
        return next;
    }

    function runtimeAppendSaveEntry(library,newEntry,newProfiles,newActiveId){
        if(!newEntry||newEntry.saveId!==newActiveId)throw new Error("New Save Library entry identity is inconsistent.");
        if(library.saves.some(entry=>entry&&entry.saveId===newEntry.saveId))throw new Error(`Save identity ${newEntry.saveId} already exists in the Save Library.`);
        const next={
            ...library,
            activeSaveId:newActiveId,
            profiles:runtimeMergeProfiles(library.profiles,newProfiles),
            saves:[...library.saves.map(runtimeCloneValue),runtimeCloneValue(newEntry)]
        };
        const errors=runtimeGetFoundation().validateSaveLibrary(next);
        if(errors.length)throw new Error(`Save Library additive create is invalid: ${errors.join(" ")}`);
        return next;
    }

    function runtimeGetCurrentShowdownReference(){return typeof currentShowdown!=="undefined"?currentShowdown:null;}
    function runtimeSetCurrentShowdownReference(value){if(typeof currentShowdown!=="undefined")currentShowdown=value;}

    function runtimeInvalidateAuthority(){
        authorityReady=false;
        ownedLibraryRaw=null;
        seasonIdentityByRound=new Map();
    }

    function runtimeAuthorityRawSnapshot(){
        if(!authorityReady||ownedLibraryRaw===null)throw new Error("Save Library runtime authority is not active.");
        if(typeof root.isCareerModeCriticalRecoveryLocked==="function"&&root.isCareerModeCriticalRecoveryLocked()){
            runtimeInvalidateAuthority();
            throw new Error("Canonical storage is locked for critical recovery.");
        }
        const raw=runtimeCaptureExactRaw();
        if(raw.activeShowdown!==null){
            runtimeInvalidateAuthority();
            throw new Error("Singleton active storage reappeared after Save Library cutover. Runtime writes are blocked.");
        }
        if(raw.saveLibrary!==ownedLibraryRaw){
            runtimeInvalidateAuthority();
            throw new Error("Save Library changed in another tab or operation. Reload before writing again.");
        }
        return raw;
    }

    async function runtimePrimeSeasonIdentities(showdown){
        seasonIdentityByRound=new Map();
        if(!showdown||!showdown.identity||typeof showdown.identity.saveId!=="string")return;
        const probe=runtimeCloneValue(showdown);
        probe.rounds=Array.from({length:10},(_,index)=>({roundNumber:index+1}));
        const refs=showdown.identity.managerProfileIds&&typeof showdown.identity.managerProfileIds==="object"?showdown.identity.managerProfileIds:null;
        const migrated=await runtimeGetFoundation().migrateShowdownIdentity(probe,refs);
        for(const round of migrated.rounds){
            if(round&&typeof round.seasonId==="string"&&round.seasonId)seasonIdentityByRound.set(Number(round.roundNumber),round.seasonId);
        }
    }

    function runtimeEnsureSeasonIdentities(showdown){
        if(!showdown||!Array.isArray(showdown.rounds))return true;
        for(const round of showdown.rounds){
            if(!round||typeof round!=="object")return false;
            const number=Number(round.roundNumber);
            if(typeof round.seasonId==="string"&&round.seasonId)continue;
            const seasonId=seasonIdentityByRound.get(number);
            if(!seasonId)return false;
            round.seasonId=seasonId;
        }
        return true;
    }

    function runtimeReportSaveFailure(message,error){
        console.error(`[Career Mode Showdown] ${message}:`,error);
        if(typeof root.showAppNotice==="function")root.showAppNotice(`${message}. ${error&&error.message?error.message:"No data was accepted as saved."}`,"error",10000);
    }

    function runtimeApplyTransaction(candidateRaw,expectedRaw,order){
        if(typeof root.applyCareerModeRawStorageTransaction!=="function")return {ok:false,status:"transaction-unavailable"};
        return root.applyCareerModeRawStorageTransaction(candidateRaw,expectedRaw,{order:order.slice(),guardRequestedBeforeEachWrite:true});
    }

    function runtimeCommitLibrary(library){
        const raw=runtimeAuthorityRawSnapshot();
        const errors=runtimeGetFoundation().validateSaveLibrary(library);
        if(errors.length)throw new Error(`Runtime Save Library candidate is invalid: ${errors.join(" ")}`);
        const nextRaw=JSON.stringify(library);
        const result=runtimeApplyTransaction({saveLibrary:nextRaw,activeShowdown:null},raw,RUNTIME_ORDER);
        if(!result||result.ok!==true){
            if(result&&(result.failurePhase==="precondition"||result.status==="rollback-failed-critical"))runtimeInvalidateAuthority();
            throw new Error(`Save Library transaction failed${result&&result.status?` (${result.status})`:""}.`);
        }
        ownedLibraryRaw=nextRaw;
        return true;
    }

    function runtimeSaveCurrent(){
        const showdown=runtimeGetCurrentShowdownReference();
        if(!showdown)return false;
        const previousUpdatedAt=showdown.updatedAt||null;
        try{
            const raw=runtimeAuthorityRawSnapshot();
            const library=runtimeParseLibrary(raw.saveLibrary);
            const entry=runtimeGetActiveEntry(library);
            const saveId=showdown.identity&&typeof showdown.identity.saveId==="string"?showdown.identity.saveId:"";
            if(!entry||!saveId||entry.saveId!==saveId||library.activeSaveId!==saveId)throw new Error("In-memory Showdown identity does not own the authoritative active save.");
            if(!runtimeEnsureSeasonIdentities(showdown))throw new Error("A completed Season is missing its stable Save Library identity.");
            showdown.updatedAt=new Date().toISOString();
            const index=library.saves.findIndex(item=>item&&item.saveId===saveId);
            library.saves[index]={saveId,showdown:runtimeCloneValue(showdown)};
            runtimeCommitLibrary(library);
            return true;
        }catch(error){
            showdown.updatedAt=previousUpdatedAt;
            runtimeReportSaveFailure("The active Showdown could not be saved under Save Library authority",error);
            return false;
        }
    }

    function runtimeLoadActive(){
        try{
            const raw=runtimeAuthorityRawSnapshot();
            const library=runtimeParseLibrary(raw.saveLibrary);
            const entry=runtimeGetActiveEntry(library);
            return entry?runtimeCloneValue(entry.showdown):null;
        }catch(error){
            runtimeReportSaveFailure("The authoritative Save Library could not be loaded",error);
            return null;
        }
    }

    function runtimeGetLibrarySnapshot(){
        try{return runtimeCloneValue(runtimeParseLibrary(runtimeAuthorityRawSnapshot().saveLibrary));}
        catch(error){
            runtimeReportSaveFailure("The Save Library could not be inspected safely",error);
            return null;
        }
    }

    function runtimeHasSaved(){return runtimeLoadActive()!==null;}

    function runtimeHasStoredActiveData(){
        try{return runtimeParseLibrary(runtimeAuthorityRawSnapshot().saveLibrary).activeSaveId!==null;}
        catch(error){return true;}
    }

    function runtimeClearActive(){
        try{
            const library=runtimeParseLibrary(runtimeAuthorityRawSnapshot().saveLibrary);
            const next=runtimeReplaceActiveEntry(library,null,[],null);
            runtimeCommitLibrary(next);
            seasonIdentityByRound=new Map();
            runtimeSetCurrentShowdownReference(null);
            return true;
        }catch(error){
            runtimeReportSaveFailure("The active Save Library entry could not be cleared",error);
            return false;
        }
    }

    async function runtimeSwitchActiveSave(saveId){
        const raw=runtimeAuthorityRawSnapshot();
        const library=runtimeParseLibrary(raw.saveLibrary);
        const target=runtimeGetSaveEntry(library,saveId);
        const prepared=runtimeCloneValue(target.showdown);
        await runtimePrimeSeasonIdentities(prepared);
        runtimeAuthorityRawSnapshot();
        if(library.activeSaveId!==saveId){
            const next={...library,activeSaveId:saveId,profiles:library.profiles.map(runtimeCloneValue),saves:library.saves.map(runtimeCloneValue)};
            const errors=runtimeGetFoundation().validateSaveLibrary(next);
            if(errors.length)throw new Error(`Save Library active selection is invalid: ${errors.join(" ")}`);
            runtimeCommitLibrary(next);
        }
        runtimeSetCurrentShowdownReference(prepared);
        return runtimeCloneValue(prepared);
    }

    function runtimeDeleteSave(saveId){
        const library=runtimeParseLibrary(runtimeAuthorityRawSnapshot().saveLibrary);
        runtimeGetSaveEntry(library,saveId);
        const deletingActive=library.activeSaveId===saveId;
        const next={
            ...library,
            activeSaveId:deletingActive?null:library.activeSaveId,
            profiles:library.profiles.map(runtimeCloneValue),
            saves:library.saves.filter(entry=>entry&&entry.saveId!==saveId).map(runtimeCloneValue)
        };
        const errors=runtimeGetFoundation().validateSaveLibrary(next);
        if(errors.length)throw new Error(`Save Library single-save deletion is invalid: ${errors.join(" ")}`);
        runtimeCommitLibrary(next);
        if(deletingActive){
            seasonIdentityByRound=new Map();
            runtimeSetCurrentShowdownReference(null);
        }
        return {ok:true,deletedSaveId:saveId,activeSaveId:next.activeSaveId,library:runtimeCloneValue(next)};
    }

    async function runtimeCreateShowdown(candidate){
        if(!candidate||typeof candidate!=="object"||Array.isArray(candidate))throw new Error("New Showdown candidate is invalid.");
        const raw=runtimeAuthorityRawSnapshot();
        const currentLibrary=runtimeParseLibrary(raw.saveLibrary);
        const planned=await runtimeGetFoundation().buildSingletonMigrationPlan({activeShowdown:candidate,legacyShowdowns:[]});
        if(!planned||planned.ok!==true||!planned.library||planned.library.saves.length!==1)throw new Error("Stable Save Library identity could not be prepared for the new Showdown.");
        const prepared=planned.library.saves[0].showdown;
        const newEntry=planned.library.saves[0];
        const newSaveId=planned.library.activeSaveId;
        const nextLibrary=runtimeAppendSaveEntry(currentLibrary,newEntry,planned.library.profiles,newSaveId);
        await runtimePrimeSeasonIdentities(prepared);
        runtimeAuthorityRawSnapshot();
        runtimeCommitLibrary(nextLibrary);
        return runtimeCloneValue(prepared);
    }

    function runtimeArchiveShowdown(showdown){
        if(!showdown||showdown.status!=="Completed")return false;
        try{
            const raw=runtimeAuthorityRawSnapshot();
            const library=runtimeParseLibrary(raw.saveLibrary);
            const saveId=showdown.identity&&showdown.identity.saveId;
            const active=runtimeGetActiveEntry(library);
            if(!active||active.saveId!==saveId)throw new Error("Completed Showdown no longer owns the active Save Library entry.");
            if(!runtimeEnsureSeasonIdentities(showdown))throw new Error("Completed Showdown contains a Season without stable identity.");
            const history=runtimeParseLegacy(raw.legacyShowdowns);
            const existingIndex=history.findIndex(item=>String(item.id)===String(showdown.id));
            if(existingIndex>=0){
                const existing=history[existingIndex];
                const sameRevision=String(existing.updatedAt||"")===String(showdown.updatedAt||"")&&String(existing.completedAt||"")===String(showdown.completedAt||"");
                if(sameRevision)return true;
            }
            const stored=runtimeCloneValue(showdown);
            stored.archivedAt=stored.archivedAt||new Date().toISOString();
            if(existingIndex>=0){stored.archivedAt=history[existingIndex].archivedAt||stored.archivedAt;history[existingIndex]=stored;}else history.unshift(stored);
            const result=runtimeApplyTransaction({legacyShowdowns:JSON.stringify(history),saveLibrary:raw.saveLibrary,activeShowdown:null},raw,ARCHIVE_ORDER);
            if(!result||result.ok!==true){
                if(result&&(result.failurePhase==="precondition"||result.status==="rollback-failed-critical"))runtimeInvalidateAuthority();
                throw new Error(`Legacy archive transaction failed${result&&result.status?` (${result.status})`:""}.`);
            }
            return true;
        }catch(error){
            runtimeReportSaveFailure("The completed Showdown could not be archived safely",error);
            return false;
        }
    }

    function runtimeCreateBackupProjection(){
        const raw=runtimeCaptureExactRaw();
        const warnings=[];
        const recovery={};
        let projectedActiveRaw=raw.activeShowdown;
        if(raw.saveLibrary!==null){
            if(raw.activeShowdown!==null){
                warnings.push("Save Library and singleton active storage both exist. No active Showdown was selected for backup because authority is ambiguous.");
                recovery.saveLibrary={storageKey:SAVE_LIBRARY_KEY,raw:raw.saveLibrary,reason:warnings[warnings.length-1]};
                recovery.activeShowdown={storageKey:SINGLETON_KEY,raw:raw.activeShowdown,reason:warnings[warnings.length-1]};
                projectedActiveRaw=null;
            }else{
                try{
                    const entry=runtimeGetActiveEntry(runtimeParseLibrary(raw.saveLibrary));
                    projectedActiveRaw=entry?JSON.stringify(entry.showdown):null;
                }catch(error){
                    const reason=`Save Library storage could not be safely interpreted: ${error.message||String(error)}`;
                    warnings.push(reason);
                    recovery.saveLibrary={storageKey:SAVE_LIBRARY_KEY,raw:raw.saveLibrary,reason};
                    projectedActiveRaw=null;
                }
            }
        }
        return {ok:true,raw:{activeShowdown:projectedActiveRaw,legacyShowdowns:raw.legacyShowdowns,preferences:raw.preferences},warnings,recovery:Object.keys(recovery).length?recovery:null,sourceRaw:runtimeCloneValue(raw)};
    }

    async function runtimePrepareRestoreLibraryRaw(activeShowdown,currentLibraryRaw){
        const currentLibrary=runtimeParseLibrary(currentLibraryRaw);
        if(activeShowdown===null)return JSON.stringify(runtimeReplaceActiveEntry(currentLibrary,null,[],null));
        const planned=await runtimeGetFoundation().buildSingletonMigrationPlan({activeShowdown,legacyShowdowns:[]});
        if(!planned||planned.ok!==true||!planned.library||planned.library.saves.length!==1)throw new Error("Backup active Showdown could not be converted to Save Library authority.");
        const nextLibrary=runtimeReplaceActiveEntry(currentLibrary,planned.library.saves[0],planned.library.profiles,planned.library.activeSaveId);
        return JSON.stringify(nextLibrary);
    }

    function runtimeClearAllData(){
        try{
            const raw=runtimeCaptureExactRaw();
            const result=runtimeApplyTransaction({legacyShowdowns:null,saveLibrary:null,preferences:raw.preferences,activeShowdown:null},raw,CLEAR_ORDER);
            if(!result||result.ok!==true)throw new Error(`Full reset transaction failed${result&&result.status?` (${result.status})`:""}.`);
            runtimeInvalidateAuthority();
            runtimeSetCurrentShowdownReference(null);
            return true;
        }catch(error){
            runtimeReportSaveFailure("Showdown data could not be reset safely",error);
            return false;
        }
    }

    function runtimeInstallAuthorityOverrides(){
        root.saveCurrentShowdown=runtimeSaveCurrent;
        root.loadSavedShowdown=runtimeLoadActive;
        root.clearSavedShowdown=runtimeClearActive;
        root.hasSavedShowdown=runtimeHasSaved;
        root.hasStoredActiveShowdownData=runtimeHasStoredActiveData;
        root.archiveShowdown=runtimeArchiveShowdown;
        root.getCareerModeStorageKeys=()=>({saveLibrary:SAVE_LIBRARY_KEY,legacyShowdowns:LEGACY_KEY,preferences:PREFERENCES_KEY});
    }

    function runtimeBindStorageListener(){
        if(storageListenerBound||!root||typeof root.addEventListener!=="function")return;
        storageListenerBound=true;
        root.addEventListener("storage",event=>{
            if(!authorityReady)return;
            if(event&&(event.key===SAVE_LIBRARY_KEY||event.key===SINGLETON_KEY)){
                runtimeInvalidateAuthority();
                if(typeof root.showAppNotice==="function")root.showAppNotice("Save data changed in another tab. Reload or Continue again before making more changes.","error",10000);
            }
        });
    }

    async function runtimeActivateAuthority(){
        if(authorityReady)return {ok:true,status:"ready"};
        if(activationPromise)return activationPromise;
        activationPromise=(async()=>{
            if(typeof root.isCareerModeCriticalRecoveryLocked==="function"&&root.isCareerModeCriticalRecoveryLocked())throw new Error("Canonical storage is locked for critical recovery.");
            const migration=await runtimeGetPersistence().migrate();
            if(!migration||migration.ok!==true){
                const details=migration&&Array.isArray(migration.errors)?migration.errors.join(" "):"Migration did not complete.";
                throw new Error(`Save Library activation failed${migration&&migration.status?` (${migration.status})`:""}. ${details}`);
            }
            const firstRaw=runtimeCaptureExactRaw();
            if(firstRaw.activeShowdown!==null)throw new Error("Singleton active storage was not retired at the Save Library activation boundary.");
            const entry=runtimeGetActiveEntry(runtimeParseLibrary(firstRaw.saveLibrary));
            await runtimePrimeSeasonIdentities(entry?entry.showdown:null);
            const finalRaw=runtimeCaptureExactRaw();
            if(finalRaw.activeShowdown!==null||finalRaw.saveLibrary!==firstRaw.saveLibrary)throw new Error("Canonical storage changed while Save Library runtime authority was activating.");
            ownedLibraryRaw=finalRaw.saveLibrary;
            authorityReady=true;
            runtimeInstallAuthorityOverrides();
            runtimeBindStorageListener();
            return {ok:true,status:migration.status||"ready",migration};
        })();
        try{return await activationPromise;}
        catch(error){runtimeInvalidateAuthority();throw error;}
        finally{activationPromise=null;}
    }

    root.clearAllCareerModeData=runtimeClearAllData;

    const api=Object.freeze({
        activate:runtimeActivateAuthority,
        isReady:()=>authorityReady,
        invalidateAuthority:runtimeInvalidateAuthority,
        createShowdown:runtimeCreateShowdown,
        saveCurrentShowdown:runtimeSaveCurrent,
        loadActiveShowdown:runtimeLoadActive,
        getLibrarySnapshot:runtimeGetLibrarySnapshot,
        switchActiveSave:runtimeSwitchActiveSave,
        deleteSave:runtimeDeleteSave,
        clearActiveShowdown:runtimeClearActive,
        archiveShowdown:runtimeArchiveShowdown,
        createBackupProjection:runtimeCreateBackupProjection,
        prepareRestoreLibraryRaw:runtimePrepareRestoreLibraryRaw,
        clearAllData:runtimeClearAllData
    });

    if(root)root.CareerModeSaveLibraryRuntime=api;
    if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:this));