const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const W=+process.env.W,H=+process.env.H,TAG=process.env.TAG;const OUT='/tmp/claude-0/g1029b/shots/'+TAG+'-'+W+'x'+H+'-';
const only=(process.env.ONLY||'').split(',').filter(Boolean);
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:W,height:H}});
 const p=await ctx.newPage();
 const _ss=p.screenshot.bind(p); p.screenshot=async(o)=>{try{await p.waitForLoadState('networkidle',{timeout:15000});}catch(e){} await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(2500); return _ss(o);};
 p.on('pageerror',e=>console.log('ERR',e.message.slice(0,150)));
 await p.goto('http://localhost:8870/index.html',{waitUntil:'load'});
 await p.waitForTimeout(3000);
 await p.evaluate(async()=>{window.isRouteStateValid=function(){return true;};try{await navigateTo('seasonEntry');}catch(e){} if(getActiveScreenName()!=='seasonEntry') showScreen('seasonEntry');});
 await p.waitForTimeout(4000);
 const measure=(label,mainSel)=>p.evaluate(([label,mainSel])=>{
   const r=e=>{if(!e)return null;const b=e.getBoundingClientRect();return {x:Math.round(b.x),y:Math.round(b.y),r:Math.round(b.right),b:Math.round(b.bottom),w:Math.round(b.width),h:Math.round(b.height)};};
   const vis=e=>e&&e.offsetParent!==null||(e&&getComputedStyle(e).position==='fixed');
   const q=s=>document.querySelector(s);
   const out={label,vw:innerWidth,vh:innerHeight};
   out.docSH=document.documentElement.scrollHeight;out.mainSH=q('main').scrollHeight+'/'+q('main').clientHeight;
   const panel=q('#seasonReviewPanel');const pv=vis(panel)&&!panel.classList.contains('hidden');
   if(pv){out.panel=r(panel);out.panelScroll=panel.scrollHeight+'/'+panel.clientHeight;}
   const sp=q('#seasonEntry .scoring-panel');out.scoring=vis(sp)&&getComputedStyle(sp).display!=='none'?r(sp):'hidden';
   const row=q('#seasonEntry .season-action-row');out.back=vis(row)&&getComputedStyle(row).display!=='none'?r(row):'hidden';
   out.grid=r(q('#seasonEntry .seasonEntryGrid'));
   const cards=[...document.querySelectorAll('#seasonEntry .seasonResultCard')].filter(e=>e.offsetParent&&!e.classList.contains('hidden')).map(r);out.cards=cards;
   out.err=r(q('#seasonEntryError'));out.cardFit=[...document.querySelectorAll('#seasonEntry .seasonResultCard')].filter(e=>e.offsetParent&&!e.classList.contains('hidden')).map(e=>e.scrollHeight+'/'+e.clientHeight);
   if(mainSel){const m=q(mainSel);out.main=vis(m)&&!m.classList.contains('hidden')?r(m):null;
     if(out.main&&pv){const pr=panel.getBoundingClientRect();const mb=m.getBoundingClientRect();out.mainVisible=mb.top>=pr.top-1&&mb.bottom<=pr.bottom+1&&mb.bottom<=innerHeight;}
     else if(out.main) out.mainVisible=out.main.b<=innerHeight;}
   // overlaps among visible blocks
   const blocks={};if(out.scoring!=='hidden')blocks.scoring=sp;if(pv)blocks.panel=panel;if(out.back!=='hidden')blocks.back=row;
   [...document.querySelectorAll('#seasonEntry .seasonResultCard')].filter(e=>e.offsetParent&&!e.classList.contains('hidden')).forEach((e,i)=>blocks['card'+i]=e);
   const err=q('#seasonEntryError');if(err&&err.textContent.trim())blocks.err=err;
   const ov=[];const ks=Object.keys(blocks);for(let i=0;i<ks.length;i++)for(let j=i+1;j<ks.length;j++){const a=blocks[ks[i]].getBoundingClientRect(),c=blocks[ks[j]].getBoundingClientRect();const ix=Math.min(a.right,c.right)-Math.max(a.left,c.left),iy=Math.min(a.bottom,c.bottom)-Math.max(a.top,c.top);if(ix>1&&iy>1)ov.push(ks[i]+'x'+ks[j]+' '+Math.round(ix)+'x'+Math.round(iy));}
   out.overlaps=ov;
   const reg=q('#seasonEntry .sd-stage__registered').getBoundingClientRect();
   const fb={daniel:[.10,.27],nik:[.73,.91]};const fo=[];
   for(const [n,[u0,u1]] of Object.entries(fb)){const f={l:reg.left+u0*reg.width,r:reg.left+u1*reg.width,t:reg.top+.09*reg.height,b:reg.top+.45*reg.height};
     for(const k of ks){const c=blocks[k].getBoundingClientRect();const ix=Math.min(f.r,c.right)-Math.max(f.l,c.left),iy=Math.min(f.b,c.bottom)-Math.max(f.t,Math.max(c.top,52));if(ix>1&&iy>1)fo.push(n+'xx'+k+' '+Math.round(ix)+'x'+Math.round(iy));}}
   out.faceOverlaps=fo;
   if(out.main){const m=q(mainSel).getBoundingClientRect();const el=document.elementFromPoint(m.left+m.width/2,Math.min(m.top+m.height/2,innerHeight-1));out.hit=!!(el&&(el===q(mainSel)||q(mainSel).contains(el)));}
   const re=q('#seasonReviewError');if(re&&re.textContent.trim()){out.revErr=r(re);}
   const ee=q('#seasonEntryError');if(ee&&ee.textContent.trim()){out.entErr=r(ee);out.entErrInView=ee.getBoundingClientRect().bottom<=innerHeight;}
   // clipped text inside the review panel / cards: any descendant button/text clipped vertically by overflow ancestor
   const cl=[];const scope=pv?panel:q('#seasonEntry .seasonEntryGrid');
   for(const t of scope.querySelectorAll('button,h3,p,label,.summaryLine')){if(!t.offsetParent||t.classList.contains('hidden'))continue;const c=t.getBoundingClientRect();if(!c.height)continue;let a=t.parentElement;while(a&&a!==document.body){const s=getComputedStyle(a);if(/(hidden|clip|auto|scroll)/.test(s.overflowY)){const rr=a.getBoundingClientRect();if(c.bottom>rr.bottom+1||c.top<rr.top-1)cl.push((t.id||t.textContent.slice(0,22))+' '+Math.round(c.top)+'-'+Math.round(c.bottom)+' in '+(a.id||a.className.toString().slice(0,24))+' '+Math.round(rr.top)+'-'+Math.round(rr.bottom));break;}a=a.parentElement;}}
   out.clipped=cl.slice(0,6);
   return out;},[label,mainSel]);
 const snap=async(name,mainSel)=>{ if(only.length&&!only.includes(name))return; await p.waitForTimeout(300); await p.screenshot({path:OUT+name+'.png'}); const m=await measure(name,mainSel); console.log('M',JSON.stringify(m)); };

 // ENTRY own card
 await p.evaluate(()=>{const one=document.querySelector('#daniel-entry-panel'),two=document.querySelector('#nik-entry-panel');one.classList.add('hidden');two.classList.remove('hidden');
   document.getElementById('seasonClubTwo').textContent='Leganés';document.getElementById('seasonClubOne').textContent='Real Betis';document.getElementById('season-phone-tab-nik').checked=true;});
 await snap('e1-entry','#completeSeason');
 // entry with error
 await p.evaluate(()=>{const e=document.getElementById('seasonEntryError');e.textContent='League Goals must be a whole number from 0 to 200.';});
 await snap('e2-entry-error','#completeSeason');
 await p.evaluate(()=>{document.getElementById('seasonEntryError').textContent='';});
 await p.evaluate(()=>{document.querySelector('#daniel-entry-panel').classList.remove('hidden');});
 await snap('e3-entry-both','#completeSeason');
 await p.evaluate(()=>{document.getElementById('seasonEntryError').textContent='League Goals must be a whole number from 0 to 200.';});
 await snap('e4-both-error','#completeSeason');
 await p.evaluate(()=>{document.getElementById('seasonEntryError').textContent='';});
 // review states
 await p.evaluate(()=>{
   const $=id=>document.getElementById(id);
   if(typeof ensureSeasonReviewUI==='function')ensureSeasonReviewUI();
   const panel=$('seasonReviewPanel'),grid=document.querySelector('#seasonEntry .seasonEntryGrid'),actions=$('completeSeason').closest('.seasonEntryActions');
   panel.classList.remove('hidden');grid.classList.add('hidden');actions.classList.add('hidden');document.getElementById('seasonEntry').dataset.sharedSeasonResults='review';const st=document.createElement('style');st.textContent='#seasonEntry[data-shared-season-results="review"] .seasonEntryActions{display:flex!important}#seasonEntry[data-shared-season-results="review"] #completeSeason{display:none!important}';document.head.appendChild(st);document.querySelector('#seasonEntry .seasonEntryHint')?.classList.add('hidden');
   const card=(el,name,club)=>{el.innerHTML='';const h=document.createElement('h3');h.textContent=name;const c=document.createElement('p');c.className='summaryClub';c.textContent=club;el.append(h,c);
     for(const [l,v] of [['League Position',1],['League Points',91],['League Goals',88]]){const r=document.createElement('div');r.className='summaryLine seasonReviewLine';r.innerHTML=`<span>${l}</span><strong>${v}</strong>`;el.append(r);}
     const a=document.createElement('div');a.className='seasonReviewAchievements';a.innerHTML='<span class="isEarned">DOMESTIC CUP ✓</span><span class="isNotEarned">CHAMPIONS LEAGUE</span><span class="isEarned">TOP SCORER ✓</span><span class="isNotEarned">TOP ASSIST</span>';el.append(a);};
   card($('seasonReviewOne'),'DANIEL','Real Betis');card($('seasonReviewTwo'),'NIK','Leganés');
   const ra=panel.querySelector('.seasonReviewActions');
   const mk=(tag,id,cls,txt)=>{const n=document.createElement(tag);n.dataset.mine='1';n.id=id;n.className=cls;n.textContent=txt;return n;};
   ra.parentNode.insertBefore(mk('p','sharedSeasonCommitStatus','seasonReviewWarning sharedSeasonCommitStatus','SEASON COMMITTED · SCORE BELOW'),ra);
   ra.prepend(mk('button','sharedSeasonCommitAction','menuButton','SEASON COMMIT ACKNOWLEDGED ✓'));
   ra.parentNode.insertBefore(mk('p','sharedMultiSeasonProgressionStatus','seasonReviewWarning sharedMultiSeasonProgressionStatus','ALL 3 SEASONS ARE AUTHORITIVELY ACCEPTED · FINAL RECONCILIATION REMAINS A SEPARATE STEP'),ra);
   ra.prepend(mk('button','sharedMultiSeasonContinueAction','menuButton','SEASON PLAN COMPLETE ✓'));
   const lr=mk('section','sharedLocalReconciliationPanel','seasonReviewSummary sharedLocalReconciliationPanel','');
   lr.append(mk('h3','sharedLocalReconciliationHeading','','LOCAL RECONCILIATION'),mk('p','sharedLocalReconciliationSummary','','Preview the exact remote snapshot against this device without changing the canonical local Save. Candidate C Apply is intentionally not exposed in this gameplay flow.'),mk('p','sharedLocalReconciliationStatus','stateNote','PREVIEW READY ✓ · CANONICAL LOCAL SAVE REMAINS UNCHANGED'));
   const la=mk('div','sharedLocalReconciliationActions','seasonReviewActions','');la.append(mk('button','sharedLocalReconciliationPreview','menuButton','PREVIEW LOCAL RECONCILIATION'));lr.append(la);panel.append(lr);
   window.__apply=(o)=>{for(const id of ['sharedLocalReconciliationPanel','sharedSeasonCommitAction','sharedMultiSeasonContinueAction','sharedSeasonCommitStatus','sharedMultiSeasonProgressionStatus']){document.querySelectorAll('[id="'+id+'"]').forEach(e=>{if(!e.dataset.mine)e.remove();});}const hide=(id,h)=>document.querySelectorAll('[id="'+id+'"]').forEach(e=>e.classList.toggle('hidden',h));
     hide('seasonReviewOne',!o.both);
     $('seasonReviewHeading').textContent=o.heading;$('seasonReviewResult').textContent=o.result;
     $('seasonReviewOverallScore').closest('.seasonReviewOverall').classList.toggle('hidden',!o.both);
     panel.querySelector('.seasonReviewWarning').classList.toggle('hidden',!o.warn);
     $('confirmSeasonCompletion').classList.toggle('hidden',!o.publish);$('confirmSeasonCompletion').disabled=!!o.pubDisabled;$('confirmSeasonCompletion').textContent=o.pubText||'PUBLISH MY SEASON RESULT';
     $('editSeasonResults').classList.toggle('hidden',!o.edit);
     hide('sharedSeasonCommitStatus',!o.commit);hide('sharedSeasonCommitAction',!o.commit);
     hide('sharedMultiSeasonProgressionStatus',!o.multi);hide('sharedMultiSeasonContinueAction',!o.multi);
     hide('sharedLocalReconciliationPanel',!o.lr);};
   window.__set=(o)=>{window.__cur=o;window.__apply(o);panel.scrollTop=0;if(!window.__iv)window.__iv=setInterval(()=>window.__apply(window.__cur),60);};
 });
 const S={
  r1:{both:0,heading:'REVIEW YOUR RESULT',result:'Check your numbers. Your rival cannot see them until you publish.',warn:1,publish:1,edit:1},
  r2:{both:0,heading:'YOUR RESULT IS PUBLISHED',result:'Your rival cannot see this result until they publish their own. This screen refreshes automatically.',warn:0,publish:1,pubDisabled:1,pubText:'PUBLISHED ✓',edit:0},
  r3:{both:1,heading:'BOTH MANAGERS PUBLISHED',result:'Both managers published their reviewed FIFA 17 season results.',warn:0,publish:0,edit:0,commit:1},
  r4:{both:1,heading:'BOTH MANAGERS PUBLISHED',result:'Both managers published their reviewed FIFA 17 season results.',warn:0,publish:0,edit:0,commit:0,multi:1},
  r5:{both:1,heading:'BOTH MANAGERS PUBLISHED',result:'Both managers published their reviewed FIFA 17 season results.',warn:0,publish:0,edit:0,lr:1},
  r6:{both:1,heading:'BOTH MANAGERS PUBLISHED',result:'Both managers published their reviewed FIFA 17 season results.',warn:0,publish:0,edit:0,commit:1,multi:1,lr:1},
 };
 const mains={r1:'#confirmSeasonCompletion',r2:'#confirmSeasonCompletion',r3:'#sharedSeasonCommitAction',r4:'#sharedMultiSeasonContinueAction',r5:'#sharedLocalReconciliationPreview',r6:'#sharedSeasonCommitAction'};
 for(const k of Object.keys(S)){await p.evaluate(o=>window.__set(o),S[k]);await snap(k+'-review',mains[k]);
   if(k==='r1'||k==='r3'){await p.evaluate(()=>{document.getElementById('seasonReviewError').textContent='Your season result could not be published. Check your connection and try again.';document.getElementById('seasonReviewPanel').scrollTop=0;});await snap(k+'e-review-error',mains[k]);await p.evaluate(()=>{document.getElementById('seasonReviewError').textContent='';});}
   if(process.env.EVAL&&process.env.EVALSTATE===k){console.log('EVAL',JSON.stringify(await p.evaluate(process.env.EVAL)));}
   if(process.env.BOTTOM){await p.evaluate(()=>{const e=document.getElementById('seasonReviewPanel');e.scrollTop=e.scrollHeight;});}}
 await b.close();
})();
