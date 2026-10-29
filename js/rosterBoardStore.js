(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeRosterBoardStore=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r87 Roster Russian Roulette (Nik 2026-10-29: "Edit board before each spin"): from season 2 each manager saves the board
  // he holds for that season's spin (his real current XI + 4 subs) before he spins. One create-only Firebase document per
  // manager per season, rivalries/{id}/rosterBoards/season_N_<role>: 1 write, checked by the Rules (shape, own role only,
  // Showdown under way, shared write authority). A saved board never changes, so after one read (or the save) it is kept as
  // a copy on this phone and never read again. Season 1 uses the FIFA 17 launch board and saves nothing.
  // The caller passes the budget-wrapped services' firestore and firestoreSdk ({doc, runTransaction, serverTimestamp}), so
  // every read is a metered transaction read; this module makes no direct document read and opens no listener.
  const COPY_KEY="careerModeShowdown.rosterBoards.v1",COPY_MAX=40;
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const DOC_KEYS=Object.freeze(["schemaVersion","objectType","rivalryId","seasonNumber","managerRole","positions","names","createdAt","activeSessionId","updatedByDeviceId"]);
  const XI=11,BOARD=15;
  const copies=new Map();

  function rbsEngine(){return root.CareerModeRosterRoulette||(typeof module!=="undefined"&&module.exports?require("./rosterRoulette.js"):null);}
  function rbsFail(code){const error=new Error(code);error.code=code;throw error;}
  function rbsResultError(error){return Object.freeze({ok:false,code:error&&typeof error.code==="string"?error.code:"ROSTER_PROVIDER_FAILED"});}
  function rbsRivalry(value){const id=String(value||"");if(!/^pair_[0-9a-f]{64}$/.test(id))rbsFail("ROSTER_RIVALRY_INVALID");return id;}
  function rbsSeason(value){if(!Number.isInteger(value)||value<2||value>10)rbsFail("ROSTER_SEASON_INVALID");return value;}
  function rbsRole(value){if(!ROLES.includes(value))rbsFail("ROSTER_ROLE_INVALID");return value;}
  function rbsBoardId(season,role){return `season_${season}_${role}`;}
  function rbsPath(rivalryId,season,role){return `rivalries/${rivalryId}/rosterBoards/${rbsBoardId(season,role)}`;}
  function rbsSdk(sdk){for(const name of ["doc","runTransaction","serverTimestamp"])if(!sdk||typeof sdk[name]!=="function")rbsFail("ROSTER_PROVIDER_UNAVAILABLE");return sdk;}
  // A board as the engine and the Rules want it: 15 rows of {pos,name} (XI with one GK, then 4 subs), or null. Frozen all the
  // way down, because the same rows are kept as this phone's copy: a caller can never change a locked board in memory.
  function rbsRows(rows){const engine=rbsEngine(),board=engine&&engine.normalizeBoard(rows);return board?Object.freeze(board.map(p=>Object.freeze({pos:p.pos,name:p.name}))):null;}
  function rbsFromDocument(value,rivalryId,season,role){
    if(!value||typeof value!=="object"||Object.keys(value).length!==DOC_KEYS.length||DOC_KEYS.some(key=>!Object.hasOwn(value,key)))return null;
    if(value.schemaVersion!==1||value.objectType!=="rosterBoard"||value.rivalryId!==rivalryId||value.seasonNumber!==season||value.managerRole!==role)return null;
    if(!Array.isArray(value.positions)||value.positions.length!==XI||!Array.isArray(value.names)||value.names.length!==BOARD)return null;
    return rbsRows(value.names.map((name,i)=>({pos:i<XI?value.positions[i]:"SUB",name})));
  }

  // The phone copy goes through the app's storage helpers (js/storage.js); it is a convenience, never the only record.
  function rbsCopyList(){try{const value=JSON.parse(typeof root.readStorageValue==="function"&&root.readStorageValue(COPY_KEY)||"[]");return Array.isArray(value)?value.filter(item=>Array.isArray(item)&&item.length===2&&typeof item[0]==="string"):[];}catch(_error){return [];}}
  function rbsCopy(path){if(copies.has(path))return copies.get(path);const found=rbsCopyList().find(item=>item[0]===path);const rows=found?rbsRows(found[1]):null;if(rows)copies.set(path,rows);return rows;}
  function rbsKeep(path,rows){
    copies.set(path,rows);
    try{const list=rbsCopyList().filter(item=>item[0]!==path);list.push([path,rows]);if(typeof root.writeStorageValue==="function")root.writeStorageValue(COPY_KEY,JSON.stringify(list.slice(-COPY_MAX)));}catch(_error){}
  }

  // The document this manager saves: the board as two flat lists (11 XI positions; 15 names, XI then subs), which keeps
  // the Rules check small. createdAt is the server time (the Rules require request.time).
  function rbsDocument({rivalryId,season,role,rows,sessionId,deviceId},sdk){
    return {schemaVersion:1,objectType:"rosterBoard",rivalryId,seasonNumber:season,managerRole:role,positions:rows.slice(0,XI).map(row=>row.pos),names:rows.map(row=>row.name),createdAt:sdk.serverTimestamp(),activeSessionId:sessionId,updatedByDeviceId:deviceId};
  }

  // read({firestore, firebaseSdk, rivalryId, season, role}) -> {ok, rows|null}. null = not saved yet.
  async function rbsRead(options){
    try{
      const rivalryId=rbsRivalry(options.rivalryId),season=rbsSeason(options.season),role=rbsRole(options.role),path=rbsPath(rivalryId,season,role);
      const kept=rbsCopy(path);if(kept)return Object.freeze({ok:true,rows:kept,source:"phone"});
      const sdk=rbsSdk(options.firebaseSdk);if(!options.firestore)rbsFail("ROSTER_PROVIDER_UNAVAILABLE");
      const ref=sdk.doc(options.firestore,"rivalries",rivalryId,"rosterBoards",rbsBoardId(season,role));
      const value=await sdk.runTransaction(options.firestore,async transaction=>{const snapshot=await transaction.get(ref);return snapshot.exists()?snapshot.data():null;});
      if(value===null)return Object.freeze({ok:true,rows:null,source:"server"});
      const rows=rbsFromDocument(value,rivalryId,season,role);if(!rows)rbsFail("ROSTER_BOARD_STORED_INVALID");
      rbsKeep(path,rows);return Object.freeze({ok:true,rows,source:"server"});
    }catch(error){return rbsResultError(error);}
  }

  // save({firestore, firebaseSdk, rivalryId, sessionId, deviceId, season, role, rows}) -> {ok, rows, created}.
  // A board already saved for this season (a second tap, a refresh, another tab) is returned as stored, never replaced:
  // the spin always uses the board that was locked first.
  async function rbsSave(options){
    try{
      const rivalryId=rbsRivalry(options.rivalryId),season=rbsSeason(options.season),role=rbsRole(options.role),path=rbsPath(rivalryId,season,role);
      const rows=rbsRows(options.rows);if(!rows)rbsFail("ROSTER_BOARD_INVALID");
      if(!/^session_[0-9a-f]{64}$/.test(String(options.sessionId||"")))rbsFail("ROSTER_SESSION_INVALID");
      if(!/^device_[0-9a-f]{32}$/.test(String(options.deviceId||"")))rbsFail("ROSTER_DEVICE_INVALID");
      const kept=rbsCopy(path);if(kept)return Object.freeze({ok:true,rows:kept,created:false});
      const sdk=rbsSdk(options.firebaseSdk);if(!options.firestore)rbsFail("ROSTER_PROVIDER_UNAVAILABLE");
      const ref=sdk.doc(options.firestore,"rivalries",rivalryId,"rosterBoards",rbsBoardId(season,role));
      const outcome=await sdk.runTransaction(options.firestore,async transaction=>{
        const snapshot=await transaction.get(ref);
        if(snapshot.exists())return {stored:snapshot.data()};
        transaction.set(ref,rbsDocument({rivalryId,season,role,rows,sessionId:options.sessionId,deviceId:options.deviceId},sdk));
        return {created:true};
      });
      if(outcome.created){rbsKeep(path,rows);return Object.freeze({ok:true,rows,created:true});}
      const stored=rbsFromDocument(outcome.stored,rivalryId,season,role);if(!stored)rbsFail("ROSTER_BOARD_STORED_INVALID");
      rbsKeep(path,stored);return Object.freeze({ok:true,rows:stored,created:false});
    }catch(error){return rbsResultError(error);}
  }

  return Object.freeze({contractVersion:1,feature:"cms-roster-board-store",copyKey:COPY_KEY,path:rbsPath,boardId:rbsBoardId,documentFor:rbsDocument,read:rbsRead,save:rbsSave,forgetPhoneCopies(){copies.clear();}});
});
