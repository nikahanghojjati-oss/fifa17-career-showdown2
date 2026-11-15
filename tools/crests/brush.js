/* R94-01 crest drawing kit (dev tool, never loaded by the game): turns a charge's skeleton (spine points with widths) into
   smooth filled outlines, so every animal and object is drawn with one consistent hand. tools/crests/build.js writes the
   finished path strings into js/visualIdentity.js; the game only ever sees plain SVG paths. */
(function(root){
  "use strict";
  const r1=v=>Math.round(v*10)/10;
  // Catmull-Rom through [x,y,w] points (w = width there), n samples per segment.
  function spline(pts,n){
    const out=[];if(pts.length<2)return pts.slice();
    const P=[pts[0]].concat(pts,[pts[pts.length-1]]);
    for(let i=1;i<P.length-2;i++){
      const p0=P[i-1],p1=P[i],p2=P[i+1],p3=P[i+2];
      for(let s=0;s<n;s++){const t=s/n,t2=t*t,t3=t2*t;
        out.push([0,1,2].map(k=>.5*((2*p1[k])+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t3)));}
    }
    out.push(pts[pts.length-1].slice());return out;
  }
  // A brush stroke: a closed outline around the spine; caps "round" or "point" at start/end.
  function stroke(pts,opt){
    opt=opt||{};const n=opt.n||10,S=spline(pts,n),L=[],R=[];
    for(let i=0;i<S.length;i++){
      const a=S[Math.max(0,i-1)],b=S[Math.min(S.length-1,i+1)];let dx=b[0]-a[0],dy=b[1]-a[1];const d=Math.hypot(dx,dy)||1;dx/=d;dy/=d;
      const w=Math.max(0,S[i][2])/2;L.push([S[i][0]-dy*w,S[i][1]+dx*w]);R.push([S[i][0]+dy*w,S[i][1]-dx*w]);
    }
    const e=S[S.length-1],e0=S[S.length-2],s0=S[0],s1=S[1];
    const endDir=[e[0]-e0[0],e[1]-e0[1]],sd=Math.hypot(...endDir)||1,startDir=[s0[0]-s1[0],s0[1]-s1[1]],ss=Math.hypot(...startDir)||1;
    const poly=L.slice();
    // end cap (from L side to R side around the tip)
    if((opt.end||"round")==="round"&&e[2]>0){const a0=Math.atan2(endDir[1],endDir[0]);for(let k=1;k<8;k++){const a=a0+Math.PI/2-k*Math.PI/8;poly.push([e[0]+Math.cos(a)*e[2]/2,e[1]+Math.sin(a)*e[2]/2]);}}
    for(let i=R.length-1;i>=0;i--)poly.push(R[i]);
    if((opt.start||"round")==="round"&&s0[2]>0){const a0=Math.atan2(startDir[1],startDir[0]);for(let k=1;k<8;k++){const a=a0+Math.PI/2-k*Math.PI/8;poly.push([s0[0]+Math.cos(a)*s0[2]/2,s0[1]+Math.sin(a)*s0[2]/2]);}}
    return orient(poly);
  }
  // Closed smooth blob through points (Catmull-Rom, closed).
  function blob(pts,n){
    n=n||8;const P=pts,out=[],m=P.length;
    for(let i=0;i<m;i++){const p0=P[(i-1+m)%m],p1=P[i],p2=P[(i+1)%m],p3=P[(i+2)%m];
      for(let s=0;s<n;s++){const t=s/n,t2=t*t,t3=t2*t;out.push([0,1].map(k=>.5*((2*p1[k])+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t3)));}}
    return orient(out);
  }
  // Polygon with straight edges (for crisp objects: hammers, towers, crosses).
  function poly(pts){return orient(pts.map(p=>[p[0],p[1]]));}
  function area(p){let a=0;for(let i=0;i<p.length;i++){const q=p[(i+1)%p.length];a+=p[i][0]*q[1]-q[0]*p[i][1];}return a/2;}
  function orient(p,ccw){const a=area(p);return (ccw?a<0:a>0)?p:p.slice().reverse();}
  function hole(p){return orient(p,true);}
  // Drop points that are closer than tol to the previous one (keeps files small).
  function thin(p,tol){tol=tol||.35;const o=[p[0]];for(let i=1;i<p.length;i++){const q=o[o.length-1];if(Math.hypot(p[i][0]-q[0],p[i][1]-q[1])>=tol)o.push(p[i]);}return o;}
  // Ramer-Douglas-Peucker: drops points that sit within eps of the straight line between their neighbours.
  function rdp(p,eps){
    if(p.length<3)return p;
    const seg=(q,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy;if(!l)return Math.hypot(q[0]-a[0],q[1]-a[1]);let t=((q[0]-a[0])*dx+(q[1]-a[1])*dy)/l;t=Math.max(0,Math.min(1,t));return Math.hypot(q[0]-a[0]-t*dx,q[1]-a[1]-t*dy);};
    let m=0,k=0;for(let i=1;i<p.length-1;i++){const v=seg(p[i],p[0],p[p.length-1]);if(v>m){m=v;k=i;}}
    return m>eps?rdp(p.slice(0,k+1),eps).slice(0,-1).concat(rdp(p.slice(k),eps)):[p[0],p[p.length-1]];
  }
  // Relative path with one decimal: small files, same drawing.
  // Optional union of all the shapes into one clean outline (a dev-machine helper: the polygon-clipping package, if the
  // build is run with it on NODE_PATH). Without it the overlapping shapes are kept: same look, bigger file.
  let pc=null;try{if(typeof require==="function")pc=require("polygon-clipping");}catch(e){pc=null;}
  function union(polys){
    if(!pc||polys.length<2)return polys;
    const mp=pc.union(...polys.map(p=>[[...p,p[0]]]));
    const out=[];mp.forEach(poly=>poly.forEach(ring=>out.push(ring.slice(0,-1))));return out;
  }
  function d(polys,eps){eps=eps==null?.12:eps;return union(polys).map(p=>{p=thin(p,.2);const c=rdp(p.concat([p[0]]),eps).slice(0,-1);let x=r1(c[0][0]),y=r1(c[0][1]),o="M"+x+" "+y;
    for(let i=1;i<c.length;i++){const nx=r1(c[i][0]),ny=r1(c[i][1]);o+="l"+r1(nx-x)+" "+r1(ny-y);x=nx;y=ny;}return o.replace(/(\s|l)0\./g,"$1.").replace(/-0\./g,"-.")+"z";}).join("");}
  // Transform helpers for reusing parts.
  function tf(p,{dx=0,dy=0,sx=1,sy=1,rot=0,cx=0,cy=0}={}){const c=Math.cos(rot),s=Math.sin(rot);return p.map(([x,y])=>{x=(x-cx)*sx;y=(y-cy)*sy;return [x*c-y*s+cx+dx,x*s+y*c+cy+dy];});}
  function mirror(p,axis){axis=axis==null?50:axis;return orient(p.map(([x,y])=>[2*axis-x,y]));}
  // Thin detail line (open), drawn later as a stroke in the detail colour.
  function line(pts,n){return spline(pts.map(p=>[p[0],p[1],0]),n||8).map(p=>[p[0],p[1]]);}
  function dl(lines){return lines.map(p=>"M"+rdp(thin(p,.3),.1).map(q=>r1(q[0])+" "+r1(q[1])).join("L")).join("");}
  const api={spline,stroke,blob,poly,orient,hole,d,dl,line,tf,mirror,thin,area};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.CrestBrush=api;
})(typeof globalThis!=="undefined"?globalThis:this);
