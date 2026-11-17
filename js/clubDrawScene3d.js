(function(root){
  "use strict";

  // R94-02 Club Assignment "spin and stop" (Nik's picks 2026-11-15, study gameplay/r94/threads/R94_02_CLUB_ASSIGNMENT_STUDY.md).
  // Two real stitched footballs on a floodlit pitch, one per manager. Each ball carries that manager's three candidate clubs:
  // the 32 panels of a match ball (12 pentagons, 20 hexagons), whole panels per club, a black band with a gold line on the
  // seams between clubs, the crest in the middle of each third. The ball turns slowly once so the crests can be read, is
  // spun hard, and STOP lets the grass slow it: the third facing the manager when it rests is his club.
  //
  // This module only draws. It never decides a club and never writes: the presentation computes the stop at the tap (tap()),
  // sends it inside the manager's confirm, and calls accept() once Firebase holds it. Until then the ball may slow but never
  // rest (it keeps rolling and adds whole turns). A stop that comes from the ledger (the rival's, or a reload) is played with
  // restOn(i, stop), or shown at rest at once with restOn(i, stop, {immediate:true}). Both phones end on the same picture:
  // the rest pose is a fixed function of the stored integer (poseOf).
  //
  // ONE quality system (js/gfxTier.js): profile() before the renderer, calibrate behind the loading screen, the shared
  // governor in play (held while a ball is being kicked or is slowing), gov.end() before the context is let go.
  // Light (Nik's Chromebook, 2 CPU threads): 2 balls (one program), the pitch and the painted stadium = 4 draws, 3 programs.
  // Engine: the vendored three r187 the other 3D screens use.
  const ENGINE_PATH="visual-assets/v10_1/roulette/vendor/three-r187.min.js";
  const GFX_JS="js/gfxTier.js";
  // Motion (study 0b/0c). J is the luck dial: a well-timed tap lands the aimed club about 50% (Nik 2026-11-15 23:57 UTC),
  // a blind tap 33%. D0 is not a whole number of turns on purpose: the lead has to be learned before timing helps.
  const PHYS={
    J:120, D0:600, SECTION:120, POSE_PULL:.6,
    REST0:.9, W_SLOW:112, SHOW:.95, SHOW_MOVE:1.05, SHOW_OUT:.55, KICK:1.15, W_FAST:470, GRAV:62,
    FK:.2, A0:3.4, SETTLE:1.7, BODY_TILT:4.2,
    AWAIT_LEAD:120, AWAIT_W:150, RIVAL_MIN:480, REPLAN_MIN:150, REPLAN_DUR:4.2,
    // r95 skill lab (tools/club-draw-lab.html; the game keeps MODE 0 until Nik picks). MODE 0 one STOP tap (2.7.0),
    // 1 trap and touch (STOP traps the ball, a second tap on the gold needle decides how true it rolls: slip +-(J0+err*JT)),
    // 2 power roll (the ball waits still after the slow look; a tap on the swinging power bar kicks it POW_MIN..+POW_RANGE).
    // BLUR 0 keeps every crest and stitch sharp at any speed (Nik 2026-11-17: never blurry). RHY makes the top speed breathe.
    MODE:0, BLUR:1, J0:6, JT:54, NEEDLE_T:.62, POW_MIN:360, POW_RANGE:540, POW_T:.85, POW_DUR:3.4, RHY:0, RHY_T:2.4, SHOW_N6:.55
  };
  const PHYS_DEFAULT=Object.freeze({...PHYS});
  // The tuning page only (tools/club-draw-tuning.html): the game never calls it. SECTION is fixed (three clubs per ball).
  function tune(partial){
    if(partial==="reset"){Object.assign(PHYS,PHYS_DEFAULT);return {...PHYS};}
    for(const [k,v] of Object.entries(partial||{}))if((k!=="SECTION"||v===120||v===60)&&Object.hasOwn(PHYS_DEFAULT,k)&&Number.isFinite(v))PHYS[k]=v;
    return {...PHYS};
  }

  // ---------- pure physics (no THREE; the contract test runs these in node) ----------
  function mod360(a){return ((a%360)+360)%360;}
  // a - b folded into (-180, 180]
  function angleDiff(a,b){const d=mod360(a-b);return d>180?d-360:d;}
  function sectionOf(stop){return Math.floor(stop/PHYS.SECTION);}
  function sceneValidStop(stop){return Number.isInteger(stop)&&stop>=0&&stop<360;}
  // The stored integer, computed ONCE at the tap from the ball face in front of the manager and a random slow-down.
  function drawStop(front,rand01,J){const j=Number.isFinite(J)?J:PHYS.J;return Math.floor(mod360(front+PHYS.D0+(2*rand01-1)*j))%360;}
  // Where the ball is shown at rest: the stored angle pulled 40% toward the middle of its own third, so a border never rests
  // facing the manager and the landed crest is always within 36 degrees of the front. The club comes from the integer alone.
  function poseOf(stop){const mid=sectionOf(stop)*PHYS.SECTION+PHYS.SECTION/2;return mid+((stop+.5)-mid)*PHYS.POSE_PULL;}
  // The slow look's next stop: the middle of the next club third ahead of the face `front` (at least 20 degrees on), where
  // that crest faces the camera.
  function showTarget(front){return Math.ceil((front+20-PHYS.SECTION/2)/PHYS.SECTION)*PHYS.SECTION+PHYS.SECTION/2;}
  // The smallest travel >= min that brings the face `front` round to `target` (mod 360).
  function travelTo(front,target,min){let d=mod360(target-front);while(d<min)d+=360;return d;}
  // Grass friction: d(speed)/dt = -(c + k*speed). c is solved so the ball travels exactly `travel`; the speed reaches zero
  // with the drag still on, so the ball stops firmly instead of gliding (Nik 2026-11-15 22:17 UTC: the stop must look real).
  function friction(w0,travel){
    const k=PHYS.FK,w=Math.max(1,w0);let lo=.001,hi=1e6,c=100;
    for(let i=0;i<64;i+=1){c=(lo+hi)/2;if(w/k-(c/(k*k))*Math.log(1+k*w/c)>travel)lo=c;else hi=c;}
    const dur=Math.log(1+k*w/c)/k;
    return {c,dur,w0:w,travel,
      at(t){const tt=Math.min(Math.max(t,0),dur),e=Math.exp(-k*tt);return ((w+c/k)*(1-e))/k-(c/k)*tt;},
      speed(t){if(t>=dur)return 0;const tt=Math.max(t,0);return Math.max(0,(w+c/k)*Math.exp(-k*tt)-c/k);}};
  }
  // The slowest start that still stops within maxDur seconds over `travel` (a re-aimed ball never crawls for ten seconds).
  function speedFor(travel,maxDur){let lo=PHYS.FK*travel*1.05,hi=Math.max(lo*2,travel*4);for(let i=0;i<48;i+=1){const m=(lo+hi)/2;if(friction(m,travel).dur>maxDur)lo=m;else hi=m;}return hi;}
  function secureRandom(){try{const a=new Uint32Array(1);root.crypto.getRandomValues(a);return a[0]/4294967296;}catch(_error){return Math.random();}}

  // ---------- engine and quality ----------
  let enginePromise=null;
  function cdDoc(){return root.document||null;}
  function cdReducedMotion(){try{return Boolean(root.matchMedia&&root.matchMedia("(prefers-reduced-motion: reduce)").matches);}catch(_error){return false;}}
  function hasWebgl(){try{const c=cdDoc().createElement("canvas"),gl=c.getContext("webgl2");if(!gl)return false;gl.getExtension("WEBGL_lose_context")?.loseContext();return true;}catch(_error){return false;}}
  function script(path,ready){
    if(ready())return Promise.resolve(true);
    return new Promise((resolve,reject)=>{const s=cdDoc().createElement("script");s.src=path;s.async=true;
      s.addEventListener("load",()=>ready()?resolve(true):reject(new Error(path+" loaded empty")));
      s.addEventListener("error",()=>{s.remove();reject(new Error(path+" did not load"));});cdDoc().head.append(s);});
  }
  function cdLoadEngine(){
    const ready=()=>root.THREE&&typeof root.THREE.WebGLRenderer==="function";
    if(ready())return Promise.resolve(root.THREE);
    if(!enginePromise)enginePromise=script(ENGINE_PATH,ready).then(()=>root.THREE,error=>{enginePromise=null;throw error;});
    return enginePromise;
  }
  const GFX_FALLBACK={level:0,name:"light",pixelRatio:1,antialias:true};
  async function quality(){
    const ok=await script(GFX_JS,()=>Boolean(root.CareerModeGfxTier)).catch(()=>false);
    try{if(ok)return root.CareerModeGfxTier.profile();}catch(_error){}
    return GFX_FALLBACK;
  }
  // What each level draws (ONE system; study 4.2). Light stays the lightest 3D screen in the game.
  function knobs(level){
    const l=Math.max(0,Math.min(5,Math.round(Number(level))||0));
    return {level:l,
      atlas:l<=0?512:l===1?768:1024,               // crest atlas, per crest
      seg:l<=0?[48,32]:l===1?[64,40]:[96,64],      // sphere segments
      gloss:l>=1,                                   // second floodlight highlight
      detail:l>=3,                                  // visible stitches, leather grain, reflection band
      blades:l>=3?(l>=4?9000:6000):0,               // grass blades around each ball (one draw)
      bokeh:l>=2, confetti:l>=2,                    // floodlight glow sprites; confetti in club colours at rest
      blurTaps:l>=4?5:3};                           // spin blur on the crests
  }

  // ---------- ball, pitch and stadium shaders (from the study mock-up v3.1, unchanged look) ----------
  const BALL_VS="varying vec3 vObj;varying vec3 vNg;varying vec3 vW;void main(){vObj=normalize(position);vNg=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}";
  const BALL_FS=[
    "uniform vec3 PC[32];uniform vec3 kA[NSEC];uniform vec3 kB[NSEC];uniform vec3 kC[NSEC];uniform vec3 kT[NSEC];uniform vec3 kS[NSEC];uniform vec3 kN[NSEC];uniform vec3 kH[NSEC];uniform vec4 kP[NSEC];uniform float lit[NSEC];uniform float foc[NSEC];uniform sampler2D atlas;uniform vec3 camP;uniform mat3 rot;uniform float blur;uniform float pulse;uniform float clat;uniform float spd;",
    "varying vec3 vObj;varying vec3 vNg;varying vec3 vW;",
    "const float TAU=6.2831853;const float G=6.2831853/float(NSEC);",
    "const vec3 KEY=vec3(.430,.765,.479);const vec3 FIL=vec3(-.611,.560,.560);const vec3 BK1=vec3(.667,.477,-.572);const vec3 BK2=vec3(-.667,.477,-.572);",
    "vec4 crest(vec3 d,float k,float off){float lc=(k+.5)*G+off;float cp=cos(clat);float sp=sin(clat);vec3 c=vec3(sin(lc)*cp,sp,cos(lc)*cp);vec3 t=vec3(cos(lc),0.,-sin(lc));vec3 b=vec3(-sin(lc)*sp,cp,-cos(lc)*sp);float dc=dot(d,c);vec2 p=vec2(dot(d,t),dot(d,b))/max(dc,.05);float s=CREST_S;vec2 q=p/(2.*s)+.5;float inside=step(0.,q.x)*step(q.x,1.)*step(0.,q.y)*step(q.y,1.)*step(.25,dc);float col=mod(k,3.);float row=floor(k/3.+.01);return texture2D(atlas,vec2((col+clamp(q.x,0.,1.))/3.,(float(ROWS)-1.-row+clamp(q.y,0.,1.))/float(ROWS)))*inside;}",
    // The club's kit on its third. u runs across the third (0..1), sv up the shirt (0 hem, 1 neck), lat is the latitude.
    // P = (pattern, fabric, stripes, sleeves). Every edge is smoothed over one pixel (fwidth), no texture.
    "float aaS(float e,float x){float w=max(fwidth(x),1e-4)*.8;return smoothstep(e-w,e+w,x);}",
    "float aaB(float a,float b,float x){return aaS(a,x)-aaS(b,x);}",
    "float sqw(float x){float w=max(fwidth(x),1e-4)*.8;float f=fract(x);return smoothstep(.5-w,.5+w,f)*(1.-smoothstep(1.-w,1.,f));}",
    "vec3 kitAt(float u,float sv,float lat,vec3 A,vec3 B,vec3 C,vec3 Tr,vec3 S,vec3 H,vec4 P){",
    " float x=u-.5;vec3 col=A;float lum=dot(A,vec3(.3,.6,.1));",
    " if(P.x<.5){",
    "  if(P.y>.5&&P.y<1.5){col=mix(col,mix(A,Tr,.6),.92*(1.-aaS(.075,abs(fract(x*11.+.5)-.5))));}",
    "  else if(P.y<2.5&&P.y>1.5){col=mix(col,lum>.55?A*.64:A*1.7+.014,sqw((x*9.+.5)*.5));}",
    "  else if(P.y<3.5&&P.y>2.5){float yc=.88-.07*(1.-4.*x*x);col=mix(col,Tr,aaS(yc,sv));col=mix(col,A*.55,aaB(-.03,0.,sv-yc));}",
    "  else if(P.y>3.5){col=mix(col,Tr,.95*(1.-smoothstep(.24,.64,sv)));col=mix(col,col*(lum>.55?.84:1.3),sqw(sv*16.)*(1.-aaS(.56,sv)));}",
    "  if(P.y>.5){col=mix(col,Tr,(aaB(-.38,-.31,x)+aaB(.31,.38,x))*(1.-aaS(.66,sv)));}",
    "  if(P.w>1.5){float hem=.27+.035*(1.-4.*x*x);col=mix(col,H,1.-aaS(hem,sv));col=mix(col,Tr,aaB(-.022,.022,sv-hem));}",
    " }",
    " else if(P.x<1.5){col=mix(A,B,sqw((x*P.z+.5)*.5));}",
    " else if(P.x<2.5){col=mix(A,B,sqw(((lat-clat)/.26+.5)*.5));}",
    " else if(P.x<3.5){col=mix(A,B,aaS(0.,x));}",
    " else if(P.x<4.5){col=mix(A,B,aaB(clat-.17,clat+.17,lat));col=mix(col,C,aaB(clat-.05,clat+.05,lat)*step(.002,dot(C-B,C-B)));}",
    " else if(P.x<5.5){col=mix(A,B,aaB(-.195,-.105,x)+aaB(.105,.195,x));}",
    " else if(P.x<6.5){float X=x*2.;float Y=sv*2.-1.;col=mix(A,B,(1.-aaS(.085,abs(Y-1.125*abs(X))/1.5))*aaS(-.05,Y));}",
    " else if(P.x<7.5){col=mix(A,B,1.-aaS(0.,sv-(.05+.9*u)));}",
    " else{col=mix(col,Tr,aaB(-.11,.11,x));col=mix(col,B,aaB(-.08,.08,x));}",
    " if(mod(P.w,2.)>.5){col=mix(col,S,((1.-aaS(.10,u))+aaS(.90,u))*aaS(.42,sv));}",
    " return col;",
    "}",
    "#ifdef DETAIL",
    "float h3(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}",
    "float vn3(vec3 x){vec3 i=floor(x);vec3 f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(h3(i),h3(i+vec3(1.,0.,0.)),f.x),mix(h3(i+vec3(0.,1.,0.)),h3(i+vec3(1.,1.,0.)),f.x),f.y),mix(mix(h3(i+vec3(0.,0.,1.)),h3(i+vec3(1.,0.,1.)),f.x),mix(h3(i+vec3(0.,1.,1.)),h3(i+vec3(1.,1.,1.)),f.x),f.y),f.z);}",
    "#endif",
    "void main(){",
    " vec3 d=normalize(vObj);",
    " float s1=-2.;float s2=-2.;vec3 c1=vec3(0.,1.,0.);vec3 c2=vec3(0.,1.,0.);float pent=0.;",
    " for(int i=0;i<32;i++){vec3 c=PC[i];float s=dot(d,c);if(s>s1){s2=s1;c2=c1;s1=s;c1=c;pent=i<12?1.:0.;}else if(s>s2){s2=s;c2=c;}}",
    " vec3 gv=c1-c2;float gl=max(length(gv),.0001);float e=(s1-s2)/gl;vec3 gd=gv/gl;",
    " float lon=atan(d.x,d.z);if(lon<0.)lon+=TAU;float g=lon/G;float k=min(floor(g),float(NSEC-1));float u=g-k;",
    " float lonc=atan(c1.x,c1.z);if(lonc<0.)lonc+=TAU;float gc=lonc/G;float uc=fract(gc);",
    " float polar=step(.99,abs(c1.y))*(1.-pent);float neutral=max(polar,step(min(uc,1.-uc),.03));",
    " float ks=mix(min(floor(gc),float(NSEC-1)),k,neutral);",
    " vec3 kBody;vec3 kSec;vec3 kSec2;vec3 kTrim;vec3 kSlv;vec3 kPent;vec3 kShorts;vec4 kPat;float L;float F;",
    " int ki=int(ks+.5);kBody=kA[ki];kSec=kB[ki];kSec2=kC[ki];kTrim=kT[ki];kSlv=kS[ki];kPent=kN[ki];kShorts=kH[ki];kPat=kP[ki];L=lit[ki];F=foc[ki];",
    " float hn=float(NSEC)*.5;float du=g-ks;if(du>hn)du-=float(NSEC);if(du<-hn)du+=float(NSEC);float klat=asin(clamp(d.y,-1.,1.));",
    " vec3 kit=kitAt(clamp(du,0.,1.),clamp(.70+(klat-clat)/1.6,0.,1.),klat,kBody,kSec,kSec2,kTrim,kSlv,kShorts,kPat);",
    " F=mix(F,1.,neutral);",
    " vec3 white=vec3(.74,.74,.71);",
    " vec3 classic=mix(white,vec3(.022,.022,.026),pent);",
    " vec3 club=mix(mix(kit,kPent,pent),vec3(.026,.026,.030),neutral);",
    " vec3 base=mix(classic,club,L);",
    " float ed=min(u,1.-u)*(360./float(NSEC))*sqrt(max(1.-d.y*d.y,0.));float pipe=(1.-smoothstep(1.05,1.45,ed))*L;",
    " float pipeEdge=(1.-smoothstep(1.45,1.9,ed))*L;base=mix(base,base*.35,pipeEdge*(1.-pipe)*neutral);",
    " base=mix(base,vec3(.80,.56,.13),pipe);",
    "#if BLUR_TAPS > 3",
    " vec4 cr=(crest(d,k,0.)*2.+crest(d,k,blur)+crest(d,k,-blur)+crest(d,k,blur*2.)+crest(d,k,-blur*2.))/6.;",
    "#else",
    " vec4 cr=(crest(d,k,0.)*2.+crest(d,k,blur*1.5)+crest(d,k,-blur*1.5))/4.;",
    "#endif",
    " vec3 crc=pow(cr.rgb/max(cr.a,.001),vec3(2.2));float ca=cr.a*L;base=mix(base,crc,ca);",
    " float wS=.014;float groove=1.-smoothstep(wS*.5,wS*1.5,e);",
    " base*=1.-groove*.86*(1.-.45*ca)*(1.-.30*spd)*(1.-.85*pipe);",
    " float grain=1.;",
    "#ifdef DETAIL",
    " vec3 ax=normalize(cross(gd,c1+c2));float al=dot(d,ax);",
    " float st=(1.-smoothstep(.12,.22,abs(fract(al*30.)-.5)))*smoothstep(wS*1.1,wS*1.6,e)*(1.-smoothstep(.034,.044,e))*(1.-spd*.8);",
    " base=mix(base,base*.5+vec3(.20),st*.55);",
    " grain=.80+.40*vn3(d*110.);base*=.955+.09*vn3(d*46.);",
    "#endif",
    " vec3 gt=gd-d*dot(gd,d);float slope=1.-smoothstep(0.,.085,e);slope*=slope;",
    " vec3 N=normalize(rot*normalize(d-gt*slope*.62));vec3 Ng=normalize(vNg);vec3 V=normalize(camP-vW);",
    " float nl=max(dot(N,KEY),0.);float nf=max(dot(N,FIL),0.);float nb=max(dot(N,BK1),0.)+max(dot(N,BK2),0.);",
    " float up=N.y*.5+.5;vec3 amb=mix(vec3(.020,.062,.022),vec3(.058,.064,.082),up);",
    " float ao=mix(.28,1.,smoothstep(-1.05,-.25,Ng.y));",
    " vec3 col=base*(amb*1.55*ao+nl*vec3(1.,.97,.90)*.98+nf*vec3(.72,.80,.96)*.40+nb*vec3(1.,.92,.76)*.20*ao);",
    " float nv=max(dot(N,V),0.);float fr=pow(1.-nv,5.);float flat1=1.-groove;",
    " vec3 H=normalize(KEY+V);col+=pow(max(dot(N,H),0.),34.)*.26*grain*flat1*vec3(1.,.97,.90);",
    "#ifdef GLOSS",
    " vec3 H2=normalize(FIL+V);col+=pow(max(dot(N,H2),0.),60.)*.20*grain*flat1*vec3(.8,.88,1.);",
    " col+=pow(max(dot(N,H),0.),260.)*.55*flat1;",
    "#endif",
    "#ifdef DETAIL",
    " vec3 R=reflect(-V,N);float band=smoothstep(.10,.16,R.y)*(1.-smoothstep(.20,.34,R.y))*step(R.z,.2);col+=band*vec3(1.,.88,.60)*.07*grain*(.4+.6*fr+.5*step(.5,fract(atan(R.x,-R.z)*5.)));",
    "#endif",
    " col+=fr*vec3(.34,.38,.34)*.22;",
    " col+=base*.30*pulse*F;",
    " float lum=dot(col,vec3(.3,.6,.1));col=mix(vec3(lum)*.42,col,F);",
    " float gy=vW.y+.035*sin(vW.x*41.+vW.z*17.)+.02*sin(vW.x*97.);col=mix(vec3(.022,.115,.020),col,smoothstep(.02,.15,gy));",
    " gl_FragColor=vec4(pow(clamp(col,0.,1.),vec3(1./2.2)),1.);",
    "}"].join("\n");
  const PITCH_GLSL=[
    "uniform vec3 s0;uniform vec3 s1;uniform vec3 b0;uniform vec3 b1;uniform float own;uniform float glow0;uniform float glow1;uniform vec3 g0;uniform vec3 g1;uniform vec2 d0;uniform vec2 d1;uniform vec3 camP;",
    "float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
    "float vn(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}",
    "float ring(vec2 p,float r,float w){return 1.-smoothstep(w*.5,w*.5+.03,abs(length(p)-r));}",
    "float lobe(vec2 q,vec2 o,float r,float h){vec2 c=q-o*r*(.85+h*1.5);float al=dot(c,o);float ac=dot(c,vec2(-o.y,o.x));return exp(-(al*al/(r*r*1.05)+ac*ac/(r*r*.42)))*.17;}",
    "vec3 spot(vec3 col,vec2 P,vec3 s,vec3 b,float gold,float glow,vec3 gc,vec2 dc){float r=s.y;vec2 p0=P-s.xz;vec2 p=vec2(p0.x*dc.y-p0.y*dc.x,dot(p0,dc));float l=length(p);",
    " col=mix(col,gc,glow*.26*exp(-l*l/(r*r*5.)));",
    " float rg=ring(p,r*1.8,.08*r);col=mix(col,mix(vec3(.74),vec3(.76,.54,.14),gold),rg*.85);",
    " float nx=abs(p.x)/(r*.20);float nz=(p.y-r*1.8)/(r*.34);float notch=step(0.,nz)*step(nz,1.)*step(nx,1.-nz);col=mix(col,vec3(.80),notch);",
    " vec2 q=P-b.xz;float h=b.y;float kk=1./(1.+h*2.5);float sh=exp(-dot(q,q)/(r*r*(.40+h*.8)))*.74*kk;",
    " sh+=(lobe(q,vec2(.62,.78),r,h)+lobe(q,vec2(-.62,.78),r,h)+lobe(q,vec2(.55,-.83),r,h)+lobe(q,vec2(-.55,-.83),r,h))*kk;",
    " return col*(1.-min(sh,.86));}",
    "vec3 pitchCol(vec3 W){vec2 P=W.xz;",
    " float sz=smoothstep(.47,.53,abs(fract(P.y/14.+.30)-.5)*2.);float sx=smoothstep(.47,.53,abs(fract(P.x/14.+.5)-.5)*2.);",
    " vec3 col=mix(vec3(.028,.160,.025),vec3(.045,.236,.035),sz);col*=mix(.93,1.05,sx);",
    " float dist=length(W-camP);float nf=1./(1.+dist*dist*.006);",
    " float n=vn(P*vec2(7.,2.2))*.55+vn(P*vec2(23.,9.))*.45;col*=1.+(n-.5)*.46*nf;",
    " col*=1.+.22*exp(-dot(P,P)/110.);",
    " col=spot(col,P,s0,b0,1.-own,glow0,g0,d0);col=spot(col,P,s1,b1,own,glow1,g1,d1);",
    " float tl=1.-smoothstep(.07,.14,abs(P.y+21.));col=mix(col,vec3(.66),tl*.8);",
    " float fz=smoothstep(-4.,-27.,P.y);col=mix(col,vec3(.070,.128,.090),fz*.5);",
    " col*=1.-.32*smoothstep(11.,25.,abs(P.x));",
    " return col;}"].join("\n");

  function seeded(s){return function(){s=(s*16807)%2147483647;return s/2147483647;};}

  // The 32 panel centres of a match ball (truncated icosahedron). A hexagon sits on each pole so the pattern repeats every
  // 120 degrees, once per club third, and a pentagon sits in the middle of every third, right behind the crest.
  function panels(T){
    const p=(1+Math.sqrt(5))/2,V=[[0,1,p],[0,-1,p],[0,1,-p],[0,-1,-p],[1,p,0],[-1,p,0],[1,-p,0],[-1,-p,0],[p,0,1],[p,0,-1],[-p,0,1],[-p,0,-1]].map(a=>new T.Vector3(a[0],a[1],a[2]).normalize()),F=[];
    for(let i=0;i<12;i++)for(let j=i+1;j<12;j++)for(let k=j+1;k<12;k++)if(V[i].dot(V[j])>.4&&V[j].dot(V[k])>.4&&V[i].dot(V[k])>.4)F.push(new T.Vector3().add(V[i]).add(V[j]).add(V[k]).normalize());
    const q=new T.Quaternion().setFromUnitVectors(F[0],new T.Vector3(0,1,0));V.forEach(v=>v.applyQuaternion(q));F.forEach(v=>v.applyQuaternion(q));
    const ref=V.filter(v=>v.y>.1&&v.y<.3)[0],lon=Math.atan2(ref.x,ref.z),q2=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI/3-lon);
    V.forEach(v=>v.applyQuaternion(q2));F.forEach(v=>v.applyQuaternion(q2));
    return {centres:V.map(v=>v.clone().multiplyScalar(.97415)).concat(F),clat:Math.asin(ref.y)};
  }

  // The painted stadium (one draw): two crowd tiers, a lit balcony, roof floodlights with glare, haze and LED boards with no
  // readable words, painted soft like a broadcast camera focused on the ball.
  function standsTexture(T){
    const Wd=2048,Ht=700,c=cdDoc().createElement("canvas");c.width=Wd;c.height=Ht;const x=c.getContext("2d"),rnd=seeded(17),Y=u=>Ht-u*50;
    const sky=x.createLinearGradient(0,0,0,Y(6.4));sky.addColorStop(0,"#03050b");sky.addColorStop(.7,"#0a1220");sky.addColorStop(1,"#1a2233");x.fillStyle=sky;x.fillRect(0,0,Wd,Ht);
    const cw=cdDoc().createElement("canvas");cw.width=Wd/2;cw.height=Ht/2;const cx=cw.getContext("2d");
    function crowdTier(y0,y1,warm,dens){const top=(Ht-y1*50)/2,bot=(Ht-y0*50)/2,pal=warm?["238,196,96","226,178,70","244,226,170","236,232,222","190,48,44","44,84,170","30,26,18","30,26,18","120,96,48"]:["150,140,110","120,120,130","200,190,160","60,70,110","26,24,22","26,24,22","110,50,48"];
      const g=cx.createLinearGradient(0,top,0,bot);g.addColorStop(0,warm?"#2b2414":"#161a22");g.addColorStop(1,warm?"#3a2f17":"#1d2027");cx.fillStyle=g;cx.fillRect(0,top,Wd/2,bot-top);
      for(let ry=top+1;ry<bot-1;ry+=2.6){const k=(ry-top)/(bot-top),br=(warm?.50:.30)+k*(warm?.45:.25);for(let px=0;px<Wd/2;px+=2.3){if(rnd()>dens)continue;cx.fillStyle="rgba("+pal[Math.floor(rnd()*pal.length)]+","+(br*(.45+rnd()*.55)).toFixed(2)+")";cx.fillRect(px+rnd(),ry+rnd()*.8,1.7,1.9);}}
      for(let ax=18;ax<Wd/2;ax+=64){cx.fillStyle="rgba(0,0,0,.42)";cx.fillRect(ax,top,2.5,bot-top);}
      if(warm)for(let vx=50;vx<Wd/2;vx+=128){cx.fillStyle="rgba(4,5,6,.9)";cx.fillRect(vx-9,top+(bot-top)*.38,18,11);cx.fillStyle="rgba(255,214,130,.5)";cx.fillRect(vx-9,top+(bot-top)*.38-1.5,18,1.5);}
      for(let s=0;s<(warm?26:14);s++){cx.fillStyle="rgba(255,255,255,.95)";cx.fillRect(rnd()*Wd/2,top+rnd()*(bot-top),1.4,1.4);}
    }
    crowdTier(.95,3.25,true,.90);crowdTier(3.65,5.75,false,.84);
    x.imageSmoothingEnabled=true;x.imageSmoothingQuality="high";if("filter" in x)x.filter="blur(1.4px)";x.drawImage(cw,0,(Ht-5.75*50)/2,Wd/2,(5.75-.95)*25,0,Y(5.75),Wd,(5.75-.95)*50);if("filter" in x)x.filter="none";
    x.fillStyle="#07080a";x.fillRect(0,Y(3.65),Wd,(3.65-3.25)*50);x.fillStyle="#3a2c12";x.fillRect(0,Y(3.33),Wd,3);
    for(let bx=6;bx<Wd;bx+=22){x.fillStyle="rgba(255,226,150,.9)";x.fillRect(bx,Y(3.50),5,3);}
    const roof=x.createLinearGradient(0,Y(6.5),0,Y(5.75));roof.addColorStop(0,"#05070b");roof.addColorStop(1,"#0b0d12");x.fillStyle=roof;x.fillRect(0,Y(6.5),Wd,(6.5-5.75)*50);
    x.strokeStyle="rgba(70,80,96,.55)";x.lineWidth=1.5;for(let tx=0;tx<Wd;tx+=64){x.beginPath();x.moveTo(tx,Y(6.5));x.lineTo(tx+32,Y(5.80));x.lineTo(tx+64,Y(6.5));x.stroke();}
    x.fillStyle="#141920";x.fillRect(0,Y(6.5)-3,Wd,3);
    x.globalCompositeOperation="lighter";
    const hz=x.createLinearGradient(0,Y(6.2),0,Y(1));hz.addColorStop(0,"rgba(255,226,170,.20)");hz.addColorStop(.5,"rgba(255,220,160,.07)");hz.addColorStop(1,"rgba(255,220,160,0)");x.fillStyle=hz;x.fillRect(0,Y(6.2),Wd,5.2*50);
    for(let k=0;k<8;k++){const lx=128+k*256,ly=Y(5.98);
      const cone=x.createLinearGradient(0,ly,0,ly+240);cone.addColorStop(0,"rgba(255,236,190,.16)");cone.addColorStop(1,"rgba(255,236,190,0)");x.fillStyle=cone;x.beginPath();x.moveTo(lx-40,ly);x.lineTo(lx+40,ly);x.lineTo(lx+190,ly+240);x.lineTo(lx-190,ly+240);x.closePath();x.fill();
      const rg=x.createRadialGradient(lx,ly,0,lx,ly,120);rg.addColorStop(0,"rgba(255,246,220,.95)");rg.addColorStop(.12,"rgba(255,226,160,.55)");rg.addColorStop(.45,"rgba(255,200,110,.12)");rg.addColorStop(1,"rgba(255,190,90,0)");x.fillStyle=rg;x.fillRect(lx-120,ly-120,240,240);
      const stg=x.createLinearGradient(lx-230,0,lx+230,0);stg.addColorStop(0,"rgba(255,236,190,0)");stg.addColorStop(.5,"rgba(255,244,214,.55)");stg.addColorStop(1,"rgba(255,236,190,0)");x.fillStyle=stg;x.fillRect(lx-230,ly-2,460,4);
      for(let r=0;r<3;r++)for(let q=0;q<9;q++){x.fillStyle="rgba(255,252,240,1)";x.fillRect(lx-40+q*9,ly-9+r*7,6,4.5);}
    }
    x.globalCompositeOperation="source-over";
    // LED boards: club-neutral gold, chalk and green panels with a thin line pattern, no words (nothing to read behind the balls).
    x.fillStyle="#050607";x.fillRect(0,Y(.98),Wd,.98*50);
    const cols=["#e9c869","#f4f1e6","#1c6b3a","#f4f1e6"],ink=["rgba(26,20,5,.55)","rgba(16,16,16,.35)","rgba(244,241,230,.5)","rgba(16,16,16,.35)"];
    for(let b=0;b<16;b++){x.fillStyle=cols[b%4];x.fillRect(b*128+3,Y(.90),122,36);x.fillStyle=ink[b%4];for(let s=0;s<5;s++)x.fillRect(b*128+18+s*20,Y(.90)+16,12,4);}
    x.globalCompositeOperation="lighter";const bg=x.createLinearGradient(0,Y(1.5),0,Y(.9));bg.addColorStop(0,"rgba(255,230,170,0)");bg.addColorStop(1,"rgba(255,230,170,.18)");x.fillStyle=bg;x.fillRect(0,Y(1.5),Wd,.6*50);x.globalCompositeOperation="source-over";
    const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=T.RepeatWrapping;t.repeat.x=-1;t.anisotropy=4;return t;
  }

  // Club colours for the leather: main colour on hexagons, second colour on pentagons (lifted apart when they are too close).
  // r187 colour management turns a hex into linear at once; these read the hex as plain sRGB numbers (as the picked mock-up
  // on r128 did), so the closeness test below and the one convertSRGBToLinear() after it stay exactly as tuned.
  function srgbColour(T,hex){return new T.Color().setStyle(hex,T.LinearSRGBColorSpace);}
  function clubColours(T,info){
    const a=srgbColour(T,info.primary||"#d8b55a"),b=srgbColour(T,info.secondary||"#101010"),dr=a.r-b.r,dg=a.g-b.g,db=a.b-b.b;
    if(dr*dr+dg*dg+db*db<.06){b.copy(a);const lum=.3*a.r+.6*a.g+.1*a.b;if(lum>.5)b.multiplyScalar(.22);else b.lerp(srgbColour(T,"#f1efe6"),.85);}
    a.convertSRGBToLinear();b.convertSRGBToLinear();return [new T.Vector3(a.r,a.g,a.b),new T.Vector3(b.r,b.g,b.b)];
  }
  // r94 gallery (Nik 2026-11-16): each club's third wears that club's own 2016-17 kit, not only its crest: the body colour, the
  // pattern (stripes, hoops, halves, chest band, twin stripes, V, sash, centre stripe) in its second colour, the one-colour
  // fabric of a plain shirt (trim pinstripes, tonal shadow stripes, a trim yoke or a hem that fades into the trim) with trim side panels, contrasting
  // sleeves on the third's edges, and the pentagons in the trim. Colours and patterns come from js/kits17.js, the one kit
  // table (Chamber Men, Squad). Where two clubs of one league share a kit (Juventus and Udinese, the blue-and-white LaLiga
  // stripes, the plain red Bundesliga shirts), BALL_VARIANT gives one of them a different stripe width, fabric or pentagon
  // colour so no two clubs that can share a ball look alike (tests/contracts/r94-club-draw-scene-contracts.cjs C10).
  const PATTERN_ID=Object.freeze({solid:0,stripes:1,hoops:2,halves:3,band:4,twin:5,vee:6,diag:7,centre:8});
  const FABRIC_ID=Object.freeze({pin:1,shadow:2,yoke:3,fade:4});
  const BALL_VARIANT=Object.freeze({
    "Southampton":{n:11},"Udinese":{n:11},"Sporting Gijón":{n:11},
    "Deportivo La Coruña":{pent:"#0c2348"},"Espanyol":{n:11},"Alavés":{n:11,pent:"#0c2348"},"Cagliari":{pent:"#002350"},
    "Mainz 05":{fabric:"pin"},"FC Ingolstadt":{fabric:"fade"},"Darmstadt 98":{fabric:"yoke",pent:"#141414"},"RB Leipzig":{fabric:"yoke",pent:"#0c2348"},
    "West Ham United":{pent:"#f4f4f2"},"Lyon":{fabric:"yoke"}});
  function hexLum(h){const n=parseInt(String(h).slice(1),16);return (.3*(n>>16)+.6*((n>>8)&255)+.1*(n&255))/255;}
  // kits: the js/kits17.js API (kit, fabric, deltaE); info: the club's identity colours, used when no kit is known.
  function ballLook(kits,name,info){
    const k=kits&&typeof kits.kit==="function"?kits.kit(name):null;
    if(!k||!k.known){const i=info||{};return {known:false,pattern:"solid",fabric:"",n:0,body:i.primary||"#d8b55a",second:i.secondary||"#101010",second2:i.secondary||"#101010",trim:i.secondary||"#101010",sleeves:null,shorts:null,pent:null};}
    const dE=kits.deltaE,v=BALL_VARIANT[k.club]||{},pattern=PATTERN_ID[v.pattern||k.pattern]!==undefined?(v.pattern||k.pattern):"solid";
    const second=k.second[0]||k.trim,sleeves=k.sleeves&&dE(k.sleeves,k.body)>12?k.sleeves:null;
    let pent=v.pent||k.trim;if(dE(pent,k.body)<18)pent=k.second[0]&&dE(k.second[0],k.body)>=18?k.second[0]:(hexLum(k.body)>.5?"#141414":"#f4f4f2");
    // A plain shirt also shows its shorts (the lower part of the third) when they are another colour: a kit reads as shirt
    // and shorts at a glance (United red over white, Freiburg red over black, Liverpool all red).
    const shorts=pattern==="solid"&&k.shorts&&dE(k.shorts,k.body)>25?k.shorts:null;
    return {known:true,pattern,fabric:pattern==="solid"?(v.fabric||(typeof kits.fabric==="function"?kits.fabric(name):"shadow")):"",n:pattern==="stripes"?(v.n||7):0,
      body:k.body,second,second2:k.second[1]||second,trim:k.trim,sleeves,shorts,pent};
  }
  // Two looks can share a ball without being mistaken for each other: a different pattern or fabric, stripes at least four
  // apart in count (bold against thin), or a clearly different second colour, pentagon colour, sleeves or body (CIE76 > 25).
  function looksApart(a,b,dE){
    if(a.pattern!==b.pattern)return true;
    if(a.pattern==="solid"&&a.fabric!==b.fabric)return true;
    if(a.pattern==="stripes"&&Math.abs(a.n-b.n)>=4)return true;
    if(a.pattern!=="solid"&&dE(a.second,b.second)>25)return true;
    if(a.pent&&b.pent&&dE(a.pent,b.pent)>25)return true;
    if(Boolean(a.sleeves)!==Boolean(b.sleeves)||(a.sleeves&&dE(a.sleeves,b.sleeves)>25))return true;
    if(Boolean(a.shorts)!==Boolean(b.shorts)||(a.shorts&&dE(a.shorts,b.shorts)>25))return true;
    return dE(a.body,b.body)>25;
  }
  function imageOf(src){
    if(!src)return Promise.resolve(null);
    if(typeof src==="object"&&(src.naturalWidth||src.width))return Promise.resolve(src);
    // js/visualIdentity.js hands its crest as a CSS value (url("data:image/svg+xml,...")): the address inside is what loads.
    const css=/^url\((["']?)(.*)\1\)$/s.exec(String(src).trim()),url=css?css[2]:String(src);
    return new Promise(resolve=>{const im=new root.Image();im.decoding="async";im.onload=()=>resolve(im);im.onerror=()=>resolve(null);im.src=url;});
  }
  // Default club info: the game's own identity table (js/visualIdentity.js): colours, and the drawn SVG crest.
  function identityInfo(name){
    try{const id=typeof root.getClubIdentity==="function"?root.getClubIdentity(name):null;if(id)return {primary:id.primary,secondary:id.secondary,crest:id.crest};}catch(_error){}
    return {primary:"#d8b55a",secondary:"#101010",crest:null};
  }
  // The R94-01 image crest where the club has one (the "ball" slot; visualIdentity falls back to its largest file, and to
  // null when there is none or it fails), else the drawn SVG crest.
  async function defaultClubInfo(name){
    const info=identityInfo(name);
    try{if(typeof root.loadClubCrestImage==="function"){const im=await root.loadClubCrestImage(name,"ball");if(im)return {...info,crest:im};}}catch(_error){}
    return info;
  }

  // ---------- the scene ----------
  function build(T,host,opts,P,assets){
    const K=knobs(P.level),d=cdDoc(),reduced=opts.reducedMotion===undefined?cdReducedMotion():Boolean(opts.reducedMotion);
    const NS=opts.balls[0].clubs.length===6?6:3,ROWS=NS/3;PHYS.SECTION=360/NS; // clubs per ball: 3 (2.7.0) or 6 (r95 lab)
    const allN=v=>Array.from({length:NS},()=>v);
    const me=opts.me===1?1:0;
    const canvas=d.createElement("canvas");canvas.className="clubDraw3d";canvas.setAttribute("aria-hidden","true");
    canvas.style.cssText="position:absolute;inset:0;width:100%;height:100%;display:block";
    const renderer=new T.WebGLRenderer({canvas,antialias:P.antialias!==false,alpha:false,powerPreference:"high-performance"});
    renderer.setClearColor(0x04060a,1);renderer.setPixelRatio(P.pixelRatio);
    const scene=new T.Scene(),cam=new T.PerspectiveCamera(32,2,.1,140),own=[];
    const geo=g=>{own.push(g);return g;},mat=m=>{own.push(m);return m;},tex=t=>{own.push(t);return t;};
    const PAN=panels(T);

    // Crest atlas: three crests side by side, drawn once (the images are already decoded behind the loading screen).
    function atlas(images){
      const size=K.atlas,cv=d.createElement("canvas");cv.width=size*3;cv.height=size*ROWS;const cx=cv.getContext("2d");
      images.forEach((im,i)=>{if(!im)return;const iw=im.naturalWidth||im.width||120,ih=im.naturalHeight||im.height||144,h=size*.90,w=Math.min(size*.92,h*iw/ih),ox=(i%3)*size,oy=Math.floor(i/3)*size;
        cx.save();cx.shadowColor="rgba(0,0,0,.6)";cx.shadowBlur=size*.03;cx.drawImage(im,ox+(size-w)/2,oy+(size-h)/2,w,h);cx.restore();});
      const t=tex(new T.CanvasTexture(cv));t.minFilter=T.LinearMipmapLinearFilter;t.premultiplyAlpha=true;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;
    }
    const ballDefines={BLUR_TAPS:K.blurTaps,NSEC:NS,ROWS,CREST_S:NS===6?".40":".64"};if(K.gloss)ballDefines.GLOSS=1;if(K.detail)ballDefines.DETAIL=1;
    const sphere=geo(new T.SphereGeometry(1,K.seg[0],K.seg[1]));
    const balls=opts.balls.map((b,idx)=>{
      const kits=root.CareerModeKits17||null,v3=hex=>{const c=srgbColour(T,hex).convertSRGBToLinear();return new T.Vector3(c.r,c.g,c.b);};
      const looks=b.clubs.map(n=>{const lk=ballLook(kits,n,assets.info[n]);if(!lk.known){const cc=clubColours(T,assets.info[n]);lk.v={A:cc[0],N:cc[1]};}return lk;});
      const kv=(f)=>looks.map(f);
      const u={PC:{value:PAN.centres},kA:{value:kv(l=>l.v?l.v.A:v3(l.body))},kB:{value:kv(l=>v3(l.second))},kC:{value:kv(l=>v3(l.second2))},kT:{value:kv(l=>v3(l.trim))},
        kS:{value:kv(l=>v3(l.sleeves||l.body))},kN:{value:kv(l=>l.v?l.v.N:v3(l.pent))},kH:{value:kv(l=>v3(l.shorts||l.body))},
        kP:{value:kv(l=>new T.Vector4(PATTERN_ID[l.pattern]||0,FABRIC_ID[l.fabric]||0,l.n||0,(l.sleeves?1:0)+(l.shorts?2:0)))},lit:{value:allN(1)},foc:{value:allN(1)},atlas:{value:atlas(b.clubs.map(n=>assets.images[n]))},
        camP:{value:new T.Vector3()},rot:{value:new T.Matrix3()},blur:{value:0},pulse:{value:0},clat:{value:PAN.clat},spd:{value:0}};
      const m=mat(new T.ShaderMaterial({uniforms:u,vertexShader:BALL_VS,fragmentShader:BALL_FS,defines:ballDefines}));
      const mesh=new T.Mesh(sphere,m);mesh.rotation.order="YXZ";const tilt=new T.Group();tilt.add(mesh);scene.add(tilt);
      return {i:idx,clubs:b.clubs,u,mesh,tilt,pos:new T.Vector3(),r:1,f:idx?215:35,state:"idle",t:0,lit:allN(1),trapF:null,
        stop:null,pick:-1,accepted:false,plan:null,planF0:0,restA:0,queued:null,queuedPending:false,seamPrev:0,land:0,w:0,y:0,vy:0,sq:0,sqT:9,wp:idx*2.4,wr:0,ox:0,oz:0,oEx:0,oEz:0,yaw:0};
    });

    const pitchU={s0:{value:new T.Vector3()},s1:{value:new T.Vector3()},b0:{value:new T.Vector3()},b1:{value:new T.Vector3()},own:{value:me},glow0:{value:0},glow1:{value:0},g0:{value:new T.Vector3()},g1:{value:new T.Vector3()},d0:{value:new T.Vector2(0,1)},d1:{value:new T.Vector2(0,1)},camP:{value:new T.Vector3()}};
    const pitch=new T.Mesh(geo(new T.PlaneGeometry(70,70)),mat(new T.ShaderMaterial({uniforms:pitchU,vertexShader:"varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}",fragmentShader:"varying vec3 vW;\n"+PITCH_GLSL+"\nvoid main(){gl_FragColor=vec4(pow(pitchCol(vW),vec3(1./2.2)),1.);}"})));
    pitch.rotation.x=-Math.PI/2;scene.add(pitch);
    const stands=new T.Mesh(geo(new T.CylinderGeometry(36,36,11.2,48,1,true,Math.PI*.60,Math.PI*.80)),mat(new T.MeshBasicMaterial({map:tex(standsTexture(T)),side:T.BackSide})));
    stands.position.set(0,5.6,7);scene.add(stands);

    // Above Light: grass blades around each ball (one draw, tinted by the pitch's own colour function).
    let blades=null;const bladeMat=K.blades?mat(new T.ShaderMaterial({uniforms:pitchU,side:T.DoubleSide,vertexShader:"attribute vec3 root;attribute float tip;varying vec3 vC;\n"+PITCH_GLSL+"\nvoid main(){vec3 c=pitchCol(root)*(.80+.40*hash(root.xz*13.7));vC=c*mix(.50,1.30,tip);gl_Position=projectionMatrix*viewMatrix*vec4(position,1.);}",fragmentShader:"varying vec3 vC;void main(){gl_FragColor=vec4(pow(vC,vec3(1./2.2)),1.);}"})):null;
    function buildBlades(){
      if(blades){scene.remove(blades);blades.geometry.dispose();blades=null;}
      if(!K.blades)return;
      const per=K.blades,n=per*2,pos=new Float32Array(n*9),rt=new Float32Array(n*9),tip=new Float32Array(n*3),rs=seeded(7);let o=0;
      balls.forEach(b=>{for(let i=0;i<per;i++){const r=(.24+2.5*Math.pow(rs(),1.25))*b.r,a=rs()*6.283,x=b.pos.x+Math.cos(a)*r,z=b.pos.z+Math.sin(a)*r,yaw=rs()*3.1416,h=(.07+.11*rs())*b.r,w=.017*b.r,lx=(rs()-.5)*.09*b.r,lz=(rs()-.5)*.09*b.r,cx=Math.cos(yaw)*w,cz=Math.sin(yaw)*w;
        const Pp=[x-cx,0,z-cz,x+cx,0,z+cz,x+lx,h,z+lz],R=[x,0,z];for(let j=0;j<9;j++){pos[o*9+j]=Pp[j];rt[o*9+j]=R[j%3];}tip[o*3+2]=1;o++;}});
      const g=new T.BufferGeometry();g.setAttribute("position",new T.BufferAttribute(pos,3));g.setAttribute("root",new T.BufferAttribute(rt,3));g.setAttribute("tip",new T.BufferAttribute(tip,1));
      blades=new T.Mesh(g,bladeMat);blades.frustumCulled=false;blades.visible=!detailOff.has("blades");scene.add(blades);
    }
    let bokeh=null,confetti=null;
    if(K.bokeh){
      const n=70,pp=new Float32Array(n*3),rs=seeded(5);for(let i=0;i<n;i++){const a=Math.PI*(.64+.72*rs());pp[i*3]=Math.cos(a)*-35;pp[i*3+1]=1.2+rs()*4.4;pp[i*3+2]=7-Math.abs(Math.sin(a))*35;}
      const g=geo(new T.BufferGeometry());g.setAttribute("position",new T.BufferAttribute(pp,3));
      const dot=d.createElement("canvas");dot.width=dot.height=64;const dx=dot.getContext("2d"),rg=dx.createRadialGradient(32,32,0,32,32,32);rg.addColorStop(0,"rgba(255,244,214,1)");rg.addColorStop(.3,"rgba(255,220,150,.45)");rg.addColorStop(1,"rgba(255,200,90,0)");dx.fillStyle=rg;dx.fillRect(0,0,64,64);
      const dt=tex(new T.CanvasTexture(dot));dt.colorSpace=T.SRGBColorSpace;
      bokeh=new T.Points(g,mat(new T.PointsMaterial({map:dt,size:.9,transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:.5})));scene.add(bokeh);
    }
    if(K.confetti){
      const m=160,cg=geo(new T.BufferGeometry());cg.setAttribute("position",new T.BufferAttribute(new Float32Array(m*3),3));cg.setAttribute("color",new T.BufferAttribute(new Float32Array(m*3),3));
      confetti=new T.Points(cg,mat(new T.PointsMaterial({size:.10,vertexColors:true,transparent:true,depthWrite:false})));confetti.visible=false;confetti.frustumCulled=false;confetti.userData={v:new Float32Array(m*3),t:9,n:m};scene.add(confetti);
    }
    function burst(b){
      if(!confetti||reduced||detailOff.has("confetti"))return;const cd=confetti.userData,p=confetti.geometry.attributes.position.array,c=confetti.geometry.attributes.color.array,info=assets.info[b.clubs[b.pick]];
      const cols=[new T.Color(info.primary||"#d8b55a"),new T.Color(info.secondary||"#101010"),new T.Color("#f3dc97")];
      for(let i=0;i<cd.n;i++){const a=Math.random()*6.283,s=1.5+Math.random()*3.2;p[i*3]=b.pos.x;p[i*3+1]=b.pos.y+.4;p[i*3+2]=b.pos.z;cd.v[i*3]=Math.cos(a)*s;cd.v[i*3+1]=3+Math.random()*4.5;cd.v[i*3+2]=Math.sin(a)*s*.6;const k=cols[i%3];c[i*3]=k.r;c[i*3+1]=k.g;c[i*3+2]=k.b;}
      confetti.geometry.attributes.color.needsUpdate=true;cd.t=0;confetti.visible=true;
    }

    // ---- sound: synthesised cues only (no samples, no licences); off unless opts.sound() says on. Music keeps playing. ----
    let ac=null;
    const soundOn=()=>{try{return typeof opts.sound==="function"?Boolean(opts.sound()):Boolean(opts.sound);}catch(_error){return false;}};
    function audio(){if(!soundOn())return null;if(!ac){const AC=root.AudioContext||root.webkitAudioContext;if(!AC)return null;try{ac=new AC();}catch(_error){return null;}}if(ac.state==="suspended")ac.resume().catch(()=>{});return ac;}
    function tone(f0,f1,dur,vol,type){const a=audio();if(!a||d.visibilityState==="hidden")return;const o=a.createOscillator(),g=a.createGain(),t=a.currentTime;o.type=type||"sine";o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+dur+.02);}
    function hiss(dur,vol,freq){const a=audio();if(!a||d.visibilityState==="hidden")return;const n=Math.floor(a.sampleRate*dur),buf=a.createBuffer(1,n,a.sampleRate),ch=buf.getChannelData(0);for(let i=0;i<n;i++)ch[i]=(Math.random()*2-1)*Math.pow(1-i/n,1.5);const s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();s.buffer=buf;f.type="bandpass";f.frequency.value=freq;f.Q.value=.8;g.gain.value=vol;s.connect(f);f.connect(g);g.connect(a.destination);s.start();}
    const cue={tick:v=>tone(900+700*v,600+400*v,.035,.04+.06*v,"triangle"),kick:()=>{tone(150,48,.14,.5);hiss(.12,.22,1800);},bounce:v=>{tone(120,50,.09,.12+.25*v);hiss(.10,.08,900);},
      grab:()=>{tone(105,42,.18,.38);hiss(.30,.20,650);},land:()=>{[523,659,784,1046].forEach((f,i)=>root.setTimeout(()=>tone(f,f,.5,.12,"triangle"),i*85));hiss(1.6,.10,1200);},lit:i=>tone(392*Math.pow(1.26,i),392*Math.pow(1.26,i),.28,.07,"sine")};

    // ---- layout: computers Daniel left and Nik right (opts.balls order); a phone upright shows the own ball big in front ----
    const size={w:0,h:0};let layoutKey="",wide=true;
    function layout(){
      // A host still hidden (the scene is built behind the league reveal) is laid out at the size it is expected to have.
      const hint=typeof opts.size==="function"?opts.size():null,w=host.clientWidth||Math.round(hint&&hint.w||0),h=host.clientHeight||Math.round(hint&&hint.h||0);if(!w||!h)return;size.w=w;size.h=h;
      renderer.setSize(w,h,false);cam.aspect=w/h;const a=w/h;wide=a>=1.5; // a phone upright (or a short phone stage) keeps the own ball big in front
      if(wide){cam.fov=Math.min(40,Math.max(22,2*Math.atan(.60/a)*180/Math.PI));cam.position.set(0,2.05,8.9);cam.lookAt(0,1.12,0);const sx=Math.min(2.9,1.5+a*.5);balls[0].pos.set(-sx,1,0);balls[1].pos.set(sx,1,0);balls[0].r=balls[1].r=1;}
      else{cam.fov=44;cam.position.set(0,3.3,8.6);cam.lookAt(0,1.25,-3);const o=balls[me],r=balls[1-me];o.pos.set(0,1,2.2);o.r=1;r.pos.set(me?-1.3:1.3,.7,-9);r.r=.7;}
      cam.updateProjectionMatrix();pitchU.camP.value.copy(cam.position);
      balls.forEach((b,i)=>{const dx=cam.position.x-b.pos.x,dz=cam.position.z-b.pos.z,l=Math.sqrt(dx*dx+dz*dz);b.yaw=Math.atan2(dx,dz);pitchU["d"+i].value.set(dx/l,dz/l);pitchU["s"+i].value.set(b.pos.x,b.r,b.pos.z);});
      const key=(wide?"w":"t")+me+balls[0].pos.x.toFixed(2);if(key!==layoutKey){layoutKey=key;buildBlades();}
    }

    // ---- motion ----
    const listeners=new Set();
    function emit(type,b){for(const fn of listeners)try{fn({type,ball:b.i,state:b.state,stop:b.stop,section:b.pick});}catch(_error){}}
    function setBallState(b,state){if(b.state===state)return;b.state=state;b.t=0;emit("state",b);}
    function lightAll(b){b.lit=allN(1);}
    // Plans the slow-down from the ball as it is now, to rest on poseOf(stop), with at least `min` degrees to travel.
    function plan(b,min){
      const target=poseOf(b.stop),w=Math.max(b.w,b.state==="spin"||b.state==="ready"?PHYS.W_FAST*.8:PHYS.AWAIT_W);
      // (w is kept fast enough that the grass stops it within REPLAN_DUR seconds.)
      const travel=travelTo(b.f,target,min);b.restA=b.f+travel;b.planF0=b.f;b.plan=friction(Math.max(w,speedFor(travel+PHYS.A0,PHYS.REPLAN_DUR)),travel+PHYS.A0);b.pick=sectionOf(b.stop);
      setBallState(b,"stopping");b.t=0; // a replan of a ball already stopping starts its own clock (no jump)
    }
    function startStop(b){
      if(b.state!=="spin")return;
      b.queued=null;b.queuedPending=false; // the trajectory starting now is the ball's one stop: nothing stays queued behind it
      if(b.own){
        // The tap: the travel is the one the stop came from (lead D0 plus the grass), corrected onto the rest pose.
        const target=poseOf(b.stop),guess=PHYS.D0+angleDiff(b.tapRest,mod360(b.f+PHYS.D0));
        const travel=guess+angleDiff(target,mod360(b.f+guess));b.restA=b.f+travel;b.planF0=b.f;b.plan=friction(Math.max(b.w,1),travel+PHYS.A0);b.pick=sectionOf(b.stop);setBallState(b,"stopping");
      }else plan(b,PHYS.RIVAL_MIN);
      if(b.i===me)cue.grab();
    }
    // r95 lab: roll from where the ball is now to rest on the absolute angle `abs` (or on poseOf of its stop once stored).
    function rollTo(b,abs,stored,kicked){
      let travel=abs-b.f;if(stored)travel+=angleDiff(poseOf(b.stop),mod360(abs));while(travel<40)travel+=360;
      const w0=kicked?Math.min(PHYS.W_FAST,speedFor(travel+PHYS.A0,PHYS.POW_DUR)):Math.max(b.w,1);
      b.restA=b.f+travel;b.planF0=b.f;b.plan=friction(w0,travel+PHYS.A0);setBallState(b,"stopping");b.t=0;
    }
    function landed(b){
      b.f=b.restA;b.ox=b.oz=0;setBallState(b,"landed");b.land=0;burst(b);if(b.i===me||balls[me].state==="landed")cue.land();
      emit("landed",b);
    }
    // Shows a ball at rest on a stored stop at once (reload, late join, Reduce Motion).
    function placeAtRest(b){b.pick=sectionOf(b.stop);b.restA=poseOf(b.stop);b.f=b.restA;b.w=0;b.y=0;b.vy=0;lightAll(b);b.accepted=true;b.plan=null;setBallState(b,"landed");b.land=9;b.u.foc.value=allN(0).map((_v,j)=>j===b.pick?1:.22);emit("landed",b);}
    const RAD=Math.PI/180,qT=new T.Quaternion(),m4=new T.Matrix4();
    function hop(b,dt){if(b.y>0||b.vy>0){b.vy-=PHYS.GRAV*dt;b.y+=b.vy*dt;if(b.y<=0){b.y=0;if(b.vy<-1.4){const hit=-b.vy;b.sq=Math.min(.11,hit*.013);b.sqT=0;b.vy=hit*.40;if(b.i===me)cue.bounce(Math.min(1,hit/8));}else b.vy=0;}}}
    function step(b,dt){
      b.t+=dt;let w=0;
      if(b.state==="idle"){w=0;}
      else if(b.state==="rest"){if(b.t>PHYS.REST0){lightAll(b);b.showSeg=0;b.showA=b.f;b.showB=showTarget(b.f);b.showT=0;b.showCued=false;setBallState(b,"show");}}
      else if(b.state==="show"){
        // The slow look (Nik 2026-11-16): all three crests are fully drawn from the first frame (their images were decoded
        // behind the loading screen), and the ball turns each one in turn to face the camera and holds it there (SHOW
        // seconds) so it can be read; after the third it rolls off and is kicked. Before, the crests bloomed in one by one
        // during a single continuous turn, so a third could pass the camera blank or half drawn.
        lightAll(b);b.showT+=dt;
        if(b.showSeg<NS){
          const span=b.showB-b.showA,dur=Math.max(.45,PHYS.SHOW_MOVE*span/120),k=Math.min(1,b.showT/dur),hold=NS===6?PHYS.SHOW_N6:PHYS.SHOW;
          b.f=b.showA+span*k*k*(3-2*k);w=k<1?span*6*k*(1-k)/dur:0;
          if(k>=1&&!b.showCued){b.showCued=true;if(b.i===me)cue.lit(sectionOf(mod360(b.showB)));}
          if(b.showT>=dur+hold){b.showSeg+=1;b.showA=b.showB;b.showB+=PHYS.SECTION;b.showT=0;b.showCued=false;}
        }else if(PHYS.MODE===2){setBallState(b,"ready");} // power roll: the ball waits for its kick
        else{
          const k=Math.min(1,b.showT/PHYS.SHOW_OUT);w=PHYS.W_SLOW*k*k;b.f+=w*dt;
          if(k>=1){setBallState(b,"kick");b.vy=7.3;b.y=.001;if(b.i===me)cue.kick();}
        }
      }else if(b.state==="kick"){
        // Spun hard: the ball hops off the turf, lands with weight, bounces once more and digs in.
        const k2=Math.min(1,b.t/PHYS.KICK),e2=k2*k2*(3-2*k2);w=PHYS.W_SLOW+(PHYS.W_FAST-PHYS.W_SLOW)*e2;b.f+=w*dt;lightAll(b);
        hop(b,dt);
        if(k2>=1&&b.y===0&&b.vy===0)setBallState(b,"spin");
      }else if(b.state==="spin"){
        w=(PHYS.W_FAST-36*(1-Math.exp(-b.t/5)))*(1+PHYS.RHY*Math.sin(6.2832*b.t/PHYS.RHY_T));b.f+=w*dt;
        if(b.queued!==null&&b.t>.6){b.stop=b.queued;b.accepted=b.accepted||!b.queuedPending;b.queued=null;b.queuedPending=false;b.w=w;startStop(b);}
      }else if(b.state==="stopping"){
        const p=b.plan,tt=Math.min(b.t,p.dur);b.f=b.planF0+p.at(tt);w=p.speed(tt);hop(b,dt);
        // The ball never rests on a club Firebase does not hold: short of the last third it waits, rolling, for the accept.
        if(!b.accepted&&b.restA+PHYS.A0-b.f<PHYS.AWAIT_LEAD){setBallState(b,"await");b.w=Math.max(w,PHYS.AWAIT_W);w=b.w;}
        else if(b.t>=p.dur){setBallState(b,"settle");b.oEx=b.ox;b.oEz=b.oz;w=0;}
      }else if(b.state==="await"){
        w=b.w;b.f+=w*dt;
        if(b.accepted){b.w=w;plan(b,PHYS.REPLAN_MIN);}
      }else if(b.state==="settle"){
        // The spin is gone: the bent grass pushes the ball back a few degrees, and it rolls back into its seat and rocks there.
        const o1=6.283/.58,e1=Math.exp(-b.t/.30);b.f=b.restA+PHYS.A0*e1*(Math.cos(o1*b.t)+Math.sin(o1*b.t)/(o1*.30));
        const o2=6.283/.70,e2=Math.exp(-b.t/.34),kk=e2*(Math.cos(o2*b.t)+Math.sin(o2*b.t)/(o2*.34));b.ox=b.oEx*kk;b.oz=b.oEz*kk;
        if(b.t>PHYS.SETTLE)landed(b);
      }else if(b.state==="ready"){w=0;if(b.queued!==null){b.stop=b.queued;b.accepted=b.accepted||!b.queuedPending;b.queued=null;b.queuedPending=false;b.w=PHYS.W_FAST*.8;plan(b,PHYS.RIVAL_MIN);}}
      else if(b.state==="landed"){b.land+=dt;const fo=b.u.foc.value;for(let j=0;j<NS;j++)fo[j]+=((j===b.pick?1:.22)-fo[j])*Math.min(1,dt*3.5);}
      b.w=w;for(let i=0;i<NS;i++)b.u.lit.value[i]=b.lit[i];
      const sp=Math.min(1,w/PHYS.W_FAST),fast=["kick","spin","stopping","await"].includes(b.state);
      b.u.blur.value=PHYS.BLUR?sp*.034:0;b.u.spd.value=PHYS.BLUR?sp:0;b.u.pulse.value=b.state==="landed"&&b.land<9?.5+.5*Math.sin(b.land*5):0;
      // The pattern's axis sits a few degrees off the spin axis (as on any ball spun by a boot), so the panels wobble once per
      // turn; the ball wanders a little inside the chalk ring and its lean always matches how far it has rolled.
      if(fast&&!reduced){const wrT=b.state==="stopping"?.045+.065*(1-sp):.045*sp;b.wr+=(wrT-b.wr)*Math.min(1,dt*3);b.wp+=dt*(.45+2.3*sp);b.ox=b.wr*Math.cos(b.wp)*b.r;b.oz=b.wr*Math.sin(b.wp)*b.r;}
      b.tilt.rotation.z=-b.ox/b.r;b.tilt.rotation.x=b.oz/b.r;b.mesh.rotation.x=PHYS.BODY_TILT*RAD;
      b.sqT+=dt;const sq=b.sqT<.13?b.sq*Math.sin(b.sqT/.13*Math.PI):0;
      b.tilt.scale.set(b.r*(1+sq*.5),b.r*(1-sq),b.r*(1+sq*.5));b.tilt.position.set(b.pos.x+b.ox,b.r*(1-sq)+b.y*b.r,b.pos.z+b.oz);
      b.mesh.rotation.y=b.yaw-b.f*RAD;
      b.tilt.updateMatrix();b.mesh.updateMatrix();qT.copy(b.tilt.quaternion).multiply(b.mesh.quaternion);m4.makeRotationFromQuaternion(qT);b.u.rot.value.setFromMatrix4(m4);
      pitchU["b"+b.i].value.set(b.pos.x+b.ox,b.y,b.pos.z+b.oz);
      const seamNow=Math.floor(b.f/PHYS.SECTION);if(seamNow!==b.seamPrev){b.seamPrev=seamNow;if(b.i===me&&sp>.02&&b.state!=="show")cue.tick(sp);}
    }
    const lin=hex=>{const c=srgbColour(T,hex);c.convertSRGBToLinear();return new T.Vector3(c.r,c.g,c.b);};
    function paint(dt){
      balls.forEach(b=>{step(b,dt);b.u.camP.value.copy(cam.position);});
      balls.forEach((b,i)=>{const on=b.state==="landed",g=pitchU["glow"+i];g.value+=((on?1:0)-g.value)*Math.min(1,dt*3);if(on&&!b.glowSet){b.glowSet=true;const pc=assets.info[b.clubs[b.pick]].primary||"#d8b55a";pitchU["g"+i].value.copy(lin(/^#f[0-9a-f]{5}$/i.test(pc)?"#cfd8e6":pc));}});
      if(confetti&&confetti.visible){const cd=confetti.userData,p=confetti.geometry.attributes.position.array;cd.t+=dt;for(let i=0;i<cd.n;i++){cd.v[i*3+1]-=9*dt;p[i*3]+=cd.v[i*3]*dt;p[i*3+1]=Math.max(.03,p[i*3+1]+cd.v[i*3+1]*dt);p[i*3+2]+=cd.v[i*3+2]*dt;}confetti.geometry.attributes.position.needsUpdate=true;confetti.material.opacity=Math.max(0,1-cd.t/2.6);if(cd.t>2.6)confetti.visible=false;}
      if(bokeh&&bokeh.visible&&!reduced)bokeh.material.opacity=.42+.10*Math.sin(clock()/700); // still under Reduce Motion
      renderer.render(scene,cam);
    }

    // ---- quality: the shared governor; heavy parts a slow device gives up, smallest loss first (Auto only) ----
    const GFX=root.CareerModeGfxTier;
    const LADDER=[...(K.confetti?["confetti"]:[]),...(K.bokeh?["bokeh"]:[]),...(K.blades?["blades"]:[])];
    const detailOff=new Set();
    const heavy=stepAt=>{const at=Math.max(0,Math.min(LADDER.length,Math.round(Number(stepAt))||0));detailOff.clear();LADDER.slice(0,at).forEach(x=>detailOff.add(x));
      if(blades)blades.visible=!detailOff.has("blades");if(bokeh)bokeh.visible=!detailOff.has("bokeh");if(confetti&&detailOff.has("confetti"))confetti.visible=false;};
    const timed=()=>paint(0);
    const gov=GFX&&typeof GFX.governor==="function"?GFX.governor(renderer,{key:"club-draw",draw:timed,beats:true,detail:LADDER.length?{steps:LADDER.length,apply:heavy}:undefined,onChange:()=>{layoutKey="";layout();}}):null;
    const fps=GFX&&typeof GFX.overlay==="function"?GFX.overlay(()=>({calls:renderer.info.render.calls,tris:renderer.info.render.triangles,extra:`programs ${renderer.info.programs?renderer.info.programs.length:0}`})):null;
    let held=false;
    function holdBeat(){const busy=balls.some(b=>["kick","stopping","await","settle"].includes(b.state));if(busy!==held){held=busy;gov?.hold(busy);}}

    // ---- frame loop: draws only while the canvas is in the page and the tab is visible ----
    function clock(){return root.performance?.now?.()??Date.now();}
    let raf=0,last=clock(),disposed=false,dirty=true;
    const tick=now=>{
      raf=0;if(disposed)return;
      if(!canvas.isConnected){free();return;}
      const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;
      if(d.visibilityState!=="hidden"&&host.clientWidth>0){gov?.frame(now);if(dirty){dirty=false;layout();}paint(dt);holdBeat();}
      raf=root.requestAnimationFrame(tick);
    };
    const relayout=()=>{dirty=true;};
    const ro=typeof root.ResizeObserver==="function"?new root.ResizeObserver(relayout):null;
    function free(){
      if(disposed)return;disposed=true;if(raf)root.cancelAnimationFrame(raf);ro?.disconnect();root.removeEventListener?.("resize",relayout);
      gov?.end();fps?.stop();
      if(blades){blades.geometry.dispose();}
      for(const v of own)try{v.dispose&&v.dispose();}catch(_error){}
      try{ac&&ac.close&&ac.close();}catch(_error){}
      renderer.dispose();try{renderer.forceContextLoss();}catch(_error){}
      canvas.remove();listeners.clear();
    }
    if(getComputedStyleSafe(host)==="static")host.style.position="relative";
    host.prepend(canvas);layout();
    ro?.observe(host);root.addEventListener?.("resize",relayout);

    const ballOf=i=>{const b=balls[i===1?1:0];return b;};
    const api={
      contractVersion:1,
      level:K.level,
      reduced,
      // Both balls begin the draw (the slow look, then the kick). Under Reduce Motion they sit still, crests lit.
      start(){balls.forEach((b,i)=>{if(b.state!=="idle")return;if(reduced){lightAll(b);b.f=60;b.state="spin-still";emit("state",b);return;}b.t=-.35*i;setBallState(b,"rest");b.t=-.35*i;});},
      state(i){return ballOf(i).state;},
      // STOP may be pressed while the own ball spins at full speed (or sits still under Reduce Motion).
      canStop(i){const b=ballOf(i);return b.stop===null&&b.queued===null&&b.trapF===null&&(b.state==="spin"||b.state==="spin-still"||b.state==="ready");},
      // r95 lab, MODE 1. trap(i): STOP traps the ball (it starts slowing at once toward the face in front + D0); touch(i, err01,
      // rand01) within NEEDLE_T seconds: err01 is how far the needle was from the gold centre (0 clean .. 1 the edge or no
      // touch); the stored integer is that aim plus a slip of up to +-(J0 + err01*JT). Returns the stop.
      trap(i){const b=ballOf(i);if(!api.canStop(i)||b.state!=="spin")return false;b.trapF=b.f;b.own=true;b.accepted=false;
        rollTo(b,b.trapF+PHYS.D0);if(b.i===me)cue.grab();return true;},
      touch(i,err01,rand01){const b=ballOf(i);if(b.trapF===null||b.stop!==null)return null;const e=Math.max(0,Math.min(1,Number(err01)||0)),r=Number.isFinite(rand01)?rand01:secureRandom();
        const abs=b.trapF+PHYS.D0+(2*r-1)*(PHYS.J0+e*PHYS.JT);b.stop=Math.floor(mod360(abs))%360;b.pick=sectionOf(b.stop);rollTo(b,abs,true);return b.stop;},
      // r95 lab, MODE 2. strike(i, power01, rand01): the ball, still after the slow look, is kicked POW_MIN + power*POW_RANGE
      // degrees on, plus a grass slip of +-J. Returns the stop.
      strike(i,power01,rand01){const b=ballOf(i);if(!api.canStop(i)||b.state!=="ready")return null;const pw=Math.max(0,Math.min(1,Number(power01)||0)),r=Number.isFinite(rand01)?rand01:secureRandom();
        const abs=b.f+PHYS.POW_MIN+pw*PHYS.POW_RANGE+(2*r-1)*PHYS.J;b.stop=Math.floor(mod360(abs))%360;b.pick=sectionOf(b.stop);b.own=true;b.accepted=false;
        b.w=0;b.vy=4.6+3*pw;b.y=.001;rollTo(b,abs,true,true);if(b.i===me)cue.kick();return b.stop;},
      // r95 lab: both balls back to the start (a new round on the test page).
      restart(){balls.forEach((b,i)=>{Object.assign(b,{state:"idle",t:0,stop:null,pick:-1,accepted:false,plan:null,queued:null,queuedPending:false,own:false,trapF:null,lit:allN(1),w:0,y:0,vy:0,sq:0,land:0,glowSet:false,f:mod360(b.f)});
        b.u.foc.value=allN(1);pitchU["glow"+i].value=0;});if(confetti)confetti.visible=false;api.start();}, // a queued stored stop is already this ball's stop
      // The tap. Returns the stored integer (0..359), computed once from the face in front of the manager now. The ball starts
      // slowing at once (the tap is felt) but rests only after accept(i). Never call it twice for one manager.
      tap(i,rand01){
        const b=ballOf(i);if(!api.canStop(i))return null;
        const r=Number.isFinite(rand01)?rand01:secureRandom();
        if(b.state==="spin-still"){b.stop=Math.floor(r*360)%360;b.own=true;b.accepted=false;b.pick=sectionOf(b.stop);b.state="still-pending";emit("state",b);return b.stop;}
        b.tapRest=mod360(b.f+PHYS.D0+(2*r-1)*PHYS.J);b.stop=Math.floor(b.tapRest)%360;b.own=true;b.accepted=false;startStop(b);
        return b.stop;
      },
      // Firebase holds this manager's stop: the ball may come to rest. A different stored stop (another tab won) re-aims.
      accept(i,storedStop){
        const b=ballOf(i);
        // Still before full speed with a stop queued: Firebase's stop is the one it will slow toward, already accepted.
        if(b.queued!==null){if(sceneValidStop(storedStop))b.queued=storedStop;b.queuedPending=false;b.accepted=true;return;}
        if(sceneValidStop(storedStop)&&storedStop!==b.stop){b.stop=storedStop;b.pick=sectionOf(storedStop);if(["stopping","await"].includes(b.state)){b.accepted=true;b.w=Math.max(b.w,PHYS.AWAIT_W);plan(b,PHYS.REPLAN_MIN);return;}
          // Already settling or at rest on another third: the stored stop wins and the ball is shown at rest on it (both
          // phones must end on the same picture). Firebase never changes a stored stop, so this is a safety net only.
          if(b.state==="settle"||b.state==="landed"){b.glowSet=false;placeAtRest(b);return;}}
        b.accepted=true;
        if(b.state==="still-pending")placeAtRest(b);
      },
      // A stop read from the ledger (the rival's, or this manager's after a reload). immediate: show it at rest now.
      // pending: this manager's own stop saved on the phone but not yet held by Firebase (a reload after the tap): the ball
      // slows toward it but keeps rolling until accept(i, stored), exactly as after a tap.
      restOn(i,stop,o){
        const b=ballOf(i),pending=Boolean(o&&o.pending);if(!sceneValidStop(stop))return false;
        if(b.state==="landed"&&b.stop===stop)return true;
        if(pending&&b.stop===stop&&b.own)return true; // asked again on every render: nothing changes, nothing is emitted
        if(pending&&(reduced||b.state==="idle"||b.state==="spin-still"||b.state==="still-pending")){b.stop=stop;b.own=true;b.accepted=false;b.pick=sectionOf(stop);b.lit=[1,1,1];b.state="still-pending";emit("state",b);return true;}
        if(!pending&&(o&&o.immediate||reduced||b.state==="idle"||b.state==="spin-still"||b.state==="still-pending")){b.stop=stop;placeAtRest(b);return true;}
        if(b.state==="spin"){b.stop=stop;b.accepted=!pending;b.own=false;startStop(b);return true;}
        if(["stopping","await","settle","landed"].includes(b.state)){if(!pending)api.accept(i,stop);return true;} // landed on another stop: accept() rests it on the stored one
        b.queued=stop;b.queuedPending=pending;return true; // rest, show or kick: it slows once it reaches full speed
      },
      on(fn){listeners.add(fn);return ()=>listeners.delete(fn);},
      // Where a ball is on screen (CSS px in the host), for the name tags the presentation draws.
      anchor(i){const b=ballOf(i),v=new T.Vector3(b.pos.x,b.pos.y+b.r*1.30,b.pos.z).project(cam);return {x:(v.x*.5+.5)*size.w,y:(-v.y*.5+.5)*size.h,wide};},
      // Behind the loading screen: every shader compiled and every texture uploaded, then a few timed frames pick the level.
      async warm(){
        try{if(typeof renderer.compileAsync==="function")await renderer.compileAsync(scene,cam);else renderer.compile(scene,cam);}catch(_error){}
        if(disposed)return;
        if(confetti){confetti.visible=true;paint(0);confetti.visible=false;}
        paint(0);
        if(GFX&&typeof GFX.calibrate==="function"){try{await GFX.calibrate(renderer,timed,{frames:5});}catch(_error){}gov?.resize();}
        if(!disposed){dirty=true;paint(0);}
      },
      // Test page and proofs: step the clock by hand (seconds), no frame loop needed.
      advance(seconds){let n=Math.round(seconds*60);while(n-->0)balls.forEach(b=>step(b,1/60));paint(0);},
      probe(){return {level:K.level,draws:renderer.info.render.calls,programs:renderer.info.programs?renderer.info.programs.length:0,triangles:renderer.info.render.triangles,pixelRatio:renderer.getPixelRatio(),frameMs:gov?gov.frameMs():null,
        balls:balls.map(b=>({state:b.state,f:+b.f.toFixed(2),stop:b.stop,section:b.pick,accepted:b.accepted})),detailOff:[...detailOff]};},
      dispose:free,
      get alive(){return !disposed;}
    };
    raf=root.requestAnimationFrame(tick);
    return api;
  }
  function getComputedStyleSafe(el){try{return root.getComputedStyle(el).position;}catch(_error){return "";}}

  // mount(host, opts): the scene inside `host` (a positioned box), resolved once every crest image is decoded, every shader
  // compiled and the first frame drawn (the Reus Gate: the screen opens only when the scene is ready). null where it cannot run.
  // opts = {balls:[{clubs:[3 names]}, {clubs:[3 names]}] (computers: left, right), me: 0|1 (the own ball),
  //         clubInfo(name) -> {primary, secondary, crest (URL or image)} (default: js/visualIdentity.js), sound: () => boolean,
  //         reducedMotion (default: the system setting), signal (AbortSignal), size () -> {w, h} (the size to lay out at while
  //         the host is still hidden; the scene re-lays itself out once it shows)}
  async function mountScene(host,opts){
    const o=opts||{},off=()=>Boolean(o.signal&&o.signal.aborted);
    if(!host||!Array.isArray(o.balls)||o.balls.length!==2||o.balls.some(b=>!b||!Array.isArray(b.clubs)||(b.clubs.length!==3&&b.clubs.length!==6)||b.clubs.length!==o.balls[0].clubs.length)||!hasWebgl()||off())return null;
    let opened=false;
    try{
      const P=await quality();if(off())return null;
      try{root.CareerModeGfxTier?.sceneOpening?.("club-draw");}catch(_error){}
      const names=[...new Set(o.balls.flatMap(b=>b.clubs))],info={},images={};
      const infoOf=typeof o.clubInfo==="function"?o.clubInfo:defaultClubInfo;
      const [T]=await Promise.all([cdLoadEngine(),...names.map(async n=>{let v=null;try{v=await infoOf(n);}catch(_error){}info[n]=v||await defaultClubInfo(n);images[n]=await imageOf(info[n].crest);if(!images[n])images[n]=await imageOf(identityInfo(n).crest);})]);
      if(!T||off()||!host.isConnected)return null;
      const api=build(T,host,o,P,{info,images});
      await api.warm();
      if(off()){api.dispose();return null;}
      opened=true;mountScene.last=api;
      return api;
    }catch(error){
      try{root.console?.warn?.("Club draw 3D scene unavailable.",error);}catch(_error){}
      return null;
    }finally{if(!opened){try{root.CareerModeGfxTier?.sceneOpened?.();}catch(_error){}}}
  }
  // Starts the engine download early (the league reveal), so the Club screen does not wait for it.
  function preload(){return cdLoadEngine().then(()=>true,()=>false);}

  const api={contractVersion:1,feature:"cms-club-draw-3d",enginePath:ENGINE_PATH,physics:PHYS_DEFAULT,tune,
    sectionOf,drawStop,poseOf,showTarget,ballLook,looksApart,BALL_VARIANT,travelTo,friction,speedFor,angleDiff,mod360,knobs,mount:mountScene,preload};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.CareerModeClubDraw3d=api;
})(typeof globalThis!=="undefined"?globalThis:this);
