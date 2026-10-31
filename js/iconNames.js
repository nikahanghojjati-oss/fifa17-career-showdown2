(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeIconNames=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // R88 Icon Unmasked (Nik 2026-10-31): the typed guess and its live suggestions. Pure functions, no IO.
  // - Matching ignores accents, case, spaces, dots, hyphens and apostrophes, so "Cech", "cech" and "Čech" are one name.
  // - A guess counts only when its text is one of an icon's accepted names (card name, full name, and the database's
  //   accepted_names). Anything else is "not-in-list" and must not use a guess chip (spec §3: a typo never burns a chance).
  // - A name that two icons share is "ambiguous": no chip either, and the suggestions show both so the manager can pick.
  // The list is data/icons.js (written by scripts/r88-icons-from-csv.mjs from GPT's checked CSVs), or any array of rows
  // with {id, name, fullName, acceptedNames}.
  const MIN_SUGGEST_CHARS=2;
  const DEFAULT_SUGGEST_LIMIT=6;
  // Letters NFD does not split into base letter + accent.
  const SPECIAL_LETTERS=Object.freeze({"ø":"o","Ø":"o","æ":"ae","Æ":"ae","œ":"oe","Œ":"oe","ß":"ss","ẞ":"ss","đ":"d","Đ":"d","ð":"d","Ð":"d","þ":"th","Þ":"th","ł":"l","Ł":"l","ı":"i","ħ":"h","Ħ":"h","ŀ":"l","Ŀ":"l"});
  const SPECIAL_RE=new RegExp(`[${Object.keys(SPECIAL_LETTERS).join("")}]`,"g");

  // The comparison key of any text: plain lower-case a-z and 0-9 only.
  function inFold(text){
    return String(text??"").replace(SPECIAL_RE,ch=>SPECIAL_LETTERS[ch]).normalize("NFD").replace(/[̀-ͯ]/g,"")
      .toLowerCase().replace(/[^a-z0-9]/g,"");
  }
  // The same, but keeping word breaks, for word-start suggestions ("Petr Čech" -> ["petr","cech"]).
  function inWords(text){
    return String(text??"").replace(SPECIAL_RE,ch=>SPECIAL_LETTERS[ch]).normalize("NFD").replace(/[̀-ͯ]/g,"")
      .toLowerCase().replace(/['’.]/g,"").split(/[^a-z0-9]+/).filter(Boolean);
  }
  // Every name a row accepts, in order, without repeats under folding: card name, full name, then accepted_names.
  function inNamesFor(row){
    const seen=new Set(),names=[];
    for(const name of [row&&row.name,row&&row.fullName,...(Array.isArray(row&&row.acceptedNames)?row.acceptedNames:[])]){
      if(typeof name!=="string")continue;
      const text=name.trim(),key=inFold(text);
      if(!key||seen.has(key))continue;
      seen.add(key);names.push(text);
    }
    return Object.freeze(names);
  }

  // Build the lookup once per list. Throws on a row without an id or a name, or on a repeated id.
  function inIndex(rows){
    if(!Array.isArray(rows))throw new TypeError("icon list must be an array");
    const byKey=new Map(),entries=[],ids=new Set();
    for(const row of rows){
      const id=row&&row.id;
      if(typeof id!=="string"||!id)throw new TypeError("icon row without id");
      if(ids.has(id))throw new Error(`repeated icon id ${id}`);
      ids.add(id);
      const names=inNamesFor(row);
      if(!names.length)throw new Error(`icon ${id} has no name`);
      const keys=names.map(inFold);
      const words=[...new Set(names.flatMap(inWords))];
      for(const key of keys){
        if(!byKey.has(key))byKey.set(key,[]);
        if(!byKey.get(key).includes(id))byKey.get(key).push(id);
      }
      entries.push(Object.freeze({id,name:typeof row.name==="string"&&row.name.trim()?row.name.trim():names[0],fullName:typeof row.fullName==="string"?row.fullName.trim():null,
        names,keys:Object.freeze(keys),words:Object.freeze(words),sortKey:inFold(row.name||names[0])}));
    }
    return Object.freeze({size:entries.length,entries:Object.freeze(entries),byId:new Map(entries.map(e=>[e.id,e])),byKey});
  }

  // What a typed guess means: {status:"empty"|"not-in-list"|"ambiguous"|"match", id?, ids?, usesChip}.
  // Only "match" uses a chip.
  function inMatch(index,text){
    const key=inFold(text);
    if(!key)return Object.freeze({status:"empty",usesChip:false});
    const ids=index.byKey.get(key);
    if(!ids)return Object.freeze({status:"not-in-list",usesChip:false});
    if(ids.length>1)return Object.freeze({status:"ambiguous",ids:Object.freeze([...ids]),usesChip:false});
    return Object.freeze({status:"match",id:ids[0],usesChip:true});
  }
  // The guess against the answer: the match plus correct true/false (always false when no chip is used).
  function inCheck(index,text,answerId){
    const match=inMatch(index,text);
    return Object.freeze({...match,correct:match.status==="match"&&match.id===answerId});
  }

  // Live suggestions while typing, from MIN_SUGGEST_CHARS folded letters on. Best first:
  // 0 a whole name equals the text, 1 a name starts with it, 2 a word of a name starts with it, 3 a name contains it.
  // Ties go alphabetically by card name, then id, so both phones list the same order. Each icon appears once.
  function inSuggest(index,text,{limit=DEFAULT_SUGGEST_LIMIT,minChars=MIN_SUGGEST_CHARS}={}){
    const key=inFold(text);
    if(key.length<minChars)return Object.freeze([]);
    const queryWords=inWords(text);
    const scored=[];
    for(const entry of index.entries){
      let rank=null;
      if(entry.keys.includes(key))rank=0;
      else if(entry.keys.some(k=>k.startsWith(key)))rank=1;
      else if(queryWords.length&&queryWords.every(q=>entry.words.some(w=>w.startsWith(q))))rank=2;
      else if(entry.keys.some(k=>k.includes(key)))rank=3;
      if(rank!==null)scored.push([rank,entry]);
    }
    scored.sort((a,b)=>a[0]-b[0]||(a[1].sortKey<b[1].sortKey?-1:a[1].sortKey>b[1].sortKey?1:0)||(a[1].id<b[1].id?-1:a[1].id>b[1].id?1:0));
    return Object.freeze(scored.slice(0,Math.max(0,limit)).map(([,entry])=>Object.freeze({id:entry.id,name:entry.name,fullName:entry.fullName})));
  }

  // The shipped list (data/icons.js), or null when it is not loaded yet.
  function inDefaultRows(){
    if(root.CareerModeIcons&&Array.isArray(root.CareerModeIcons.players))return root.CareerModeIcons.players;
    if(typeof module!=="undefined"&&module.exports){
      try{const list=require("../data/icons.js");return list&&Array.isArray(list.players)?list.players:null;}catch(error){return null;}
    }
    return null;
  }
  let defaultIndex=null;
  function inDefaultIndex(){
    if(defaultIndex)return defaultIndex;
    const rows=inDefaultRows();
    return rows?(defaultIndex=inIndex(rows)):null;
  }

  return Object.freeze({contractVersion:1,feature:"cms-icon-names",minSuggestChars:MIN_SUGGEST_CHARS,suggestLimit:DEFAULT_SUGGEST_LIMIT,
    fold:inFold,words:inWords,namesFor:inNamesFor,index:inIndex,match:inMatch,check:inCheck,suggest:inSuggest,defaultIndex:inDefaultIndex});
});
