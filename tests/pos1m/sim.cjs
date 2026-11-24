"use strict";
// POS1M Ring 1: the seeded world every story runs in.
//
// One Sim owns virtual time, every pending network delivery and every timer. Nothing in a story waits on the real
// clock or the libuv thread pool, so the same seed gives the same interleaving, the same faults and the same result on
// every run (a flaky replay would make people stop trusting the red light).
//
//  - rng: mulberry32, seeded. Math.random is replaced by it while a story runs.
//  - time: Date.now and the timer functions are replaced by virtual ones while a story runs. Time only moves when
//    nothing else can happen, so a 15-minute Transfer War or a 25 s Prime Pack stage costs no real time.
//  - deliveries: the stand-in database never answers a call directly. It queues a delivery; the Sim picks the next
//    delivery at random (seeded) after all microtasks settle. Two phones' calls therefore interleave in every order the
//    seed can reach, including a rival's commit landing between this phone's transaction read and its commit.
//  - crypto: SHA-256 through node:crypto resolved without the thread pool (WebCrypto digest is asynchronous on a worker
//    thread, which would make the order of two phones' steps depend on the machine), and seeded random bytes.
const nodeCrypto=require("node:crypto");

const REAL={setTimeout,clearTimeout,setInterval,clearInterval,setImmediate,dateNow:Date.now,random:Math.random};
// 2026-11-24 12:00:00 UTC. Virtual epoch start for every story, so stored timestamps are the same on every run.
const EPOCH_MS=Date.UTC(2026,10,24,12,0,0);

function mulberry32(seed){let a=(Number(seed)>>>0)||0x9e3779b9;return function(){a=(a+0x6d2b79f5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function settle(){return new Promise(resolve=>REAL.setImmediate(resolve));}

class Sim{
  constructor(seed,{epochMs=EPOCH_MS,maxSteps=2_000_000}={}){
    this.seed=Number(seed)>>>0;
    this.random=mulberry32(this.seed);
    this.now=epochMs;
    this.epochMs=epochMs;
    this.ready=[];// pending deliveries {label,fn}
    this.timers=new Map();// id -> {at,fn,every,seq}
    this.timerSeq=0;
    this.steps=0;
    this.maxSteps=maxSteps;
    this.trace=[];
    this.traceOn=false;
    this.installed=false;
    this.crypto=this.makeCrypto();
  }
  int(n){return Math.floor(this.random()*n);}
  chance(p){return p>0&&this.random()<p;}
  pick(list){return list[this.int(list.length)];}
  log(entry){if(this.traceOn)this.trace.push(`${this.now-this.epochMs}ms ${entry}`);}
  // Queue a delivery. The Sim runs fn later, at a moment of its choosing.
  defer(label,fn){this.ready.push({label,fn});}
  // Virtual timers (also used by the code under test once install() has replaced the globals).
  setTimer(fn,ms,args,every=false){const id=++this.timerSeq;const delay=Math.max(0,Math.round(Number(ms)||0));this.timers.set(id,{id,at:this.now+delay,fn:()=>fn(...(args||[])),every:every?Math.max(1,delay):0,seq:id});return {id,unref(){return this;},ref(){return this;},hasRef(){return false;},[Symbol.toPrimitive](){return id;}};}
  clearTimer(handle){const id=typeof handle==="object"&&handle?handle.id:Number(handle);this.timers.delete(id);}
  install(){
    if(this.installed)return;
    const sim=this;
    globalThis.setTimeout=(fn,ms,...args)=>sim.setTimer(fn,ms,args,false);
    globalThis.clearTimeout=handle=>sim.clearTimer(handle);
    globalThis.setInterval=(fn,ms,...args)=>sim.setTimer(fn,ms,args,true);
    globalThis.clearInterval=handle=>sim.clearTimer(handle);
    Date.now=()=>sim.now;
    Math.random=()=>sim.random();
    this.installed=true;
  }
  uninstall(){
    if(!this.installed)return;
    globalThis.setTimeout=REAL.setTimeout;globalThis.clearTimeout=REAL.clearTimeout;
    globalThis.setInterval=REAL.setInterval;globalThis.clearInterval=REAL.clearInterval;
    Date.now=REAL.dateNow;Math.random=REAL.random;
    this.installed=false;
  }
  nextTimer(){let best=null;for(const timer of this.timers.values()){if(!best||timer.at<best.at||(timer.at===best.at&&timer.seq<best.seq))best=timer;}return best;}
  // Run until done() is true or nothing at all can happen any more. Returns "done", "idle" or "limit".
  async run(done,{untilMs=Infinity}={}){
    for(;;){
      await settle();
      if(done&&done())return "done";
      if(++this.steps>this.maxSteps)return "limit";
      if(this.ready.length){
        const index=this.int(this.ready.length);
        const [event]=this.ready.splice(index,1);
        this.log(event.label);
        event.fn();
        continue;
      }
      const timer=this.nextTimer();
      if(!timer||timer.at>untilMs)return "idle";
      if(timer.at>this.now)this.now=timer.at;
      if(timer.every){timer.at=this.now+timer.every;timer.seq=++this.timerSeq;}else this.timers.delete(timer.id);
      timer.fn();
    }
  }
  // Seeded WebCrypto stand-in: digest without the thread pool, seeded random bytes, cached digests (pure function).
  makeCrypto(){
    const sim=this,cache=new Map();
    const subtle={
      digest(algorithm,data){
        const name=String(typeof algorithm==="string"?algorithm:algorithm&&algorithm.name).toUpperCase().replace("-","");
        if(name!=="SHA256")return Promise.reject(new Error(`POS1M crypto supports SHA-256 only, not ${name}`));
        const bytes=data instanceof ArrayBuffer?Buffer.from(data):Buffer.from(data.buffer,data.byteOffset,data.byteLength);
        const key=bytes.length<=4096?bytes.toString("latin1"):null;
        let out=key!==null?cache.get(key):undefined;
        if(!out){out=nodeCrypto.createHash("sha256").update(bytes).digest();if(key!==null){if(cache.size>50_000)cache.clear();cache.set(key,out);}}
        const copy=new ArrayBuffer(out.length);new Uint8Array(copy).set(out);
        return Promise.resolve(copy);
      }
    };
    return {
      subtle,
      getRandomValues(array){for(let i=0;i<array.length;i+=1){array[i]=Math.floor(sim.random()*256);}return array;},
      randomUUID(){const b=Array.from({length:16},()=>Math.floor(sim.random()*256));b[6]=(b[6]&0x0f)|0x40;b[8]=(b[8]&0x3f)|0x80;const h=b.map(x=>x.toString(16).padStart(2,"0")).join("");return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;}
    };
  }
}

module.exports={Sim,mulberry32,EPOCH_MS,REAL,settle};
