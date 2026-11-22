/* THE CHRONICLE · Volume 26 (Team G, r98 / 2.11.0): adds "Four Balls, One League" (volume26-data.js) to the book after
   Volume 25, the same way volume25.js adds Volume 25. Words and data only; book.js and novel.js draw it. */
(()=>{
'use strict';
const d=window.CHRONICLE_VOLUME26,b=window.SHOWDOWN_BOOK;if(!d||!b)return;
b.parts.push(d.part);b.chapters.push(...d.chapters);b.wordCount+=d.wordCount;
const sm=new Map(b.sources.map(s=>[s.url,s]));for(const c of d.chapters)for(const s of c.sources)sm.set(s.url,s);b.sources=[...sm.values()];
if(Array.isArray(window.chronicleCurrentSearch))window.chronicleCurrentSearch.push(...d.chapters.map(c=>({kind:'latest',title:c.title,dek:c.dek,text:JSON.stringify(c.blocks),url:'#read/'+c.id,label:'2.11.0 LIVE'})));
})();
