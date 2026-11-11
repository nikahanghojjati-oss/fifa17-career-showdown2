/* Career Mode Showdown r91 (2.4.0): the full FIFA 17 launch player list for Transfer War name autocomplete.
   data/fifa17/players-170002.<sha8>.json is built by scripts/build-fifa17-database.py from the hash-pinned players_17.csv
   (SoFIFA roster 170002 = FIFA 17 v1.11 "Reset All Squads"): all 17,597 players, 224 free agents included.
   - load(json) is pure; suggest(text) ranks: exact name (or one whole name word), every typed word starts a name word, the joined name
     starts with the text, the name contains it.
     Ties: higher overall, then lower SoFIFA id, so the likely signing comes first and the order never changes.
   - ensure() fetches the file once per page, at idle, never on Home (only Transfer War asks). A content hash in the name
     means a cached copy is never stale. A failed fetch leaves the name box as plain text and the next ask retries.
   - No Firestore: the file comes from the site itself, nothing is sent anywhere. */
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModePlayerSearch=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  const PLAYERS_FILE="data/fifa17/players-170002.0aeb6a8d.json";
  const LIMIT=20,MIN_LETTERS=2;
  // Same folding as Prime Pack (js/iconNames.js inFold/inWords), so "Cech", "cech" and "Čech" all match.
  const SPECIAL_LETTERS=Object.freeze({"ø":"o","Ø":"o","æ":"ae","Æ":"ae","œ":"oe","Œ":"oe","ß":"ss","ẞ":"ss","đ":"d","Đ":"d","ð":"d","Ð":"d","þ":"th","Þ":"th","ł":"l","Ł":"l","ı":"i","ħ":"h","Ħ":"h","ŀ":"l","Ŀ":"l"});
  const SPECIAL_RE=new RegExp(`[${Object.keys(SPECIAL_LETTERS).join("")}]`,"g");
  function foldBase(text){return String(text??"").replace(SPECIAL_RE,ch=>SPECIAL_LETTERS[ch]).normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();}
  function fold(text){return foldBase(text).replace(/[^a-z0-9]/g,"");}
  function words(text){return foldBase(text).replace(/['’.]/g,"").split(/[^a-z0-9]+/).filter(Boolean);}

  function loadList(json){
    const data=typeof json==="string"?JSON.parse(json):json;
    if(!data||data.v!==1||!data.cols||!Array.isArray(data.cols.id))throw new Error("PLAYER_LIST_INVALID");
    const c=data.cols,count=c.id.length;
    for(const key of ["n","f","o","p","pos","c","na","a","sh"])if(!Array.isArray(c[key])||c[key].length!==count)throw new Error("PLAYER_LIST_INVALID");
    let keys=null;
    // Folded keys, built once on first search (about 17 ms in V8 for all players).
    function buildKeys(){
      if(keys)return keys;
      const name=new Array(count),long=new Array(count),wordList=new Array(count);
      for(let i=0;i<count;i+=1){
        name[i]=fold(c.n[i]);long[i]=c.f[i]?fold(c.f[i]):"";
        wordList[i]=c.f[i]?[...new Set([...words(c.n[i]),...words(c.f[i])])]:words(c.n[i]);
      }
      keys={name,long,words:wordList};return keys;
    }
    const byIdIndex=new Map();for(let i=0;i<count;i+=1)byIdIndex.set(c.id[i],i);
    function row(i){
      const club=c.c[i]>=0?data.clubs[c.c[i]]:null,positions=String(c.pos[i]).split(",");
      return Object.freeze({id:c.id[i],name:c.n[i],longName:c.f[i]||"",overall:c.o[i],potential:c.p[i],positions:Object.freeze(positions),position:positions[0],
        club:club?club[0]:"",leagueId:club?data.leagues[club[1]]:"",freeAgent:!club,nationality:data.nations[c.na[i]],nationalityId:data.nationIds[c.na[i]]||"",
        age:c.a[i],shirt:c.sh[i]||0});
    }
    function suggest(text,options={}){
      const q=fold(text),qWords=words(text),limit=Number.isInteger(options.limit)?options.limit:LIMIT;
      if(q.length<MIN_LETTERS)return [];
      const k=buildKeys(),hits=[];
      for(let i=0;i<count;i+=1){
        const n=k.name[i],l=k.long[i];let tier=-1;
        if(n===q||l===q||(qWords.length===1&&k.words[i].includes(q)))tier=0;
        else if(qWords.length&&qWords.every(w=>k.words[i].some(x=>x.startsWith(w))))tier=1;
        else if(n.startsWith(q)||(l&&l.startsWith(q)))tier=2;
        else if(n.includes(q)||(l&&l.includes(q)))tier=3;
        if(tier>=0)hits.push(i*4+tier);
      }
      hits.sort((a,b)=>(a&3)-(b&3)||c.o[b>>2]-c.o[a>>2]||c.id[a>>2]-c.id[b>>2]);
      return hits.slice(0,limit).map(h=>row(h>>2));
    }
    function findById(id){const i=byIdIndex.get(Number(id));return i===undefined?null:row(i);}
    return Object.freeze({count,roster:data.roster,suggest,byId:findById,warm:buildKeys});
  }

  // ---- loading (browser only) ----
  let db=null,pending=null,status="idle";
  function idle(fn){if(typeof root.requestIdleCallback==="function")root.requestIdleCallback(fn,{timeout:2000});else root.setTimeout(fn,0);}
  function ensure(){
    if(db)return Promise.resolve(db);
    if(pending)return pending;
    if(typeof root.fetch!=="function"){status="failed";return Promise.resolve(null);}
    status="loading";
    pending=new Promise(resolve=>idle(resolve)).then(()=>root.fetch(PLAYERS_FILE,{credentials:"same-origin"}))
      .then(response=>{if(!response||!response.ok)throw new Error("PLAYER_LIST_UNAVAILABLE");return response.json();})
      .then(json=>{db=loadList(json);status="ready";idle(()=>{try{db.warm();}catch(_error){}});notify();return db;})
      .catch(()=>{status="failed";notify();return null;})
      .finally(()=>{pending=null;});
    return pending;
  }
  function notify(){try{if(root.document&&typeof root.CustomEvent==="function")root.document.dispatchEvent(new root.CustomEvent("career-mode-player-list",{detail:{status}}));}catch(_error){}}

  return Object.freeze({PLAYERS_FILE,LIMIT,MIN_LETTERS,fold,words,load:loadList,ensure,status:()=>status,ready:()=>db});
});
