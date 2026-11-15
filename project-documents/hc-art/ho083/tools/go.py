import math, json, numpy as np
from PIL import Image
exec(open('../ho081/fin.py').read().split('def xf')[0])
src=Image.open('t2_cut.png'); W,H=src.size
pad=800; big=Image.new('RGBA',(W+2*pad,H+2*pad),(0,0,0,0)); big.paste(src,(pad,pad))
valid=Image.new('L',big.size,0); valid.paste(255,(pad,pad,pad+W,pad+H))
P0={'muzzle':(420.5,213.6),'muzzle2':(504.5,283.4),'wrist':(780,630),'glove':(650,540)}
# precise bore: use barrel top edge direction ~ measure: points on top edge (400,205)->(525,272)
ang0=math.degrees(math.atan2(283.4-213.6,504.5-420.5)); rot=40-ang0
print('orig bore',round(ang0,1),'rotate',round(rot,1))
a=math.radians(rot); ca,sa=math.cos(a),math.sin(a); cx,cy=650+pad,540+pad
A,B,D,E=ca,sa,-sa,ca; C=cx-A*cx-B*cy; F=cy-D*cx-E*cy
R=big.transform(big.size,Image.AFFINE,(A,B,C,D,E,F),resample=Image.BICUBIC)
V=np.array(valid.transform(big.size,Image.AFFINE,(A,B,C,D,E,F)))
f=lambda x,y:(cx+ca*(x+pad-cx)-sa*(y+pad-cy), cy+sa*(x+pad-cx)+ca*(y+pad-cy))
Q={k:f(*v) for k,v in P0.items()}
al=np.array(R)[...,3]
# glove box in rotated: opaque pixels within radius of glove pt excluding gun top? use bbox of opaque region x in [gx-200, wrist x], y>muzzle2 y
gx,gy=Q['glove']; wx,wy=Q['wrist']
sub=al[int(Q['muzzle2'][1]):int(gy+250), int(gx-250):int(wx)]
yy,xx=np.where(sub>128); g0x,g1x=xx.min()+int(gx-250),xx.max()+int(gx-250); g0y,g1y=yy.min()+int(Q['muzzle2'][1]),yy.max()+int(Q['muzzle2'][1])
gcx,gcy=(g0x+g1x)/2,(g0y+g1y)/2
best=None
for Wc in range(900,1700,10):
  Hc=Wc*0.75
  for gf in (0.50,0.52,0.55):
    L=gcx-gf*Wc; xc=L+Wc
    fore=(xc-wx)/Wc
    if not(0.35<=fore<=0.40): continue
    if xc>=pad+W-5: continue
    col=al[:,int(xc)]; ys=np.where(col>128)[0]
    if (V[ys.min():ys.max(),int(xc)]<128).any(): continue
    for vf in (0.50,0.55,0.60):
      T=gcy-vf*Hc; Bt=T+Hc
      if Q['muzzle'][1]-T < 0.04*Hc: continue
      if ys.max()>Bt-10 or ys.min()<T+10: continue
      # nothing else touching left/top/bottom
      box=al[int(T):int(Bt), int(L):int(xc)]
      if (box[0]>8).any() or (box[-1]>8).any() or (box[:,0]>8).any(): continue
      cand=(Wc,gf,vf,L,T,xc,fore)
      if best is None or Wc<best[0]: best=cand
print('best',best)
Wc,gf,vf,L,T,xc,fore=best; Hc=Wc*0.75
c=R.crop((int(L),int(T),int(L)+Wc,int(T)+int(Hc))).resize((1600,1200),Image.LANCZOS)
arr=np.array(c); arr[:,-1,3]=np.where(arr[:,-2,3]>128,255,arr[:,-1,3]); c=decon(Image.fromarray(arr,'RGBA'))
s=1600/Wc; L0,T0=int(L),int(T)
fx=lambda p:[round((p[0]-L0)*s/1600,4), round(1-(p[1]-T0)*s/1200,4)]
al2=np.array(c)[...,3]; ys=np.where(al2[:,-1]>128)[0]
m=Q['muzzle']; m2=Q['muzzle2']
num={'canvas':[1600,1200],'yFrom':'bottom','muzzle':fx(m),'boreRear':fx(m2),'wrist':fx(Q['wrist']),
 'boreAngleDeg':round(math.degrees(math.atan2(m2[1]-m[1],m2[0]-m[0])),1),'cut':[[1.0,round(1-ys.min()/1200,4)],[1.0,round(1-ys.max()/1200,4)]],
 'gloveBox':{'x0':round((g0x-L0)/Wc,3),'x1':round((g1x-L0)/Wc,3),'yTop':round(1-(g0y-T0)/Hc,3),'yBottom':round(1-(g1y-T0)/Hc,3)},
 'forearmFractionOfWidth':round(fore,3)}
cm=[1.0,(num['cut'][0][1]+num['cut'][1][1])/2]; w_=num['wrist']
num['elbowDirection']={'from':w_,'toward':cm,'angleAboveHorizontalDeg':round(math.degrees(math.atan2((w_[1]-cm[1])*1200,(1-w_[0])*1600)),1)}
num['touchesOtherEdges']={'left':bool((al2[:,0]>8).any()),'top':bool((al2[0]>8).any()),'bottom':bool((al2[-1]>8).any())}
json.dump(num,open('HO083_PLATE_NUMBERS.json','w'),indent=1); print(json.dumps(num))
c.save('RR_HAND_POV_S_V2.webp',quality=86,alpha_quality=100,method=6)
bg=Image.new('RGBA',c.size,(18,14,12,255)); bg.alpha_composite(c); bg.convert('RGB').save('PREVIEW_S_V2_ON_DARK.jpg',quality=88)
