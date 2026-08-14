let currentShowdown=null;
const CURRENT_SHOWDOWN_SCHEMA_VERSION=2;
const ALLOWED_SHOWDOWN_ROUNDS=Object.freeze([1,3,5,10]);
let showdownCreationPromise=null;
function initializeSaveLibraryCutoverGate(){
    if(typeof document==="undefined"||!document.addEventListener||window.__cmsSaveLibraryCutoverGate)return;
    window.__cmsSaveLibraryCutoverGate=true;
    document.addEventListener("click",async event=>{
        const button=event.target instanceof Element?event.target.closest("#continueCareer,#startShowdown,#legacyButton,#settingsButton"):null;
        if(!button||button.disabled)return;
        event.preventDefault();event.stopImmediatePropagation();
        const lock=button.matches("#continueCareer,#startShowdown");if(lock)button.disabled=true;
        try{
            if(typeof loadRuntimeScript!=="function")throw new Error("Optional runtime loader is unavailable.");
            await loadRuntimeScript("save-library-cutover","js/saveLibraryCutover.js",()=>typeof window.handleSaveLibraryCutoverAction==="function");
            await window.handleSaveLibraryCutoverAction(button);
        }catch(error){
            if(lock)button.disabled=false;
            if(typeof window.reportApplicationError==="function")window.reportApplicationError("Unable to prepare local Save Library authority",error);
        }
    },true);
}
async function createShowdown(){
    if(showdownCreationPromise)return showdownCreationPromise;
    showdownCreationPromise=(async()=>{
        let existing=null;
        const hasUsableActiveSave=hasSavedShowdown(),hasStoredActiveData=hasUsableActiveSave||hasStoredActiveShowdownData();
        if(hasStoredActiveData){
            existing=hasUsableActiveSave?loadSavedShowdown():null;
            const existingName=existing?.name?` "${existing.name}"`:" data currently stored in this browser";
            if(!window.confirm(`Start a new showdown and replace the active save${existingName}? Completed showdowns already stored in Legacy will not be deleted.`))return false;
        }
        const showdownNameInput=document.getElementById("showdownName"),managerOneInput=document.getElementById("managerOne"),managerTwoInput=document.getElementById("managerTwo"),roundAmountInput=document.getElementById("roundAmount");
        if(!showdownNameInput||!managerOneInput||!managerTwoInput||!roundAmountInput){
            if(typeof window.reportApplicationError==="function")window.reportApplicationError("Showdown creation form is incomplete",new Error("Required setup fields are missing from the page."));
            return false;
        }
        const showdownName=showdownNameInput.value.trim(),managerOne=managerOneInput.value.trim(),managerTwo=managerTwoInput.value.trim(),requestedRounds=Number(roundAmountInput.value),roundAmount=ALLOWED_SHOWDOWN_ROUNDS.includes(requestedRounds)?requestedRounds:1,now=new Date().toISOString();
        const candidate={schemaVersion:CURRENT_SHOWDOWN_SCHEMA_VERSION,id:Date.now(),name:showdownName||"Unnamed Showdown",managers:{playerOne:managerOne||"Manager 1",playerTwo:managerTwo||"Manager 2"},totalRounds:roundAmount,currentRound:1,status:"Created",selectedLeague:null,clubs:{playerOne:null,playerTwo:null},score:{playerOne:0,playerTwo:0},transferChallenges:[],rounds:[],integrityWarnings:[],createdAt:now,updatedAt:now,completedAt:null,archivedAt:null};
        const runtime=window.CareerModeSaveLibraryRuntime;
        if(!runtime||typeof runtime.createShowdown!=="function"||!runtime.isReady()){
            if(typeof window.showAppNotice==="function")window.showAppNotice("Save Library authority is not ready, so the new Showdown was not created.","error",10000);
            return false;
        }
        try{
            const prepared=await runtime.createShowdown(candidate);
            currentShowdown=normalizeShowdown(prepared);
        }catch(error){
            if(typeof window.reportApplicationError==="function")window.reportApplicationError("The new Showdown could not be saved under Save Library authority",error);
            return false;
        }
        if(typeof window.resetTransientSelectionOperations==="function")window.resetTransientSelectionOperations();
        if(typeof window.refreshMainMenuExperience==="function")window.refreshMainMenuExperience();
        return showScreen("leagueWheelScreen");
    })();
    try{return await showdownCreationPromise;}finally{showdownCreationPromise=null;}
}
function isLeagueDatabaseReady(){return typeof leagues!=="undefined"&&Array.isArray(leagues);}
function getCanonicalLeague(league){if(!league||!league.id)return null;if(!isLeagueDatabaseReady())return league;return leagues.find(item=>item.id===league.id)||null;}
function getClubPairIntegrity(showdown){
    const result={complete:false,valid:false,verified:false,reason:""};
    if(!showdown||!showdown.clubs){result.reason="Club assignment is missing.";return result;}
    const one=showdown.clubs.playerOne,two=showdown.clubs.playerTwo;
    if(!one&&!two){result.reason="Clubs have not been assigned yet.";return result;}
    if(!one||!two){result.reason="Only one manager has an assigned club.";return result;}
    result.complete=true;
    if(one===two){result.reason="Both managers cannot use the same club.";return result;}
    if(!showdown.selectedLeague||!showdown.selectedLeague.id){result.reason="Assigned clubs do not have a selected league.";return result;}
    if(typeof getClubsForLeague!=="function"){result.valid=true;return result;}
    const eligible=getClubsForLeague(showdown.selectedLeague.id);result.verified=true;
    if(!eligible.includes(one)||!eligible.includes(two)){result.reason="Assigned clubs do not belong to the selected league.";return result;}
    result.valid=true;return result;
}
function canSafelyResetClubAssignment(showdown){const hasRounds=Array.isArray(showdown.rounds)&&showdown.rounds.length>0,hasTransferHistory=Array.isArray(showdown.transferChallenges)&&showdown.transferChallenges.some(challenge=>challenge&&challenge.status!=="not_started");return !hasRounds&&!hasTransferHistory;}
function addIntegrityWarning(showdown,message){if(!message)return;showdown.integrityWarnings=Array.isArray(showdown.integrityWarnings)?showdown.integrityWarnings:[];if(!showdown.integrityWarnings.includes(message))showdown.integrityWarnings.push(message);}
function repairShowdownIntegrity(showdown){
    if(!showdown)return null;showdown.integrityWarnings=[];
    const canonicalLeague=getCanonicalLeague(showdown.selectedLeague);
    if(showdown.selectedLeague&&canonicalLeague)showdown.selectedLeague=canonicalLeague;
    else if(showdown.selectedLeague&&!canonicalLeague){if(canSafelyResetClubAssignment(showdown)){showdown.selectedLeague=null;showdown.clubs={playerOne:null,playerTwo:null};showdown.status="Created";}else addIntegrityWarning(showdown,"The saved league is not recognized by the current FIFA 17 league database.");}
    const clubIntegrity=getClubPairIntegrity(showdown);
    if((showdown.clubs.playerOne||showdown.clubs.playerTwo)&&!clubIntegrity.valid){if(canSafelyResetClubAssignment(showdown)){showdown.clubs={playerOne:null,playerTwo:null};showdown.status=showdown.selectedLeague?"League Selected":"Created";}else addIntegrityWarning(showdown,clubIntegrity.reason);}
    if(showdown.rounds.length>showdown.totalRounds)addIntegrityWarning(showdown,"Saved season history contains more seasons than the showdown length.");
    if(showdown.status==="Completed"&&showdown.rounds.length<showdown.totalRounds)addIntegrityWarning(showdown,"The showdown is marked complete but not every configured season has a result.");
    return showdown;
}
function normalizeShowdown(showdown){
    if(!showdown)return null;
    showdown.schemaVersion=Number(showdown.schemaVersion)||1;showdown.name=showdown.name||"Unnamed Showdown";showdown.managers=showdown.managers||{playerOne:"Manager 1",playerTwo:"Manager 2"};showdown.managers.playerOne=showdown.managers.playerOne||"Manager 1";showdown.managers.playerTwo=showdown.managers.playerTwo||"Manager 2";
    const requestedRounds=Number(showdown.totalRounds)||1;showdown.totalRounds=ALLOWED_SHOWDOWN_ROUNDS.includes(requestedRounds)?requestedRounds:1;showdown.currentRound=Math.max(1,Math.min(Number(showdown.currentRound)||1,showdown.totalRounds));showdown.status=showdown.status||"Created";showdown.selectedLeague=showdown.selectedLeague||null;
    showdown.clubs=showdown.clubs||{playerOne:null,playerTwo:null};showdown.clubs.playerOne=showdown.clubs.playerOne||null;showdown.clubs.playerTwo=showdown.clubs.playerTwo||null;
    showdown.score=showdown.score||{playerOne:0,playerTwo:0};showdown.score.playerOne=Number(showdown.score.playerOne)||0;showdown.score.playerTwo=Number(showdown.score.playerTwo)||0;
    showdown.transferChallenges=Array.isArray(showdown.transferChallenges)?showdown.transferChallenges:[];showdown.rounds=Array.isArray(showdown.rounds)?showdown.rounds:[];showdown.integrityWarnings=Array.isArray(showdown.integrityWarnings)?showdown.integrityWarnings:[];
    showdown.createdAt=showdown.createdAt||null;showdown.updatedAt=showdown.updatedAt||null;showdown.completedAt=showdown.completedAt||null;showdown.archivedAt=showdown.archivedAt||null;
    showdown.transferChallenges.forEach(challenge=>{if(!challenge)return;challenge.seasonNumber=Math.max(1,Number(challenge.seasonNumber)||1);challenge.status=challenge.status||"not_started";challenge.durationSeconds=Number(challenge.durationSeconds)||900;challenge.startedAt=challenge.startedAt||null;challenge.deadlineAt=challenge.deadlineAt||null;challenge.endedAt=challenge.endedAt||null;challenge.completedAt=challenge.completedAt||null;challenge.endedEarly=Boolean(challenge.endedEarly);challenge.signings=challenge.signings||{playerOne:[],playerTwo:[]};challenge.signings.playerOne=Array.isArray(challenge.signings.playerOne)?challenge.signings.playerOne:[];challenge.signings.playerTwo=Array.isArray(challenge.signings.playerTwo)?challenge.signings.playerTwo:[];challenge.guesses=challenge.guesses||{againstPlayerOne:[],againstPlayerTwo:[]};challenge.guesses.againstPlayerOne=Array.isArray(challenge.guesses.againstPlayerOne)?challenge.guesses.againstPlayerOne:[];challenge.guesses.againstPlayerTwo=Array.isArray(challenge.guesses.againstPlayerTwo)?challenge.guesses.againstPlayerTwo:[];});
    showdown.rounds.forEach((round,index)=>{if(round)round.roundNumber=Number(round.roundNumber)||(index+1);});
    if(typeof recalculateShowdownScores==="function")recalculateShowdownScores(showdown);
    repairShowdownIntegrity(showdown);showdown.schemaVersion=CURRENT_SHOWDOWN_SCHEMA_VERSION;return showdown;
}
function needsShowdownNormalization(showdown){if(!showdown||typeof showdown!=="object"||Array.isArray(showdown))return true;if(Number(showdown.schemaVersion)!==CURRENT_SHOWDOWN_SCHEMA_VERSION)return true;if(!showdown.managers||!showdown.clubs||!showdown.score)return true;if(!Array.isArray(showdown.transferChallenges)||!Array.isArray(showdown.rounds))return true;if(!ALLOWED_SHOWDOWN_ROUNDS.includes(Number(showdown.totalRounds)))return true;const round=Number(showdown.currentRound);return !Number.isInteger(round)||round<1||round>Number(showdown.totalRounds);}
function ensureCurrentShowdownNormalized(force=false){if(!currentShowdown)return null;if(force||needsShowdownNormalization(currentShowdown))currentShowdown=normalizeShowdown(currentShowdown);return currentShowdown;}
function touchCurrentShowdown(){if(currentShowdown)currentShowdown.updatedAt=new Date().toISOString();}
function getShowdownWinner(showdown=currentShowdown){if(!showdown)return"draw";if(Number(showdown.score.playerOne)>Number(showdown.score.playerTwo))return"playerOne";if(Number(showdown.score.playerTwo)>Number(showdown.score.playerOne))return"playerTwo";return"draw";}
function getTransferChallengeForSeason(seasonNumber){if(!currentShowdown||!Array.isArray(currentShowdown.transferChallenges))return null;const targetSeason=Number(seasonNumber);return currentShowdown.transferChallenges.find(challenge=>challenge&&Number(challenge.seasonNumber)===targetSeason)||null;}
function isTransferChallengeComplete(seasonNumber){const challenge=getTransferChallengeForSeason(seasonNumber);return Boolean(challenge&&challenge.status==="completed");}
window.createShowdown=createShowdown;
window.isLeagueDatabaseReady=isLeagueDatabaseReady;
window.ensureCurrentShowdownNormalized=ensureCurrentShowdownNormalized;
window.needsShowdownNormalization=needsShowdownNormalization;
initializeSaveLibraryCutoverGate();
