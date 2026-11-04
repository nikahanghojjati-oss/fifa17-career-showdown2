# Bake a kit lookup for one body: per atlas texel, where it sits on the kit in wrap terms.
# Output RGB PNG: R = wrap u, G = wrap v (0 hem/cuff/ankle .. 255 neck/shoulder/top), B = part<<5 | trimDist(mm, 0..31)
# parts: 0 none, 1 torso, 2 sleeve L (wearer's left, +x), 3 sleeve R, 4 shorts, 5 sock L, 6 sock R
import sys,numpy as np
from PIL import Image
from glb import load
path,out,N=sys.argv[1],sys.argv[2],int(sys.argv[3]) if len(sys.argv)>3 else 1024
j,M,img=load(path)
def raster(m,fn):
    P,UV,I=m['pos'],m['uv'],m['idx'].reshape(-1,3)
    buf=np.zeros((N,N,3),np.float64); hit=np.zeros((N,N),bool); pos=np.zeros((N,N,3)); clash=0
    for t in I:
        uv=UV[t]*N; p=P[t]
        x0,y0=np.floor(uv.min(0)).astype(int); x1,y1=np.ceil(uv.max(0)).astype(int)
        x0=max(x0,0);y0=max(y0,0);x1=min(x1,N-1);y1=min(y1,N-1)
        if x1<x0 or y1<y0: continue
        xs,ys=np.meshgrid(np.arange(x0,x1+1)+.5,np.arange(y0,y1+1)+.5)
        a,b,c=uv; d=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
        if abs(d)<1e-12: continue
        w0=((b[1]-c[1])*(xs-c[0])+(c[0]-b[0])*(ys-c[1]))/d; w1=((c[1]-a[1])*(xs-c[0])+(a[0]-c[0])*(ys-c[1]))/d; w2=1-w0-w1
        e=-.6/ max(1.0,np.abs(d)**.5)  # small dilation so island edges are covered
        ins=(w0>=e)&(w1>=e)&(w2>=e)
        if not ins.any(): continue
        q=w0[...,None]*p[0]+w1[...,None]*p[1]+w2[...,None]*p[2]
        yy=(ys[ins]-.5).astype(int); xx=(xs[ins]-.5).astype(int); qq=q[ins]
        prev=hit[yy,xx]
        if prev.any(): clash+=int((np.linalg.norm(pos[yy,xx][prev]-qq[prev],axis=1)>3).sum())
        pos[yy,xx]=qq; hit[yy,xx]=True
    return pos,hit,clash
def boundary(m):
    I=m['idx'].reshape(-1,3); E={}
    for t in I:
        for a,b in ((t[0],t[1]),(t[1],t[2]),(t[2],t[0])):
            k=(min(a,b),max(a,b)); E[k]=E.get(k,0)+1
    # weld by position (seams split vertices)
    P=m['pos']; key=lambda i: tuple(np.round(P[i],2))
    E2={}
    for (a,b),n in E.items():
        k=tuple(sorted([key(a),key(b)])); E2[k]=E2.get(k,0)+n
    pts=[]
    for (a,b),n in E2.items():
        if n==1:
            a=np.array(a);b=np.array(b)
            for s in np.linspace(0,1,6): pts.append(a+(b-a)*s)
    return np.array(pts)
def mindist(q,pts):
    out=np.full(len(q),1e9)
    for i in range(0,len(q),20000):
        d=np.linalg.norm(q[i:i+20000,None,:]-pts[None,:,:],axis=2).min(1); out[i:i+20000]=d
    return out
R=np.zeros((N,N),np.uint8);G=np.zeros((N,N),np.uint8);B=np.zeros((N,N),np.uint8)
def put(mask,u,v,part,dist=None):
    R[mask]=np.clip(np.round(np.mod(u,1)*255),0,255); G[mask]=np.clip(np.round(v*255),0,255)
    dd=np.full(mask.sum(),31) if dist is None else np.clip(np.round(dist*10),0,31)
    B[mask]=(part<<5)|dd.astype(np.uint8)
