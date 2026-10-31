// Leak probe (test-only, injected by tests/browser/ce2pg-leak-soak.cjs before any game script; never served by the game).
// Counts what is LIVE right now, grouped by the game module line that created it:
//   listeners  addEventListener minus removeEventListener / abort / once-fired / garbage-collected target, split by target kind
//   intervals  setInterval minus clearInterval
//   timeouts   pending setTimeout (fired or cleared ones leave)
//   raf        pending requestAnimationFrame callbacks
//   observers  Mutation/Resize/Intersection observers that observe something (disconnect leaves)
//   webgl      WebGL contexts created, and how many of their canvases are still in the document
//   audio      AudioContexts not closed
//   snapshots  Firestore onSnapshot listeners not unsubscribed (filled by the patched meter wrapper)
(()=>{
  if(window.__leakProbe)return;
  const P=window.__leakProbe={listeners:new Map(),intervals:new Map(),timeouts:new Map(),raf:new Map(),observers:new Map(),webgl:[],audio:[],snapshots:new Map(),totals:{listenerAdds:0,intervalAdds:0,timeoutAdds:0,rafAdds:0,snapshotAdds:0}};
  const site=()=>{try{
    const lines=String(new Error().stack).split("\n").slice(2);
    for(const l of lines){const m=/\/js\/([^:/?]+\.js)[^:]*:(\d+)/.exec(l);if(m)return `${m[1]}:${m[2]}`;}
    for(const l of lines){if(/leak-probe|__cms-/.test(l))continue;const m=/\/([^/:?]+\.js)[^:]*:(\d+)/.exec(l);if(m)return `~${m[1]}`;}
    return "?";
  }catch(_){return "?";}};
  const bump=(map,key,d)=>{const v=(map.get(key)||0)+d;if(v)map.set(key,v);else map.delete(key);};
  const kindOf=t=>t===window?"window":t===document?"document":t instanceof Element?(t.isConnected?"element":"element(detached)"):t&&t.constructor?t.constructor.name:"?";

  // ---- listeners ----
  const reg=new WeakMap();// target -> Map(key -> {site,kind})
  const fin=typeof FinalizationRegistry==="function"?new FinalizationRegistry(list=>{for(const k of list)bump(P.listeners,k,-1);}):null;
  const heldKeys=new WeakMap();// target -> array of live map keys, for the finalizer
  const ET=EventTarget.prototype,add=ET.addEventListener,rem=ET.removeEventListener;
  const capOf=o=>typeof o==="boolean"?o:Boolean(o&&o.capture);
  const idFor=(()=>{const ids=new WeakMap();let n=0;return f=>{if(!f||(typeof f!=="function"&&typeof f!=="object"))return "x";let v=ids.get(f);if(!v){v=++n;ids.set(f,v);}return v;};})();
  function untrack(target,key){
    const m=reg.get(target);if(!m)return;const e=m.get(key);if(!e)return;m.delete(key);
    for(const h of e.helpers||[])try{rem.call(h.on,h.type,h.fn,h.capture);}catch(_){}
    const k=`${e.kind} ${e.type} @ ${e.site}`;bump(P.listeners,k,-1);
    const held=heldKeys.get(target);if(held){const i=held.indexOf(k);if(i>=0)held.splice(i,1);}
  }
  ET.addEventListener=function(type,fn,opts){
    const r=add.call(this,type,fn,opts);
    try{
      if(!fn)return r;
      const key=`${type}|${capOf(opts)}|${idFor(fn)}`;
      let m=reg.get(this);if(!m){m=new Map();reg.set(this,m);}
      if(m.has(key))return r;// duplicate add is a no-op in the DOM too
      const e={type,site:site(),kind:kindOf(this)};m.set(key,e);
      const k=`${e.kind} ${type} @ ${e.site}`;bump(P.listeners,k,1);P.totals.listenerAdds+=1;
      if(fin&&this!==window&&this!==document){let held=heldKeys.get(this);if(!held){held=[];heldKeys.set(this,held);try{fin.register(this,held);}catch(_){}}held.push(k);}
      const target=this;
      if(opts&&typeof opts==="object"){
        // Helpers are kept on the entry and removed with it, so a later re-add of the same callback is not untracked by a stale helper.
        e.helpers=[];
        if(opts.once){const h={on:this,type,fn:()=>untrack(target,key),capture:capOf(opts)};e.helpers.push(h);add.call(this,type,h.fn,{once:true,capture:h.capture});}
        if(opts.signal&&typeof opts.signal.addEventListener==="function"){if(opts.signal.aborted)untrack(target,key);else{const h={on:opts.signal,type:"abort",fn:()=>untrack(target,key),capture:false};e.helpers.push(h);add.call(opts.signal,"abort",h.fn,{once:true});}}
      }
    }catch(_){}
    return r;
  };
  ET.removeEventListener=function(type,fn,opts){
    try{if(fn)untrack(this,`${type}|${capOf(opts)}|${idFor(fn)}`);}catch(_){}
    return rem.call(this,type,fn,opts);
  };

  // ---- timers ----
  const sI=window.setInterval,cI=window.clearInterval,sT=window.setTimeout,cT=window.clearTimeout,rA=window.requestAnimationFrame,cA=window.cancelAnimationFrame;
  const liveI=new Map(),liveT=new Map(),liveR=new Map();
  window.setInterval=function(fn,ms,...a){const id=sI.call(window,fn,ms,...a);const s=`${site()} every ${ms|0}ms`;liveI.set(id,s);bump(P.intervals,s,1);P.totals.intervalAdds+=1;return id;};
  window.clearInterval=function(id){const s=liveI.get(id);if(s){liveI.delete(id);bump(P.intervals,s,-1);}else{const t=liveT.get(id);if(t){liveT.delete(id);bump(P.timeouts,t,-1);}}return cI.call(window,id);};
  window.setTimeout=function(fn,ms,...a){
    const s=site();let id;
    const wrapped=typeof fn==="function"?function(...x){if(liveT.has(id)){liveT.delete(id);bump(P.timeouts,s,-1);}return fn.apply(this,x);}:fn;
    id=sT.call(window,wrapped,ms,...a);if(typeof fn==="function"){liveT.set(id,s);bump(P.timeouts,s,1);}P.totals.timeoutAdds+=1;return id;
  };
  window.clearTimeout=function(id){const s=liveT.get(id);if(s){liveT.delete(id);bump(P.timeouts,s,-1);}else{const i=liveI.get(id);if(i){liveI.delete(id);bump(P.intervals,i,-1);}}return cT.call(window,id);};
  if(rA){
    window.requestAnimationFrame=function(fn){const s=site();let id;id=rA.call(window,t=>{if(liveR.has(id)){liveR.delete(id);bump(P.raf,s,-1);}return fn(t);});liveR.set(id,s);bump(P.raf,s,1);P.totals.rafAdds+=1;return id;};
    window.cancelAnimationFrame=function(id){const s=liveR.get(id);if(s){liveR.delete(id);bump(P.raf,s,-1);}return cA.call(window,id);};
  }

  // ---- observers ----
  for(const name of ["MutationObserver","ResizeObserver","IntersectionObserver"]){
    const C=window[name];if(typeof C!=="function")continue;
    const W=class extends C{
      constructor(cb,o){super(cb,o);this.__s=`${name} @ ${site()}`;this.__on=false;}
      observe(...a){if(!this.__on){this.__on=true;bump(P.observers,this.__s,1);}return super.observe(...a);}
      disconnect(){if(this.__on){this.__on=false;bump(P.observers,this.__s,-1);}return super.disconnect();}
    };
    try{Object.defineProperty(window,name,{value:W,writable:true,configurable:true});}catch(_){}
  }

  // ---- WebGL and audio ----
  const gc=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type,...a){
    const ctx=gc.call(this,type,...a);
    try{if(ctx&&/webgl/i.test(String(type))&&!P.webgl.some(w=>w.ref.deref&&w.ref.deref()===this))P.webgl.push({site:site(),ref:typeof WeakRef==="function"?new WeakRef(this):{deref:()=>this},lost:false,ctx:typeof WeakRef==="function"?new WeakRef(ctx):{deref:()=>ctx}});}catch(_){}
    return ctx;
  };
  for(const name of ["AudioContext","webkitAudioContext"]){
    const C=window[name];if(typeof C!=="function")continue;
    const W=class extends C{constructor(...a){super(...a);P.audio.push({site:site(),ref:new WeakRef(this)});}};
    try{Object.defineProperty(window,name,{value:W,writable:true,configurable:true});}catch(_){}
  }

  // ---- Firestore onSnapshot (the meter wrapper calls these) ----
  window.__leakProbeSnap=(path,origin)=>{const k=`${path} @ ${origin}`;bump(P.snapshots,k,1);P.totals.snapshotAdds+=1;let done=false;return ()=>{if(!done){done=true;bump(P.snapshots,k,-1);}};};
  window.__leakProbeSite=site;

  // ---- read-out ----
  const obj=m=>Object.fromEntries([...m.entries()].sort((a,b)=>b[1]-a[1]));
  const sum=m=>[...m.values()].reduce((a,b)=>a+b,0);
  window.__leakProbeRead=()=>{
    let docNodes=0;try{const w=document.createTreeWalker(document,NodeFilter.SHOW_ALL);while(w.nextNode())docNodes+=1;}catch(_){}
    const gl=P.webgl.map(w=>{const c=w.ref.deref();const x=w.ctx.deref();return {site:w.site,alive:Boolean(c),connected:Boolean(c&&c.isConnected),lost:Boolean(x&&x.isContextLost&&x.isContextLost())};});
    const au=P.audio.map(a=>{const c=a.ref.deref();return {site:a.site,alive:Boolean(c),state:c?c.state:"gc"};});
    const screens=[...document.querySelectorAll(".screen:not(.hidden)")].map(s=>s.id).join(",");
    return {screens,docNodes,elements:document.getElementsByTagName("*").length,iframes:document.getElementsByTagName("iframe").length,canvases:document.getElementsByTagName("canvas").length,
      videos:document.getElementsByTagName("video").length,audios:document.getElementsByTagName("audio").length,images:document.images.length,styleSheets:document.styleSheets.length,
      live:{listeners:sum(P.listeners),intervals:sum(P.intervals),timeouts:sum(P.timeouts),raf:sum(P.raf),observers:sum(P.observers),snapshots:sum(P.snapshots),
        webglAlive:gl.filter(g=>g.alive&&!g.lost).length,webglDetached:gl.filter(g=>g.alive&&!g.connected&&!g.lost).length,webglCreated:gl.length,audioOpen:au.filter(a=>a.alive&&a.state!=="closed").length},
      totals:{...P.totals},
      by:{listeners:obj(P.listeners),intervals:obj(P.intervals),timeouts:obj(P.timeouts),raf:obj(P.raf),observers:obj(P.observers),snapshots:obj(P.snapshots),webgl:gl,audio:au},
      localStorageBytes:(()=>{try{let n=0;for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);n+=k.length+(localStorage.getItem(k)||"").length;}return n;}catch(_){return -1;}})()};
  };
})();
