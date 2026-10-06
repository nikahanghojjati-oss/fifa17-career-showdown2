// Page-side fixture installers. Loaded into the page with page.addScriptTag; everything hangs off window.__auditFixtures.
// No network, no auth: provider adapters are faked in the page, the real production modules and Team V skins render.
(function(){
  const F = window.__auditFixtures = {};
  // Real js/productionSharedTransferChallenge.js + js/transferScreenV10.js with a fake Spark read. Role playerOne (Daniel), phase starts WINDOW_OPEN.
  F.installTransfer = async function(){
        await ensureGameplayModules();
        const role = "playerOne", other = "playerTwo", rivalryId = "pair_" + "a".repeat(64), sessionId = "session_" + "c".repeat(64);
        const managers = { playerOne: "Daniel", playerTwo: "Nik" }, clubs = { playerOne: "Arsenal", playerTwo: "Liverpool" };
        const epoch = Date.now();
        currentShowdown = { ...currentShowdown, currentRound: 1, status: "Ready", sharedJourney: { mode: "shared", rivalryId }, managers };
        let phase = "WINDOW_OPEN";
        window.CareerModeProductionSharedShowdownSetup = { getState: () => ({ status: "ready", ready: true, open: false, busy: false, revision: 6, phase: "SHOWDOWN_CONFIRMED", rivalryId, sessionId, deviceId: "device_" + "1".repeat(32), managerRole: role, setup: { phase: "SHOWDOWN_CONFIRMED", revision: 6, coordinatorRole: "playerOne", totalSeasons: 3, confirmedRoles: ["playerOne", "playerTwo"], clubs } }), refresh: async () => ({ ok: true }) };
        window.CareerModeProductionSharedCareerStart = { getState: () => ({ state: { phase: "CAREER_START_READY", revision: 2, acknowledgedRoles: ["playerOne", "playerTwo"] } }), refresh: async () => ({ ok: true }) };
        window.CareerModeSharedTransferChallenge = { runtimeRevision: "1.9.1-r8" };
        const inputs = r => ({ guesses: [{ slot: 1, type: "league", valueId: "england-premier-league" }, { slot: 2, type: "nationality", valueId: "spain" }], signings: [{ slot: 1, name: r === "playerOne" ? "Player A" : "Player B", leagueId: "spain-primera-division", nationalityId: "england" }] });
        const view = () => {
            const base = { ok: true, seasonNumber: 1, managerRole: role, rivalryId };
            const ended = { startedAtEpochMs: epoch - 900000, endedAtEpochMs: epoch - 1, endRequestedRoles: ["playerOne", "playerTwo"] };
            if(phase === "WINDOW_OPEN") return { ...base, revision: 1, state: { phase, revision: 1, startedAtEpochMs: epoch - 30000, endRequestedRoles: [], guessLockedRoles: [], signingLockedRoles: [] }, ownInputs: { guesses: null, signings: null }, opponentInputs: null, verdicts: null };
            if(phase === "GUESS_ENTRY") return { ...base, revision: 3, state: { phase, revision: 3, ...ended, guessLockedRoles: [], signingLockedRoles: [] }, ownInputs: { guesses: null, signings: null }, opponentInputs: null, verdicts: null };
            if(phase === "SIGNING_ENTRY") return { ...base, revision: 5, state: { phase, revision: 5, ...ended, guessLockedRoles: ["playerOne", "playerTwo"], signingLockedRoles: [] }, ownInputs: { guesses: inputs(role).guesses, signings: null }, opponentInputs: null, verdicts: null };
            return { ...base, revision: 7, state: { phase: "COMPLETED", revision: 7, ...ended, guessLockedRoles: ["playerOne", "playerTwo"], signingLockedRoles: ["playerOne", "playerTwo"] }, ownInputs: inputs(role), opponentInputs: inputs(other), verdicts: { playerOne: [], playerTwo: [] } };
        };
        const reject = async () => ({ ok: false, code: "AUDIT_MUTATION_FORBIDDEN" });
        window.CareerModeSparkSharedTransferChallenge = { read: async () => view(), startWindow: reject, requestEndWindow: reject, advanceExpiredWindow: reject, lockGuesses: reject, lockSignings: reject };
        const currentUser = { uid: "account_one", getIdTokenResult: async () => ({ issuedAtTime: new Date(epoch).toISOString() }) };
        window.CareerModeProductionFirebaseRuntime = { ensureAccountServices: async () => ({ ok: true, auth: { currentUser }, firestore: {}, firestoreSdk: {} }) };
        await loadRuntimeScript("audit-transfer", "js/productionSharedTransferChallenge.js", () => window.CareerModeProductionSharedTransferChallenge);
        CareerModeProductionSharedTransferChallenge.install();
        await loadRuntimeScript("audit-transfer-v10", "js/transferScreenV10.js", () => window.CareerModeTransferScreenV10); await window.CareerModeTransferScreenV10.install();
        window.__auditTransfer = {
            open: async p => { phase = p; await CareerModeProductionSharedTransferChallenge.open(); },
            setPhase: async p => { phase = p; await CareerModeProductionSharedTransferChallenge.refresh(); }
        };
  };
  // Providers for Final Winner / Rivalry / Standings: identity, pair, multi-season, history, final reconciliation and terminal close states.
  F.installFinalState = async function(fx){
    await loadRuntimeScript("audit-adapter", "js/sharedActiveShowdownAdapter.js", () => window.CareerModeSharedActiveShowdownAdapter);
    const put = (name, state) => { window[name] = { ...(window[name] || {}), getState: () => state, subscribe: () => () => {}, refresh: async () => state, install() { return true; } }; };
    put("CareerModeOnlinePlayerIdentity", fx.identity); put("CareerModePersistentNikDanielPair", fx.pair);
    put("CareerModeProductionSharedMultiSeasonProgression", fx.multi); put("CareerModeProductionSharedHistoryConvergence", fx.history);
    put("CareerModeProductionSharedFinalReconciliation", fx.finalReconciliation); put("CareerModeProductionSharedTerminalClose", fx.closed);
    currentShowdown.sharedJourney = { mode: "shared", rivalryId: fx.rivalryId, setupPending: false };
  };
  // Team V career screens fed the contract career model (finished three seasons, trophies on both managers).
  F.mountCareer = async function(screen, model){
    await window.loadRuntimeScript("audit-career-v10", "js/careerScreensV10.js", () => window.CareerModeCareerScreensV10);
    await window.CareerModeCareerScreensV10.mount(screen, () => model);
  };
  // Rivalry Statistics and Legacy (js/rivalryLegacyV10.js): rivalry from the active-showdown adapter over the filled state, Legacy from the career model.
  F.mountRivalryLegacy = async function(screen, careerModel){
    await window.loadRuntimeScript("rivalry-legacy-v10", "js/rivalryLegacyV10.js", () => Boolean(window.CareerModeRivalryLegacyV10));
    let model = careerModel;
    if(screen === "rivalryStatistics"){
      const A = window.CareerModeSharedActiveShowdownAdapter;
      const snap = { identity: window.CareerModeOnlinePlayerIdentity.getState(), pair: window.CareerModePersistentNikDanielPair.getState(), history: window.CareerModeProductionSharedHistoryConvergence.getState(), multiSeason: window.CareerModeProductionSharedMultiSeasonProgression.getState(), finalReconciliation: window.CareerModeProductionSharedFinalReconciliation.getState(), terminalClose: window.CareerModeProductionSharedTerminalClose.getState() };
      const active = A.buildActiveShowdownViews(snap);
      model = { ...active.rivalry, lifecycle: active.classification };
    }
    await window.CareerModeRivalryLegacyV10.mount(screen, () => model);
  };
})();