report={}
TAKEN=np.zeros((N,N),bool)
SKIP=set(sys.argv[4].split(',')) if len(sys.argv)>4 else set()
for name,m in M.items():
    if m['mat'] not in ('kitShirt','kitShorts','kitSocks') or m['mat'] in SKIP: continue
    pos,hit,clash=raster(m,None); report[name+'_overlapOther']=int((hit&TAKEN).sum()); TAKEN|=hit; q=pos[hit]; report[name]=dict(texels=int(hit.sum()),clash=clash)
    P=m['pos']
    if m['mat']=='kitShirt':
        # armpit: the torso is the part within the chest's half-width
        chest=P[(P[:,1]>P[:,1].min()+5)&(P[:,1]<P[:,1].min()+25)]; ax=np.abs(chest[:,0]).max()+1.0
        torso=np.abs(q[:,0])<=ax; cz=chest[:,2].mean()
        yh,yn=P[np.abs(P[:,0])<=ax][:,1].min(),P[np.abs(P[:,0])<=ax][:,1].max()
        top=P[(np.abs(P[:,0])<14)&(P[:,1]>yn-16)]; nz=top[:,2].mean(); th=np.arctan2(top[:,0],top[:,2]-nz); bins=np.floor((th+np.pi)/(2*np.pi)*48).astype(int)
        rim=[top[bins==k][np.argmax(top[bins==k][:,1])] for k in range(48) if (bins==k).any()]
        rim=np.array(rim); ang=np.arctan2(rim[:,0],rim[:,2]-nz); rim=rim[np.argsort(ang)]
        neck=np.array([rim[i]+(rim[(i+1)%len(rim)]-rim[i])*t for i in range(len(rim)) for t in np.linspace(0,1,12,endpoint=False)])
        u=.5+np.arctan2(q[:,0],q[:,2]-cz)/(2*np.pi); v=(q[:,1]-yh)/(yn-yh)
        # trim distance: how far below the neck rim (at the same angle round the neck) a point sits, in cm
        ra=np.arctan2(rim[:,0],rim[:,2]-nz); o=np.argsort(ra); ra,ry=ra[o],rim[o][:,1]
        # smooth the rim round the neck (circular median then mean) so the trim is one clean band, not spikes
        n=len(ry); ry=np.array([np.median(ry[[(i+k)%n for k in range(-3,4)]]) for i in range(n)]); ry=np.array([ry[[(i+k)%n for k in range(-2,3)]].mean() for i in range(n)])
        qa=np.arctan2(q[:,0],q[:,2]-nz); ryq=np.interp(qa,np.concatenate([ra-2*np.pi,ra,ra+2*np.pi]),np.concatenate([ry,ry,ry]))
        near=np.hypot(q[:,0],q[:,2]-nz)<16
        nd=np.where(near,np.clip(ryq-q[:,1],0,99),99)
        sub=np.zeros_like(hit); tm=torso
        idx=np.argwhere(hit)
        mt=np.zeros_like(hit); mt[idx[tm,0],idx[tm,1]]=True
        put(mt,u[tm],np.clip(v[tm],0,1),1,nd[tm])
        xend=np.abs(P[:,0]).max()
        for side,part in ((1,2),(-1,3)):
            sm=(~tm)&(np.sign(q[:,0])==side)
            if not sm.any(): continue
            s=q[sm]; yc=s[:,1].mean(); zc=s[:,2].mean()
            a=(np.abs(s[:,0])-ax)/(xend-ax)          # 0 at the shoulder .. 1 at the cuff
            uu=.5+np.arctan2(s[:,2]-zc,(s[:,1]-yc)*side)/(2*np.pi)
            mm=np.zeros_like(hit); mm[idx[sm,0],idx[sm,1]]=True
            put(mm,uu,np.clip(1-a,0,1),part)
        report[name].update(armpit=round(float(ax),1),hem=round(float(yh),1),neck=round(float(yn),1),neckpts=len(neck))
    elif m['mat']=='kitShorts':
        cz=P[:,2].mean(); u=.5+np.arctan2(q[:,0],q[:,2]-cz)/(2*np.pi); v=(q[:,1]-P[:,1].min())/(P[:,1].max()-P[:,1].min())
        put(hit,u,v,4)
    else:
        idx=np.argwhere(hit)
        for side,part in ((1,5),(-1,6)):
            sm=np.sign(q[:,0])==side
            if not sm.any(): continue
            s=q[sm]; lp=P[np.sign(P[:,0])==side]; lx,lz=lp[:,0].mean(),lp[:,2].mean()
            uu=.5+np.arctan2(s[:,0]-lx,s[:,2]-lz)/(2*np.pi); vv=(s[:,1]-lp[:,1].min())/(lp[:,1].max()-lp[:,1].min())
            mm=np.zeros_like(hit); mm[idx[sm,0],idx[sm,1]]=True; put(mm,uu,vv,part)
Image.fromarray(np.dstack([R,G,B])).save(out,optimize=True)
print(report)
