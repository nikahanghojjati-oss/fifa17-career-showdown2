(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeIconNames=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // R88 Prime Pack (Nik 2026-10-31): the typed guess and its live suggestions. Pure functions, no IO.
  // - Matching ignores accents, case, spaces, dots, hyphens and apostrophes, so "Cech", "cech" and "Čech" are one name.
  // - A guess counts when its text is one of an icon's accepted names (card name, full name, and the database's
  //   accepted_names). An exact name always wins. A name that two icons share is "ambiguous": no chip, and the
  //   suggestions show both so the manager can pick.
  // - G Lead 2026-11-01 (it's a football game, not a spelling test): with no exact name, a small typo still counts, but only
  //   when it can point to one icon alone (TYPO_RULE below). Anything else is "not-in-list" and uses no guess chip, so a
  //   typo that is refused never burns a chance.
  // The list is data/icons.js (written by scripts/r88-icons-from-csv.mjs from GPT's checked CSVs), or any array of rows
  // with {id, name, fullName, acceptedNames}.
  const MIN_SUGGEST_CHARS=2;
  const DEFAULT_SUGGEST_LIMIT=6;
  // Typo tolerance, all its numbers in one place (G Lead 2026-11-01, second rule). Lengths are folded letters (a-z, 0-9),
  // so accents never count as typos. A typed text with no exact name counts as icon X only when ALL of these hold:
  //  1 the text has at least minTypedLetters letters ("pel" is not yet "Pele");
  //  2 the edit distance (Levenshtein: one letter added, dropped or changed is 1) from the text to one of X's names is at
  //    most that name's allowance: 0 for 3 or fewer letters, 1 for 4 to 5, 2 for 6 or more ("posks" is 2 from "puskas");
  //  3 no OTHER icon has any name within othersWithin slips of the text, whatever that name's length, where a slip is a
  //    letter added, dropped or changed or two neighbours swapped (full Damerau-Levenshtein). So one or two slips on one
  //    icon's name can never count as another icon: that icon is within 2 and the text is refused ("reme" is 1 from Remy
  //    but 2 from Brehme: refused);
  //  4 the text is not a whole word of another icon's name ("Ronald" is Koeman's first name, not a typo of Ronaldo).
  // A refused typo is "not-in-list" and costs no guess chip. Only ever tighten these numbers.
  const TYPO_RULE=Object.freeze({minTypedLetters:4,oneEditFrom:4,twoEditsFrom:6,maxEdits:2,othersWithin:2});
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
    // For typos: every (name key, icon) pair once, grouped by length, and which icons each whole name word belongs to.
    const typoKeys=[],wordOwners=new Map();
    for(const entry of entries){
      for(const key of new Set(entry.keys)){
        while(typoKeys.length<=key.length)typoKeys.push([]);
        typoKeys[key.length].push(Object.freeze({key,id:entry.id,bag:inBag(key)}));
      }
      for(const word of entry.words){
        if(!wordOwners.has(word))wordOwners.set(word,new Set());
        wordOwners.get(word).add(entry.id);
      }
    }
    return Object.freeze({size:entries.length,entries:Object.freeze(entries),byId:new Map(entries.map(e=>[e.id,e])),byKey,
      typoKeys:Object.freeze(typoKeys.map(Object.freeze)),wordOwners});
  }

  // Letter counts of a folded key (a-z then 0-9). One added, dropped or changed letter moves the counts by at most 2 in all
  // and a swap by 0, so names whose counts differ by more than 2 per allowed slip are skipped without the full count.
  function inBag(key){
    const bag=new Uint8Array(36);
    for(let i=0;i<key.length;i++){const c=key.charCodeAt(i);bag[c>=97?c-97:c-48+26]+=1;}
    return bag;
  }
  function inBagGap(x,y){let gap=0;for(let i=0;i<36;i++)gap+=x[i]>y[i]?x[i]-y[i]:y[i]-x[i];return gap;}
  // How many typo edits a name of this many folded letters allows (TYPO_RULE).
  function inTypoAllowance(length){
    if(length>=TYPO_RULE.twoEditsFrom)return 2;
    if(length>=TYPO_RULE.oneEditFrom)return 1;
    return 0;
  }
  // Edit distance between two folded keys, or max+1 as soon as it is known to be more than max. Plain Levenshtein (one
  // letter added, dropped or changed is 1 edit; two swapped letters are 2). With swaps=true, two neighbouring letters
  // swapped count as 1 edit (optimal string alignment): never more than Levenshtein, so it is used only where a smaller
  // distance makes the rule stricter, to judge whether ANOTHER icon is as close.
  // Only the cells within max of the diagonal are worked out (the rest are already more than max), so it stays quick.
  let rowA=new Int32Array(64),rowB=new Int32Array(64),rowC=new Int32Array(64);
  function inDistance(a,b,max=Infinity,swaps=false){
    a=String(a);b=String(b);
    if(a===b)return 0;
    const la=a.length,lb=b.length;
    if(!Number.isFinite(max))max=Math.max(la,lb);
    if(Math.abs(la-lb)>max)return max+1;
    if(rowA.length<=lb+1){rowA=new Int32Array(lb+2);rowB=new Int32Array(lb+2);rowC=new Int32Array(lb+2);}
    const far=max+1;
    let back=rowC,prev=rowA,cur=rowB;
    for(let j=0;j<=lb;j++)prev[j]=j<=max?j:far;
    for(let i=1;i<=la;i++){
      const lo=Math.max(1,i-max),hi=Math.min(lb,i+max);
      cur[0]=i<=max?i:far;
      if(lo>1)cur[lo-1]=far;
      let rowMin=lo===1?cur[0]:far;
      const ca=a.charCodeAt(i-1);
      for(let j=lo;j<=hi;j++){
        const cb=b.charCodeAt(j-1);
        let v=prev[j-1]+(ca===cb?0:1);
        if(prev[j]+1<v)v=prev[j]+1;
        if(cur[j-1]+1<v)v=cur[j-1]+1;
        if(swaps&&i>1&&j>1&&ca===b.charCodeAt(j-2)&&a.charCodeAt(i-2)===cb&&back[j-2]+1<v)v=back[j-2]+1;
        cur[j]=v;if(v<rowMin)rowMin=v;
      }
      if(hi<lb)cur[hi+1]=far;
      if(rowMin>max)return far;
      const t=back;back=prev;prev=cur;cur=t;
    }
    return prev[lb]>max?far:prev[lb];
  }
  // Full Damerau-Levenshtein distance (Lowrance-Wagner): any mix of letters added, dropped, changed and neighbours swapped,
  // each 1, including a swap next to another slip ("toure" -> "ture" -> "utre" is 2). Never more than the distances above.
  // Used only by rule 3, so that ANY two slips on another icon's name stay within reach of the refusal.
  let damTable=new Int32Array(0);const damLast=new Int32Array(128);
  function inDamerau(a,b){
    a=String(a);b=String(b);
    const la=a.length,lb=b.length,w=lb+2,inf=la+lb;
    if(damTable.length<(la+2)*w)damTable=new Int32Array((la+2)*w);
    const H=damTable;damLast.fill(0);
    H[0]=inf;
    for(let i=0;i<=la;i++){H[(i+1)*w]=inf;H[(i+1)*w+1]=i;}
    for(let j=0;j<=lb;j++){H[j+1]=inf;H[w+j+1]=j;}
    for(let i=1;i<=la;i++){
      let lastMatch=0;const ca=a.charCodeAt(i-1)&127;
      for(let j=1;j<=lb;j++){
        const cb=b.charCodeAt(j-1)&127,i1=damLast[cb],j1=lastMatch,cost=ca===cb?0:1;
        if(!cost)lastMatch=j;
        let v=H[i*w+j]+cost;
        if(H[(i+1)*w+j]+1<v)v=H[(i+1)*w+j]+1;
        if(H[i*w+j+1]+1<v)v=H[i*w+j+1]+1;
        const t=H[i1*w+j1]+(i-i1-1)+1+(j-j1-1);if(t<v)v=t;
        H[(i+1)*w+j+1]=v;
      }
      damLast[ca]=i;
    }
    return H[(la+1)*w+lb+1];
  }
  // Is another icon's name within two slips of the text? Quick checks first; the full count only when it can matter
  // (two slips are never more than 4 plain edits).
  function inWithinSlips(key,name,within,keyBag,nameBag){
    if(Math.abs(key.length-name.length)>within)return false;
    if(keyBag&&nameBag&&inBagGap(keyBag,nameBag)>2*within)return false;
    if(inDistance(key,name,within,true)<=within)return true;
    if(inDistance(key,name,2*within)>2*within)return false;
    return inDamerau(key,name)<=within;
  }
  // The one icon a typo points to, or null. key has no exact name in the index.
  function inTypo(index,key){
    if(key.length<TYPO_RULE.minTypedLetters||!index.typoKeys)return null;
    const buckets=index.typoKeys,last=buckets.length-1,max=TYPO_RULE.maxEdits,within=TYPO_RULE.othersWithin,bag=inBag(key);
    // Rule 2: the closest name within its own allowance (only names within max letters of the text's length can be).
    let winner=null,winnerD=Infinity;
    for(let length=Math.max(0,key.length-max);length<=Math.min(last,key.length+max);length++){
      const allowance=inTypoAllowance(length);
      if(!allowance)continue;
      for(const {key:name,id,bag:nameBag} of buckets[length]){
        if(inBagGap(bag,nameBag)>2*Math.min(allowance,winnerD))continue;
        const d=inDistance(key,name,Math.min(allowance,winnerD));
        if(d<=allowance&&d<winnerD){winner=id;winnerD=d;}
      }
    }
    if(!winner)return null;
    // Rule 3: no other icon has any name within othersWithin slips (added, dropped, changed or swapped letters, each 1).
    for(let length=Math.max(0,key.length-within);length<=Math.min(last,key.length+within);length++){
      for(const {key:name,id,bag:nameBag} of buckets[length])if(id!==winner&&inWithinSlips(key,name,within,bag,nameBag))return null;
    }
    // Rule 4: the text is not a whole word of another icon's name.
    const owners=index.wordOwners&&index.wordOwners.get(key);
    if(owners)for(const id of owners)if(id!==winner)return null;
    return {id:winner,distance:winnerD};
  }

  // What a typed guess means: {status:"empty"|"not-in-list"|"ambiguous"|"match", id?, ids?, usesChip}.
  // Only "match" uses a chip. A match found through a typo also has typo:true, the edit distance and the icon's card name
  // (so the screen can say who it counted as).
  function inMatch(index,text){
    const key=inFold(text);
    if(!key)return Object.freeze({status:"empty",usesChip:false});
    const ids=index.byKey.get(key);
    if(!ids){
      const typo=inTypo(index,key);
      if(!typo)return Object.freeze({status:"not-in-list",usesChip:false});
      return Object.freeze({status:"match",id:typo.id,usesChip:true,typo:true,distance:typo.distance,name:index.byId.get(typo.id).name});
    }
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

  return Object.freeze({contractVersion:1,feature:"cms-icon-names",minSuggestChars:MIN_SUGGEST_CHARS,suggestLimit:DEFAULT_SUGGEST_LIMIT,typoRule:TYPO_RULE,
    fold:inFold,words:inWords,namesFor:inNamesFor,index:inIndex,match:inMatch,check:inCheck,suggest:inSuggest,defaultIndex:inDefaultIndex,
    distance:inDistance,damerau:inDamerau,typoAllowance:inTypoAllowance});
});
