import math, json, numpy as np, sys
from PIL import Image, ImageFilter
sys.path.insert(0,'../ho081'); 
src=Image.open('s2_cut.png'); W,H=src.size
ang=8.3; a=math.radians(ang); ca,sa=math.cos(a),math.sin(a)
pad=600; big=Image.new('RGBA',(W+2*pad,H+2*pad),(0,0,0,0)); big.paste(src,(pad,pad))
valid=Image.new('L',big.size,0); valid.paste(255,(pad,pad,pad+W,pad+H))
cx,cy=800+pad,700+pad
A,B,D,E=ca,sa,-sa,ca; C=cx-A*cx-B*cy; F=cy-D*cx-E*cy
R=big.transform(big.size,Image.AFFINE,(A,B,C,D,E,F),resample=Image.BICUBIC)
V=np.array(valid.transform(big.size,Image.AFFINE,(A,B,C,D,E,F)))
f=lambda x,y:(cx+ca*(x+pad-cx)-sa*(y+pad-cy), cy+sa*(x+pad-cx)+ca*(y+pad-cy))
P={'muzzle':(610,115),'boreRear':(774,420),'wrist':(1010,725)}
Q={k:f(*v) for k,v in P.items()}
al=np.array(R)[...,3]
# glove box from alpha in rotated coords: bbox of opaque pixels left of wrist x and below cylinder
print({k:[round(v,1) for v in q] for k,q in Q.items()})
# candidate cut columns
for xc in range(1650,2100,25):
    col=al[:,xc]; ys=np.where(col>128)[0]
    if len(ys)==0: continue
    oob=(V[ys.min()-2:ys.max()+3,xc]<128).any()
    print(xc, ys.min(), ys.max(), 'oob' if oob else '')
np.save('R.npy',np.array(R)); json.dump({k:list(v) for k,v in Q.items()},open('Q.json','w'))
