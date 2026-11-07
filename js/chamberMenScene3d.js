(function(root){
  "use strict";

  // r89 Chamber Men in real 3D (Nik 2026-11-03: "Chamber men needs most important"), the broadcast penalty since 2026-11-04:
  // a three.js r187 scene drawn in place of the marble goal art of js/chamberMenStep.js (cmsGoal). r90 (Nik 2026-11-07, cut
  // the waste): one look only. The gold statue hall and its lounge light are gone; no stadium or players means the SVG goal.
  //
  // The step stays the one owner of the game: it still builds the SVG goal, keeps its classes and poses, and calls
  // scene.reset() and scene.kick() next to its own drawing. The SVG stays in the page on top of the canvas with its art
  // hidden (.cmGoal.cm3d-on), so its gold border stays (r90: no LEFT / MIDDLE / RIGHT words over the goal; the choice
  // buttons name the sides). No WebGL2, a load fault or a slow load: mount() gives null and the SVG goal plays as before.
  //
  // Loads the shared engine (visual-assets/v10_1/roulette/vendor/three-r187.min.js) with its plain path, the one the
  // service worker keeps for offline play and the roulette's own page asks for. Draws only while the canvas is in the page;
  // when the step removes its stage, the scene frees its WebGL context for the roulette that comes next.
  const ENGINE_PATH="visual-assets/v10_1/roulette/vendor/three-r187.min.js";
  // Goal and pitch in metres (a real goal: 7.32 x 2.44). The goal line is z 0, the camera looks from the penalty spot side (+z).
  const GOAL_W=7.32,GOAL_H=2.44,HALF=GOAL_W/2,BALL_R=.11,SPOT_Z=11;
  const FLIGHT=.46,SETTLE=2.0,GRAVITY=-9.8;
  let enginePromise=null;

  function doc(){return root.document||null;}
  function reducedMotion(){try{return Boolean(root.matchMedia&&root.matchMedia("(prefers-reduced-motion: reduce)").matches);}catch(_error){return false;}}
  function hasWebgl2(){
    try{
      if(!root.WebGL2RenderingContext)return false;
      const c=doc().createElement("canvas"),gl=c.getContext("webgl2");
      if(!gl)return false;
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      return true;
    }catch(_error){return false;}
  }
  function loadEngine(){
    const ready=()=>root.THREE&&typeof root.THREE.WebGLRenderer==="function"&&typeof root.THREE.CapsuleGeometry==="function";
    if(ready())return Promise.resolve(root.THREE);
    if(enginePromise)return enginePromise;
    enginePromise=new Promise((resolve,reject)=>{
      const script=doc().createElement("script");
      script.src=ENGINE_PATH;script.async=true;script.dataset.runtimeScript="three-r187";
      script.addEventListener("load",()=>ready()?resolve(root.THREE):reject(new Error("three-r187 loaded without THREE")));
      script.addEventListener("error",()=>{script.remove();enginePromise=null;reject(new Error("three-r187 did not load"));});
      doc().head.append(script);
    });
    return enginePromise;
  }
  // ---------- r89 broadcast: the FIFA 17 penalty (Nik 2026-11-04) ----------
  // The camera sits behind and above the taker, as on TV; the taker (in his manager's club kit, js/kits17.js) runs up and
  // strikes, the keeper (his rival's club keeper kit, never clashing) dives; the stadium kit (js/chamberMenStadium3d.js)
  // gives the goal, net, pitch, stands and crowd. Players: the rigged Mixamo body with its own clips
  // (visual-assets/v10_1/chamber-men/players, tools/chamber-men-players). Everything is a function of the time since the
  // strike, so a frame can be drawn at any moment, and both phones show the same kick.
  const STADIUM_JS="js/chamberMenStadium3d.js",KITS_JS="js/kits17.js",CREST_JS="js/visualIdentity.js";
  const PLAYER_PATH="visual-assets/v10_1/chamber-men/players/";
  // Bodies (tools/chamber-men-players): one shared clip file, then a light file per body. A body plays only once kits17
  // can paint its kit (its name is in K.layouts). Ch42's toes dip up to 3 cm into the grass, so it stands 2 cm higher.
  const BODIES=["remy","ch38","ch42"],BODY_LIFT={ch42:.02};
  // Skin and hair go together, only in the pairs checked to look natural on each body (Nik 2026-11-04: never an unnatural
  // mix). Ch38's hair is black, so it keeps its own.
  const BODY_LOOKS={
    remy:[[[1,1,1],[1,1,1]],[[1,1,1],[.55,.42,.3]],[[.92,.84,.78],[.32,.22,.13]],[[.86,.76,.68],[.16,.11,.07]],[[.7,.56,.46],[.07,.05,.04]],[[.52,.39,.31],[.05,.04,.035]]],
    ch38:[[[1,1,1],[1,1,1]],[[1.12,1.05,1],[1,1,1]],[[.88,.84,.82],[1,1,1]],[[.75,.7,.68],[1,1,1]]],
    ch42:[[[1,1,1],[1,1,1]],[[.92,.84,.78],[1,1,1]],[[.86,.76,.68],[.6,.6,.6]],[[.7,.56,.46],[.5,.5,.5]],[[.52,.39,.31],[.4,.4,.4]],[[1,1,1],[1.6,1.3,1]]]
  };
  // Seconds from kick() to the strike. The step waits for it before it shows the result words.
  const RUNUP=2.15,EXTRAS_WAIT_MS=4200,DISSOLVE=.55;
  // penaltyKick's strike is measured on the boot when the scene is built (strikeOf); these are only the fallback.
  const KICK_HIT_GUESS=.74,KICK_BALL_GUESS=[-.99,BALL_R,2.42];
  // jog: the frame whose feet match the first frame of penaltyKick (left foot down, right foot pushing off).
  const JOG_JOIN=1.933;
  // Run-ups, one per kick in turn: a jog, a longer, slower jog, and two steps from a standstill (FIFA 17's "still").
  const RUNUPS=[{jog:1.1,rate:1},{jog:1.3,rate:.82},{jog:0,rate:1}];
  // Keeper moves by the side he goes to (world -x is the keeper's right; "m" mirrors a clip to the other side). tc is the
  // clip time of full stretch (the glove meets the ball there), s the speed it plays at so the dive starts on the strike.
  const KEEPS={
    L:[{c:"gkDive1",m:0,tc:.9,s:1.35},{c:"gkDive",m:1,tc:1.1,s:1.6},{c:"gkBlock1",m:0,tc:.7,s:1.15},{c:"gkBlock",m:1,tc:.8,s:1.25},{c:"gkBlock2",m:1,tc:.7,s:1.15}],
    R:[{c:"gkDive",m:0,tc:1.1,s:1.6},{c:"gkDive1",m:1,tc:.9,s:1.35},{c:"gkBlock",m:0,tc:.8,s:1.25},{c:"gkBlock1",m:1,tc:.7,s:1.15},{c:"gkBlock2",m:0,tc:.7,s:1.15}],
    M:[{c:"gkCatch1",m:0,tc:.4,s:1,hold:1},{c:"gkCatch2",m:0,tc:.8,s:1.2,hold:1}]
  };
  // Goals: where in the zone the ball goes (heights), by kick.
  const GOAL_SPOTS={side:[[2.75,.32],[2.6,1.05],[2.85,1.85],[2.95,.6]],mid:[[.35,1.55],[-.3,.95],[.15,1.95]]};

  function cm3Script(key,path,ready){
    if(ready())return Promise.resolve(true);
    if(typeof root.loadRuntimeScript==="function")return Promise.resolve(root.loadRuntimeScript(key,path,ready)).then(()=>Boolean(ready()),()=>false);
    return new Promise(resolve=>{const s=doc().createElement("script");s.src=path;s.async=true;s.onload=()=>resolve(Boolean(ready()));s.onerror=()=>resolve(false);doc().head.append(s);});
  }
  // The stadium textures, the kits, the shared clips and each club's body (taker and keeper: one file per body, parsed
  // twice). null when any part cannot come in time: the SVG goal plays instead.
  // Started before the engine arrives: the scripts, the clips and the bodies come down while three.js loads.
  function cm3Hash(s){let h=2166136261;for(const ch of String(s))h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;return h;}
  // The bodies kits17 can dress (a proof run may force one with CMS_CHAMBER_MEN_BODY).
  function cm3BodyList(K){
    const forced=root.CMS_CHAMBER_MEN_BODY;if(BODIES.includes(forced))return [forced];
    const ok=K&&Array.isArray(K.layouts)?K.layouts:["remy"];const list=BODIES.filter(b=>ok.includes(b));return list.length?list:["remy"];
  }
  // One body per club for the whole Showdown (its taker and its keeper), from the club's name: nothing random.
  function cm3BodyOf(club,list){return list[cm3Hash(`body|${club||""}`)%list.length];}
  function cm3Prefetch(tier,clubs){
    const scripts=Promise.all([cm3Script("chamber-men-stadium",STADIUM_JS,()=>Boolean(root.CareerModeChamberMenStadium)),cm3Script("kits17",KITS_JS,()=>Boolean(root.CareerModeKits17)),
      cm3Script("visual-identity",CREST_JS,()=>typeof root.getClubCrestSvg==="function").catch(()=>false)]).then(([okS,okK])=>Boolean(okS&&okK),()=>false);
    const get=file=>typeof root.fetch!=="function"?Promise.resolve(null):root.fetch(PLAYER_PATH+file).then(r=>r.ok?r.arrayBuffer():null).catch(()=>null);
    const anims=get(`anims_${tier}.glb`);
    const bodies=scripts.then(ok=>{
      if(!ok)return null;
      const list=cm3BodyList(root.CareerModeKits17),c=clubs||{};
      const names=[...new Set([cm3BodyOf(c.playerOne,list),cm3BodyOf(c.playerTwo,list)])];
      return Promise.all(names.map(n=>get(`body_${n}_${tier}.glb`))).then(bufs=>bufs.every(Boolean)?Object.fromEntries(names.map((n,i)=>[n,bufs[i]])):null);
    });
    return {scripts,anims,bodies};
  }
  function cm3Extras(T,Q,pre){
    if(typeof T.GLTFLoader!=="function"||typeof T.AnimationMixer!=="function"||!pre)return Promise.resolve(null);
    let late=false;
    const work=(async()=>{
      if(!await pre.scripts)return null;
      const S=root.CareerModeChamberMenStadium;
      const [tex,anims,bufs]=await Promise.all([S.load(T,{phone:Q.assets==="phone",level:Q.level}),pre.anims,pre.bodies]);
      if(!anims||!bufs){for(const t of Object.values(tex||{}))t.dispose?.();return null;}
      const parse=buf=>new T.GLTFLoader().parseAsync(buf.slice(0),PLAYER_PATH);
      const clips=await parse(anims);
      const bodies={};
      await Promise.all(Object.entries(bufs).map(async([n,buf])=>{const [taker,keeper]=await Promise.all([parse(buf),parse(buf)]);bodies[n]={taker,keeper};}));
      // Warm each body's kit map (kits17 caches it), so the first kit goes on with the first frame.
      const K=root.CareerModeKits17;
      await Promise.all(Object.keys(bufs).map(n=>{try{return Promise.resolve(K.textures("",{layout:n,size:"small"}).ready).catch(()=>null);}catch(_error){return null;}}));
      const out={S,tex,K,clips,bodies};
      if(late){cm3FreeExtras(out);return null;}
      return out;
    })().catch(error=>{try{root.console?.warn?.("Chamber Men 3D: no stadium or players; the drawn goal plays.",error);}catch(_error){}return null;});
    return Promise.race([work,new Promise(resolve=>root.setTimeout(()=>{late=true;resolve(null);},EXTRAS_WAIT_MS))]);
  }
  function cm3FreeExtras(x){
    try{for(const t of Object.values(x.tex||{}))t.dispose?.();}catch(_error){}
    const all=[x.clips];for(const b of Object.values(x.bodies||{}))all.push(b.taker,b.keeper);
    for(const g of all)try{g?.scene?.traverse(o=>{o.geometry?.dispose?.();for(const m of [].concat(o.material||[])){for(const v of Object.values(m))if(v&&v.isTexture)v.dispose();m.dispose?.();}});}catch(_error){}
  }

  function buildBroadcast(T,svg,x,opts,Q){
    const d=doc(),canvas=d.createElement("canvas");
    canvas.className="cmGoal3d";canvas.setAttribute("aria-hidden","true");
    // r90 quality from the device (js/gfxTier.js): MSAA, pixel ratio, shadow size and crowd density by level.
    const renderer=new T.WebGLRenderer({canvas,antialias:Q.antialias,alpha:false,powerPreference:"high-performance"});
    const phone=Q.assets==="phone";
    renderer.setPixelRatio(Q.pixelRatio);
    renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
    const aniso=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    const scene=new T.Scene();scene.background=new T.Color(0x05070b);scene.fog=new T.FogExp2(0x0a0d14,.0045);
    const own=[];const keep=v=>{own.push(v);return v;};
    const clubs=(opts&&opts.clubs)||{};
    const K=x.K,colourOf=club=>{try{return parseInt(String(K.kit(club).dominant).replace("#",""),16);}catch(_error){return 0x888888;}};
    // Stadium: white posts like FIFA 17, the crowd in each club's colour.
    const S=x.S.build(T,x.tex,{phone,density:Q.density,posts:"white",home:colourOf(clubs.playerOne),away:colourOf(clubs.playerTwo),aniso});
    scene.add(S.group);
    const ball=S.ball;
    // Night match light: floodlights from high over both corners of the box, a cool sky, a soft rim behind the goal.
    scene.add(new T.HemisphereLight(0xdde6ff,0x15200f,.55));
    const key=new T.DirectionalLight(0xfff3e2,2.7);key.position.set(9,30,24);key.target.position.set(0,0,6);
    key.castShadow=true;key.shadow.mapSize.set(Q.shadowSize,Q.shadowSize);key.shadow.bias=-.0004;key.shadow.normalBias=.03;key.shadow.radius=2;
    Object.assign(key.shadow.camera,{left:-11,right:11,top:13,bottom:-11,near:10,far:70});key.shadow.camera.updateProjectionMatrix();
    scene.add(key,key.target);
    const fill=new T.DirectionalLight(0xe4ecff,.75);fill.position.set(-14,20,18);scene.add(fill);
    const rim=new T.DirectionalLight(0xfff0d0,.9);rim.position.set(-4,12,-24);scene.add(rim);
    // Reflections: the stadium itself, once (the ball and posts see the stands and lights).
    {const pm=new T.PMREMGenerator(renderer);scene.environment=keep(pm.fromScene(scene,.04,.1,300).texture);pm.dispose();scene.environmentIntensity=.55;}

    // ---------- players ----------
    const sample=new T.Vector3(),sampleQ=new T.Quaternion(),fwd=new T.Vector3();
    // A body plays the shared clips: each clip cloned with its hips travel scaled to the body (cmHipsScale, from the
    // converter: the body's hips height over Remy's). Rotations fit every body as they are.
    const scaleOf=g=>{const u=g.scene.userData?.cmHipsScale??g.scene.children[0]?.userData?.cmHipsScale;return Number.isFinite(u)&&u>0?u:1;};
    const retarget=scale=>{const out={};for(const c of x.clips.animations){
      if(scale===1){out[c.name]=c;continue;}
      const k=c.clone();for(const t of k.tracks)if(t.name.endsWith(".position")){const v=t.values;for(let i=0;i<v.length;i+=1)v[i]*=scale;}out[c.name]=k;}return out;};
    const actor=(gltf,name,body)=>{
      const model=gltf.scene,holder=new T.Group();holder.name=name;holder.add(model);holder.visible=false;scene.add(holder);
      model.position.y=BODY_LIFT[body]||0;
      const mats={},bones={};
      model.traverse(o=>{
        if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;for(const m of [].concat(o.material)){if(m&&m.name)mats[m.name]=m;keep(m);}}
        if(o.isBone&&!bones[o.name])bones[o.name]=o;
      });
      const clips=retarget(scaleOf(gltf));
      const mixer=new T.AnimationMixer(model),actions=new Map();
      const act=clip=>{let a=actions.get(clip);if(!a){a=mixer.clipAction(clip);a.setLoop(T.LoopRepeat,Infinity);a.play();a.enabled=false;actions.set(clip,a);}return a;};
      // layers: [{clip, time, w}] (weights are normalised, so a blend never shows the bind pose).
      const pose=layers=>{
        for(const a of actions.values())a.enabled=false;
        let sum=0;for(const l of layers)if(l.clip&&l.w>0)sum+=l.w;
        for(const l of layers){if(!l.clip||l.w<=0)continue;const a=act(l.clip);a.enabled=true;a.setEffectiveWeight(l.w/sum);a.time=Math.max(0,Math.min(l.clip.duration-1e-3,l.time));}
        mixer.update(0);holder.updateMatrixWorld(true);
      };
      return {holder,model,mats,bones,clips,mixer,pose,hips:bones.mixamorigHips,body};
    };
    // Root motion. A clip's hips track is in the hips' parent space; we move it in world space (the model at rest at the
    // origin): optionally drop its travel along x/z, then turn it by yaw about `from` and carry `from` to `to`.
    const hipsOf=(a,clip,time)=>{a.pose([{clip,time,w:1}]);a.hips.getWorldPosition(sample);a.hips.getWorldQuaternion(sampleQ);fwd.set(0,0,1).applyQuaternion(sampleQ);return {x:sample.x,z:sample.z,face:Math.atan2(fwd.x,fwd.z)};};
    const rebase=(a,clip,name,{zero,from,to})=>{
      const P=a.hips.parent;a.holder.updateMatrixWorld(true);
      const M=P.matrixWorld.clone(),Mi=M.clone().invert(),Pq=new T.Quaternion(),Ps=new T.Vector3(),Pp=new T.Vector3();M.decompose(Pp,Pq,Ps);
      const yaw=to&&from?to.face-from.face:0,Q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),yaw);
      const Lq=Pq.clone().invert().multiply(Q).multiply(Pq);
      const tracks=clip.tracks.map(t=>{
        const n=t.name;if(!n.startsWith(`${a.hips.name}.`))return t.clone();
        const c=t.clone(),v=c.values;
        if(n.endsWith(".position")){
          const w0=new T.Vector3(v[0],v[1],v[2]).applyMatrix4(M),w=new T.Vector3();
          for(let i=0;i<v.length;i+=3){
            w.set(v[i],v[i+1],v[i+2]).applyMatrix4(M);
            if(zero&&zero.includes("x"))w.x=w0.x;if(zero&&zero.includes("z"))w.z=w0.z;
            if(from&&to){w.x-=from.x;w.z-=from.z;w.applyAxisAngle(new T.Vector3(0,1,0),yaw);w.x+=to.x;w.z+=to.z;}
            w.applyMatrix4(Mi);v[i]=w.x;v[i+1]=w.y;v[i+2]=w.z;
          }
        }else if(n.endsWith(".quaternion")&&yaw){
          const q=new T.Quaternion();
          for(let i=0;i<v.length;i+=4){q.fromArray(v,i).premultiply(Lq);q.toArray(v,i);}
        }
        return c;
      });
      return new T.AnimationClip(name,clip.duration,tracks);
    };
    const need=(a,names)=>{if(!names.every(n=>a.clips[n]))throw new Error("player clips missing");};
    // A taker on one body: his clips, all in penaltyKick's frame; his strike measured on his own boot; placed so that
    // boot meets the ball on the spot.
    const takerRig=taker=>{
      need(taker,["penaltyKick","jog","offensiveIdle","victory","disappointed"]);
      const TK=taker.clips,kick0=hipsOf(taker,TK.penaltyKick,0),kickEnd=hipsOf(taker,TK.penaltyKick,TK.penaltyKick.duration-.034);
      const jogJoin=hipsOf(taker,TK.jog,JOG_JOIN);
      const jog=rebase(taker,TK.jog,"cmJog",{from:jogJoin,to:kick0});
      const styles=RUNUPS.map((r,i)=>{
        let start=kick0;
        if(r.jog){const h=hipsOf(taker,jog,JOG_JOIN-r.jog*r.rate);start=h;}
        const idle0=hipsOf(taker,TK.offensiveIdle,0);
        return {...r,start,idle:rebase(taker,TK.offensiveIdle,`cmIdle${i}`,{zero:"xz",from:idle0,to:start})};
      });
      const react={victory:rebase(taker,TK.victory,"cmVictory",{zero:"xz",from:hipsOf(taker,TK.victory,0),to:kickEnd}),
        disappointed:rebase(taker,TK.disappointed,"cmDown",{zero:"xz",from:hipsOf(taker,TK.disappointed,0),to:kickEnd})};
      const struck=strikeOf(taker,TK);
      const hit=struck?struck.hit:KICK_HIT_GUESS,at=struck?struck.ball:KICK_BALL_GUESS;
      taker.holder.rotation.y=TAKER_YAW;
      taker.holder.position.set(0-(at[0]*cosY+at[2]*sinY),0,SPOT_Z-(-at[0]*sinY+at[2]*cosY));
      return {a:taker,TK,jog,styles,react,struck,hit,ball:at};
    };
    // A keeper on one body: his clips stay on his line (no travel toward the taker).
    const keeperRig=keeper=>{
      need(keeper,["gkIdle","gkDive","gkDive1","gkBlock","gkBlock1","gkBlock2","gkCatch1","gkCatch2"]);
      const KC={gkIdle:rebase(keeper,keeper.clips.gkIdle,"cmGkIdle",{zero:"xz"})};
      for(const n of ["gkDive","gkDive1","gkBlock","gkBlock1","gkBlock2","gkCatch1","gkCatch2"])KC[n]=rebase(keeper,keeper.clips[n],`cm_${n}`,{zero:"z"});
      keeper.holder.position.set(0,0,.25);
      return {a:keeper,KC};
    };
    // Where they stand: the taker so that his foot meets the ball on the spot; the keeper on his line facing out.
    const TAKER_YAW=Math.PI,cosY=Math.cos(TAKER_YAW),sinY=Math.sin(TAKER_YAW);
    // The strike, measured on the boot itself (Nik 2026-11-04: the foot must really meet the ball, never pass through it).
    // At the fastest point of the swing the front of the kicking boot (its skinned vertices, not a bone) sets where the
    // ball sits, with the ball's centre at its own height on the grass; the strike is the first moment any part of that
    // boot touches the ball, found to under a millimetre. Before it nothing of either boot is inside the ball; after it the
    // ball is gone at ~25 m/s while the foot follows at ~12 m/s.
    const strikeOf=(taker,TK)=>{
      const meshes=[];taker.model.traverse(o=>{if(o.isSkinnedMesh&&/^Boots/.test(o.name||o.parent?.name||""))meshes.push(o);});
      if(!meshes.length)return null;
      const kick=TK.penaltyKick,toe=taker.bones.mixamorigRightToeBase,ltoe=taker.bones.mixamorigLeftToeBase;if(!toe||!ltoe)return null;
      const at=time=>{taker.pose([{clip:kick,time,w:1}]);};
      const v=new T.Vector3(),pts=[];
      const bootPts=()=>{pts.length=0;for(const m of meshes){const n=m.geometry.attributes.position.count;for(let i=0;i<n;i+=1){m.getVertexPosition(i,v);v.applyMatrix4(m.matrixWorld);pts.push(v.x,v.y,v.z);}}return pts;};
      // The fastest moment of the right toe in the swing.
      let tPeak=KICK_HIT_GUESS,best=0;const a=new T.Vector3(),b=new T.Vector3(),dir=new T.Vector3();
      for(let t=.55;t<.95;t+=1/120){at(t);toe.getWorldPosition(a);at(t+1/240);toe.getWorldPosition(b);const sp=b.distanceTo(a)*240;if(sp>best){best=sp;tPeak=t;dir.copy(b).sub(a);}}
      dir.y=0;if(dir.lengthSq()<1e-6)return null;dir.normalize();
      at(tPeak);toe.getWorldPosition(a);ltoe.getWorldPosition(b);
      // The kicking boot's points: nearer the right toe than the left. Its front at the ball's centre height.
      const p=bootPts();let front=-1e9,F=null;
      for(let i=0;i<p.length;i+=3){v.set(p[i],p[i+1],p[i+2]);if(v.distanceToSquared(a)>v.distanceToSquared(b))continue;if(Math.abs(v.y-BALL_R)>.045)continue;const d=v.dot(dir);if(d>front){front=d;F=v.clone();}}
      if(!F)return null;
      const C=F.addScaledVector(dir,BALL_R);C.y=BALL_R;
      const gap=time=>{at(time);const q=bootPts();let m=1e9;for(let i=0;i<q.length;i+=3){const dx=q[i]-C.x,dy=q[i+1]-C.y,dz=q[i+2]-C.z;const d=dx*dx+dy*dy+dz*dz;if(d<m)m=d;}return Math.sqrt(m)-BALL_R;};
      let lo=.3,hi=tPeak+.05;
      for(let t=.3;t<=tPeak+.05;t+=1/60){if(gap(t)<=0){hi=t;break;}lo=t;}
      for(let i=0;i<10;i+=1){const mid=(lo+hi)/2;if(gap(mid)<=0)hi=mid;else lo=mid;}
      return {hit:lo,ball:[C.x,C.y,C.z],gap:gap(lo),peak:tPeak,speed:best};
    };
    // Each club has one body for the Showdown (its taker and its keeper); a kick shows the taker's club's taker and the
    // keeper's club's keeper, the others hidden.
    const rigs={};
    for(const [n,g] of Object.entries(x.bodies))rigs[n]={taker:takerRig(actor(g.taker,`cmTaker_${n}`,n)),keeper:keeperRig(actor(g.keeper,`cmKeeper_${n}`,n))};
    const loaded=Object.keys(rigs);if(!loaded.length)throw new Error("no player body");
    const bodyFor=club=>{const b=cm3BodyOf(club,cm3BodyList(K));return rigs[b]?b:cm3BodyOf(club,loaded);};
    let taker,keeper,TK,jog,styles,react,KC,KICK_HIT,KICK_BALL,struck;
    const useRigs=(takerClub,keeperClub)=>{
      const tr=rigs[bodyFor(takerClub)].taker,kr=rigs[bodyFor(keeperClub)].keeper;
      for(const r of Object.values(rigs)){r.taker.a.holder.visible=r.taker===tr;r.keeper.a.holder.visible=r.keeper===kr;}
      ({TK,jog,styles,react,struck}=tr);taker=tr.a;KICK_HIT=tr.hit;KICK_BALL=tr.ball;keeper=kr.a;KC=kr.KC;
    };
    useRigs(clubs.playerOne,clubs.playerTwo);

    // Kits: the taker in his club's home kit, the keeper in his own club's keeper kit picked against the taker's.
    let lineup={taker:null,keeper:null,round:1};
    const kitSize=phone?"phone":"full";
    // Looks: skin tone and hair come from the club and role (the same man for a club's kicks, another for its keeps), from
    // the body's own natural pairs (BODY_LOOKS); nothing random.
    const look=(a,club,role)=>{
      const pairs=BODY_LOOKS[a.body]||BODY_LOOKS.remy,[sk,hr]=pairs[cm3Hash(`${club}|${role}`)%pairs.length];
      a.model.traverse(o=>{if(!o.isMesh)return;const m=o.material;if(!m||Array.isArray(m))return;
        if(o.name==="Body"&&m.name==="Bodymat")m.color.setRGB(sk[0],sk[1],sk[2]);
        if(o.name==="Hair"||m.name==="Hairmat")m.color.setRGB(hr[0],hr[1],hr[2]);});
    };
    const dress=(a,club,role,vs)=>{
      look(a,club,role);
      let t;try{t=K.textures(club,{layout:a.body,role,vsClub:vs,size:kitSize});}catch(_error){return;}
      // One texture per canvas: on Ch38 and Ch42 the shirt, shorts (and Ch38's socks) share one atlas.
      const put=()=>{const made=new Map(),olds=new Set();for(const [m,k] of [["kitShirt","shirt"],["kitShorts","shorts"],["kitSocks","socks"]]){
        const mat=a.mats[m],c=t[k];if(!mat||!c)continue;
        let tex=made.get(c);if(!tex){tex=new T.CanvasTexture(c);tex.flipY=false;tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=aniso;tex.userData.cmKit=true;made.set(c,tex);}
        if(mat.map&&mat.map.userData?.cmKit&&mat.map!==tex)olds.add(mat.map);mat.map=tex;mat.color.setRGB(1,1,1);mat.roughness=.72;mat.needsUpdate=true;
      }for(const o of olds)o.dispose();};
      const token=a.kitToken=(a.kitToken||0)+1;
      // A body-mapped kit is blank until its kit map has loaded: it goes on only when painted (the last kit stays meanwhile).
      if(t.shirt===t.shorts){Promise.resolve(t.ready).then(()=>{if(!disposed&&a.kitToken===token)put();},()=>{});return;}
      put();Promise.resolve(t.ready).then(()=>{if(disposed||a.kitToken!==token)return;for(const m of ["kitShirt","kitShorts","kitSocks"])if(a.mats[m]?.map)a.mats[m].map.needsUpdate=true;},()=>{});
    };

    // ---------- the kick ----------
    let plan=null,frozenAt=null,frozenClock=null,raf=0,alive=true,disposed=false;
    const clockNow=()=>frozenClock!==null?frozenClock:cm3Clock();
    const t0=cm3Clock();
    const ballFree={p:new T.Vector3(),v:new T.Vector3(),t:0,on:false};
    const v3=(a,b,c)=>new T.Vector3(a,b,c);
    const pick=(list,n)=>list[((n%list.length)+list.length)%list.length];
    // The palms: between the wrist and the middle knuckle of each glove.
    const gloveL=new T.Vector3(),gloveR=new T.Vector3(),knuckle=new T.Vector3();
    const palms=()=>{const B=keeper.bones;
      B.mixamorigLeftHand.getWorldPosition(gloveL);B.mixamorigLeftHandMiddle1.getWorldPosition(knuckle);gloveL.lerp(knuckle,.55);
      B.mixamorigRightHand.getWorldPosition(gloveR);B.mixamorigRightHandMiddle1.getWorldPosition(knuckle);gloveR.lerp(knuckle,.55);};
    const keeperAt=(move,time)=>{keeper.holder.scale.x=move.m?-1:1;keeper.pose([{clip:KC[move.c],time,w:1}]);palms();};
    const G=v3(0,GRAVITY,0);
    const makePlan=k=>{
      const round=k.round||1,side=k.dive||"M",move=pick(KEEPS[side]||KEEPS.M,round*3+(k.shot==="R"?1:0));
      const start=v3(0,BALL_R,SPOT_Z);let target,after,hold=false;
      // Where the keeper's gloves are at full stretch: a save meets them there.
      keeperAt(move,move.tc);
      if(!k.shot){target=v3(.7,GOAL_H+1.05,-.3);after={kind:"over"};}
      else if(k.goal){
        const s=k.shot==="M"?pick(GOAL_SPOTS.mid,round):pick(GOAL_SPOTS.side,round),sx=k.shot==="L"?-1:k.shot==="R"?1:1;
        target=v3(k.shot==="M"?s[0]:sx*s[0],s[1],0);after={kind:"net"};
      }else{
        // A save: the ball's surface meets the leading palm (both palms on a catch), on the side the shot comes from.
        hold=Boolean(move.hold);
        const palm=hold?gloveL.clone().add(gloveR).multiplyScalar(.5):(side==="L"?(gloveL.x<gloveR.x?gloveL:gloveR):side==="R"?(gloveL.x>gloveR.x?gloveL:gloveR):(gloveL.y>gloveR.y?gloveL:gloveR)).clone();
        const toShot=start.clone().sub(palm).normalize();
        target=palm.clone().addScaledVector(toShot,BALL_R+(hold?.0:.02));target.y=Math.max(BALL_R,target.y);
        after={kind:hold?"held":"parry",palm};
      }
      // Real flight: one launch velocity under gravity that reaches the target at the arrival time (about 90 km/h).
      const v0=target.clone().sub(start).addScaledVector(G,-.5*FLIGHT*FLIGHT).multiplyScalar(1/FLIGHT);
      const spinAxis=v3(0,1,0).cross(v0).normalize(),spinRate=v0.length()/BALL_R*.18;
      return {...k,round,move,style:pick(RUNUPS.map((_r,i)=>i),round),start,target,v0,spinAxis,spinRate,after,hold,kStart:FLIGHT-move.tc/move.s,netHit:false};
    };
    const cm3Easy=u=>u<=0?0:u>=1?1:u*u*(3-2*u);
    // The taker at time t (seconds from the strike); idle while waiting.
    const takerAt=(t,live)=>{
      const st=styles[plan?plan.style:lineup.style||0];
      if(!plan){taker.pose([{clip:st.idle,time:live%st.idle.duration,w:1}]);return;}
      const kickT=t+KICK_HIT,jogLen=st.jog,runStart=-KICK_HIT-jogLen;
      const idle={clip:st.idle,time:(live)%st.idle.duration,w:1};
      if(kickT>=0){
        const end=TK.penaltyKick.duration-.034;
        if(kickT<end){
          const k={clip:TK.penaltyKick,time:kickT,w:1};
          if(st.jog&&kickT<.12){const j=cm3Easy(kickT/.12);taker.pose([{clip:jog,time:JOG_JOIN+kickT*st.rate,w:1-j},{...k,w:j}]);return;}
          if(!st.jog&&kickT<.001){taker.pose([idle]);return;}
          taker.pose([k]);return;
        }
        const r=plan.goal&&plan.shot?react.victory:react.disappointed,rt=kickT-end,b=cm3Easy(rt/.4);
        taker.pose([{clip:TK.penaltyKick,time:end,w:1-b},{clip:r,time:rt,w:b}]);return;
      }
      if(!st.jog){
        // Two steps from a standstill: he waits, then goes.
        const b=cm3Easy((kickT+.28)/.28);taker.pose([idle,{clip:TK.penaltyKick,time:0,w:b}]);return;
      }
      if(t<runStart){taker.pose([idle]);return;}
      const jt=JOG_JOIN-(-KICK_HIT-t)*st.rate,b=cm3Easy((t-runStart)/.3);
      taker.pose([{...idle,w:1-b},{clip:jog,time:jt,w:b}]);
    };
    const keeperPose=(t,live)=>{
      const idle={clip:KC.gkIdle,time:live%KC.gkIdle.duration,w:1};
      if(!plan||t<plan.kStart){keeper.holder.scale.x=1;keeper.pose([idle]);return;}
      const m=plan.move,ct=(t-plan.kStart)*m.s,b=cm3Easy(ct/(m.s*.12));
      keeper.holder.scale.x=m.m?-1:1;keeper.pose([{...idle,w:1-b},{clip:KC[m.c],time:ct,w:b}]);
    };
    // The loose ball: gravity, air drag, bounces that lose speed, grass friction while it rolls, and inside the goal the
    // net (back, sides and roof) takes its pace; it rolls the way it moves.
    const roll=new T.Vector3(),spinQ=new T.Quaternion(),UP=v3(0,1,0);
    const stepFree=dt=>{
      const s=ballFree,sp=s.v.length();
      s.v.y+=GRAVITY*dt;if(sp>0)s.v.multiplyScalar(Math.max(0,1-.012*sp*dt));
      s.p.addScaledVector(s.v,dt);
      if(s.p.y<BALL_R){s.p.y=BALL_R;if(s.v.y<0){s.v.y=-s.v.y*.55;s.v.x*=.86;s.v.z*=.86;}if(Math.abs(s.v.y)<.35)s.v.y=0;}
      if(s.p.y<=BALL_R+1e-4&&s.v.y===0){const h=Math.hypot(s.v.x,s.v.z),dec=Math.min(h,1.3*dt);if(h>0){s.v.x-=s.v.x/h*dec;s.v.z-=s.v.z/h*dec;}}
      if(plan&&plan.after.kind==="net"&&s.p.z<.05){
        const back=-2.08+Math.max(0,s.p.y-1.5)*1.1,side=HALF-.08-BALL_R,roof=GOAL_H-.06-BALL_R;
        if(s.p.z<back+BALL_R){s.p.z=back+BALL_R;if(s.v.z<0)s.v.z=-s.v.z*.08;s.v.x*=.35;s.v.y*=.35;}
        if(Math.abs(s.p.x)>side){s.p.x=Math.sign(s.p.x)*side;s.v.x*=-.1;s.v.z*=.5;}
        if(s.p.y>roof){s.p.y=roof;if(s.v.y>0)s.v.y*=-.1;}
      }
      ball.position.copy(s.p);
      roll.crossVectors(UP,s.v);const rs=roll.length();if(rs>1e-5){spinQ.setFromAxisAngle(roll.multiplyScalar(1/rs),rs*dt/BALL_R);ball.quaternion.premultiply(spinQ);}
    };
    const ballAt=t=>{
      if(!plan||t<=0){ball.position.set(0,BALL_R,SPOT_Z);ball.rotation.set(.3,.6,0);ballFree.on=false;return;}
      if(t<FLIGHT){
        ball.position.copy(plan.start).addScaledVector(plan.v0,t).addScaledVector(G,.5*t*t);
        ball.rotation.set(.3,.6,0);spinQ.setFromAxisAngle(plan.spinAxis,plan.spinRate*t);ball.quaternion.premultiply(spinQ);ballFree.on=false;return;}
      if(plan.hold){// caught: the ball stays between his palms
        palms();ball.position.copy(gloveL).add(gloveR).multiplyScalar(.5);ball.position.y=Math.max(BALL_R,ball.position.y);return;}
      if(!ballFree.on||ballFree.t>t+1e-6){
        ballFree.on=true;ballFree.t=FLIGHT;ballFree.p.copy(plan.target);
        const vA=plan.v0.clone().addScaledVector(G,FLIGHT);
        if(plan.after.kind==="parry"){
          // Off the glove: away from the palm (never back through the hand or body), out toward the pitch and wide.
          const n=plan.target.clone().sub(plan.after.palm).normalize();n.z=Math.max(n.z,.45);n.x+=Math.sign(plan.target.x||1)*.6;n.y=Math.max(n.y,.25);n.normalize();
          ballFree.v.copy(n).multiplyScalar(vA.length()*.32);
        }else ballFree.v.copy(vA);
      }
      while(ballFree.t<t){const dt=Math.min(1/120,t-ballFree.t);stepFree(dt);ballFree.t+=dt;}
      ball.position.copy(ballFree.p);
    };
    // Camera: behind and above the taker. Waiting: a slow drift; run-up: a push-in; after the strike it leans after the ball.
    const camera=new T.PerspectiveCamera(30,16/9,.1,400);
    const CAMB={pos:v3(0,3.9,SPOT_Z+17),look:v3(0,.5,5.5),hfov:40,vmin:21};
    const CAMP={pos:v3(.3,3.2,SPOT_Z+13),look:v3(0,.75,3)};
    const camLook=new T.Vector3();
    const cameraAt=(t,live)=>{
      const drift=reducedMotion()?0:1;
      const w=live*.22;let p=CAMB.pos.clone(),l=CAMB.look.clone();
      p.x+=Math.sin(w)*.18*drift;p.y+=Math.sin(w*.7)*.05*drift;
      if(plan&&!reducedMotion()){
        const k=cm3Easy((t+RUNUP)/(RUNUP+.4));p.lerp(CAMP.pos,k);l.lerp(CAMP.look,k);
        if(t>0){const f=cm3Easy(t/1.1);l.x+=ball.position.x*.22*f;l.y+=Math.max(-.2,ball.position.y-1)*.12*f;}
      }
      camera.position.copy(p);camLook.copy(l);
      // Proofs only: a close camera on the foot or the gloves ({pos, look, fov}); the game never sets it.
      const cu=api.closeup;if(cu){camera.position.fromArray(cu.pos);camLook.fromArray(cu.look);camera.fov=cu.fov||20;camera.updateProjectionMatrix();}
      camera.lookAt(camLook);camera.updateMatrixWorld();
    };
    const excitement=t=>{if(!plan)return .2;if(t<0)return .2+.4*cm3Easy((t+RUNUP)/RUNUP);if(t<FLIGHT)return .6;
      if(plan.goal&&plan.shot)return Math.max(.45,1-Math.max(0,t-1.6)*.2);return Math.max(.3,.7-(t-FLIGHT)*.35);};

    // ---------- the dissolve between kicks ----------
    // A new taker and keeper come in under a short broadcast dissolve: the last frame fades out over the new one (never
    // to black, never dimmed).
    let snap=null,snapAt=-1e9;
    const overlay=new T.Scene(),overlayCam=new T.OrthographicCamera(-1,1,1,-1,0,1);
    const overlayMat=keep(new T.MeshBasicMaterial({transparent:true,depthTest:false,depthWrite:false,toneMapped:true}));
    const overlayGeo=keep(new T.PlaneGeometry(2,2));overlay.add(new T.Mesh(overlayGeo,overlayMat));
    const dissolveFrom=()=>{
      if(!cssW||(frozenClock===null&&reducedMotion()))return;
      const size=renderer.getDrawingBufferSize(new T.Vector2());
      if(!snap||snap.width!==size.x||snap.height!==size.y){snap?.dispose();snap=new T.WebGLRenderTarget(size.x,size.y,{type:T.HalfFloatType,samples:phone?0:4});}
      renderer.setRenderTarget(snap);renderer.render(scene,camera);renderer.setRenderTarget(null);
      overlayMat.map=snap.texture;overlayMat.needsUpdate=true;snapAt=clockNow();
    };

    // ---------- size, labels, drawing ----------
    let cssW=0,cssH=0;
    const fit=()=>{
      const box=svg.parentNode;if(!box||!box.getBoundingClientRect)return;
      const r=svg.getBoundingClientRect(),o=box.getBoundingClientRect(),w=Math.round(r.width),h=Math.round(r.height);if(!w||!h)return;
      canvas.style.left=`${(r.left-o.left).toFixed(2)}px`;canvas.style.top=`${(r.top-o.top).toFixed(2)}px`;canvas.style.width=`${w}px`;canvas.style.height=`${h}px`;
      if(w!==cssW||h!==cssH){cssW=w;cssH=h;renderer.setSize(w,h,false);}
      // The goal's width sets the lens; a very wide box keeps at least vmin degrees of height, so the taker stays whole.
      camera.aspect=w/h;
      camera.fov=Math.max(CAMB.vmin,T.MathUtils.radToDeg(2*Math.atan(Math.tan(T.MathUtils.degToRad(CAMB.hfov)/2)/camera.aspect)));
      camera.updateProjectionMatrix();
    };
    const paint=()=>{
      // Reduce Motion (Codex on #1254): every clock stands still. The players hold their pose, the crowd stops swaying, the
      // net never bulges and a kick shows only its settled end (kick() already skips the run-up); the lineup and the
      // result still change. Proofs that freeze the scene clock keep their own clocks.
      const still=frozenClock===null&&reducedMotion();
      const now=clockNow(),live=still?0:(now-t0)/1000;
      const t=frozenAt!==null?frozenAt:plan?(still?SETTLE:(now-plan.startAt)/1000):0;
      keeperPose(t,live);takerAt(t,live);ballAt(t);
      // The net takes the ball (the stadium kit times its bulge on its own clock: ours).
      const stadiumT=still?0:plan?(plan.startAt-t0)/1000+t:live;
      if(!still&&plan&&plan.after.kind==="net"&&!plan.netHit&&t>=FLIGHT+.07){plan.netHit=true;S.update((plan.startAt-t0)/1000+FLIGHT+.07,1);S.hitNet(plan.target.x,plan.target.y*.9,plan.v0.length());}
      S.update(stadiumT,still?.2:excitement(t));
      cameraAt(t,live);
      renderer.render(scene,camera);
      const fade=still?0:1-(now-snapAt)/(DISSOLVE*1000);
      if(fade>0&&snap){overlayMat.opacity=cm3Easy(fade);renderer.autoClear=false;renderer.render(overlay,overlayCam);renderer.autoClear=true;}
    };
    // Smoothness first (Nik 2026-11-04, 2026-11-07): the shared governor (js/gfxTier.js) moves the pixel ratio: down after a
    // second of slow frames, up only when a timed frame shows room, never back to a step that ran slow, and never during a
    // kick (held from kick() to the next reset). Motion never depends on the frame rate: every pose is read from the clock.
    const GFX=root.CareerModeGfxTier;
    const gov=GFX?GFX.governor(renderer,{key:"chamber-men",draw:paint,onChange:()=>{cssW=0;layoutDirty=true;}}):null;
    const fps=GFX?GFX.overlay(()=>({calls:renderer.info.render.calls,tris:renderer.info.render.triangles,extra:`crowd ${S.crowdCount}`})):null;
    // The box is measured only when it changes (a ResizeObserver, a window resize), never every frame.
    let layoutDirty=true;
    const tick=time=>{
      raf=0;if(disposed)return;
      if(!canvas.isConnected||!svg.isConnected){free();return;}
      if(d.visibilityState!=="hidden"){gov?.frame(time);if(layoutDirty){layoutDirty=false;fit();}paint();}
      raf=root.requestAnimationFrame(tick);
    };
    const relayout=()=>{layoutDirty=true;};
    const ro=typeof root.ResizeObserver==="function"?new root.ResizeObserver(relayout):null;
    const free=()=>{
      if(disposed)return;disposed=true;alive=false;if(raf)root.cancelAnimationFrame(raf);ro?.disconnect();root.removeEventListener?.("resize",relayout);
      gov?.end();fps?.stop();
      for(const r of Object.values(rigs))for(const a of [r.taker.a,r.keeper.a])try{a.mixer.stopAllAction();a.mixer.uncacheRoot(a.model);}catch(_error){}
      scene.traverse(o=>{if(o.geometry)o.geometry.dispose();for(const m of [].concat(o.material||[]))for(const v of Object.values(m))if(v&&v.isTexture)v.dispose();});
      try{S.dispose();}catch(_error){}
      for(const v of own)try{v.dispose&&v.dispose();}catch(_error){}
      snap?.dispose();
      renderer.dispose();try{renderer.forceContextLoss();}catch(_error){}
      canvas.remove();svg.classList.remove("cm3d-on");
    };
    const setLineup=(takerClub,keeperClub,round)=>{
      const next={taker:String(takerClub||""),keeper:String(keeperClub||""),round:round||1};
      next.style=pick(RUNUPS.map((_r,i)=>i),next.round);
      if(next.taker===lineup.taker&&next.keeper===lineup.keeper&&next.style===lineup.style)return false;
      lineup=next;useRigs(next.taker,next.keeper);dress(taker,next.taker,"outfield",next.keeper);dress(keeper,next.keeper,"gk",next.taker);
      return true;
    };
    const api={
      mode:"broadcast",
      reset(){if(plan&&clockNow()-snapAt>120)dissolveFrom();plan=null;frozenAt=null;ballFree.on=false;gov?.hold(false);},
      // Who is on the pitch for the coming kick: the shooter's club takes it, the other club keeps goal.
      lineup(k){const fresh=k&&(String(k.taker||"")!==lineup.taker||String(k.keeper||"")!==lineup.keeper||pick(RUNUPS.map((_r,i)=>i),k.round||1)!==lineup.style);
        if(fresh&&!plan&&clockNow()-snapAt>120&&lineup.taker!==null)dissolveFrom();if(k)setLineup(k.taker,k.keeper,k.round);},
      // k = {shot: "L"|"M"|"R"|null (clock ran out), dive: "L"|"M"|"R", goal: boolean, animate: boolean, round}
      kick(k){
        plan=makePlan({shot:k.shot||null,dive:k.dive||"M",goal:Boolean(k.goal),round:k.round||1});
        ballFree.on=false;
        const still=!k.animate||reducedMotion();
        plan.startAt=clockNow()+(still?-SETTLE*1000:RUNUP*1000);frozenAt=null;gov?.hold(true);
      },
      runUpMs:RUNUP*1000,
      // clock (ms, optional) also freezes the scene clock, so a proof can step through a dissolve frame by frame.
      at(t,clock){frozenAt=typeof t==="number"?t:null;frozenClock=typeof clock==="number"?clock:null;fit();paint();},
      // Behind the loading screen: a few timed frames pick the level for this device (they also compile every shader).
      async warm(){if(!GFX)return;const before=renderer.getPixelRatio();await GFX.calibrate(renderer,paint,{frames:6});if(renderer.getPixelRatio()!==before){cssW=0;fit();}gov?.resize();paint();},
      dispose:free,
      lit:Boolean(scene.environment),
      probe(){return {mode:"broadcast",pixelRatio:renderer.getPixelRatio(),frameMs:gov?gov.frameMs():null,level:Q.name,kicking:Boolean(plan),keeper:keeper.holder.position.toArray(),ball:ball.position.toArray(),taker:taker.hips.getWorldPosition(new T.Vector3()).toArray(),lineup:{...lineup},move:plan?plan.move.c:null,strike:struck,bodies:{taker:taker.body,keeper:keeper.body},palms:[gloveL.toArray(),gloveR.toArray()]};},
      get alive(){return alive;}
    };
    setLineup(clubs.playerOne,clubs.playerTwo,1);
    svg.parentNode.insertBefore(canvas,svg);
    svg.classList.add("cm3d-on");
    fit();cameraAt(0,0);renderer.compile(scene,camera);paint();
    ro?.observe(svg);if(svg.parentNode)ro?.observe(svg.parentNode);root.addEventListener?.("resize",relayout);
    raf=root.requestAnimationFrame(tick);
    return api;
  }
  function cm3Clock(){return root.performance?.now?.()??Date.now();}

  // mount(svg) (cm3Mount): the 3D goal in place of the SVG art, resolved once its first frame is drawn; null when it cannot run here.
  // opts = {clubs:{playerOne, playerTwo}}: the taker and keeper clubs for the first kick.
  // The device's level (js/gfxTier.js, in the shell); light and phone screens take the lighter player and ball files.
  const GFX_JS="js/gfxTier.js";
  const GFX_FALLBACK={level:1,name:"medium",pixelRatio:1,antialias:true,shadowSize:1024,density:.7,bloom:false};
  async function cm3Quality(){
    const ok=await cm3Script("gfx-tier",GFX_JS,()=>Boolean(root.CareerModeGfxTier)).catch(()=>false);
    let p=GFX_FALLBACK;try{if(ok)p=root.CareerModeGfxTier.profile();}catch(_error){}
    const phoneScreen=Math.min(root.screen?.width||1e4,root.screen?.height||1e4)<700;
    return {...p,assets:phoneScreen||p.level<=1?"phone":"desktop"};
  }
  async function cm3Mount(svg,opts){
    if(!svg||!svg.parentNode||root.CMS_CHAMBER_MEN_3D==="off"||!hasWebgl2())return null;
    try{
      const Q=await cm3Quality();
      const pre=cm3Prefetch(Q.assets,opts&&opts.clubs);
      const T=await loadEngine();
      const extras=await cm3Extras(T,Q,pre);
      // r90: no stadium or players in time is the SVG goal, never a second look (the gold hall and its lounge light are gone).
      if(!extras)return null;
      if(!svg.isConnected){cm3FreeExtras(extras);return null;}
      let api=null;
      try{api=buildBroadcast(T,svg,extras,opts,Q);await api.warm();}
      catch(error){try{root.console?.warn?.("Chamber Men 3D scene failed; the drawn goal plays.",error);}catch(_error){}cm3FreeExtras(extras);svg.parentNode?.querySelector?.(":scope > canvas.cmGoal3d")?.remove();svg.classList.remove("cm3d-on");return null;}
      CareerModeChamberMen3d.last=api;
      return api;
    }catch(error){
      try{root.console?.warn?.("Chamber Men 3D goal unavailable; the drawn goal plays instead.",error);}catch(_error){}
      return null;
    }
  }
  const CareerModeChamberMen3d={contractVersion:1,feature:"cms-chamber-men-3d",enginePath:ENGINE_PATH,mount:cm3Mount,last:null};
  root.CareerModeChamberMen3d=CareerModeChamberMen3d;
})(typeof globalThis!=="undefined"?globalThis:this);
